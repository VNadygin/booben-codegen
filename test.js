const {
  FieldKinds,
  isBuiltinGraphQLType,
  RELAY_TYPE_NODE_INTERFACE,
  RELAY_TYPE_PAGEINFO,
  RELAY_CONNECTION_ARGS_NUM,
  RELAY_CONNECTION_ARG_FIRST,
  RELAY_CONNECTION_ARG_LAST,
  RELAY_CONNECTION_ARG_AFTER,
  RELAY_CONNECTION_ARG_BEFORE,
  RELAY_CONNECTION_FIELDS_NUM,
  RELAY_CONNECTION_FIELD_EDGES,
  RELAY_CONNECTION_FIELD_PAGEINFO,
  RELAY_PAGEINFO_FIELDS_NUM,
  RELAY_PAGEINFO_FIELD_HAS_NEXT_PAGE,
  RELAY_PAGEINFO_FIELD_HAS_PREVIOUS_PAGE,
  RELAY_PAGEINFO_FIELD_START_CURSOR,
  RELAY_PAGEINFO_FIELD_END_CURSOR,
  RELAY_EDGE_FIELDS_NUM,
  RELAY_EDGE_FIELD_NODE,
  RELAY_EDGE_FIELD_CURSOR,
  RELAY_PAGEINFO_FIELDS,
  AFTER_ARG_DEFINITION,
  BEFORE_ARG_DEFINITION,
  parseGraphQLSchema,
  parseFieldName,
  formatFieldName,
  getTypeNameByField,
  getTypeNameByPath,
  getJssyValueDefOfField,
  getJssyValueDefOfMutationArgument,
  getJssyValueDefOfQueryArgument,
  fieldHasArguments,
  getFieldOnType,
  getFieldsByPath,
  getFieldByPath,
  getMutationField,
  getMutationType,
  findFirstConnectionInPath,
} = require("@jssy/graphql-schema")

const schema = require('./shema.json')

const result = getFieldsByPath(schema, ["allTodoes"])


console.log(result);




 