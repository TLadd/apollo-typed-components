const fs = require("fs");
const glob = require("glob");
const gql = require("graphql-tag").default;
const async = require("async");
const { flowTemplate, typescriptTemplate } = require("./templates");

/**
 * Find every queries.graphql file and generate a corresponding components file next to it
 * with Query and Mutation components for each operation using generated type from apollo-cli
 */
const generate = (options, callback) => {
  const { target } = options;

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
                parsedData: gql(data),
                target
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
 * @param {queries.graphql filename} filename
 * @param {graphql AST output from gql} parsedData
 * @param {flow or typescript} target
 */
const generateCompsFromParsedQueryFile = (
  { filename, parsedData, target },
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
      } else if (def.operation === "subscription") {
        return {
          type: "Subscription",
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

  let outputFileText;
  switch (target) {
    case "flow":
      outputFileText = flowTemplate({ operations });
      break;
    case "typescript":
      outputFileText = typescriptTemplate({ operations });
      break;
    default:
      console.warn(`Invalid target ${target}`);
  }

  const outputFilePath = filename.substring(
    0,
    filename.length - "queries.graphql".length
  );

  let fileExtension;
  switch (target) {
    case "flow":
      fileExtension = "js";
      break;
    case "typescript":
      fileExtension = "tsx";
      break;
    default:
      console.warn(`Invalid target ${target}`);
  }
  const outputFilename = `${outputFilePath}ApolloComps.${fileExtension}`;

  fs.writeFile(outputFilename, outputFileText, error => {
    if (error) {
      return callback(error);
    }
    callback();
  });
};

module.exports = {
  generate
};
