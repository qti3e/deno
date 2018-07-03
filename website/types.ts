// Copyright 2018 Ryan Dahl <ry@tinyclouds.org>
// All rights reserved. MIT License.

import * as ts from "typescript";

export type DocEntity = FunctionDeclaration;

export type SerilizedData = DocEntity | JSDocComment | Parameter | Keyword;

export interface DocEntityBase extends Modifiers {
  name: string;
  documentation: Comment;
}

export interface Keyword {
  type: "keyword";
  name: string;
}

export interface FunctionDeclaration extends DocEntityBase {
  type: "function";
  parameters: Parameter[];
  returnType?: Type;
  generator: boolean;
}

export interface Parameter extends DocEntityBase {
  type: "parameter";
  dataType?: Type;
  optional: boolean;
}

// TODO
export type Type = Keyword;

export interface Modifiers {
  visibility?: "public" | "protected" | "private";
  async?: boolean;
  default?: boolean;
  static?: boolean;
  readonly?: boolean;
}

export type Comment = JSDocComment | string;

export interface JSDocComment {
  type: "jsdoc";
  comment: string;
  tags: JSDocTag[];
}

// TODO
export type JSDocTag = any;

// ----------------

/**
 * Anything with a push operator.
 */
export interface Pushable<T> {
  push(d: T): void;
}

/**
 * Parser contains data which are mostly needed by visitors
 * when we call a visitor, it's bound to value that implement
 * this type.
 * So inside a visitor functions, it is accessible thought `this`.
 */
export interface Parser {
  sourceFile: ts.SourceFile;
  checker: ts.TypeChecker;
  currentNamespace: string[];
  isJS: boolean;
  isDeclarationFile: boolean;
  visit(node: ts.Node, entities: Pushable<SerilizedData>): void;
}
