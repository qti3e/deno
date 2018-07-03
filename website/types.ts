// Copyright 2018 Ryan Dahl <ry@tinyclouds.org>
// All rights reserved. MIT License.

import * as ts from "typescript";

// TODO
export type DocEntity = any;

// TODO
export type SerilizedData = DocEntity | any;

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
