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

  let imports = [];

  if (hasQueries) {
    imports = [
      ...imports,
      "Query",
      "useQuery",
      "QueryComponentOptions",
      "QueryHookOptions"
    ];
  }
  if (hasMutations) {
    imports = [
      ...imports,
      "Mutation",
      "useMutation",
      "MutationComponentOptions",
      "MutationHookOptions"
    ];
  }
  if (hasSuscriptions) {
    imports = [
      ...imports,
      "Subscription",
      "useSubscription",
      "SubscriptionComponentOptions",
      "SubscriptionHookOptions"
    ];
  }

  return imports.map(i => `  ${i}`).join(",\n");
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
        return `${operationType},\n  ${op.name}Variables`;
      }
      return `${operationType}`;
    })
    .map(i => `  ${i}`)
    .join(",\n");
};

/**
 * Returns a string with all the imports necessary from the queries.graphql file
 */
const getQueryFileImports = ({ operations }) => {
  return operations.map(op => `  ${op.name}`).join(",\n");
};

/**
 * Returns the generic type parameterization for apollo operations
 * @param {The query, mutation or subscription operation name} name
 * @param {Query, Mutation or Subscription} type
 * @param {Whether or not the operation has variables or not} hasVars
 */
const getOperationGenerics = ({ name, hasVars }) => {
  const dataType = `${name}Type`;
  const variablesType = `${name}Variables`;
  return hasVars ? `${dataType}, ${variablesType}` : dataType;
};

/**
 * Wraps a Query/Mutation/Subscription component with type information and the query/mutation/subscription DocumentNode
 * automatically passed in.
 * @param {The query, mutation or subscription operation name} name
 * @param {Query, Mutation or Subscription} type
 * @param {Whether or not the operation has variables or not} hasVars
 */
const operationComponentTemplate = ({ name, type, hasVars }) => {
  const componentName = `${name}${type}`;
  const generics = getOperationGenerics({ name, hasVars });
  const propsType = `Omit<${type}ComponentOptions<${generics}>, "${type.toLowerCase()}">`;
  return `export const ${componentName} = (props: ${propsType}) => {\n  return <${type}<${generics}> ${type.toLowerCase()}={${name}} {...props} />;\n}`;
};

/**
 * Wraps a hook with type information and the query/mutation/subscription DocumentNode
 * automatically passed in.
 * @param {The query, mutation or subscription operation name} name
 * @param {Query, Mutation or Subscription} type
 * @param {Whether or not the operation has variables or not} hasVars
 */
const operationHookTemplate = ({ name, type, hasVars }) => {
  const hookName = `use${name}${type}`;
  const apolloHookName = `use${type}`;
  const generics = getOperationGenerics({ name, hasVars });
  const hookOptionsType = `${type}HookOptions<${generics}>`;
  return `export const ${hookName} = (options?: ${hookOptionsType}) => {\n  return ${apolloHookName}<${generics}>(${name}, options);\n}`;
};

/**
 * Returns the string contents of the generated components files
 * @param {Array of { type, name, hasVars } objects} operations
 */
const fileTemplate = ({ operations }) => {
  const reactApolloImports = getReactApolloImports({ operations });

  const typeImports = getTypeImports({ operations });

  const queryFileImports = getQueryFileImports({ operations });

  const operationComponents = operations
    .map(operationComponentTemplate)
    .join("\n");

  const operationHooks = operations.map(operationHookTemplate).join("\n");

  return (
    "/* Generated using apollo-typed-components */\n" +
    'import * as React from "react";\n' +
    `import {\n${reactApolloImports}\n} from "react-apollo";\n` +
    `import {\n${queryFileImports}\n} from "./queries.graphql"\n` +
    `import {\n${typeImports}\n} from "types";\n\n` +
    `${operationComponents}\n\n` +
    `${operationHooks}`
  );
};

module.exports = {
  typescriptTemplate: fileTemplate
};
