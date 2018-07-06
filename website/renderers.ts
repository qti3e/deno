import * as types from "./types";
import { Writer } from "./writer";

export function renderFunction(w: Writer, e: types.FunctionDeclaration) {
  w.write(w.style.keyword("function"));
  w.write(" ");
  w.write(w.style.identifier(e.name));
  w.renderTypeParameters(e.typeParameters);
  w.write("(");
  w.renderParameters(e.parameters);
  w.write(")");
  if (e.returnType) {
    w.write(": ");
    w.render(e.returnType);
  }
  w.write(";");
  w.renderChild(e.documentation);
}

export function renderParameter(w: Writer, e: types.Parameter) {
  w.write(e.name);
  if (e.optional) {
    w.write("?");
  }
  if (e.dataType) {
    w.write(": ");
    w.render(e.dataType);
  }
}

export function renderTypeParam(w: Writer, e: types.TypeParameter) {
  w.write(w.style.identifier(e.name));
  if (e.constraint) {
    w.write(" ");
    w.write(w.style.keyword("extends"));
    w.write(" ");
    w.render(e.constraint);
  }
}

export function renderTypeRef(w: Writer, e: types.TypeReference) {
  w.write(e.name);
  w.renderTypeParameters(e.arguments);
}

export function renderJsdoc(w: Writer, e: types.JSDocComment) {
  w.write(e.comment);
}

export function renderKeyword(w: Writer, e: types.Keyword<string>) {
  w.write(w.style.keyword(e.name));
}
