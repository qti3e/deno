// Copyright 2018 Ryan Dahl <ry@tinyclouds.org>
// All rights reserved. MIT License.

import * as ts from "typescript";
import { registerVisitor } from "./parser";
import * as types from "./types";
import * as util from "./util";

registerVisitor(ts.SyntaxKind.EnumDeclaration, function(
  node: ts.EnumDeclaration,
  e
): void {
  const documentation = util.getDocumentation(this, node);
  const members: types.EnumMember[] = [];
  for (const m of node.members) {
    this.visit(m, members);
  }
  e.push({
    type: "enum",
    documentation,
    name: node.name.text,
    members,
    ...util.getModifiers(node)
  });
});

registerVisitor(ts.SyntaxKind.EnumMember, function(
  node: ts.EnumMember,
  e
): void {
  const documentation = util.getDocumentation(this, node);
  this.visit(node.initializer, util.keepFirstElement);
  const initializer = util.keepFirstElement.getData();
  this.visit(node.name, util.keepFirstElement);
  const name: types.Name = util.keepFirstElement.getData();
  // assert(name.type, "name");
  e.push({
    type: "enumMember",
    documentation,
    name: name && name.text,
    initializer
  });
});
