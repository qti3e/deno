import * as ts from "typescript";
import * as types from "./types";
import * as ast from "./ast";
import * as _ from "./util";

export function serialize(node: ts.Node | symbol): types.DocEntry {
  if (typeof node === "symbol") return undefined;
  if (_.isScopeNode(node)) {
    return serializeModule(node);
  } else if (ts.isVariableDeclaration(node)) {
    return serializeVariableDeclaration(node);
  } else if (ts.isFunctionLike(node)) {
    return serializeSignature(node);
  } else if (ts.isClassLike(node)) {
    return serializeClass(node);
  } else if (ts.isPropertyDeclaration(node)) {
    return serializeVariableDeclaration(node);
  }
  return undefined;
}

function serializeModule(node: ts.Scope): types.NamespaceDocEntry {
  console.log(node);
  const name = ts.isSourceFile(node) ? "" : node.name.text;
  const doc = ts.isSourceFile(node) ? undefined : ast.getDocumentation(node);
  const childs: types.DocEntry[] = [];
  node.exports.forEach((exportedNode, name) => {
    const declaration = ast.findDeclarationOfExportedNode(exportedNode);
    const docEntry = serialize(declaration);
    if (!docEntry) return;
    docEntry.name = name;
    childs.push(docEntry);
  });
  return {
    kind: "namespace",
    doc,
    name,
    childs
  }
}

function serializeClass(node: ts.ClassLikeDeclaration): types.ClassDocEntry {
  const doc = ast.getDocumentation(node);
  let parent;
  let implement = [];
  if (node.heritageClauses) {
    for (const h of node.heritageClauses) {
      for (const t of h.types) {
        const serialized = serializeTypeNode(t);
        if (h.token === ts.SyntaxKind.ExtendsKeyword) {
          parent = serialized;
        } else {
          implement.push(serialized);
        }
      }
    }
  }
  const docEntry: types.ClassDocEntry = {
    kind: "class",
    doc,
    name: node.name && ts.isIdentifier(node.name) ? node.name.text : "",
    extends: parent,
    implement,
    typeParams: node.typeParameters &&
      node.typeParameters.map(serializeTypeParameter),
    isAbstract: (ts.getCombinedModifierFlags(node) &&
      ts.ModifierFlags.Abstract) !== 0,
    childs: node.members.map(serialize)
  };
  return docEntry;
}

function serializeVariableDeclaration(
  node: ts.VariableDeclaration | ts.PropertyDeclaration
): types.ConstantDocEntry | types.SignatureDocEntry {
  if (node.initializer && ts.isFunctionLike(node.initializer)) {
    return serializeSignature(node.initializer);
  }
  const doc = ast.getDocumentation(node);
  const type = serializeTypeNode(node.type);
  const value = serializeLiteral(node.initializer as ts.LiteralExpression) || "...";
  return {
    kind: "constant",
    doc,
    name: node.name && ts.isIdentifier(node.name) ? node.name.text : undefined,
    type,
    value
  };
}

export function serializeSignature(
  node: ts.SignatureDeclaration
): types.SignatureDocEntry {
  const doc = ast.getDocumentation(node);
  const e: types.SignatureDocEntry = {
    kind: "signature",
    doc,
    typeParams: [],
    params: [],
  }
  if (node.typeParameters) {
    for (const t of node.typeParameters) {
      e.typeParams.push(serializeTypeParameter(t));
    }
  }
  if (node.parameters) {
    for (const p of node.parameters) {
      e.params.push(serializeParameter(p));
    }
  }
  if (node.type) {
    e.returnType = serializeTypeNode(node.type);
  }
  const flags = ts.getCombinedModifierFlags(node);
  if ((flags & ts.ModifierFlags.Static) !== 0) {
    e.isStatic = true;
  }
  if ((flags & ts.ModifierFlags.Async) !== 0) {
    e.isAsync = true;
  }
  if ((flags & ts.ModifierFlags.Abstract) !== 0) {
    e.isAbstract = true;
  }
  if (node["asteriskToken"]) {
    e.hasAsterisk = true;
  }
  if (ts.isConstructSignatureDeclaration(node) ||
    ts.isConstructorTypeNode(node) ||
    ts.isConstructorDeclaration(node)) {
    e.isConstructor = true;
  }
  return e;
}

