#!/bin/bash
node ./node_modules/.bin/tslint -p .
./tools/test.sh
