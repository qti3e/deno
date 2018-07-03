// Copyright 2018 Ryan Dahl <ry@tinyclouds.org>
// All rights reserved. MIT License.

import { test } from "liltest";
import { parse } from "./parser";

test(function test_parser() {
  parse(
    `
  import { b } from "b";
  type x = null;
  const a = {};
  export { a, b as c };
  export function d() {}
  export { x }
  `,
    "file.ts"
  );
});
