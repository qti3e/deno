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

test(async function test_function() {
  const F = parseTs(
    `
    /**
     * Doc
     * @param n Foo
     */
    export function F<P extends T<string>>(n: P<number>, m?): void {}
    `
  )[0];
  assertEqual(F.type, "function");
  assertEqual(F.name, "F");
  // Test documentation
  assertEqual(F.documentation.type, "jsdoc");
  assertEqual(F.documentation.comment, "Doc");
  // TODO
  // assertEqual(F.documentation.tags.length, 1);
  // Test type parameters
  const P = F.typeParameters[0];
  assertEqual(F.typeParameters.length, 1);
  assertEqual(P.type, "typeParam");
  assertEqual(P.name, "P");
  assertEqual(P.constraint.type, "typeRef");
  assertEqual(P.constraint.name, "T");
  assertEqual(P.constraint.arguments.length, 1);
  assertEqual(P.constraint.arguments[0].type, "keyword");
  assertEqual(P.constraint.arguments[0].name, "string");
  // Test parameters
  const n = F.parameters[0];
  const m = F.parameters[1];
  assertEqual(F.parameters.length, 2);
  assertEqual(n.type, "parameter");
  assertEqual(n.name, "n");
  assertEqual(n.dataType.type, "typeRef");
  assertEqual(n.dataType.name, "P");
  assertEqual(n.dataType.arguments.length, 1);
  assertEqual(n.dataType.arguments[0].type, "keyword");
  assertEqual(n.dataType.arguments[0].name, "number");
  assertEqual(n.documentation, "Foo");
  assertEqual(m.name, "m");
  // Test `optional`
  assertEqual(n.optional, false);
  assertEqual(m.optional, true);
  // Test return type
  assertEqual(F.returnType.type, "keyword");
  assertEqual(F.returnType.name, "void");
});

test(async function test_interface() {
  const I = parseTs(
    `
    /**
     * Foo
     */
    export interface I<A extends B> extends N<A>, M<keyof A>, K {
      /**
       * 1
       */
      a: number;
      b?: string;
      // 3
      c<S>(a: number, b?: string): void;
      /**
       * @param x foo
       */
      new(x: 4, c): this;
    }
    `
  )[0];
  assertEqual(I.type, "interface");
  assertEqual(I.name, "I");
  assertEqual(I.documentation.type, "jsdoc");
  assertEqual(I.documentation.comment, "Foo");
  // Test parameters
  assertEqual(I.parameters.length, 1);
  assertEqual(I.parameters[0].type, "typeParam");
  assertEqual(I.parameters[0].name, "A");
  assertEqual(I.parameters[0].constraint.type, "typeRef");
  assertEqual(I.parameters[0].constraint.name, "B");
  // Test heritage clauses
  const N = I.heritageClauses[0];
  const M = I.heritageClauses[1];
  const K = I.heritageClauses[2];
  assertEqual(I.heritageClauses.length, 3);
  assertEqual(N.type, "expressionWithTypeArguments");
  assertEqual(N.expression, "N");
  assertEqual(N.arguments.length, 1);
  assertEqual(N.arguments[0].type, "typeRef");
  assertEqual(N.arguments[0].name, "A");
  assertEqual(M.type, "expressionWithTypeArguments");
  assertEqual(M.expression, "M");
  assertEqual(M.arguments.length, 1);
  assertEqual(M.arguments[0].type, "typeOperator");
  assertEqual(M.arguments[0].operator.type, "keyword");
  assertEqual(M.arguments[0].operator.name, "keyOf");
  assertEqual(M.arguments[0].subject.type, "typeRef");
  assertEqual(M.arguments[0].subject.name, "A");
  assertEqual(K.type, "expressionWithTypeArguments");
  assertEqual(K.expression, "K");
  assertEqual(K.arguments.length, 0);
  // Test members
  const a = I.members[0];
  const b = I.members[1];
  const c = I.members[2];
  const d = I.members[3];
  assertEqual(I.members.length, 4);
  assertEqual(a.type, "propertySignature");
  assertEqual(a.name, "a");
  assertEqual(a.optional, false);
  assertEqual(a.documentation.type, "jsdoc");
  assertEqual(a.documentation.comment, "1");
  assertEqual(a.dataType.type, "keyword");
  assertEqual(a.dataType.name, "number");
  assertEqual(b.type, "propertySignature");
  assertEqual(b.name, "b");
  assertEqual(b.optional, true);
  assertEqual(c.type, "methodSignature");
  assertEqual(c.name, "c");
  assertEqual(c.optional, false);
  // TODO
  // assertEqual(c.documentation, "3");
  assertEqual(c.parameters.length, 2);
  assertEqual(c.parameters[0].name, "a");
  assertEqual(c.parameters[1].name, "b");
  assertEqual(c.typeParameters.length, 1);
  assertEqual(c.typeParameters[0].type, "typeParam");
  assertEqual(c.typeParameters[0].name, "S");
  assertEqual(c.dataType.type, "keyword");
  assertEqual(c.dataType.name, "void");
  assertEqual(d.type, "constructSignature");
  assertEqual(d.returnType.type, "keyword");
  assertEqual(d.returnType.name, "this");
  assertEqual(d.parameters.length, 2);
  assertEqual(d.documentation.type, "jsdoc");
  assertEqual(d.documentation.comment, undefined);
  // TODO
  // assertEqual(d.documentation.tags.length, 1);
  assertEqual(d.parameters[0].type, "parameter");
  assertEqual(d.parameters[0].name, "x");
  assertEqual(d.parameters[0].documentation, "foo");
  assertEqual(d.parameters[0].dataType.type, "number");
  assertEqual(d.parameters[0].dataType.text, "4");
});

