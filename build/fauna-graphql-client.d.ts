declare type $FixAny = any
import { Client } from 'faunadb'
import { GraphQLFieldResolver } from 'graphql'
interface FaunaGraphQLClientOptions {
  client: Client
  typeDefs: $FixAny
}
export declare class FaunaGraphQLClient {
  private client
  private compiler
  constructor({ client, typeDefs }: FaunaGraphQLClientOptions)
  createRootResolver(
    typeName: string,
    indexName: string
  ): GraphQLFieldResolver<any, any, any>
}
export {}
