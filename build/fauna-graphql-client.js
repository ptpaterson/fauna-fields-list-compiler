'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.FaunaGraphQLClient = void 0
const faunadb_1 = require('faunadb')
const graphqlQueryFields = require('graphql-fields')
const faunadb_compiler_1 = require('./faunadb-compiler')
const SelectionBuilder = require('./selection-builder')
class FaunaGraphQLClient {
  constructor({ client, typeDefs }) {
    this.client = client
    this.compiler = new faunadb_compiler_1.FaunaDBCompiler({ typeDefs })
  }
  createRootResolver(typeName, indexName) {
    const resolver = (_root, _args, _ctx, info) => {
      // const refs = q.Paginate(q.Match(q.Index(indexName)));
      // const compiledQuery = compiler(graphqlQueryFields(info))(refs);
      // return this.client.query(compiledQuery);
      const fields = graphqlQueryFields(info).data
      const selections = SelectionBuilder.fromGraphQLFieldsList(fields)
      const baseQuery = faunadb_1.query.Paginate(
        faunadb_1.query.Match(faunadb_1.query.Index(indexName))
      )
      const queryCompiler = this.compiler.getCollectionListCompiler(
        baseQuery,
        typeName
      )
      return this.client.query(queryCompiler(selections))
    }
    return resolver
  }
}
exports.FaunaGraphQLClient = FaunaGraphQLClient
//# sourceMappingURL=fauna-graphql-client.js.map