test(async function test_typeQuery() {
  const a = parseTs(`export type a = typeof P.x;`)[0];
  assertEqual(a.definition.type, "typeQuery");
  assertEqual(a.definition.exprName, "P.x");
});

test(async function test_typePredicate() {
  const a = parseTs(`export function a(b): b is string {}`)[0];
  assertEqual(a.returnType.type, "typePredicate");
  assertEqual(a.returnType.parameterName, "b");
  assertEqual(a.returnType.dataType.type, "keyword");
  assertEqual(a.returnType.dataType.name, "string");
});

test(async function test_conditionalType() {
  const a = parseTs(`export type a<T> = T extends (infer R)[] ? R : any;`)[0];
  const t = a.definition;
  assertEqual(t.type, "conditionalType");
  assertEqual(t.checkType.type, "typeRef");
  assertEqual(t.checkType.name, "T");
  assertEqual(t.extendsType.type, "arrayType");
  assertEqual(t.extendsType.elementType.type, "parenthesizedType");
  assertEqual(t.extendsType.elementType.elementType.type, "inferType");
  assertEqual(
    t.extendsType.elementType.elementType.parameter.type,
    "typeParam"
  );
  assertEqual(t.extendsType.elementType.elementType.parameter.name, "R");
  assertEqual(t.trueType.type, "typeRef");
  assertEqual(t.trueType.name, "R");
  assertEqual(t.falseType.type, "keyword");
  assertEqual(t.falseType.name, "any");
});

test(async function test_indexedAccessType() {
  const a = parseTs(`export type a = {b: number;}[x]`)[0];
  const t = a.definition;
  assertEqual(t.type, "indexedAccessType");
  assertEqual(t.object.type, "typeLiteral");
  assertEqual(t.object.members.length, 1);
  assertEqual(t.index.type, "typeRef");
  assertEqual(t.index.name, "x");
});

test(async function test_mappedType() {
  const a = parseTs(`export type a = {readonly [n in K]?: number}`)[0];
  const t = a.definition;
  assertEqual(t.type, "mappedType");
  assertEqual(t.questionToken, "?");
  assertEqual(t.readonlyToken, "readonly");
  assertEqual(t.dataType.type, "keyword");
  assertEqual(t.dataType.name, "number");
  assertEqual(t.typeParameter.type, "typeParam");
  assertEqual(t.typeParameter.name, "n");
  assertEqual(t.typeParameter.constraint.type, "typeRef");
  assertEqual(t.typeParameter.constraint.name, "K");
});
