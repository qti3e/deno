import * as types from "./types";
import { Writer } from "./writer";

function isEmpty(a: any[] | undefined): boolean {
  return !a || a.length === 0;
}

export function renderFunction(w: Writer, e: types.FunctionDeclaration) {
  w.header(`function ${e.name}`);
  w.eol();
  w.openPre();
  w.keyword("function ");
  w.identifier(e.name);
  if (!isEmpty(e.typeParameters)) {
    w.text("<");
    e.typeParameters.forEach((t, i) => {
      if (i > 0 && e.typeParameters.length > 0) {
        w.text(", ");
      }
      w.render(t);
    });
    w.text(">");
  }
  w.text("(");
  e.parameters.forEach((t, i) => {
    if (i > 0 && e.parameters.length > 0) {
      w.text(", ");
    }
    w.render(t);
  });
  if (e.parameters.length > 0) {
    w.eol();
  }
  w.text(")");
  if (e.generator) {
    w.text("*");
  }
  if (e.returnType) {
    w.text(": ");
    w.render(e.returnType);
  }
  w.closePre();
  w.eol();
  w.increasePadding();
  w.increasePadding();
  w.render(e.documentation);
  w.decreasePadding();
  w.decreasePadding();
}

export function renderTypeParam(w: Writer, e: types.TypeParameter) {
  w.identifier(e.name);
  if (e.constraint) {
    w.keyword(" extends ");
    w.render(e.constraint);
  }
}

export function renderTypeRef(w: Writer, e: types.TypeReference) {
  // TODO
  w.openAnchor(e.fileName);
  w.identifier(e.name);
  w.closeAnchor();
  if (!isEmpty(e.arguments)) {
    w.text("<");
    e.arguments.forEach((t, i) => {
      if (i > 0 && e.arguments.length > 0) {
        w.text(", ");
      }
      w.render(t);
    });
    w.text(">");
  }
}

export function renderParameter(w: Writer, e: types.Parameter) {
  w.eol();
  w.increasePadding();
  if (typeof e.documentation === "string" && e.documentation) {
    const doc = e.documentation.split(/\n/g).map(l => "// " + l);
    w.comment(doc.join("\n"));
    w.eol();
  }
  w.text(e.name);
  if (e.optional) {
    w.text("?");
  }
  if (e.dataType) {
    w.text(": ");
    w.render(e.dataType);
  }
  w.decreasePadding();
}

export function renderJsdoc(w: Writer, e: types.JSDocComment) {
  w.text(e.comment);
}
