#!/bin/bash
prettier --write \
  parser.ts \
  test.ts \
  types.ts \
  util.ts \
  parser_test.ts \
  parser_module.ts \
  parser_function.ts \
  parser_jsdoc.ts \
  parser_keyword.ts
