type $FixAny = any;

import { Client, query as q } from 'faunadb';

import graphqlQueryFields from 'graphql-fields';

import { FaunaDBCompiler } from './faunadb-compiler';
import * as SelectionBuilder from './selection-builder';
import { GraphQLFieldResolver } from 'graphql';

interface FaunaGraphQLClientOptions {
  client: Client;
  typeDefs: $FixAny;
}

export class FaunaGraphQLClient {
  private client: Client;
  private compiler: FaunaDBCompiler;

  constructor({ client, typeDefs }: FaunaGraphQLClientOptions) {
    this.client = client;
    this.compiler = new FaunaDBCompiler({ typeDefs });
  }

  createRootResolver(typeName: string, indexName: string) {
    const resolver: GraphQLFieldResolver<any, any, any> = (
      _root,
      _args,
      _ctx,
      info
    ) => {
      // const refs = q.Paginate(q.Match(q.Index(indexName)));
      // const compiledQuery = compiler(graphqlQueryFields(info))(refs);
      // return this.client.query(compiledQuery);

      const fields = graphqlQueryFields(info).data;
      const selections = SelectionBuilder.fromGraphQLFieldsList(fields);

      const baseQuery = q.Paginate(q.Match(q.Index(indexName)));
      const queryCompiler = this.compiler.getCollectionListCompiler(
        baseQuery,
        typeName
      );
      return this.client.query(queryCompiler(selections));
    };

    return resolver;
  }
}
