// Copyright 2018 Ryan Dahl <ry@tinyclouds.org>
// All rights reserved. MIT License.

import chalk from "chalk";
import * as r from "./renderers";
import * as types from "./types";

// Writer is the core part of documentation rendering,
// it provides a single interface for other functions
// to generate output for both HTML pages and CLI.

// Pre compute renderers name.
// Removes `render` from the begining of the name
// and convert name to lowerCamelCase.
const renderers = Object.create(null);
for (let key in r) {
  if (r.hasOwnProperty(key)) {
    const val = r[key];
    key = key[6].toLowerCase() + key.substr(7);
    renderers[key] = val;
  }
}

export class Writer {
  private style: Style;
  private lastCharacter = "\n";
  private padding = 0;

  constructor(public isHTML: boolean) {
    this.style = isHTML ? htmlStyle : cliStyle;
  }

  render(entity: string | types.SerilizedData): void {
    if (typeof entity === "string") {
      this.text(entity);
      return;
    }
    const renderer = renderers[entity.type];
    if (!renderer) {
      throw new Error(`Can not render ${entity.type}.`);
    }
    if (this.isHTML) {
      this.write(`<div class="doc-entity doc-${entity.type}"`);
    }
    renderer(this, entity);
    if (this.isHTML) this.write(`</div>`);
  }

  increasePadding() {
    this.padding++;
    if (this.isHTML) {
      this.write(`<div class="padding">`);
    }
  }

  decreasePadding() {
    this.padding--;
    if (this.padding < 0) {
      throw new Error(
        "Called decreasePadding() more than expected number of times."
      );
    }
    if (this.isHTML) {
      this.write(`</div>`);
    }
  }

  private cliWriteLine(line: string): void {
    const padding = " ".repeat(this.padding * 4);
    if (this.lastCharacter === "\n") {
      line = padding + line;
    }
    process.stdout.write(line);
    this.lastCharacter = line[line.length - 1];
  }

  private write(data: string): void {
    if (this.isHTML) {
      process.stdout.write(data);
      return;
    }
    data.split(/\n/g).forEach(this.cliWriteLine.bind(this));
  }

  comemnt(str: string): void {
    this.write(this.style.comment(str));
  }

  keyword(str: string): void {
    this.write(this.style.comment(str));
  }

  identifier(str: string): void {
    this.write(this.style.identifier(str));
  }

  literal(str: string): void {
    this.write(this.style.literal(str));
  }

  text(str: string): void {
    this.write(this.style.text(str));
  }

  anchor(str: string, href: string): void {
    this.write(this.style.anchor(str, href));
  }

  pre(str: string): void {
    this.write(this.style.pre(str));
  }

  header(str: string): void {
    this.write(this.style.header(str));
  }
}

export interface Style {
  comment(str: string): string;
  keyword(str: string): string;
  identifier(str: string): string;
  literal(str: string): string;
  text(str: string): string;
  anchor(str: string, href: string): string;
  pre(str: string): string;
  header(str: string): string;
}

const cliStyle: Style = {
  comment: chalk.green,
  keyword: chalk.blue,
  identifier: chalk.green.bold,
  literal: chalk.yellow.italic,
  text: chalk,
  anchor: chalk,
  pre: chalk,
  header: chalk.bold
};

const htmlStyle: Style = {
  comment(str) {
    return `<p class="comment">${str}</p>`;
  },
  keyword(str) {
    return `<p class="keyword">${str}</p>`;
  },
  identifier(str) {
    return `<p class="identifier">${str}</p>`;
  },
  literal(str) {
    return `<p class="literal">${str}</p>`;
  },
  text(str) {
    return str;
  },
  anchor(str, href) {
    return str.anchor(href);
  },
  pre(str) {
    return `<pre>${str}</pre`;
  },
  header(str) {
    return `<h1>${str}<h1>`;
  }
};
