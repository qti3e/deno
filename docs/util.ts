import * as ts from "typescript";

export function isDeclaration(node): node is ts.DenoDeclaration {
  return ts.isFunctionLike(node) ||
    ts.isVariableDeclaration(node) ||
    ts.isInterfaceDeclaration(node) ||
    ts.isEnumDeclaration(node) ||
    ts.isClassDeclaration(node) ||
    ts.isTypeAliasDeclaration(node);
}

export function isScopeNode(node): node is ts.Scope {
  return ts.isSourceFile(node) || ts.isModuleDeclaration(node);
}

export function isExported(node): boolean {
  return (ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Export) !== 0;
}

export function isDefault(node): boolean {
  return (ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Default) !== 0;
}

export function isJunkNode(node): boolean {
  // This is list of nodes that their information is useless for
  // a documentation, so we skip them.
  return (
    ts.isBlock(node) ||
    ts.isSwitchStatement(node) ||
    ts.isWhileStatement(node) ||
    ts.isIfStatement(node) ||
    ts.isDoStatement(node) ||
    ts.isForStatement(node) ||
    ts.isForOfStatement(node) ||
    ts.isForInStatement(node) ||
    ts.isTryStatement(node)
  );
}
