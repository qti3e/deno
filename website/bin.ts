import * as fs from "fs";
import { parse } from "./parser";
import { Writer } from "./writer";

if (process.argv.length > 4 || process.argv.length < 3) {
  console.log("Usage: ts-node bin.ts [--html] [fileName]");
  process.exit(1);
}

// Read file and parse it.
const pArgs = process.argv.slice(2);
let isHTML = false;
for (const a of pArgs) {
  if (a === "--html") {
    isHTML = true;
  }
}
const fileName = pArgs.filter(x => x !== "--html")[0];

if (!isHTML) console.log("Start");

const sourceCode = fs.readFileSync(fileName).toString();
const doc = parse(sourceCode, fileName);
const writer = new Writer(isHTML);
const styles = fs.readFileSync(__dirname + "/styles.css");

if (isHTML) {
  process.stdout.write(`<style>${styles}</style>`);
}

for (let i = 0; i < doc.length - 1; ++i) {
  writer.render(doc[i]);
  writer.eol();
  writer.eol();
}
writer.render(doc[doc.length - 1]);
writer.eol();
