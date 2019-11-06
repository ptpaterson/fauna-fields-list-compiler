const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '.env') })

const { ApolloServer } = require('apollo-server')
const { Client } = require('faunadb')
const { FaunaGraphQLClient } = require('../../dist')

// TODO:  generate models from typeDefs, so we don't have to ourselves
const client = new Client({ secret: process.env.FAUNADB_SECRET })
const faunadbTypeDefs = require('../standalone/faunadb-typedefs')
const faunaGraphQLClient = new FaunaGraphQLClient({
  client,
  typeDefs: faunadbTypeDefs
})

const typeDefs = require('./schema')
const resolvers = {
  Query: {
    books: faunaGraphQLClient.createRootResolver('Book', 'books'),
    members: faunaGraphQLClient.createRootResolver('Member', 'members')
  }
}

const server = new ApolloServer({
  typeDefs,
  resolvers
})

server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`)
})
