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
  Book: {
    fields: { title: {}, author: { type: 'Member', resolveType: 'ref' } }
  },
  Member: {
    fields: {
      name: {},
      age: {},
      favorites: { type: 'List', of: 'Book', resolveType: 'ref' },
      address: { type: 'Address' }
    }
  },
  Address: {
    fields: {
      street: {},
      city: {},
      zip: {}
    }
  }
};

const resolvers = {
  Query: {
    books: faunaGraphQLClient.createRootResolver(dataModel, 'Book', 'books'),
    members: faunaGraphQLClient.createRootResolver(
      dataModel,
      'Member',
      'members'
    )
  }
};

const server = new ApolloServer({
  typeDefs,
  resolvers
});

server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});
