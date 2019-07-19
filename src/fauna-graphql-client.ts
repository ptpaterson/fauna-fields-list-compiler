import { Client, query as q } from "faunadb";
import graphqlQueryFields from "graphql-fields";

import { createTopLevelCompiler, DataModel } from "./fauna-compilers";
import { GraphQLFieldResolver } from "graphql";

export class FaunaGraphQLClient {
  constructor(private client: Client) {}

  createRootResolver(models: DataModel, className: string, indexName: string) {
    const compiler = createTopLevelCompiler(models, className);

    const resolver: GraphQLFieldResolver<any, any, any> = (
      _root,
      _args,
      _ctx,
      info
    ) => {
      const refs = q.Paginate(q.Match(q.Index(indexName)));
      const compiledQuery = compiler(graphqlQueryFields(info))(refs);
      return this.client.query(compiledQuery);
    };

    return resolver;
  }
}
