import { query as q, Expr, ExprArg } from "faunadb";

// Types
export type DataModel = {
  [key: string]: {
    fields: {
      [key: string]: {
        resolveType?: "default" | "ref" | string;
        type: "List" | string;
        of?: string;
      };
    };
  };
};

export type QueryFields = {
  [key: string]: {} | QueryFields;
};

export type Compiler = (
  fields: QueryFields | undefined
) => (value: Expr) => Expr;

// Compilers
const defaultCompiler: Compiler = () => value => value;

export const createListCompiler = (compiler: Compiler): Compiler => (
  fields: QueryFields | undefined
) => (collection: ExprArg) =>
  q.Map(collection, (ref: Expr) => compiler(fields)(ref));

export const createObjectCompiler = (
  dataModel: DataModel,
  className: string
): Compiler => {

  // thunk-ify Compilers and only resolve if needed.
  // Otherwise it would create an infinite loop due to circular references.
  const fieldResolverThunkMap: {
    [key: string]: () => Compiler;
  } = Object.keys(dataModel[className].fields).reduce((result, key) => {

    // Parse through the data model and build a map of compilers based on the
    // field's type.  That compiler can then be selected via the fields-list.

    const value = dataModel[className].fields[key];
    const resolveType = value.resolveType || "default";
    const fieldName = key;
    const fieldType = value.type;
    const isList = fieldType === "List";
    const baseFieldType = isList ? value.of! : fieldType;

    const getfieldCompiler = (): Compiler =>
      resolveType === "default"
        ? defaultCompiler
        : resolveType === "ref"
        ? createObjectCompiler(dataModel, baseFieldType)
        : defaultCompiler;

    const getMaybeListCompiler = () =>
      isList ? createListCompiler(getfieldCompiler()) : getfieldCompiler();

    return {
      ...result,
      [fieldName]: getMaybeListCompiler
    };
  }, {});

  return fields => ref => {
    const instance = q.Get(ref);

    return Object.keys(fields || {}).reduce((result, key) => {
      const fieldType = dataModel[className].fields[key].type;
      const isList = fieldType === "List";
      const selectExpr = isList
        ? q.Select(["data", key], instance, [])
        : q.Select(["data", key], instance, null as any);

      return {
        ...result,
        [key]: fieldResolverThunkMap[key]()(fields![key])(selectExpr)
      };
    }, {});
  };
};

export const createPageCompiler = (listCompiler: Compiler) => (
  fields: QueryFields
) => (set: ExprArg) => listCompiler(fields.data)(set);

export const createTopLevelCompiler = (
  dataModel: DataModel,
  className: string
) =>
  createPageCompiler(
    createListCompiler(createObjectCompiler(dataModel, className))
  );
