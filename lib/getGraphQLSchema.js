/**
 * @author Dmitriy Bizyaev
 */

const request = require('request-promise-native');
const { introspectionQuery } = require('graphql/utilities');

/**
 *
 * @param {string} graphqlEndpointURL
 * @return {Promise<GQLSchema>}
 */
const getGraphQLSchema = async graphqlEndpointURL => {
  const data = await request({
    url: graphqlEndpointURL,
    method: 'POST',
    body: {
      query: introspectionQuery,
    },
    headers: {
      'Content-Type': 'application/json',
    },
    json: true,
  });

  if (data.error) {
    throw new Error(data.error);
  }

  if (!data.data || !data.data.__schema) {
    throw new Error(
      "getGraphQLSchema(): server response doesn't contain schema"
    );
  }

  return data.data.__schema;
};

module.exports = getGraphQLSchema;
