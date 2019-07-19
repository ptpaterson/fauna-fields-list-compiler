import { query as q } from "faunadb";
import graphqlQueryFields from "graphql-fields";
import { GraphQLFieldResolver } from "graphql";

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

export type Compiler = (fields: QueryFields | undefined) => (value: any) => any;

const defaultCompiler: Compiler = () => value => value;

export const createListCompiler = (compiler: Compiler): Compiler => (
  fields: QueryFields | undefined
) => (refs: any) => q.Map(refs, ref => compiler(fields)(ref));

export const createObjectCompiler = (
  dataModel: DataModel,
  className: string
): Compiler => fields => ref => {
  const instance = q.Get(ref);

  // thunk-ify Compilers and only resolve if needed.  
  // Otherwise it would create an infinite loop due to circular references.
  const fieldResolverThunkMap: { [key: string]: () => Compiler } = Object.keys(
    dataModel[className].fields
  ).reduce((result, key) => {
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

  const result = Object.keys(fields || {}).reduce((result, key) => {
    const fieldType = dataModel[className].fields[key].type;
    const isList = fieldType === "List";
    const selector = isList
      ? q.Select(["data", key], instance, [])
      : q.Select(["data", key], instance, null as any);

    return {
      ...result,
      [key]: fieldResolverThunkMap[key]()(fields![key])(selector)
    };
  }, {});

  return result;
};

export const createPageCompiler = (listCompiler: Compiler) => (
  fields: QueryFields
) => (refs: any) => listCompiler(fields.data)(refs);

export const createTopLevelCompiler = (
  dataModel: DataModel,
  className: string
) =>
  createPageCompiler(
    createListCompiler(createObjectCompiler(dataModel, className))
  );
