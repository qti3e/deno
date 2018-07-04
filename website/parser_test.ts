// Copyright 2018 Ryan Dahl <ry@tinyclouds.org>
// All rights reserved. MIT License.

import { test } from "liltest";
import { parse } from "./parser";

test(function test_parser() {
  const doc = parse(
    `
    export type X = {
      r();
      new(): number;
    };
  `,
    "file.ts"
  );
  console.log(doc);
});
