#!/usr/bin/env node

const { generate } = require("./generate");

const argv = require("yargs").option("target", {
  demandOption: true,
  describe: "Language target to generate components for",
  choices: ["flow", "typescript"]
}).argv;

generate(argv);
