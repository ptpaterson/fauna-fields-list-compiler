const { gql } = require('apollo-server')

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
    tags: [String]
    favorites: [Book]
    address: Address
    relationships_out: [HasRelationship]
  }

  type MemberPage {
    data: [Member!]!
    before: String
    after: String
  }

  type HasRelationship {
    from: Member
    to: Member
    relationship: String
  }

  type Query {
    books: BookPage
    members: MemberPage
  }
`

module.exports = typeDefs
