// ENV
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// External(ish) Packages
const { ApolloServer } = require('apollo-server');
const { Client } = require('faunadb');
const { FaunaGraphQLClient } = require('../../dist');

// Internal Packages
const typeDefs = require('./schema');

// Create the FaunaDB client and put it in the library wrapper
const client = new Client({ secret: process.env.FAUNADB_SECRET });
const faunaGraphQLClient = new FaunaGraphQLClient(client);

// TODO:  generate models from typeDefs, so we don't have to ourselves
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

const resolvers = {
  Query: {
    books: faunaGraphQLClient.createRootResolver(dataModel, 'Book', 'books'),
    members: faunaGraphQLClient.createRootResolver(dataModel, 'Member', 'members')
  }
};

const server = new ApolloServer({
  typeDefs,
  resolvers
});

server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});
