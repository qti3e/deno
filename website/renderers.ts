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
    w.render(e.typeParameters[0]);
    for (let i = 1; i < e.typeParameters.length; ++i) {
      w.text(", ");
      w.render(e.typeParameters[i]);
    }
    w.text(">");
  }
  w.text("(");
  w.increasePadding();
  if (!isEmpty(e.parameters)) {
    w.eol();
    w.render(e.parameters[0]);
    for (let i = 1; i < e.parameters.length; ++i) {
      w.text(", ");
      w.eol();
      w.render(e.parameters[i]);
    }
  }
  w.decreasePadding();
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
    w.render(e.arguments[0]);
    for (let i = 1; i < e.arguments.length; ++i) {
      w.text(", ");
      w.render(e.arguments[i]);
    }
    w.text(">");
  }
}

export function renderParameter(w: Writer, e: types.Parameter): void {
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
}

export function renderJsdoc(w: Writer, e: types.JSDocComment): void {
  w.text(e.comment);
}

export function renderKeyword(w: Writer, e: types.Keyword<string>): void {
  w.keyword(e.name);
}

export function renderFunctionType(w: Writer, e: types.FunctionType): void {
  if (!isEmpty(e.typeParameters)) {
    w.text("<");
    w.render(e.typeParameters[0]);
    for (let i = 1; i < e.typeParameters.length; ++i) {
      w.text(", ");
      w.render(e.typeParameters[i]);
    }
    w.text(">");
  }
  w.text("(");
  if (!isEmpty(e.parameters)) {
    w.render(e.parameters[0]);
    for (let i = 1; i < e.parameters.length; ++i) {
      w.text(", ");
      w.render(e.parameters[i]);
    }
  }
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

export function renderTypePredicate(w: Writer, e: types.TypePredicate): void {
  w.identifier(e.parameterName);
  w.text(" is ");
  w.render(e.dataType);
}

export function renderType(w: Writer, e: types.TypeDeclaration): void {
  w.header(`type ${e.name}`);
  w.eol();
  let typeLiteral = false;

  w.openPre();
  w.keyword("type ");
  w.identifier(e.name);
  if (!isEmpty(e.parameters)) {
    w.text("<");
    w.render(e.parameters[0]);
    for (let i = 1; i < e.parameters.length; ++i) {
      w.text(", ");
      w.render(e.parameters[i]);
    }
    w.text(">");
  }
  if (e.definition.type === "typeLiteral") {
    if (e.definition.members.length === 0) {
      w.text(" = ");
      w.text("{}");
    } else {
      typeLiteral = true;
    }
  } else {
    w.text(" = ");
    w.render(e.definition);
  }
  if (!typeLiteral) {
    w.text(";");
  }
  w.closePre();

  w.eol();
  w.render(e.documentation);

  if (typeLiteral) {
    w.eol();
    w.increasePadding();
    w.header("Members:");
    w.render(e.definition);
    w.decreasePadding();
  }
}

export function renderTypeLiteral(w: Writer, e: types.TypeLiteral): void {
  w.render(e.members[0]);
  for (let i = 1; i < e.members.length; ++i) {
    w.eol();
    w.render(e.members[i]);
  }
}

export function renderProperty(w: Writer, e: types.Property): void {
  w.eol();
  w.openPre();
  w.identifier(e.name);
  if (e.optional) {
    w.text("?");
  }
  if (e.dataType) {
    w.text(": ");
    w.render(e.dataType);
  }
  // TODO initializer
  w.text(";");
  w.closePre();
  if (e.documentation) {
    w.eol();
    w.render(e.documentation);
  }
}
