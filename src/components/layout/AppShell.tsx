"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/nav";
import type { ShellData } from "@/lib/shell-data";
import { BottomDock } from "./BottomDock";
import { CommandPalette } from "./CommandPalette";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

const COLLAPSE_KEY = "sproutbox-sidebar-collapsed";

interface AppShellProps {
  role: Role;
  userName: string;
  shell: ShellData;
  children: ReactNode;
}

// Verdelo-style shell: floating sidebar + top bar on desktop, top bar +
// bottom dock on phones. Pages render inside <main> on the glow canvas.
export function AppShell({ role, userName, shell, children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {
      // storage blocked: start expanded
    }
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function toggleCollapsed() {
    setCollapsed((value) => {
      const next = !value;
      try {
        window.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  }

  return (
    <div className="app-canvas min-h-screen">
      <Sidebar
        role={role}
        userName={userName}
        workspace={shell.workspace}
        badges={shell.badges}
        pinned={shell.pinned}
        collapsed={collapsed}
        onToggle={toggleCollapsed}
      />

      <div className={cn("min-h-screen transition-[padding] duration-200", collapsed ? "lg:pl-[96px]" : "lg:pl-[264px]")}>
        <TopBar role={role} userName={userName} unread={shell.unread} onOpenSearch={() => setPaletteOpen(true)} />
        <main className="mx-auto w-full max-w-7xl px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-10">{children}</main>
      </div>

      <BottomDock role={role} badges={shell.badges} />
      <CommandPalette role={role} open={paletteOpen} onClose={() => setPaletteOpen(false)} />

      <Toaster
        position="top-right"
        richColors
        toastOptions={{ classNames: { toast: "!rounded-xl !shadow-pop", title: "!font-semibold" } }}
      />
    </div>
  );
}
