type $FixMe = any;

import { query as q, Expr, ExprArg } from 'faunadb';

const createSelectQuery = (path: $FixMe, many: boolean) =>
  many
    ? q.Select(path, q.Var('instance'), [])
    : q.Select(path, q.Var('instance'), null);

type compiler = (selections: $FixMe) => Expr;

const idCompiler: compiler = _ => q.Select(['id'], q.Var('ref'));
const tsCompiler: compiler = _ => q.Select(['ts'], q.Var('instance'));
const createSelectCompiler = (path: $FixMe, many: boolean): compiler => _ =>
  createSelectQuery(path, many);

const baseTypes = [
  {
    kind: 'ScalarTypeDefinition',
    name: 'String'
  },
  {
    kind: 'ScalarTypeDefinition',
    name: 'Number'
  }
];

interface FaunaDBCompilerOptions {
  typeDefs: $FixMe;
}

export class FaunaDBCompiler {
  typeDefs: $FixMe;

  constructor({ typeDefs }: FaunaDBCompilerOptions) {
    this.typeDefs = [...baseTypes, ...typeDefs];
  }

  getTypeSchema(typeName: string) {
    const typeSchema = this.typeDefs.find((i: $FixMe) => i.name === typeName);
    if (!typeSchema) {
      throw new Error(
        `getTypeSchema:  could not type '${typeName}' in typeDefs.`
      );
    }
    return typeSchema;
  }

  getFieldFromTypeSchema(typeSchema: $FixMe, fieldName: string) {
    const field = typeSchema.fields.find((i: $FixMe) => i.name === fieldName);
    if (!field) {
      throw new Error(
        `getFieldFromTypeSchema: could not find field '${typeSchema.name}'.`
      );
    }
    return field;
  }

  getDefaultObjectCompiler(typeName: string, path: $FixMe): compiler {
    return selections =>
      q.Let(
        { embedded: createSelectQuery(path, false) },
        q.If(
          q.Equals([q.Var('embedded'), null]),
          null,
          this.expandSelection(typeName, selections, path)
        )
      );
  }

  getDefaultObjectListCompiler(typeName: string, path: $FixMe): compiler {
    return selections =>
      q.Map(createSelectQuery(path, true), instance =>
        this.expandSelection(typeName, selections, [])
      );
  }

  getCollectionCompiler(refQuery: Expr, typeName: string): compiler {
    return selections =>
      q.Let(
        {
          ref: refQuery,
          instance: q.Get(q.Var('ref'))
        },
        this.expandSelection(typeName, selections)
      );
  }

  getDefaultCollectionCompiler(typeName: string, path: $FixMe): compiler {
    return this.getCollectionCompiler(createSelectQuery(path, false), typeName);
  }

  getCollectionListCompiler(refsQuery: Expr, typeName: string): compiler {
    return selections =>
      q.Map(refsQuery, ref =>
        q.Let(
          {
            instance: q.Get(q.Var('ref'))
          },
          this.expandSelection(typeName, selections)
        )
      );
  }

  getDefaultCollectionListCompiler(typeName: string, path: $FixMe): compiler {
    return this.getCollectionListCompiler(
      createSelectQuery(path, true),
      typeName
    );
  }

  getCompiler(typeName: string, fieldName: string, path: $FixMe): compiler {
    // System types
    if (fieldName === '_id') return idCompiler;
    if (fieldName === '_ts') return tsCompiler;

    // User types
    const typeSchema = this.getTypeSchema(typeName);
    const fieldSchema = this.getFieldFromTypeSchema(typeSchema, fieldName);

    // determine field type
    let fieldTypeName;
    let fieldIsList;

    if (fieldSchema.type.kind === 'NamedType') {
      fieldIsList = false;
      fieldTypeName = fieldSchema.type.name;
    } else if (fieldSchema.type.kind === 'ListType') {
      fieldIsList = true;
      fieldTypeName = fieldSchema.type.type.name;
    }
    // TODO include nonnullables

    let compiler;

    const resolverDef = fieldSchema.resolver;

    if (!resolverDef) {
      // determine default compiler
      const fieldTypeSchema = this.getTypeSchema(fieldTypeName);
      switch (fieldTypeSchema.kind) {
        case 'ScalarTypeDefinition':
          compiler = fieldIsList
            ? createSelectCompiler(path, true)
            : createSelectCompiler(path, false);
          break;
        case 'EmbeddedTypeDefinition':
          compiler = fieldIsList
            ? this.getDefaultObjectListCompiler(fieldTypeName, path)
            : this.getDefaultObjectCompiler(fieldTypeName, path);
          break;
        case 'CollectionTypeDefinition':
          compiler = fieldIsList
            ? this.getDefaultCollectionListCompiler(fieldTypeName, path)
            : this.getDefaultCollectionCompiler(fieldTypeName, path);
          break;
        default:
          throw new TypeError(
            `Encountered unknown Field type: ${fieldTypeSchema.kind}`
          );
      }
    } else {
      // use schema resolver for compiler
      switch (resolverDef.kind) {
        case 'matchRefResolver':
          const index = resolverDef.index;
          compiler = this.getCollectionListCompiler(
            q.Select(
              ['data'],
              q.Paginate(q.Match(q.Index(index), q.Var('ref')))
            ),
            fieldTypeName
          );
          break;
        default:
          throw new TypeError(
            `Encountered unknown Resolver type: ${resolverDef.kind}`
          );
      }
    }

    return compiler;
  }

  expandSelection(typeName: string, selections: $FixMe, path?: $FixMe): Expr {
    path = path || ['data'];

    return selections.reduce(
      (result: $FixMe, selector: $FixMe) => {
        let resolved;

        switch (selector.kind) {
          case 'FieldSelection':
            const newSelections = selector.selections;
            resolved = {
              ...result,
              [selector.name]: this.getCompiler(typeName, selector.name, [
                ...path,
                selector.name
              ])(newSelections)
            };
            break;

          case 'TypeConditionSelection':
            throw {
              name: 'NotImplementedError',
              message: 'Type Condition selectors have not been implemented'
            };

          default:
            throw new TypeError(
              `Encountered unknown Selector type ${selector.kind}`
            );
        }

        return resolved;
      },
      { _type: typeName }
    );
  }
}
