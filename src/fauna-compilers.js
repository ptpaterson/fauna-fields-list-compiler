const { query: q } = require("faunadb");

const defaultCompiler = _ => value => value;

const createListCompiler = compiler => fields => refs => q.Map(refs, ref => compiler(fields)(ref));

const createObjectCompiler = (dataModel, className) => fields => ref => {
  const instance = q.Get(ref);

  const fieldResolverThunkMap = Object.keys(dataModel[className].fields).reduce((result, key) => {
    const value = dataModel[className].fields[key];
    const resolveType = value.resolveType || "default";
    const fieldName = key;
    const fieldType = value.type;
    const isList = fieldType === "List";
    const baseFieldType = isList ? value.of : fieldType;

    const getfieldCompiler = () =>
      resolveType === "default"
        ? defaultCompiler
        : resolveType === "ref"
        ? createObjectCompiler(dataModel, baseFieldType)
        : undefined;

    const getMaybeListCompiler = () =>
      isList ? createListCompiler(getfieldCompiler()) : getfieldCompiler();

    return {
      ...result,
      [fieldName]: getMaybeListCompiler
    };
  }, {});

  const result = Object.keys(fields).reduce((result, key) => {
    const fieldType = dataModel[className].fields[key].type;
    const isList = fieldType === "List";
    const selector = isList
      ? q.Select(["data", key], instance, [])
      : q.Select(["data", key], instance, null);

    return {
      ...result,
      [key]: fieldResolverThunkMap[key]()(fields[key])(selector)
    };
  }, {});

  return result;
};

const createPageCompiler = listCompiler => fields => refs => listCompiler(fields.data)(refs);

const createTopLevelCompiler = (dataModel, className, index) =>
  createPageCompiler(createListCompiler(createObjectCompiler(dataModel, className)));

const createGraphqlRootQuery = (dataModel, className, indexName) => {
  const compiler = createTopLevelCompiler(dataModel, className);

  return (root, args, ctx, info) => {
    const refs = q.Paginate(q.Match(q.Index(indexName)));
    const compiledQuery = compiler(graphqlQueryFields(info))(refs);
    return client.query(compiledQuery);
  };
};

module.exports = {
  createTopLevelCompiler,
  createPageCompiler,
  createListCompiler,
  createObjectCompiler,
  createGraphqlRootQuery
};
