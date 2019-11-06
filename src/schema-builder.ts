type $FixMe = any;

export const namedType = (name: string) => ({
  kind: 'NamedType',
  name
});

export const listType = (type: $FixMe) => ({
  kind: 'ListType',
  type
});

export const embeddedType = (name: string, fields: $FixMe) => ({
  kind: 'EmbeddedTypeDefinition',
  name,
  fields
});

export const collectionType = (name: string, fields: $FixMe) => ({
  kind: 'CollectionTypeDefinition',
  name,
  fields
});

export const StringField = namedType('String');
export const NumberField = namedType('Number');
