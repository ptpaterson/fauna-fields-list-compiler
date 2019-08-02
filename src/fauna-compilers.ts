import { query as q, Expr, ExprArg } from "faunadb";

import {
  DataModel,
  getCollectionModel,
  getFieldModel,
  getDirectives
} from "./datamodel";

export type QueryFields = {
  [key: string]: {} | QueryFields;
};

export type Compiler = (fields: QueryFields) => (value: Expr) => Expr;

type FieldCompilerThunkMap = {
  [key: string]: () => Compiler;
};

// Compilers

export const createListCompiler = (compiler: Compiler): Compiler => (
  fields: QueryFields
) => (collection: ExprArg) =>
  q.Map(collection, (ref: Expr) => compiler(fields)(ref));

export const createObjectCompiler = (
  dataModel: DataModel,
  collectionName: string,
  parentFieldName?: string
): Compiler => {
  // get some required infos
  const collectionModel = getCollectionModel(dataModel, collectionName);
  const collectionDirectives = getDirectives(collectionModel);
  const collectionIsEmbedded =
    typeof collectionDirectives.embedded !== "undefined";

  // thunk-ify Compilers and only resolve if needed.
  // Otherwise it would create an infinite loop due to circular references.
  const fieldCompilerThunkMap: FieldCompilerThunkMap = collectionModel.fields.reduce(
    (result: any, fieldModel: any) => {
      // Parse through the data model and build a map of compilers based on the
      // field's type.  That compiler can then be selected via the fields-list.

      const fieldName = fieldModel.name;
      const fieldTypeModel = fieldModel.type;
      const isList = fieldTypeModel.List != undefined;
      const baseFieldType = isList
        ? fieldTypeModel.List.Named
        : fieldTypeModel.Named;

      // if the base type is not one of the modeled fields, assume it's a scalar
      const typeModel = dataModel.collections.find(
        (collectionModel: any) => collectionModel.name === baseFieldType
      );
      if (!typeModel) return result;

      // if not a scalar, build a compiler for the field
      const getfieldCompiler = () =>
        createObjectCompiler(dataModel, baseFieldType, fieldName);
      const getMaybeListCompiler = () =>
        isList ? createListCompiler(getfieldCompiler()) : getfieldCompiler();
      return {
        ...result,
        [fieldName]: getMaybeListCompiler
      };
    },
    {}
  );

  return fields => ref => {
    const instance = collectionIsEmbedded ? ref : q.Get(ref);

    const inExpr = Object.keys(fields || {}).reduce(
      (result, queryFieldName) => {
        // **********************************************************************
        // System types
        if (queryFieldName === "_id") {
          return {
            ...result,
            _id: q.Select(["id"], ref)
          };
        }
        if (queryFieldName === "_ts") {
          return {
            ...result,
            _ts: q.Select(["ts"], instance)
          };
        }

        // **********************************************************************
        // Application Types
        const fieldModel = getFieldModel(collectionModel, queryFieldName);

        const resolveTypeModel = fieldModel.type;
        const resolveTypeIsList = resolveTypeModel.List != undefined;

        // TODO: account for NotNull
        const selectExpr = collectionIsEmbedded
          ? resolveTypeIsList
            ? q.Select([queryFieldName], instance, [])
            : q.Select([queryFieldName], instance, null as any)
          : resolveTypeIsList
          ? q.Select(["data", queryFieldName], instance, [])
          : q.Select(["data", queryFieldName], instance, null as any);

        // for scalars
        if (!fieldCompilerThunkMap[queryFieldName]) {
          return {
            ...result,
            [queryFieldName]: selectExpr
          };
        }

        // TODO: deal with NotNull
        const resolveBaseTypeName = resolveTypeIsList
          ? resolveTypeModel.List.Named
          : resolveTypeModel.Named;
        const resolveCollection = getCollectionModel(
          dataModel,
          resolveBaseTypeName
        );

        const resolveTypeDirectives = getDirectives(resolveCollection);
        const resolveTypeIsEmbedded =
          typeof resolveTypeDirectives.embedded !== "undefined";
        const embeddedResult = q.Let(
          {
            parent: resolveTypeIsList
              ? q.Select(["data", queryFieldName], instance, [])
              : q.Select(["data", queryFieldName], instance, null as any)
          },
          q.If(
            q.Equals([q.Var("parent"), null]),
            null,
            fieldCompilerThunkMap[queryFieldName]()(fields[queryFieldName])(
              q.Var("parent")
            )
          )
        );

        // otherwise
        return {
          ...result,
          [queryFieldName]: resolveTypeIsEmbedded
            ? embeddedResult
            : fieldCompilerThunkMap[queryFieldName]()(fields[queryFieldName])(
                selectExpr
              )
        };
      },
      {}
    );

    return inExpr;
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
