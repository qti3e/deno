import * as types from "./types";
import { Writer } from "./writer";

function isEmpty(a: any[] | undefined): boolean {
  return !a || a.length === 0;
}

export function renderFunction(w: Writer, e: types.FunctionDeclaration): void {
  w.header(`function ${e.name}`);
  w.eol();

  w.openPre();
  if (e.async) {
    w.keyword("async ");
  }
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
  w.text(";");
  w.closePre();

  w.eol();
  w.render(e.documentation);
}

export function renderTypeParam(w: Writer, e: types.TypeParameter): void {
  w.identifier(e.name);
  if (e.constraint) {
    w.keyword(" extends ");
    w.render(e.constraint);
  }
}

export function renderTypeRef(w: Writer, e: types.TypeReference): void {
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

export function renderParameter(w: Writer, e: types.Parameter): void {
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

export function renderJsdoc(w: Writer, e: types.JSDocComment): void {
  w.text(e.comment);
}

export function renderKeyword(w: Writer, e: types.Keyword<string>): void {
  w.keyword(e.name);
}

export function renderFunctionType(w: Writer, e: types.FunctionType): void {
  w.text("(");
  e.typeParameters.forEach((t, i) => {
    if (i > 0 && e.typeParameters.length > 0) {
      w.text(", ");
    }
    w.render(t);
  });
  w.text("): ");
  w.render(e.returnType);
}

export function renderParenthesizedType(
  w: Writer,
  e: types.ParenthesizedType
): void {
  w.text("(");
  w.render(e.elementType);
  w.text(")");
}

export function renderTupleType(w: Writer, e: types.TupleType): void {
  w.text("[");
  w.render(e.elementTypes[0]);
  for (let i = 1; i < e.elementTypes.length; ++i) {
    w.text(", ");
    w.render(e.elementTypes[i]);
  }
  w.text("]");
}

export function renderArrayType(w: Writer, e: types.ArrayType): void {
  w.render(e.elementType);
  w.text("[]");
}

export function renderString(w: Writer, e: types.StringLiteral): void {
  w.literal(JSON.stringify(e.text));
}

export function renderNumber(w: Writer, e: types.NumericLiteral): void {
  w.literal(e.text);
}

export function renderUnionType(w: Writer, e: types.UnionType): void {
  w.render(e.types[0]);
  for (let i = 1; i < e.types.length; ++i) {
    w.text(" | ");
    w.render(e.types[i]);
  }
}

export function renderIntersectionType(
  w: Writer,
  e: types.IntersectionType
): void {
  w.render(e.types[0]);
  for (let i = 1; i < e.types.length; ++i) {
    w.text(" & ");
    w.render(e.types[i]);
  }
}
