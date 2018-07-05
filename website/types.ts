// Copyright 2018 Ryan Dahl <ry@tinyclouds.org>
// All rights reserved. MIT License.

import * as ts from "typescript";

export type DocEntity =
  | FunctionDeclaration
  | TypeDeclaration
  | EnumDeclaration
  | InterfaceDeclaration;

export type Type =
  | Keyword<string>
  | TypeReference
  | UnionType
  | IntersectionType
  | ArrayType
  | TupleType
  | FunctionType
  | ParenthesizedType
  | StringLiteral
  | NumericLiteral
  | TypeLiteral
  | ConditionalType
  | TypeOperator
  | TypeQuery
  | IndexedAccessType
  // TODO Remove TypePredicate and InferType from here.
  | TypePredicate
  | InferType;

// TODO
export type TypeElement =
  | IndexSignature
  | ConstructSignature
  | PropertySignature
  | MethodSignature;

export type SerilizedData =
  | DocEntity
  | Type
  | TypeElement
  | JSDocComment
  | Parameter
  | TypeParameter
  | EnumMember
  | Name
  | ExpressionWithTypeArguments;

export interface DocEntityBase extends Modifiers {
  name: string;
  documentation: Comment;
}

export interface Reference {
  fileName: string;
}

export interface IndexedAccessType {
  type: "indexedAccessType";
  object: Type;
  index: Type;
}

export interface InferType {
  type: "inferType";
  parameter: TypeParameter;
}

export interface TypePredicate {
  type: "typePredicate";
  parameterName: string;
  dataType: Type;
}

export interface TypeQuery {
  type: "typeQuery";
  exprName: string;
}

export interface ExpressionWithTypeArguments extends Reference {
  type: "expressionWithTypeArguments";
  expression: string;
  arguments: Type[];
}

export interface MethodSignature {
  type: "methodSignature";
  name: string;
  documentation: Comment;
  parameters: Parameter[];
  dataType: Type;
  typeParameters: TypeParameter[];
  optional: boolean;
}

export interface InterfaceDeclaration extends DocEntityBase {
  type: "interface";
  parameters: TypeParameter[];
  heritageClauses: Type[];
  members: TypeElement[];
}

export interface TypeOperator {
  type: "typeOperator";
  operator: Keyword<"keyOf" | "unique">;
  subject: Type;
}

export interface ConditionalType {
  type: "conditionalType";
  checkType: Type;
  extendsType: Type;
  trueType: Type;
  falseType: Type;
}

export interface PropertySignature {
  type: "propertySignature";
  documentation: Comment;
  name: string;
  optional: boolean;
  dataType: Type;
}

export interface EnumDeclaration extends DocEntityBase {
  type: "enum";
  members: EnumMember[];
}

export interface EnumMember {
  type: "enumMember";
  documentation: Comment;
  name: string;
  initializer?: NumericLiteral | StringLiteral | Keyword<string>;
}

export interface ConstructSignature {
  type: "constructSignature";
  documentation: Comment;
  parameters: Parameter[];
  returnType: Type;
}

export interface IndexSignature {
  type: "indexSignature";
  documentation: Comment;
  parameters: TypeParameter[];
  dataType: Type;
}

export interface TypeLiteral {
  type: "typeLiteral";
  members: TypeElement[];
}

export interface FunctionType {
  type: "functionType";
  parameters: Parameter[];
  returnType: Type;
  typeParameters: TypeParameter[];
}

export interface ParenthesizedType {
  type: "parenthesizedType";
  elementType: Type;
}

export interface TupleType {
  type: "tupleType";
  elementTypes: Type[];
}

export interface ArrayType {
  type: "arrayType";
  elementType: Type;
}

export interface StringLiteral {
  type: "string";
  text: string;
}

export interface NumericLiteral {
  type: "number";
  text: string;
}

export interface UnionType {
  type: "unionType";
  types: Type[];
}

export interface IntersectionType {
  type: "intersectionType";
  types: Type[];
}

export interface TypeDeclaration extends DocEntityBase {
  type: "type";
  parameters: TypeParameter[];
  definition: Type;
}

export interface TypeParameter {
  type: "typeParam";
  name: string;
  constraint?: Type;
}

export interface TypeReference extends Reference {
  type: "typeRef";
  name: string;
  arguments: Type[];
}

export interface Keyword<Name> {
  type: "keyword";
  name: Name;
}

export interface FunctionDeclaration extends DocEntityBase {
  type: "function";
  parameters: Parameter[];
  returnType?: Type;
  generator: boolean;
  typeParameters: TypeParameter[];
}

export interface Parameter extends DocEntityBase {
  type: "parameter";
  dataType?: Type;
  optional: boolean;
}

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

/**
 * Should not be used in final generated data.
 * @internal
 */
export interface Name {
  type: "name";
  ref: ts.Identifier;
  text: string;
}
