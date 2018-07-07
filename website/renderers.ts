import * as types from "./types";
import { Writer } from "./writer";

export function renderFunction(w: Writer, e: types.FunctionDeclaration) {
  w.header(`function ${e.name}`);
  w.eol();
  w.openPre();
  w.increasePadding();
  w.text("S");
  w.text("P");
  w.text("\nR");
  w.decreasePadding();
  w.closePre();
  w.increasePadding();
  w.eol();
  w.text("test");
  w.decreasePadding();
}
