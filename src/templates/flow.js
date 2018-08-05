const {
  getOperationClassDeclarations,
  getQueryFileImports,
  getReactApolloImports,
  getTypeImports
} = require("./shared");

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
  const reactApolloImports = getReactApolloImports({ operations });

  const typeImports = getTypeImports({ operations });

  const queryFileImports = getQueryFileImports({ operations });

  const operationClasses = getOperationClassDeclarations({ operations });

  const operationComponents = operations
    .map(operationComponentTemplate)
    .join("\n");

  return (
    "/* Generated using apollo-typed-components */\n" +
    "// @flow\n" +
    'import * as React from "react";\n' +
    `import { ${reactApolloImports} } from "react-apollo";\n` +
    `import {\n${queryFileImports}\n} from "./queries.graphql"\n` +
    `import type {\n${typeImports}\n} from "types";\n\n` +
    `${operationClasses}\n\n` +
    `${operationComponents}`
  );
};

module.exports = {
  flowTemplate: fileTemplate
};
