# apollo-typed-components

Command-line tool to generate ready-to-use [react-apollo](https://github.com/apollographql/react-apollo) flow typed Query and Mutation components. Utilizes type output from [apollo-cli](https://github.com/apollographql/apollo-cli)

## Usage
```bash
# Use apollo-cli to get schema definition from graphql server
$ apollo schema:download --endpoint=http://localhost:3001/graphql schema.json

# Generate typescript or flow types from queries.graphql files
$ apollo codegen:generate --schema=schema.json --target=flow --outputFlat src/types.js
$ apollo codegen:generate --schema=schema.json --target=typescript --outputFlat src/types.ts

# Generate components utilizing generated typescript or flow types
$ apollo-typed-components --target=flow
$ apollo-typed-components --target=typescript
```

A corresponding ApolloComps.(tsx, js) file will be generated next to each queries.graphql file, with one Query/Mutation component export for each operation defined in queries.graphql. The components automatically will have type-safety with the generated types and also will automatically pass down the query/mutation DocumentNode.

## Assumptions
The generated files make some assumptions about how the consuming project is structured.
* query and mutation operations are defined in queries.graphql files
* The types generated from apollo-cli are accessible via `import type { ... } from "types"`. To allow this:
  * `module.system.node.resolve_dirname=./src` in .flowconfig options for flow
  * for typescript `{ "baseUrl": "src" }` in tsconfig.json
  * output generated types to `src/types/apolloTypes.(js, tsx)`, and then re-export them out of `src/types/index.js` using `export (type) *`

## Example Output
Given a queries.graphql file:
```graphql
query GetList(
  $first: Int!
  $after: String
) {
  list(
    first: $first
    after: $after
  ) {
    pageInfo {
      totalCount
    }
  }
}

mutation DeleteItem($input: DeleteItemInput!) {
  deleteItem(input: $input) {
    success
  }
}
```

apollo-flow-components will generate this ApolloComps.js file in the same directory:
```javascript
/* DO NOT EDIT Generated using apollo-typed-components */
// @flow
import * as React from "react";
import { Query, Mutation } from "react-apollo";
import {
  GetList,
  DeleteItem
} from "./queries.graphql"
import type {
  GetList as GetListType,
  GetListVariables,
  DeleteItem as DeleteItemType,
  DeleteItemVariables
} from "types";

class GetListQueryClass extends Query<GetListType, GetListVariables> {};
class DeleteItemMutationClass extends Mutation<DeleteItemType, DeleteItemVariables> {};

export const GetListQuery = (props: $Diff<React.ElementConfig<typeof GetListQueryClass>, { query: any }>) => <GetListQueryClass query={GetList} {...props} />;
export const DeleteItemMutation = (props: $Diff<React.ElementConfig<typeof DeleteItemMutationClass>, { mutation: any }>) => <DeleteItemMutationClass mutation={DeleteItem} {...props} />;
```

Then, to utilize the components,
```javascript
import { GetListQuery } from "./ApolloComps"

const Comp = () => (
  <GetListQuery variables={{ first: 10 }}>
    {({ data, loading, error }) => ... }
  </GetListQuery>
)
```
