// Copyright 2018 Ryan Dahl <ry@tinyclouds.org>
// All rights reserved. MIT License.

import { assertEqual, test } from "liltest";
import { parse } from "./parser";

// Disable typechecking in tests.
type Parser = (sourceCode: string) => any;
const parseTs: Parser = sourceCode => parse(sourceCode, "file.ts");

test(function test_enum() {
  const X = parseTs(
    `
    /**
     * Foo
     */
    export enum X {
      /**
       * Bar
       */
      a;
      b = 2;
      // inline comment
      c = "<*_*>";
      d = null;
    }
    `
  )[0];
  assertEqual(!!X, true);
  assertEqual(X.type, "enum");
  assertEqual(X.name, "X");
  // Test documentation
  assertEqual(X.documentation.type, "jsdoc");
  assertEqual(X.documentation.comment, "Foo");
  assertEqual(X.documentation.tags.length, 0);
  assertEqual(X.members.length, 4);
  // Test a
  const a = X.members[0];
  assertEqual(a.type, "enumMember");
  assertEqual(a.name, "a");
  assertEqual(a.initializer, undefined);
  assertEqual(a.documentation.type, "jsdoc");
  assertEqual(a.documentation.comment, "Bar");
  assertEqual(a.documentation.tags.length, 0);
  // Test b
  const b = X.members[1];
  assertEqual(b.type, "enumMember");
  assertEqual(b.name, "b");
  assertEqual(b.initializer.type, "number");
  assertEqual(b.initializer.text, "2");
  assertEqual(!!b.documentation, false);
  // Test c
  const c = X.members[2];
  assertEqual(c.type, "enumMember");
  assertEqual(c.name, "c");
  assertEqual(c.initializer.type, "string");
  assertEqual(c.initializer.text, "<*_*>");
  // TODO
  // assertEqual(c.documentation, "inline comment");
  // Test d
  const d = X.members[3];
  assertEqual(d.type, "enumMember");
  assertEqual(d.name, "d");
  assertEqual(d.initializer.type, "keyword");
  assertEqual(d.initializer.name, "null");
  assertEqual(!!d.documentation, false);
});
