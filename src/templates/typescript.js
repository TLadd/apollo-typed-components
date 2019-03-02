const {
  getOperationClassDeclarations,
  getQueryFileImports,
  getReactApolloImports,
  getTypeImports
} = require("./shared");

/**
 * Wraps the apollo class Query or Mutation to pass the corresponding query DocumentNode
 * @param {The query, mutation or subscription operation name} name
 * @param {Query, Mutation or Subscription} type
 */
const operationComponentTemplate = ({ name, type }) => {
  const className = `${name}${type}Class`;
  return `export const ${name}${type} = (props: Omit<GetComponentProps<${className}>, "${type.toLowerCase()}">) => <${className} ${type.toLowerCase()}={${name}} {...props} />;`;
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
    'import * as React from "react";\n' +
    `import { ${reactApolloImports} } from "react-apollo";\n` +
    `import {\n${queryFileImports}\n} from "./queries.graphql"\n` +
    `import {\n${typeImports}\n} from "types";\n\n` +
    `type GetComponentProps<T> = T extends React.Component<infer P> ? P : never;\n` +
    `type Omit<T, K> = Pick<T, Exclude<keyof T, K>>;\n\n` +
    `${operationClasses}\n\n` +
    `${operationComponents}`
  );
};

module.exports = {
  typescriptTemplate: fileTemplate
};
