import assert from "node:assert/strict";
import test from "node:test";

import { buildChoiceWidgetLines, parseChoiceCommand } from "./index.ts";

void test("parseChoiceCommand parses submit, show, and custom commands", () => {
  assert.deepEqual(parseChoiceCommand(""), { kind: "show" });
  assert.deepEqual(parseChoiceCommand("2"), { kind: "submit", index: 1 });
  assert.deepEqual(parseChoiceCommand("custom 我先退到门边观察。"), {
    kind: "custom",
    text: "我先退到门边观察。",
  });
  assert.equal(parseChoiceCommand("abc"), undefined);
});

void test("buildChoiceWidgetLines renders numbered commands", () => {
  assert.deepEqual(
    buildChoiceWidgetLines([
      { label: "追上去", submitText: "我追上去。" },
      { label: "检查现场", submitText: "我检查现场。" },
    ]),
    ["── 可选行动（可忽略，直接手打也可以）──", "/choice 1  追上去", "/choice 2  检查现场"],
  );
});
