jest.mock("fs");
jest.mock("glob");

const { generate } = require("../generate");
const fs = require("fs");
const glob = require("glob");

const aQueries = `
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
`;

const bcQueries = `
fragment IdNameFrag on Record {
  id
  name
}

query GetRecord($id: ID!) {
  record(id: $id) {
    ...IdNameFrage
  }
} 

mutation UpdateRecord($input: UpdateRecordInput!) {
  updateRecord(input: $input) {
    record {
      ...IdNameFrage
    }
  }
} 
`;

const dQueries = `
query GetViewer {
  viewer {
    id
    name
  }
}      
`;

const eQueries = `
fragment IdNameFrag on Record {
  id
  name
}    
`;

const fQueries = `
mutation DeleteRecord($input: DeleteRecordInput!) {
  deleteRecord(input: $input) {
    success
  }
}
`;

describe("generate", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("generates expected output for flow", done => {
    glob.mockImplementationOnce((path, options, callback) => {
      callback(null, [
        "src/a/queries.graphql",
        "src/b/c/queries.graphql",
        "d/queries.graphql",
        "e/queries.graphql",
        "f/queries.graphql"
      ]);
    });

    fs.readFile.mockImplementation((path, options, callback) => {
      callback(
        null,
        {
          "src/a/queries.graphql": aQueries,
          "src/b/c/queries.graphql": bcQueries,
          "d/queries.graphql": dQueries,
          "e/queries.graphql": eQueries,
          "f/queries.graphql": fQueries
        }[path]
      );
    });

    fs.writeFile.mockImplementation((filename, fileText, callback) => {
      callback(null);
    });

    jest.spyOn(global.console, "warn").mockImplementation(() => {});

    generate({ target: "flow" }, error => {
      expect(fs.writeFile.mock.calls).toHaveLength(4);
      expect(global.console.warn).toHaveBeenCalledWith(
        "No queries or mutations found in e/queries.graphql"
      );

      const aCall = fs.writeFile.mock.calls.find(
        call => call[0] === "src/a/ApolloComps.js"
      );
      const bcCall = fs.writeFile.mock.calls.find(
        call => call[0] === "src/b/c/ApolloComps.js"
      );
      const dCall = fs.writeFile.mock.calls.find(
        call => call[0] === "d/ApolloComps.js"
      );
      const fCall = fs.writeFile.mock.calls.find(
        call => call[0] === "f/ApolloComps.js"
      );

      expect(error).toBeNull();
      expect(aCall[1]).toMatchSnapshot(
        "Generates a file with GetList query and DeleteItem mutation"
      );
      expect(bcCall[1]).toMatchSnapshot(
        "Generates a file with GetRecord query and UpdateRecord mutation"
      );
      expect(dCall[1]).toMatchSnapshot("Generates a file with GetViewer query");
      expect(fCall[1]).toMatchSnapshot(
        "Generates a file with DeleteRecord mutation"
      );

      done();
    });
  });

  it("generates expected output for typescript", done => {
    glob.mockImplementationOnce((path, options, callback) => {
      callback(null, [
        "src/a/queries.graphql",
        "src/b/c/queries.graphql",
        "d/queries.graphql",
        "e/queries.graphql",
        "f/queries.graphql"
      ]);
    });

    fs.readFile.mockImplementation((path, options, callback) => {
      callback(
        null,
        {
          "src/a/queries.graphql": aQueries,
          "src/b/c/queries.graphql": bcQueries,
          "d/queries.graphql": dQueries,
          "e/queries.graphql": eQueries,
          "f/queries.graphql": fQueries
        }[path]
      );
    });

    fs.writeFile.mockImplementation((filename, fileText, callback) => {
      callback(null);
    });

    jest.spyOn(global.console, "warn").mockImplementation(() => {});

    generate({ target: "typescript" }, error => {
      expect(fs.writeFile.mock.calls).toHaveLength(4);
      expect(global.console.warn).toHaveBeenCalledWith(
        "No queries or mutations found in e/queries.graphql"
      );

      const aCall = fs.writeFile.mock.calls.find(
        call => call[0] === "src/a/ApolloComps.tsx"
      );
      const bcCall = fs.writeFile.mock.calls.find(
        call => call[0] === "src/b/c/ApolloComps.tsx"
      );
      const dCall = fs.writeFile.mock.calls.find(
        call => call[0] === "d/ApolloComps.tsx"
      );
      const fCall = fs.writeFile.mock.calls.find(
        call => call[0] === "f/ApolloComps.tsx"
      );

      expect(error).toBeNull();
      expect(aCall[1]).toMatchSnapshot(
        "Generates a file with GetList query and DeleteItem mutation"
      );
      expect(bcCall[1]).toMatchSnapshot(
        "Generates a file with GetRecord query and UpdateRecord mutation"
      );
      expect(dCall[1]).toMatchSnapshot("Generates a file with GetViewer query");
      expect(fCall[1]).toMatchSnapshot(
        "Generates a file with DeleteRecord mutation"
      );

      done();
    });
  });

  it("calls callback with error if glob fails", done => {
    glob.mockImplementationOnce((path, options, callback) => {
      callback("Glob failed");
    });

    generate({ target: "typescript" }, error => {
      expect(error).toBe("Glob failed");
      done();
    });
  });

  it("calls callback with error if readFile fails", done => {
    glob.mockImplementationOnce((path, options, callback) => {
      callback(null, ["src/a/queries.graphql"]);
    });

    fs.readFile.mockImplementation((path, options, callback) => {
      callback("File does not exist");
    });

    generate({ target: "typescript" }, error => {
      expect(error).toBe("File does not exist");
      done();
    });
  });

  it("calls callback with error if writeFile fails", done => {
    glob.mockImplementationOnce((path, options, callback) => {
      callback(null, ["src/a/queries.graphql"]);
    });

    fs.readFile.mockImplementation((path, options, callback) => {
      callback(null, aQueries);
    });

    fs.writeFile.mockImplementation((filename, fileText, callback) => {
      callback("writeFile failed");
    });

    generate({ target: "flow" }, error => {
      expect(error).toBe("writeFile failed");
      done();
    });
  });
});
