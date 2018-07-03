// Copyright 2018 Ryan Dahl <ry@tinyclouds.org>
// All rights reserved. MIT License.

import * as ts from "typescript";
import { registerVisitor } from "./parser";
import * as types from "./types";

registerVisitor(ts.SyntaxKind.JSDocComment, function(node: ts.JSDoc, e): void {
  const tags: types.JSDocTag[] = [];
  if (node.tags) {
    for (const t of node.tags) {
      this.visit(t, tags);
    }
  }
  e.push({
    type: "jsdoc",
    comment: node.comment,
    tags
  });
});

// TODO
// JSDocTag
// JSDocAugmentsTag
// JSDocClassTag
// JSDocCallbackTag
// JSDocParameterTag
// JSDocReturnTag
// JSDocTypeTag
// JSDocTemplateTag
// JSDocTypedefTag
// JSDocPropertyTag
