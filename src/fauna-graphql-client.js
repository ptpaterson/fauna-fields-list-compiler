const { query: q } = require("faunadb");
const graphqlQueryFields = require("graphql-fields");

const { createTopLevelCompiler } = require("./fauna-compilers");

class FaunaGraphQLClient {
  constructor(client) {
    this.client = client;
  }

  createRootResolver (models, className, indexName) {
    const compiler = createTopLevelCompiler(models, className);

    return (root, args, ctx, info) => {
      const refs = q.Paginate(q.Match(q.Index(indexName)));
      const compiledQuery = compiler(graphqlQueryFields(info))(refs);
      return this.client.query(compiledQuery);
    };
  };
}

module.exports = FaunaGraphQLClient;
