import * as fs from "fs";
import { parse } from "./parser";
import { Writer } from "./writer";

// Read file and parse it.
const fileName = process.argv[2];

if (!fileName) {
  console.log("Usage: ts-node bin.ts [fileName]");
  process.exit(1);
}

const sourceCode = fs.readFileSync(fileName).toString();
const doc = parse(sourceCode, fileName);
const writer = new Writer("");

for (const entity of doc) {
  writer.render(entity);
  writer.eol();
  writer.eol();
}
