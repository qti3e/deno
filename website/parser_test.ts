// Copyright 2018 Ryan Dahl <ry@tinyclouds.org>
// All rights reserved. MIT License.

import { test } from "liltest";
import { parse } from "./parser";

test(function test_parser() {
  parse(`
  import { a } from "a";
  export { a };
  `, "file.ts");
});
