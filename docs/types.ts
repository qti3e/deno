import * as ts from "typescript";

export interface Reference {
  fileName?: string;
  name: string;
  isLocal?: boolean;
  typeArgs?: Type[];
  // QualifiedName
  left?: Reference;
  /* @internal */ moduleSpecifier?: ts.Expression;
}

export interface TypeParam {
  kind: "typeParam";
  name: string;
  constraint?: Type;
}

// T | T, T & T, [T, T]
export interface TypeCollection {
  kind: "union" | "intersection" | "tuple";
  types: Type[];
}

// T[], (T), infer T, keyof T
export interface TypeModifier {
  kind: "arrayType" | "parenthesizedType" | "infer" | "keyof";
  type: Type;
}

export type Type =
  | Reference
  | SignatureDocEntry
  | TypeCollection
  | TypeModifier
  | string;

export interface Param {
  kind: "param";
  name: string;
  type?: Type;
  optional?: boolean;
  initializer?: string;
}

export interface NamespaceDocEntry {
  kind: "namespace";
  doc?: JSDoc;
  name?: string;
  childs: DocEntry[];
}

export interface ClassDocEntry {
  kind: "class";
  doc: JSDoc;
  name: string;
  extends?: Reference;
  implement?: Reference[];
  typeParams?: TypeParam[];
  isAbstract?: boolean;
  childs: DocEntry[];
}

export interface ConstantDocEntry {
  kind: "constant";
  doc: JSDoc;
  name: string;
  type?: Type;
  value: string | Reference;
}

export interface SignatureDocEntry {
  kind: "signature";
  doc: JSDoc;
  name?: string;
  typeParams: TypeParam[];
  params: Param[];
  returnType?: Type;
  isStatic?: boolean;
  isAsync?: boolean;
  isAbstract?: boolean;
  hasAsterisk?: boolean;
  isConstructor?: boolean;
  // TODO(qti3e)
  isPrivate?: boolean;
  isProtected?: boolean;
}

export interface TypeAliasDocEntry {
  kind: "type";
  doc: JSDoc;
  name: string;
  typeParams?: TypeParam[];
  members: DocEntry[];
}

export interface InterfaceDocEntry {
  kind: "interface";
  // TODO(qti3e)
}

// TODO
export interface JSDoc {}

export type DocEntry =
  | NamespaceDocEntry
  | ClassDocEntry
  | ConstantDocEntry
  | SignatureDocEntry;
