/**
 * Returns a string that declares a react-apollo Query or Mutation component with types
 * @param {The query or mutation operation name} name
 * @param {Query, Mutation or Subscription} type
 * @param {Boolean whether the operation takes in variables or not} hasVars
 */
const operationClassTemplate = ({ name, type, hasVars }) => {
  if (hasVars) {
    return `class ${name}${type}Class extends ${type}<${name}Type, ${name}Variables> {};`;
  }
  return `class ${name}${type}Class extends ${type}<${name}Type, {}> {};`;
};

/**
 * Returns the react-apollo Query and Mutation classes for each operation, separated by a newline
 */
const getOperationClassDeclarations = ({ operations }) => {
  return operations.map(operationClassTemplate).join("\n");
};

/**
 * Returns the components from react-apollo that need to be imported
 * @param {The query or mutation operation name} name
 * @param {Query, Mutation or Subscription} type
 * @param {Boolean whether the operation takes in variables or not} hasVars
 */
const getReactApolloImports = ({ operations }) => {
  const hasQueries = operations.some(op => op.type === "Query");
  const hasMutations = operations.some(op => op.type === "Mutation");
  const hasSuscriptions = operations.some(op => op.type === "Subscription");

  let result = "";

  if (hasQueries) {
    result = "Query";
  }
  if (hasMutations) {
    result += `${hasQueries ? ", " : ""}Mutation`;
  }
  if (hasSuscriptions) {
    result += `${hasQueries || hasMutations ? ", " : ""}Subscription`;
  }

  return result;
};

/**
 * Returns the types used to parameterize the react-apollo components
 * @param {The query or mutation operation name} name
 * @param {Query, Mutation or Subscription} type
 * @param {Boolean whether the operation takes in variables or not} hasVars
 */
const getTypeImports = ({ operations }) => {
  return operations
    .map(op => {
      const operationType = `${op.name} as ${op.name}Type`;
      if (op.hasVars) {
        return `  ${operationType},\n  ${op.name}Variables`;
      }
      return `  ${operationType}`;
    })
    .join(",\n");
};

/**
 * Returns a string with all the imports necessary from the queries.graphql file
 */
const getQueryFileImports = ({ operations }) => {
  return operations.map(op => `  ${op.name}`).join(",\n");
};

module.exports = {
  getOperationClassDeclarations,
  getQueryFileImports,
  getReactApolloImports,
  getTypeImports
};
