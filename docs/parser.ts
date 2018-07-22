import * as ts from "typescript";
import { preProcessSourceFile } from "./ast";
import { NamespaceDocEntry } from "./types";
import { serialize } from "./serializer";

const sourceFilesCache = new Map<string, ts.SourceFile>();

let fetcchSourceCodeCb: (fileName: string) => string = () => {
  throw new Error(`You must call setFetchSourceCode first.`);
}

export function setFetchSourceCode(cb: (fileName: string) => string) {
  fetcchSourceCodeCb = cb;
}

export function getSourceFile(fileName: string): ts.SourceFile {
  if (sourceFilesCache.has(fileName)) {
    return sourceFilesCache.get(fileName);
  }
  const sourceText = fetcchSourceCodeCb(fileName);
  if (!sourceText) {
    throw new Error(`Can not resolve "${fileName}".`);
  }
  const sourceFile = ts.createSourceFile(
    fileName,
    sourceText,
    ts.ScriptTarget.Latest
  );
  preProcessSourceFile(sourceFile);
  sourceFilesCache.set(fileName, sourceFile);
  return sourceFile;
}

export function resolveModule(moduleSpecifier: ts.Expression): ts.SourceFile {
  if (!ts.isStringLiteral(moduleSpecifier)) {
    // In an export declaration node.moduleSpecifier
    // might be something rather than string literal
    // but it's a grammar error.
    throw new Error("Unexcpected moduleSpecifier");
  }
  // TODO(qti3e) Support relative path.
  return getSourceFile(moduleSpecifier.text);
}

export function parse(fileName: string): NamespaceDocEntry {
  const sourceFile = getSourceFile(fileName);
  return serialize(sourceFile) as NamespaceDocEntry;
}
