// Copyright 2018 Ryan Dahl <ry@tinyclouds.org>
// All rights reserved. MIT License.

import chalk from "chalk";
import * as r from "./renderers";
import * as types from "./types";

const renderers = Object.create(null);
for (let key in r) {
  if (r.hasOwnProperty(key)) {
    const val = r[key];
    key = key[6].toLowerCase() + key.substr(7);
    renderers[key] = val;
  }
}

export class Writer {
  private childWriter: Writer;
  style = style;
  constructor(private readonly padding: string) {}

  write(data: string) {
    const lines = data.split(/\n/g).map(l => this.padding + l);
    process.stdout.write(lines.join("\n"));
  }

  eol() {
    process.stdout.write("\n");
  }

  render(entity: types.SerilizedData | string) {
    if (typeof entity === "string") {
      this.write(entity + "\n");
      return;
    }
    const renderer = renderers[entity.type];
    if (!renderer) {
      this.write(
        style.error(
          "error: Can not render `" + style.identifier(entity.type) + "`."
        )
      );
      return;
    }
    renderer(this, entity);
  }

  renderChild(entity: types.SerilizedData | string) {
    if (!this.childWriter) {
      const padding = this.padding + style.border("    ║ ");
      this.childWriter = new Writer(padding);
    } else {
      this.childWriter.eol();
      this.write(style.border("    ╠══════════"));
    }
    this.childWriter.eol();
    this.childWriter.render(entity);
  }

  renderParameters(parameters: type.SerilizedData[]) {
    if (!parameters) return;
    parameters.forEach((e, i) => {
      if (i > 0 && parameters.length > 1) {
        this.write(", ");
      }
      this.render(e);
    });
  }

  renderTypeParameters(parameters: type.TypeParameter[]) {
    if (!parameters || parameters.length === 0) return;
    this.write("<");
    this.renderParameters(parameters);
    this.write(">");
  }
}

const style = {
  border: chalk.red,
  error: chalk.red.italic,
  comment: chalk,
  keyword: chalk.blue,
  identifier: chalk.green.bold
};
