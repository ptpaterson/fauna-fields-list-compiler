'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.NumberField = exports.StringField = exports.collectionType = exports.embeddedType = exports.listType = exports.namedType = void 0
exports.namedType = (name) => ({
  kind: 'NamedType',
  name
})
exports.listType = (type) => ({
  kind: 'ListType',
  type
})
exports.embeddedType = (name, fields) => ({
  kind: 'EmbeddedTypeDefinition',
  name,
  fields
})
exports.collectionType = (name, fields) => ({
  kind: 'CollectionTypeDefinition',
  name,
  fields
})
exports.StringField = exports.namedType('String')
exports.NumberField = exports.namedType('Number')
//# sourceMappingURL=schema-builder.js.map
