const fs = require("fs");
const glob = require("glob");
const gql = require("graphql-tag").default;
const async = require("async");

/**
 * Find every queries.graphql file and generate a corresponding components file next to it
 * with Query and Mutation components for each operation using generated type from apollo-cli
 */
const generate = callback => {
  glob(
    "**/queries.graphql",
    {
      ignore: "node_modules/**"
    },
    (error, files) => {
      if (error) {
        return callback(error);
      }

      async.each(
        files,
        (filename, cb) => {
          fs.readFile(filename, "utf8", (error, data) => {
            if (error) {
              return cb(error);
            }

            generateCompsFromParsedQueryFile(
              {
                filename,
                parsedData: gql(data)
              },
              cb
            );
          });
        },
        callback
      );
    }
  );
};

/**
 * Writes a file with generated react-apollo Query and Mutation components
 * based on the parsedData input
 * @param {graphql AST output from gql} parsedData
 */
const generateCompsFromParsedQueryFile = (
  { filename, parsedData },
  callback
) => {
  const operations = parsedData.definitions
    .map(def => {
      if (def.kind !== "OperationDefinition") {
        return null;
      }

      if (def.operation === "query") {
        return {
          type: "Query",
          name: def.name.value,
          hasVars: Boolean(def.variableDefinitions.length)
        };
      } else if (def.operation === "mutation") {
        return {
          type: "Mutation",
          name: def.name.value,
          hasVars: Boolean(def.variableDefinitions.length)
        };
      } else {
        return null;
      }
    })
    .filter(Boolean);

  if (operations.length === 0) {
    console.warn(`No queries or mutations found in ${filename}`);
    return callback();
  }

  const outputFileText = fileTemplate({ operations });

  const outputFilePath = filename.substring(
    0,
    filename.length - "queries.graphql".length
  );
  const outputFilename = `${outputFilePath}ApolloComps.js`;

  fs.writeFile(outputFilename, outputFileText, error => {
    if (error) {
      return callback(error);
    }
    callback();
  });
};

/**
 * Returns a string that declares a react-apollo Query or Mutation component with types
 * @param {The query or mutation operation name} name
 * @param {Query or Mutation} type
 * @param {Boolean whether the operation takes in variables or not} hasVars
 */
const operationClassTemplate = ({ name, type, hasVars }) => {
  if (hasVars) {
    return `class ${name}${type}Class extends ${type}<${name}Type, ${name}Variables> {};`;
  }
  return `class ${name}${type}Class extends ${type}<${name}Type, {}> {};`;
};

/**
 * Wraps the apollo class Query or Mutation to pass the corresponding query DocumentNode
 * @param {The query or mutation operation name} name
 * @param {Query or Mutation} type
 */
const operationComponentTemplate = ({ name, type }) => {
  return `export const ${name}${type} = (props: $Diff<React.ElementConfig<typeof ${name}${type}Class>, { ${type.toLowerCase()}: any }>) => <${name}${type}Class ${type.toLowerCase()}={${name}} {...props} />;`;
};

/**
 * Returns the string contents of the generated components files
 * @param {Array of { type, name, hasVars } objects} operations
 */
const fileTemplate = ({ operations }) => {
  const hasQueries = operations.some(op => op.type === "Query");
  const hasMutations = operations.some(op => op.type === "Mutation");

  let reactApolloImports;
  if (hasQueries && hasMutations) {
    reactApolloImports = "Query, Mutation";
  } else if (hasQueries) {
    reactApolloImports = "Query";
  } else if (hasMutations) {
    reactApolloImports = "Mutation";
  }

  const typeImports = operations
    .map(op => {
      const operationType = `${op.name} as ${op.name}Type`;
      if (op.hasVars) {
        return `  ${operationType},\n  ${op.name}Variables`;
      }
      return `  ${operationType}`;
    })
    .join(",\n");

  const queryImports = operations.map(op => `  ${op.name}`).join(",\n");

  const operationClasses = operations.map(operationClassTemplate).join("\n");

  const operationComponents = operations
    .map(operationComponentTemplate)
    .join("\n");

  return (
    "/* DO NOT EDIT Generated using apollo-flow-components */\n" +
    "// @flow\n" +
    'import * as React from "react";\n' +
    `import { ${reactApolloImports} } from "react-apollo";\n` +
    `import {\n${queryImports}\n} from "./queries.graphql"\n` +
    `import type {\n${typeImports}\n} from "types";\n\n` +
    `${operationClasses}\n\n` +
    `${operationComponents}`
  );
};

module.exports = {
  generate
};
