import assert from "node:assert/strict";
import test from "node:test";
import { Type } from "typebox";
import { Compile } from "typebox/compile";

import { parseTypeBoxValue } from "./typebox-validation.ts";

const SAMPLE_SCHEMA = Type.Object({
  name: Type.String(),
  count: Type.Integer(),
  enabled: Type.Boolean(),
  note: Type.Union([Type.String(), Type.Null()]),
  tags: Type.Array(Type.String()),
});

const SAMPLE_VALIDATOR = Compile(SAMPLE_SCHEMA);

function validSample(): Record<string, unknown> {
  return { name: "saber", count: 3, enabled: true, note: null, tags: ["servant"] };
}

void test("parseTypeBoxValue keeps LLM-friendly string-to-number coercion", () => {
  const parsed = parseTypeBoxValue(
    { ...validSample(), count: "42", enabled: "true" },
    "sample",
    SAMPLE_VALIDATOR,
  );

  assert.equal(parsed.count, 42);
  assert.equal(parsed.enabled, true);
});

void test("parseTypeBoxValue rejects null laundered into a string", () => {
  assert.throws(
    () => parseTypeBoxValue({ ...validSample(), name: null }, "sample", SAMPLE_VALIDATOR),
    /非法 sample\.name: 类型 null 不会被隐式转换为 string/,
  );
});

void test("parseTypeBoxValue rejects null laundered into a number", () => {
  assert.throws(
    () => parseTypeBoxValue({ ...validSample(), count: null }, "sample", SAMPLE_VALIDATOR),
    /非法 sample\.count: 类型 null 不会被隐式转换为 number/,
  );
});

void test("parseTypeBoxValue rejects number laundered into a string", () => {
  assert.throws(
    () => parseTypeBoxValue({ ...validSample(), name: 42 }, "sample", SAMPLE_VALIDATOR),
    /非法 sample\.name: 类型 number 不会被隐式转换为 string/,
  );
});

void test("parseTypeBoxValue reports coercion path inside arrays", () => {
  assert.throws(
    () => parseTypeBoxValue({ ...validSample(), tags: [123] }, "sample", SAMPLE_VALIDATOR),
    /非法 sample\.tags\[0\]: 类型 number 不会被隐式转换为 string/,
  );
});

void test("parseTypeBoxValue still accepts legitimate null for nullable fields", () => {
  const parsed = parseTypeBoxValue(validSample(), "sample", SAMPLE_VALIDATOR);

  assert.equal(parsed.note, null);
});
