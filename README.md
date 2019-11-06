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
- [x] Typescript!
- [x] resolve `_id` and `_ts` fields
- [x] resolve reverse refs (index on other collection)
- [ ] synchronize data model with Fauna gql meta objects.
- [ ] authorization helpers.
  - [ ] login, logout
  - [ ] RBAC
- [ ] converter for GraphQL Schema AST to data model
- [ ] pluggable way to do resolvers/compilers with directives
- [ ] interfaces & unions

## Standalone Usage

The library provides functions that convert the data model into a recursive query builder. They take the data model and a starting FaunaDB class. From there they can take a selection set (or a "fields list") and a starting `Ref`.

See the [full example](https://github.com/ptpaterson/fauna-fields-list-compiler/tree/master/examples/standalone).

```js
const { Client } = require('faunadb');
const {
  FaunaDBCompiler,
  SelectionBuilder
} = require('fauna-fields-list-compiler');
const client = new Client({ secret: process.env.FAUNADB_SECRET });

// define the data model and create the compiler
const faunadbTypeDefs = {
  /*...*/
};
const faunaDBCompiler = new FaunaDBCompiler({ typeDefs: faunadbTypeDefs });

// *****************************************************************************
// query a single object
// *****************************************************************************
// 1) Build compilers
const memberRefBaseQuery = q.Ref(q.Collection('Member'), '238074476388942340');
const memberCompiler = faunaDBCompiler.getCollectionCompiler(
  memberRefBaseQuery,
  'Member'
);

// 2) Create Selections
const memberSelections = [
  /*...*/
];

// 3) Run Query

client
  .query(memberCompiler(memberSelections))
  .then(results => console.log(results))
  .catch(e => console.error(e));

// *****************************************************************************
// Query Many
// *****************************************************************************
// 1) Build compilers
const booksListBaseQuery = q.Paginate(q.Match(q.Index('books')));
const booksCompiler = faunaDBCompiler.getCollectionListCompiler(
  booksListBaseQuery,
  'Book'
);

// 2) Create Selections
const booksSelections = [
  /*...*/
];

// 3) Run Query
client
  .query(booksCompiler(booksSelections))
  .then(results => console.log(results))
  .catch(e => console.error(e));
```

## GraphQL Usage

A full [example with Apollo Server (V2.9)](https://github.com/ptpaterson/fauna-fields-list-compiler/tree/master/examples/apollo) shows how to use with GraphQL.

The standalone usage can be applied to GraphQL resolver anywhere you like, but there is an additional helper to build root queries.

```js
const { Client } = require('faunadb');
const { FaunaGraphQLClient } = require('fauna-fields-list-compiler');
const client = new Client({ secret: process.env.FAUNADB_SECRET });

// define the data model
const faunadbTypeDefs = {
  /*...*/
};

// Create the FaunaDB client and put it in the library wrapper
const faunaGraphQLClient = new FaunaGraphQLClient({
  client,
  typeDefs: faunadbTypeDefs
});

/*...*/

// Define the graphQL resolvers
const resolvers = {
  Query: {
    books: faunaGraphQLClient.createRootResolver('Book', 'books'),
    members: faunaGraphQLClient.createRootResolver('Member', 'members')
  }
};

/*...*/
```

## Data Models

The data model is a stripped down version of the database schema. The following data model is used in the examples:

> Version 0.4.0 included breaking changes in the data model. Helper functions are provided to build up the new format. These changes are making it easier to extend the types of relationships possible between types.

### Type Definitions

The data model is made up of a list of type definitions. These will be

- Collection Types
- Embedded Types
- Interfaces
- Unions

A `SchemaBuilder` helper object is available to help build up types.

```js
const { SchemaBuilder } = require('fauna-fields-list-compiler');
const {
  collectionType,
  embeddedType,
  listType,
  namedType,
  NumberField,
  StringField
} = SchemaBuilder;

const MemberTypeDef = collectionType(/*...*/);
const BookTypeDef = collectionType(/*...*/);
const HasRelationshipTypeDef = collectionType(/*...*/);
const AddressTypeDef = embeddedType(/*...*/);

const faunadbTypeDefs = [
  AddressTypeDef,
  BookTypeDef,
  MemberTypeDef,
  HasRelationshipTypeDef
];
```

### Collection References

The default compiler for a collection type expands a `Ref` or a list of `Ref`s. Nothing more is needed than something like the following:

```js
const BookTypeDef = collectionType('Book', [
  { name: 'title', type: StringField },
  { name: 'author', type: namedType('Member') }
]);
```

### Match Index Relationship

a compiler override can be specified for collection type fields.

define an index like:

```js
q.CreateIndex({
  name: 'relationships_out',
  source: q.Class('HasRelationship'),
  terms: [{ field: ['data', 'from'] }]
});
```

Then the following will work to create a link from the `Member` type to the `HasRelationship` type.

```js
const MemberTypeDef = collectionType('Member', [
  /*...*/
  {
    name: 'relationships_out',
    type: listType(namedType('HasRelationship')),
    resolver: {
      kind: 'matchRefResolver',
      index: 'relationships_out'
    }
  }
]);

const HasRelationshipTypeDef = {
  kind: 'CollectionTypeDefinition',
  name: 'HasRelationship',
  fields: [
    { name: 'from', type: namedType('Member') },
    { name: 'to', type: namedType('Member') },
    { name: 'relationship', type: StringField }
  ]
};
```

this corresponds to the following GraphQL

```graphql
type Member {
  _id: ID!
  _ts: Long!
  # ...
  relationships_out: [HasRelationship]
}

type HasRelationship {
  from: Member
  to: Member
  relationship: String
}
```

## Selections

The selection set is a kind of map of the fields that you want queried.

> Version 0.4.0 included breaking changes to `Selections` (formerly `Fields List`). Helper functions are provided to build up the new format. The new format will allow the addition of type conditions, i.e. interfaces and unions!

The following are used in the examples

```js
const memberSelections = [
  field('_id'),
  field('_ts'),
  field('name'),
  field('age'),
  field('address', [field('street'), field('city'), field('zip')]),
  field('tags'),
  field('favorites', [
    field('title'),
    field('author', [field('_id'), field('_ts'), field('name')])
  ]),
  field('relationships_out', [
    field('relationship'),
    field('to', [(field('_id'), field('_ts'), field('name'))])
  ])
];

const booksSelections = [
  field('_id'),
  field('_ts'),
  field('title'),
  field('author', [field('_id'), field('_ts'), field('name')])
];
```

The format is the nolonger the same as the output from node package [`graphql-fields`](https://www.npmjs.com/package/graphql-fields). However, a helper method is provided to convert from `graphql-fields`. This is what is used internally in `FaunaGraphQLClient`.
