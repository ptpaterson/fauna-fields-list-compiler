# Fauna Fields List Compiler

### Standalone Example

This will work with a Fauna Cloud database in a few steps.

Clone the whole repository. The example is meant to work from within the package.

Create a new DB. Go to the GraphQL cloud console and import the following schema:

```graphql
type Book {
  title: String
  author: Member
}

type Member {
  name: String
  age: Int
  favorites: [Book]
}

type Query {
  books: [Book]
  members: [Book]
}
```

Fauna will migrate this to something closer to the typdefs in [schema.js](schema.js).

Use the GraphQL cloud console to mutate some data in. This is not a GraphQL example, but it is a really easy way to get the collections, indexes, and data entered to get the example working.

Then add your own `.env` file to this directory with the following in it:

```js
FAUNADB_SECRET = PUT_YOUR_FAUNADB_SECRET_HERE;
```

run the program

```bash
# from package root
npm run example-standalone
```
