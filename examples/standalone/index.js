// ENV
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

// External(ish) Packages
const { query: q, Client } = require("faunadb");
const { createObjectCompiler, createListCompiler, createPageCompiler } = require("../../dist");

// Create the FaunaDB client
const client = new Client({ secret: process.env.FAUNADB_SECRET });

// define the data model
const dataModel = {
  Book: {
    fields: { title: {}, author: { type: "Member", resolveType: "ref" } }
  },
  Member: {
    fields: {
      name: {},
      age: {},
      favorites: { type: "List", of: "Book", resolveType: "ref" }
    }
  }
};

// query a single object
const memberCompiler = createObjectCompiler(dataModel, "Member");
const memberQueryFields = {
  name: {},
  age: {},
  favorites: {
    title: {},
    author: {
      name: {}
    }
  }
};
const memberRef = q.Ref(q.Collection("Member"), "238074476388942340");
client
  .query(memberCompiler(memberQueryFields)(memberRef))
  .then(results => console.log(results))
  .catch(e => console.error(e));

const booksCompiler = createListCompiler(createObjectCompiler(dataModel, "Book"));
const bookQueryFields = {
  title: {},
  author: {
    name: {},
    age: {}
  }
};
const bookRefs = q.Paginate(q.Match(q.Index("books")));
client
  .query(booksCompiler(bookQueryFields)(bookRefs))
  .then(results => console.log(results))
  .catch(e => console.error(e));
