// Copyright 2018 Ryan Dahl <ry@tinyclouds.org>
// All rights reserved. MIT License.

import * as ts from "typescript";
import { registerVisitor } from "./parser";

registerVisitor(ts.SyntaxKind.AnyKeyword, function(
  node: ts.KeywordTypeNode,
  e
): void {
  e.push({
    type: "keyword",
    name: "any"
  });
});

registerVisitor(ts.SyntaxKind.NumberKeyword, function(
  node: ts.KeywordTypeNode,
  e
): void {
  e.push({
    type: "keyword",
    name: "number"
  });
});

registerVisitor(ts.SyntaxKind.ObjectKeyword, function(
  node: ts.KeywordTypeNode,
  e
): void {
  e.push({
    type: "keyword",
    name: "object"
  });
});

registerVisitor(ts.SyntaxKind.BooleanKeyword, function(
  node: ts.KeywordTypeNode,
  e
): void {
  e.push({
    type: "keyword",
    name: "boolean"
  });
});

registerVisitor(ts.SyntaxKind.StringKeyword, function(
  node: ts.KeywordTypeNode,
  e
): void {
  e.push({
    type: "keyword",
    name: "string"
  });
});

registerVisitor(ts.SyntaxKind.SymbolKeyword, function(
  node: ts.KeywordTypeNode,
  e
): void {
  e.push({
    type: "keyword",
    name: "symbol"
  });
});

registerVisitor(ts.SyntaxKind.ThisKeyword, function(
  node: ts.KeywordTypeNode,
  e
): void {
  e.push({
    type: "keyword",
    name: "this"
  });
});

registerVisitor(ts.SyntaxKind.VoidKeyword, function(
  node: ts.KeywordTypeNode,
  e
): void {
  e.push({
    type: "keyword",
    name: "void"
  });
});

registerVisitor(ts.SyntaxKind.NullKeyword, function(
  node: ts.KeywordTypeNode,
  e
): void {
  e.push({
    type: "keyword",
    name: "null"
  });
});

registerVisitor(ts.SyntaxKind.NeverKeyword, function(
  node: ts.KeywordTypeNode,
  e
): void {
  e.push({
    type: "keyword",
    name: "never"
  });
});

registerVisitor(ts.SyntaxKind.TrueKeyword, function(
  node: ts.KeywordTypeNode,
  e
): void {
  e.push({
    type: "keyword",
    name: "true"
  });
});

registerVisitor(ts.SyntaxKind.FalseKeyword, function(
  node: ts.KeywordTypeNode,
  e
): void {
  e.push({
    type: "keyword",
    name: "false"
  });
});

registerVisitor(ts.SyntaxKind.UndefinedKeyword, function(
  node: ts.KeywordTypeNode,
  e
): void {
  e.push({
    type: "keyword",
    name: "undefined"
  });
});
