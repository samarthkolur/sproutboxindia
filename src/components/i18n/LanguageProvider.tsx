"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import {
  defaultLanguage,
  languageOptions,
  languageStorageKey,
  restoreTranslatedText,
  translateText,
  type LanguageCode,
} from "@/lib/i18n";

type LanguageContextValue = {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  t: (value: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

const ignoredSelector = [
  "script",
  "style",
  "noscript",
  "svg",
  "canvas",
  "code",
  "pre",
  "textarea",
  "input",
  "[contenteditable='true']",
  "[data-i18n-ignore]",
].join(",");

const translatedAttributes = ["placeholder", "title", "aria-label"] as const;

function isLanguageCode(value: string | null): value is LanguageCode {
  return languageOptions.some((option) => option.code === value);
}

function shouldTranslateNode(node: Text) {
  const parent = node.parentElement;

  return Boolean(parent && !parent.closest(ignoredSelector) && node.nodeValue?.trim());
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [language, setLanguageState] = useState<LanguageCode>(defaultLanguage);
  const textSources = useRef(new WeakMap<Text, string>());
  const attrSources = useRef(new WeakMap<Element, Partial<Record<(typeof translatedAttributes)[number], string>>>());
  const previousLanguage = useRef<LanguageCode>(defaultLanguage);
  const isApplying = useRef(false);

  useEffect(() => {
    const storedLanguage = window.localStorage.getItem(languageStorageKey);

    if (isLanguageCode(storedLanguage)) {
      setLanguageState(storedLanguage);
    }
  }, []);

  const setLanguage = useCallback((nextLanguage: LanguageCode) => {
    setLanguageState(nextLanguage);
    window.localStorage.setItem(languageStorageKey, nextLanguage);
  }, []);

  const t = useCallback(
    (value: string) => translateText(value, language),
    [language]
  );

  const contextValue = useMemo(
    () => ({ language, setLanguage, t }),
    [language, setLanguage, t]
  );

  const translateAttribute = useCallback(
    (element: Element, attribute: (typeof translatedAttributes)[number]) => {
      const currentValue = element.getAttribute(attribute);

      if (!currentValue?.trim()) return;

      const stored = attrSources.current.get(element) ?? {};
      const previousSource = stored[attribute];
      const previousTranslation = previousSource
        ? translateText(previousSource, previousLanguage.current)
        : undefined;
      const nextSource =
        previousSource &&
        (currentValue === previousSource || currentValue === previousTranslation)
          ? previousSource
          : restoreTranslatedText(currentValue, previousLanguage.current);

      attrSources.current.set(element, { ...stored, [attribute]: nextSource });

      const nextValue = translateText(nextSource, language);
      if (currentValue !== nextValue) {
        element.setAttribute(attribute, nextValue);
      }
    },
    [language]
  );

  const translateTextNode = useCallback(
    (node: Text) => {
      if (!shouldTranslateNode(node)) return;

      const currentValue = node.nodeValue ?? "";
      const previousSource = textSources.current.get(node);
      const previousTranslation = previousSource
        ? translateText(previousSource, previousLanguage.current)
        : undefined;
      const nextSource =
        previousSource &&
        (currentValue === previousSource || currentValue === previousTranslation)
          ? previousSource
          : restoreTranslatedText(currentValue, previousLanguage.current);

      textSources.current.set(node, nextSource);

      const nextValue = translateText(nextSource, language);
      if (currentValue !== nextValue) {
        node.nodeValue = nextValue;
      }
    },
    [language]
  );

  const translateTree = useCallback(
    (root: ParentNode) => {
      if (typeof document === "undefined") return;

      isApplying.current = true;

      try {
        if (root instanceof Element) {
          translatedAttributes.forEach((attribute) => {
            translateAttribute(root, attribute);
          });
        }

        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        let currentNode = walker.nextNode();

        while (currentNode) {
          translateTextNode(currentNode as Text);
          currentNode = walker.nextNode();
        }

        if (root instanceof Element || root instanceof Document) {
          root.querySelectorAll(translatedAttributes.map((attr) => `[${attr}]`).join(",")).forEach((element) => {
            translatedAttributes.forEach((attribute) => {
              translateAttribute(element, attribute);
            });
          });
        }
      } finally {
        queueMicrotask(() => {
          isApplying.current = false;
          previousLanguage.current = language;
        });
      }
    },
    [language, translateAttribute, translateTextNode]
  );

  useEffect(() => {
    const selectedLanguage = languageOptions.find((option) => option.code === language);
    document.documentElement.lang = selectedLanguage?.htmlLang ?? "en";
    document.documentElement.dataset.language = language;
  }, [language]);

  useEffect(() => {
    translateTree(document.body);

    const observer = new MutationObserver((mutations) => {
      if (isApplying.current) return;

      mutations.forEach((mutation) => {
        if (mutation.type === "characterData") {
          translateTextNode(mutation.target as Text);
          return;
        }

        if (mutation.type === "attributes") {
          translateAttribute(
            mutation.target as Element,
            mutation.attributeName as (typeof translatedAttributes)[number]
          );
          return;
        }

        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE) {
            translateTextNode(node as Text);
          }

          if (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.DOCUMENT_NODE) {
            translateTree(node as ParentNode);
          }
        });
      });
    });

    observer.observe(document.body, {
      attributeFilter: [...translatedAttributes],
      attributes: true,
      characterData: true,
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, [language, pathname, translateAttribute, translateTextNode, translateTree]);

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }

  return context;
}
