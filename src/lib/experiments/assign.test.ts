import { test } from "node:test";
import assert from "node:assert/strict";
import { assignAll, assignVariant, hash32, parseForce } from "./assign";
import { EXPERIMENTS, type Experiment } from "./config";

const running: Experiment = {
  key: "test_exp",
  description: "",
  status: "running",
  variants: [
    { key: "control", weight: 0.5 },
    { key: "b", weight: 0.5 },
  ],
  primaryMetric: "cta_click",
  area: "test",
};

const ids = Array.from({ length: 20000 }, (_, i) => `visitor-${i}`);

test("hash32 is stable (known FNV-1a values)", () => {
  assert.equal(hash32(""), 0x811c9dc5);
  assert.equal(hash32("a"), 0xe40c292c);
});

test("same visitor always gets the same variant", () => {
  for (const id of ids.slice(0, 500)) {
    assert.equal(assignVariant(running, id), assignVariant(running, id));
  }
});

test("50/50 split is close to even (sequential and random ids)", () => {
  const uuids = Array.from({ length: 20000 }, () => crypto.randomUUID());
  for (const sample of [ids, uuids]) {
    const share = sample.filter((id) => assignVariant(running, id) === "b").length / sample.length;
    assert.ok(share > 0.485 && share < 0.515, `variant b share was ${share}`);
  }
});

test("uneven weights are respected", () => {
  const exp: Experiment = {
    ...running,
    variants: [
      { key: "control", weight: 0.9 },
      { key: "b", weight: 0.1 },
    ],
  };
  const share = ids.filter((id) => assignVariant(exp, id) === "b").length / ids.length;
  assert.ok(share > 0.085 && share < 0.115, `variant b share was ${share}`);
});

test("experiments bucket independently of each other", () => {
  const other: Experiment = { ...running, key: "other_exp" };
  const agree = ids.filter((id) => assignVariant(running, id) === assignVariant(other, id)).length;
  const share = agree / ids.length;
  assert.ok(share > 0.47 && share < 0.53, `agreement was ${share}`);
});

test("draft and paused experiments always show control", () => {
  for (const status of ["draft", "paused"] as const) {
    const exp = { ...running, status };
    assert.ok(ids.slice(0, 500).every((id) => assignVariant(exp, id) === "control"));
  }
});

test("concluded experiments show the winner to everyone", () => {
  const exp: Experiment = { ...running, status: "concluded", winner: "b" };
  assert.ok(ids.slice(0, 500).every((id) => assignVariant(exp, id) === "b"));
});

test("parseForce accepts known pairs and ignores junk", () => {
  assert.deepEqual(parseForce("hero_headline:b,nav_cta_label:b"), {
    hero_headline: "b",
    nav_cta_label: "b",
  });
  assert.deepEqual(parseForce("hero_headline:zzz,unknown:b,garbage"), {});
  assert.deepEqual(parseForce(null), {});
});

test("bots always get control; force overrides bucketing", () => {
  const bot = assignAll("anyone", { isBot: true });
  for (const [key, exp] of Object.entries(EXPERIMENTS)) {
    assert.equal(bot[key as keyof typeof bot], exp.variants[0].key);
  }
  const forced = assignAll("anyone", { force: { grower_form_length: "b" } });
  assert.equal(forced.grower_form_length, "b");
});

test("every registered experiment has weights summing to 1 and a valid winner", () => {
  for (const exp of Object.values(EXPERIMENTS) as Experiment[]) {
    const sum = exp.variants.reduce((a, v) => a + v.weight, 0);
    assert.ok(Math.abs(sum - 1) < 1e-9, `${exp.key} weights sum to ${sum}`);
    if (exp.winner) assert.ok(exp.variants.some((v) => v.key === exp.winner));
  }
});

test("only one running experiment per page area", () => {
  const areas = (Object.values(EXPERIMENTS) as Experiment[])
    .filter((e) => e.status === "running")
    .map((e) => e.area);
  assert.equal(new Set(areas).size, areas.length, `duplicate running areas: ${areas}`);
});
