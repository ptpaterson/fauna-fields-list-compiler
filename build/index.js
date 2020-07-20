'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.SelectionBuilder = exports.SchemaBuilder = void 0
const SchemaBuilder = require('./schema-builder')
exports.SchemaBuilder = SchemaBuilder
const SelectionBuilder = require('./selection-builder')
exports.SelectionBuilder = SelectionBuilder
var faunadb_compiler_1 = require('./faunadb-compiler')
Object.defineProperty(exports, 'FaunaDBCompiler', {
  enumerable: true,
  get: function () {
    return faunadb_compiler_1.FaunaDBCompiler
  }
})
var fauna_graphql_client_1 = require('./fauna-graphql-client')
Object.defineProperty(exports, 'FaunaGraphQLClient', {
  enumerable: true,
  get: function () {
    return fauna_graphql_client_1.FaunaGraphQLClient
  }
})
//# sourceMappingURL=index.js.map
