// ENV
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// External(ish) Packages
require('node-json-color-stringify')
const { query: q, Client } = require('faunadb');
const { createObjectCompiler, createListCompiler, createPageCompiler } = require('../../dist');

// Create the FaunaDB client
const client = new Client({ secret: process.env.FAUNADB_SECRET });

// define the data model
const dataModel = {
  collections: [
    {
      name: "Book",
      fields: [
        { name: "_id", type: { Named: "ID" } },
        { name: "_ts", type: { Named: "Int" } },
        { name: "title", type: { Named: "String" } },
        { name: "author", type: { Named: "Member" } }
      ]
    },
    {
      name: "Member",
      fields: [
        { name: "_id", type: { Named: "ID" } },
        { name: "_ts", type: { Named: "Int" } },
        { name: "name", type: { Named: "String" } },
        { name: "age", type: { Named: "Int" } },
        { name: "address", type: { Named: "Address" } },
        { name: "favorites", type: { List: { Named: "Book" } } }
      ]
    },
    {
      name: "Address",
      fields: [
        { name: "street", type: { Named: "String" } },
        { name: "city", type: { Named: "String" } },
        { name: "zip", type: { Named: "String" } }
      ],
      directives: [{ name: "embedded" }]
    }
  ],
  indexes: [
    {
      name: "allBooks",
      type: { List: { Named: "Book" } }
    }
  ]
};

// query a single object
const memberCompiler = createObjectCompiler(dataModel, 'Member');
const memberQueryFields = {
  _id: {},
  _ts: {},
  name: {},
  age: {},
  address: {
    street: {},
    city: {},
    zip: {}
  },
  favorites: {
    title: {},
    author: {
      _id: {},
      _ts: {},
      name: {}
    }
  }
};
const memberRef = q.Ref(q.Collection('Member'), '238074476388942340');
client
  .query(memberCompiler(memberQueryFields)(memberRef))
  .then(results => console.log(JSON.colorStringify(results, null, 4)))
  .catch(e => console.error(e));

// Query Many
const booksCompiler = createListCompiler(createObjectCompiler(dataModel, 'Book'));
const bookQueryFields = {
  _id: {},
  title: {},
  author: {
    _id: {},
    name: {},
    age: {},
    address: {
      street: {},
      city: {},
      zip: {}
    }
  }
};
const bookRefs = q.Paginate(q.Match(q.Index('books')));
client
  .query(booksCompiler(bookQueryFields)(bookRefs))
  .then(results => console.log(JSON.colorStringify(results, null, 4)))
  .catch(e => console.error(e));
