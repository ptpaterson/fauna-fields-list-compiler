// Types
interface NamedTypeModel {
  Named: string;
}

interface ListTypeModel<
  T extends NamedTypeModel | NotNullTypeModel<NamedTypeModel>
> {
  List: T;
}

interface NotNullTypeModel<
  T extends
    | NamedTypeModel
    | ListTypeModel<NamedTypeModel>
    | ListTypeModel<NotNullTypeModel<NamedTypeModel>>
> {
  NotNull: T;
}

type FieldTypeModel =
  | NamedTypeModel
  | NotNullTypeModel<NamedTypeModel>
  | ListTypeModel<NamedTypeModel>
  | ListTypeModel<NotNullTypeModel<NamedTypeModel>>
  | NotNullTypeModel<ListTypeModel<NamedTypeModel>>
  | NotNullTypeModel<ListTypeModel<NotNullTypeModel<NamedTypeModel>>>;

type FieldModel = {
  name: string;
  type: FieldTypeModel;
};

type DirectiveModel = {
  name: string;
  args?: { [key: string]: string };
};

type CollectionModel = {
  name: string;
  fields: FieldModel[];
  directives?: DirectiveModel[];
};

type IndexModel = {
  name: string;
  type: FieldTypeModel;
  directives?: DirectiveModel[];
};

export type DataModel = {
  collections: CollectionModel[];
  indexes: IndexModel[];
};

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
