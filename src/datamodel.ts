// Types
export type DataModel = any;

export const getCollectionModel = (
  dataModel: DataModel,
  collectionName: string
) => {
  const collectionModel = dataModel.collections.find(
    (collectionModel: any) => collectionModel.name === collectionName
  );
  if (!collectionModel) {
    throw new Error(`Collection, ${collectionName}, not found in Data Model`);
  }
  return collectionModel;
};

export const getFieldModel = (collectionModel: any, fieldName: string) => {
  const fieldModel = collectionModel.fields.find(
    (fieldModel: any) => fieldModel.name === fieldName
  );
  if (!fieldModel) {
    throw new Error(
      `Field, ${fieldName}, not found in Collection, ${collectionModel.name}`
    );
  }
  return fieldModel;
};

export const getDirectives = (model: any) => {
  const directives = model.directives;
  if (!directives) return {};

  return directives.reduce(
    (result: any, directive: any) => ({
      ...result,
      [directive.name]: directive.args || {}
    }),
    {}
  );
};
