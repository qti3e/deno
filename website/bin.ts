import * as fs from "fs";
import { parse } from "./parser";
import { Writer } from "./writer";

if (process.argv.length > 4 || process.argv.length < 3) {
  console.log("Usage: ts-node bin.ts [--html] [fileName]");
  process.exit(1);
}

// Read file and parse it.
const fileName = process.argv[process.argv.length === 3 ? 2 : 3];
const isHTML = process.argv[process.argv.length === 4 ? 2 : null];

const sourceCode = fs.readFileSync(fileName).toString();
const doc = parse(sourceCode, fileName);
const writer = new Writer(isHTML === "--html");

for (const entity of doc) {
  writer.render(entity);
}
console.log();
