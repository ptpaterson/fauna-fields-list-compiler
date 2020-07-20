'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.FaunaDBCompiler = void 0
const faunadb_1 = require('faunadb')
const createSelectQuery = (path, many) =>
  many
    ? faunadb_1.query.Select(path, faunadb_1.query.Var('instance'), [])
    : // @ts-ignore: null is okay here
      faunadb_1.query.Select(path, faunadb_1.query.Var('instance'), null)
const idCompiler = (_) =>
  faunadb_1.query.Select(['id'], faunadb_1.query.Var('ref'))
const tsCompiler = (_) =>
  faunadb_1.query.Select(['ts'], faunadb_1.query.Var('instance'))
const createSelectCompiler = (path, many) => (_) =>
  createSelectQuery(path, many)
const baseTypes = [
  {
    kind: 'ScalarTypeDefinition',
    name: 'String'
  },
  {
    kind: 'ScalarTypeDefinition',
    name: 'Number'
  }
]
class FaunaDBCompiler {
  constructor({ typeDefs }) {
    this.typeDefs = [...baseTypes, ...typeDefs]
  }
  getTypeSchema(typeName) {
    const typeSchema = this.typeDefs.find((i) => i.name === typeName)
    if (!typeSchema) {
      throw new Error(
        `getTypeSchema:  could not type '${typeName}' in typeDefs.`
      )
    }
    return typeSchema
  }
  getFieldFromTypeSchema(typeSchema, fieldName) {
    const field = typeSchema.fields.find((i) => i.name === fieldName)
    if (!field) {
      throw new Error(
        `getFieldFromTypeSchema: could not find field '${typeSchema.name}'.`
      )
    }
    return field
  }
  getDefaultObjectCompiler(typeName, path) {
    return (selections) =>
      faunadb_1.query.Let(
        { embedded: createSelectQuery(path, false) },
        faunadb_1.query.If(
          faunadb_1.query.Equals([faunadb_1.query.Var('embedded'), null]),
          null,
          this.expandSelection(typeName, selections, path)
        )
      )
  }
  getDefaultObjectListCompiler(typeName, path) {
    return (selections) =>
      faunadb_1.query.Map(createSelectQuery(path, true), (instance) =>
        this.expandSelection(typeName, selections, [])
      )
  }
  getCollectionCompiler(refQuery, typeName) {
    return (selections) =>
      faunadb_1.query.Let(
        {
          ref: refQuery,
          instance: faunadb_1.query.Get(faunadb_1.query.Var('ref'))
        },
        this.expandSelection(typeName, selections)
      )
  }
  getDefaultCollectionCompiler(typeName, path) {
    return this.getCollectionCompiler(createSelectQuery(path, false), typeName)
  }
  getCollectionListCompiler(refsQuery, typeName) {
    return (selections) =>
      faunadb_1.query.Map(refsQuery, (ref) =>
        faunadb_1.query.Let(
          {
            instance: faunadb_1.query.Get(faunadb_1.query.Var('ref'))
          },
          this.expandSelection(typeName, selections)
        )
      )
  }
  getDefaultCollectionListCompiler(typeName, path) {
    return this.getCollectionListCompiler(
      createSelectQuery(path, true),
      typeName
    )
  }
  getCompiler(typeName, fieldName, path) {
    // System types
    if (fieldName === '_id') return idCompiler
    if (fieldName === '_ts') return tsCompiler
    // User types
    const typeSchema = this.getTypeSchema(typeName)
    const fieldSchema = this.getFieldFromTypeSchema(typeSchema, fieldName)
    // determine field type
    let fieldTypeName
    let fieldIsList
    if (fieldSchema.type.kind === 'NamedType') {
      fieldIsList = false
      fieldTypeName = fieldSchema.type.name
    } else if (fieldSchema.type.kind === 'ListType') {
      fieldIsList = true
      fieldTypeName = fieldSchema.type.type.name
    }
    // TODO include nonnullables
    let compiler
    const resolverDef = fieldSchema.resolver
    if (!resolverDef) {
      // determine default compiler
      const fieldTypeSchema = this.getTypeSchema(fieldTypeName)
      switch (fieldTypeSchema.kind) {
        case 'ScalarTypeDefinition':
          compiler = fieldIsList
            ? createSelectCompiler(path, true)
            : createSelectCompiler(path, false)
          break
        case 'EmbeddedTypeDefinition':
          compiler = fieldIsList
            ? this.getDefaultObjectListCompiler(fieldTypeName, path)
            : this.getDefaultObjectCompiler(fieldTypeName, path)
          break
        case 'CollectionTypeDefinition':
          compiler = fieldIsList
            ? this.getDefaultCollectionListCompiler(fieldTypeName, path)
            : this.getDefaultCollectionCompiler(fieldTypeName, path)
          break
        default:
          throw new TypeError(
            `Encountered unknown Field type: ${fieldTypeSchema.kind}`
          )
      }
    } else {
      // use schema resolver for compiler
      switch (resolverDef.kind) {
        case 'matchRefResolver':
          const index = resolverDef.index
          compiler = this.getCollectionListCompiler(
            faunadb_1.query.Select(
              ['data'],
              faunadb_1.query.Paginate(
                faunadb_1.query.Match(
                  faunadb_1.query.Index(index),
                  faunadb_1.query.Var('ref')
                )
              )
            ),
            fieldTypeName
          )
          break
        default:
          throw new TypeError(
            `Encountered unknown Resolver type: ${resolverDef.kind}`
          )
      }
    }
    return compiler
  }
  expandSelection(typeName, selections, path) {
    path = path || ['data']
    return selections.reduce(
      (result, selector) => {
        let resolved
        switch (selector.kind) {
          case 'FieldSelection':
            const newSelections = selector.selections
            resolved = {
              ...result,
              [selector.name]: this.getCompiler(typeName, selector.name, [
                ...path,
                selector.name
              ])(newSelections)
            }
            break
          case 'TypeConditionSelection':
            throw {
              name: 'NotImplementedError',
              message: 'Type Condition selectors have not been implemented'
            }
          default:
            throw new TypeError(
              `Encountered unknown Selector type ${selector.kind}`
            )
        }
        return resolved
      },
      { _type: typeName }
    )
  }
}
exports.FaunaDBCompiler = FaunaDBCompiler
//# sourceMappingURL=faunadb-compiler.js.map
