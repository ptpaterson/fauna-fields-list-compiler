const { gql } = require('apollo-server');

const typeDefs = gql`
  scalar Long

  type Book {
    _id: ID!
    _ts: Long!
    title: String
    author: Member
  }
  type BookPage {
    data: [Book!]!
    before: String
    after: String
  }

  type Address {
    street: String
    city: String
    zip: String
  }

  type Member {
    _id: ID!
    _ts: Long!
    name: String
    age: Int
    favorites: [Book]
    address: Address
  }

  type MemberPage {
    data: [Member!]!
    before: String
    after: String
  }

  type Query {
    books: BookPage
    members: MemberPage
  }
`;

module.exports = typeDefs;
