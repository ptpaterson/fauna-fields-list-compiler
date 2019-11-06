const { SchemaBuilder } = require('../../dist');
const {
  embeddedType,
  collectionType,
  namedType,
  listType,
  StringField,
  NumberField
} = SchemaBuilder;

const AddressTypeDef = embeddedType('Address', [
  { name: 'street', type: StringField },
  { name: 'city', type: StringField },
  { name: 'zip', type: StringField }
]);

const BookTypeDef = collectionType('Book', [
  { name: 'title', type: StringField },
  { name: 'author', type: namedType('Member') }
]);

const MemberTypeDef = collectionType('Member', [
  { name: 'name', type: StringField },
  { name: 'age', type: NumberField },
  { name: 'address', type: namedType('Address') },
  { name: 'tags', type: listType(StringField) },
  { name: 'favorites', type: listType(namedType('Book')) },
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

const typeDefs = [
  AddressTypeDef,
  BookTypeDef,
  MemberTypeDef,
  HasRelationshipTypeDef
];

module.exports = typeDefs;
