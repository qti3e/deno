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
  private padding = 1;
  private lastPadding;
  private lastCharacter;
  private spaceSize = 4;
  private inPre = null;

  private drawPadding(): void {
    if (this.isHTML) {
      if (this.inPre !== null) {
        const paddingSize = this.spaceSize * (this.padding - this.inPre);
        process.stdout.write(" ".repeat(paddingSize));
      }
      return;
    }
    // Only attempt to draw padding when:
    // padding > 0 or
    // content is inside the pre tag.
    if (this.padding < 1 && this.inPre === null) return;
    // Create an array filled with white-space
    // so we can change each element individually.
    let paddingSize = this.spaceSize * this.padding;
    // Always keep free room for pre border.
    if (this.inPre !== null) paddingSize += 2;
    const padding = new Array(paddingSize).fill(" ");
    // Draw border for the pre tag.
    if (this.inPre !== null) {
      padding[this.spaceSize * this.inPre] = chalk.yellowBright("◉");
    }
    // `size` is conceptually same thisng as paddingSize, but with it
    // considers that we should not draw `lines` inside the pre tag.
    const size =
      this.inPre === null ? paddingSize : this.spaceSize * this.inPre;
    // Draw lines.
    for (let i = this.spaceSize - 1; i < size; i += this.spaceSize) {
      // -1 to keep an space before content.
      padding[i - 1] = chalk.red("║");
    }
    // Now we try to make the output look a bit better.
    // If size has changed since the last call to this function,
    // draw a horizontal line.
    if (
      this.lastPadding !== this.padding &&
      this.lastPadding &&
      this.inPre === null
    ) {
      const s = this.lastPadding * this.spaceSize - 2;
      const e = paddingSize - 2;
      padding[s] = chalk.red("╠");
      padding[e] = chalk.red("╗");
      for (let i = s + 1; i < e; ++i) {
        if ((i + 2) % this.spaceSize === 0) {
          padding[i] = chalk.red("╦");
        } else {
          padding[i] = chalk.red("═");
        }
      }
    }
    this.lastPadding = this.padding;
    process.stdout.write(padding.join(""));
  }

  private write(data: string): void {
    // Draw the padding of the first line.
    if (!this.lastCharacter) this.drawPadding();
    for (const c of data) {
      if (this.lastCharacter === "\n") {
        this.drawPadding();
      }
      this.lastCharacter = c;
      if (c === "\n" && this.isHTML && this.inPre === null) {
        process.stdout.write("<br />");
        continue;
      }
      process.stdout.write(c);
    }
  }

  constructor(public isHTML: boolean) {
    this.style = isHTML ? htmlStyle : cliStyle;
  }

  render(entity: string | types.SerilizedData): void {
    if (!entity) return;
    if (typeof entity === "string") {
      this.text(entity);
      return;
    }
    const renderer = renderers[entity.type];
    if (!renderer) {
      throw new Error(`Can not render ${entity.type}.`);
    }
    if (this.isHTML && this.inPre === null) {
      this.write(`<div class="doc-entity doc-${entity.type}">`);
    }
    renderer(this, entity);
    if (this.isHTML && this.inPre === null) this.write(`</div>`);
  }

  increasePadding() {
    this.padding++;
    if (this.isHTML && this.inPre === null) {
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
    if (this.isHTML && this.inPre === null) {
      this.write(`</div>`);
    }
  }

  eol() {
    if (this.isHTML && !this.inPre) return;
    this.write("\n");
  }

  comment(str: string): void {
    this.write(this.style.comment(str));
  }

  keyword(str: string): void {
    this.write(this.style.keyword(str));
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

  openAnchor(href: string): void {
    if (this.isHTML) {
      this.write(`<a href="${href}">`);
    }
  }

  closeAnchor(): void {
    if (this.isHTML) {
      this.write(`</a>`);
    }
  }

  openPre(): void {
    this.inPre = this.padding;
    if (this.isHTML) {
      this.write(`<pre>`);
    }
  }

  closePre(): void {
    this.inPre = null;
    if (this.isHTML) {
      this.write(`</pre>`);
    }
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
  header(str: string): string;
}

const cliStyle: Style = {
  comment: chalk.green,
  keyword: chalk.blue,
  identifier: chalk.green.bold,
  literal: chalk.yellow.italic,
  text: chalk,
  header: chalk.bold
};

const htmlStyle: Style = {
  comment(str) {
    return `<span class="comment">${str}</span>`;
  },
  keyword(str) {
    return `<span class="keyword">${str}</span>`;
  },
  identifier(str) {
    return `<span class="identifier">${str}</span>`;
  },
  literal(str) {
    return `<span class="literal">${str}</span>`;
  },
  text(str) {
    return str;
  },
  header(str) {
    return `<h1>${str}</h1>`;
  }
};
