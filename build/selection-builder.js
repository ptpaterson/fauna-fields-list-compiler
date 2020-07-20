'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.fromGraphQLFieldsList = exports.typeCondition = exports.field = void 0
exports.field = (name, selections = []) => ({
  kind: 'FieldSelection',
  name,
  selections
})
exports.typeCondition = (typeName, selections) => ({
  kind: 'TypeConditionSelection',
  selections
})
const fieldHasFields = (field) => Object.keys(field).length > 0
exports.fromGraphQLFieldsList = (fields) => {
  const fieldReducer = (result, [name, subfields]) => {
    const selection = fieldHasFields(subfields)
      ? exports.field(name, Object.entries(subfields).reduce(fieldReducer, []))
      : exports.field(name)
    return [...result, selection]
  }
  return Object.entries(fields).reduce(fieldReducer, [])
}
//# sourceMappingURL=selection-builder.js.map
