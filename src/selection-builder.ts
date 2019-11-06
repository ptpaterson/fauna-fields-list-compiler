type $FixMe = any;

export const field = (name: string, selections: $FixMe = []) => ({
  kind: 'FieldSelection',
  name,
  selections
});

export const typeCondition = (typeName: string, selections: $FixMe) => ({
  kind: 'TypeConditionSelection',
  selections
});

const fieldHasFields = (field: $FixMe) => Object.keys(field).length > 0;
export const fromGraphQLFieldsList = (fields: $FixMe) => {
  const fieldReducer = (result: $FixMe, [name, subfields]: $FixMe): $FixMe => {
    const selection = fieldHasFields(subfields)
      ? field(name, Object.entries(subfields).reduce(fieldReducer, []))
      : field(name);

    return [...result, selection];
  };

  return Object.entries(fields).reduce(fieldReducer, []);
};
