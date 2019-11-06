const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '.env') })

const { query: q, Client } = require('faunadb')
const { FaunaDBCompiler, SelectionBuilder } = require('../../dist')
const { field } = SelectionBuilder

// Create the FaunaDB client
const client = new Client({ secret: process.env.FAUNADB_SECRET })

// define the data model
const faunadbTypeDefs = require('./faunadb-typedefs')
const faunaDBCompiler = new FaunaDBCompiler({ typeDefs: faunadbTypeDefs })

// *****************************************************************************
// query a single object
// *****************************************************************************
// 1) Build compilers
const memberRefBaseQuery = q.Ref(q.Collection('Member'), '238074476388942340')
const memberCompiler = faunaDBCompiler.getCollectionCompiler(
  memberRefBaseQuery,
  'Member'
)

// 2) Create Selections
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
]

// 3) Run Query

client
  .query(memberCompiler(memberSelections))
  .then(results => console.log(results))
  .catch(e => console.error(e))

// *****************************************************************************
// Query Many
// *****************************************************************************
// 1) Build compilers
const booksListBaseQuery = q.Paginate(q.Match(q.Index('books')))
const booksCompiler = faunaDBCompiler.getCollectionListCompiler(
  booksListBaseQuery,
  'Book'
)

// 2) Create Selections
const booksSelections = [
  field('_id'),
  field('_ts'),
  field('title'),
  field('author', [field('_id'), field('_ts'), field('name')])
]

// 3) Run Query
client
  .query(booksCompiler(booksSelections))
  .then(results => console.log(results))
  .catch(e => console.error(e))
