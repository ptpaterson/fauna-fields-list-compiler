const { gql } = require('apollo-server');

const typeDefs = gql`
  type Book {
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
