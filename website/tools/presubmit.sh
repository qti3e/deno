#!/bin/bash
node ./node_modules/.bin/tslint -p .
node ./node_modules/.bin/tsc --noEmit
./tools/test.sh
