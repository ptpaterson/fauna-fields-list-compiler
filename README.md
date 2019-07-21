# Fauna Fields List Compiler

![npm](https://img.shields.io/npm/v/fauna-fields-list-compile.svg)

A POC for a GraphQL to FaunaDB FQL compiler and general utility to produce FaunaDB queries from a fields list.

#### Motivation

FaunaDB's query language is, FQL, is particularly well suited for getting a bunch of relational data and returning a denormalized result, with just the data you want, all from only one hit to the DB. GraphQL is great for just getting the data you want, but a typical naive setup will often have to make many round trips to a database before it completes.

By compiling the GraphQL query directly into a single FQL query, we can make the database do all the work for us in one trip. All we need is an understanding of the schema (database and GraphQL) and the query AST. We can get the AST from the now [demystified `info` argument](https://www.prisma.io/blog/graphql-server-basics-demystifying-the-info-argument-in-graphql-resolvers-6f26249f613a)!

This project started off specifically as a way to compile GraphQL queries down to a single FQL query. I hope this project can be a proof of concept for compiling GraphQL queries as well as just building FQL queries rapidly.

#### TODO List

- [x] resolve all scalar properties in the data model
- [x] resolve properties containing a `Ref` and get their properties
- [x] resolve embedded objects
- [x] compile GraphQL query to single FQL query
- [X] Typescript!
- [ ] resolve `_id` and `_ts` fields
- [ ] synchronize data model with Fauna gql meta objects.
- [ ] authorization helpers.
  - [ ] login, logout
  - [ ] RBAC
- [ ] resolve reverse refs (index on other collection)
- [ ] converter for GraphQL Schema AST to data model
- [ ] pluggable way to do resolvers/compilers with directives
- [ ] interfaces & unions

## Standalone Usage

The library provides functions that convert the data model into a recursive query builder. They take the data model and a starting FaunaDB class. From there they can take a selection set (or a "fields list") and a starting `Ref`.

See the [full example](https://github.com/ptpaterson/fauna-fields-list-compiler/tree/master/examples/standalone).

```js
const {
  createObjectCompiler,
  createListCompiler,
  createPageCompiler
} = require('fauna-fields-list-compiler');

// define the data model
const dataModel = {
  /*...*/
};

// query a single object
const memberCompiler = createObjectCompiler(dataModel, 'Member');
const memberQueryFields = {
  /*...*/
};
const memberRef = q.Ref(q.Collection('Member'), '238074476388942340');
client
  .query(memberCompiler(memberQueryFields)(memberRef))
  .then(results => console.log(results))
  .catch(e => console.error(e));

const booksCompiler = createListCompiler(
  createObjectCompiler(dataModel, 'Book')
);
const bookQueryFields = {
  /*...*/
};
const bookRefs = q.Paginate(q.Match(q.Index('books')));
client
  .query(booksCompiler(bookQueryFields)(bookRefs))
  .then(results => console.log(results))
  .catch(e => console.error(e));
```

## GraphQL Usage

A full [example with Apollo Server (V2.6)](https://github.com/ptpaterson/fauna-fields-list-compiler/tree/master/examples/apollo) shows how to use with GraphQL.

The standalone usage can be applied to GraphQL resolver anywhere you like, but there is an additional helper to build root queries.

```js
const { Client } = require('faunadb');
const { FaunaGraphQLClient } = require('fauna-fields-list-compiler');

// Create the FaunaDB client and put it in the library wrapper
const client = new Client({ secret: process.env.FAUNADB_SECRET });
const faunaGraphQLClient = new FaunaGraphQLClient(client);

/*...*/

// Define the graphQL resolvers
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

/*...*/
```

## Data Models

The data model is a stripped down version of the database schema. The following data model is used in the examples:

```js
const dataModel = {
  Book: {
    fields: { title: {}, author: { type: 'Member', resolveType: 'ref' } }
  },
  Member: {
    fields: {
      name: {},
      age: {},
      favorites: { type: 'List', of: 'Book', resolveType: 'ref' }
    }
  }
};
```

## Fields List

The fields list is a map of the fields that you want selected.

The format is the same as the output from node package [`graphql-fields`](https://www.npmjs.com/package/graphql-fields). `graphql-fields` is built in to the `FaunaGraphQLClient` helper class that is a part of this library.

The following are used in the examples

```js
const memberQueryFields = {
  name: {},
  age: {},
  favorites: {
    title: {},
    author: {
      name: {}
    }
  }
};

const bookQueryFields = {
  title: {},
  author: {
    name: {},
    age: {}
  }
};
```