export function serializeParameter(
  node: ts.ParameterDeclaration
): types.Param {
  const e: types.Param = {
    kind: "param",
    name: ts.isIdentifier(node.name) ? node.name.text : undefined,
  };
  if (node.type) {
    e.type = serializeTypeNode(node.type);
  }
  if (node.questionToken) {
    e.optional = true;
  }
  if (node.initializer) {
    e.initializer = serializeLiteral(node.initializer);
  }
  return e;
}

export function serializeTypeParameter(
  node: ts.TypeParameterDeclaration
): types.TypeParam {
  const e: types.TypeParam = {
    kind: "typeParam",
    name: node.name.text
  };
  if (node.constraint) {
    e.constraint = serializeTypeNode(node.constraint);
  }
  return e;
}

export function serializeLiteral(node: ts.Expression): string {
  if (!node) return undefined;
  switch(node.kind) {
    case ts.SyntaxKind.TrueKeyword:
      return "true";
    case ts.SyntaxKind.FalseKeyword:
      return "false";
    case ts.SyntaxKind.NullKeyword:
    return "null";
    case ts.SyntaxKind.StringLiteral:
    case ts.SyntaxKind.NumericLiteral:
      // Maybe save information about its type somewhere?
      return (node as ts.StringLiteral | ts.NumericLiteral).text;
    default:
      return undefined;
  }
}

function parseKeyword(node: ts.Types): string {
  switch(node.kind) {
    case ts.SyntaxKind.AnyKeyword:
      return "any";
    case ts.SyntaxKind.NumberKeyword:
      return "number";
    case ts.SyntaxKind.ObjectKeyword:
      return "object";
    case ts.SyntaxKind.BooleanKeyword:
      return "boolean";
    case ts.SyntaxKind.StringKeyword:
      return "string";
    case ts.SyntaxKind.SymbolKeyword:
      return "symbol";
    case ts.SyntaxKind.ThisKeyword:
      return "this";
    case ts.SyntaxKind.VoidKeyword:
      return "void";
    case ts.SyntaxKind.UndefinedKeyword:
      return "undefined";
    case ts.SyntaxKind.NullKeyword:
      return "null";
    case ts.SyntaxKind.NeverKeyword:
      return "never";
    case ts.SyntaxKind.TrueKeyword:
      return "true";
    case ts.SyntaxKind.FalseKeyword:
      return "false";
    default:
      return undefined;
  }
}

export function serializeTypeNode(node: ts.Types): types.Type {
  if (!node) return undefined;
  // Parse keywords.
  let ret;
  if (ret = parseKeyword(node)) {
    return ret;
  }
  if (ts.isFunctionTypeNode(node) || ts.isConstructorTypeNode(node)) {
    return serializeSignature(node as ts.SignatureDeclaration);
  }
  if (ts.isUnionTypeNode(node)) {
    return {
      kind: "union",
      types: node.types.map(serializeTypeNode)
    };
  }
  if (ts.isIntersectionTypeNode(node)) {
    return {
      kind: "intersection",
      types: node.types.map(serializeTypeNode)
    };
  }
  if (ts.isTupleTypeNode(node)) {
    return {
      kind: "tuple",
      types: node.elementTypes.map(serializeTypeNode)
    };
  }
  if (ts.isArrayTypeNode(node)) {
    return {
      kind: "arrayType",
      type: serializeTypeNode(node.elementType)
    };
  }
  if (ts.isParenthesizedTypeNode(node)) {
    return {
      kind: "parenthesizedType",
      type: serializeTypeNode(node.type)
    };
  }
  if (ts.isTypeReferenceNode(node)) {
    const reference = serializeEntityName(node.typeName);
    reference.typeArgs = node.typeArguments.map(serializeTypeNode);
    return reference; 
  }
  if (ts.isExpressionWithTypeArguments(node)) {
    // Actully, this is not a type and should not be placed
    // here.
    // TODO(qti3e)
  }
  return undefined;
}

export function serializeEntityName(node: ts.EntityName): types.Reference {
  if (ts.isIdentifier(node)) {
    const tmp = ast.getFileName(node);
    delete tmp.moduleSpecifier;
    return tmp;
  }
  function extractNameRecursive(node: ts.EntityName): types.Reference {
    if (ts.isQualifiedName(node)) {
      const p = extractNameRecursive(node.right);
      if (ts.isIdentifier(node.left)) {
        p.left = ast.getFileName(node.left);
        delete p.left.moduleSpecifier;
      } else {
        p.left = extractNameRecursive(node.left);
      }
      return p;
    } else {
      return {
        name: node.text
      };
    }
  }
  return extractNameRecursive(node);
}