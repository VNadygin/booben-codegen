'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

/**
 * @author Dmitriy Bizyaev
 */

var request = require('request-promise-native');

var _require = require('graphql/utilities'),
    introspectionQuery = _require.introspectionQuery;

/**
 *
 * @param {string} graphqlEndpointURL
 * @return {Promise<GQLSchema>}
 */


var getGraphQLSchema = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(graphqlEndpointURL) {
    var data;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return request({
              url: graphqlEndpointURL,
              method: 'POST',
              body: {
                query: introspectionQuery
              },
              headers: {
                'Content-Type': 'application/json'
              },
              json: true
            });

          case 2:
            data = _context.sent;

            if (!data.error) {
              _context.next = 5;
              break;
            }

            throw new Error(data.error);

          case 5:
            if (!(!data.data || !data.data.__schema)) {
              _context.next = 7;
              break;
            }

            throw new Error("getGraphQLSchema(): server response doesn't contain schema");

          case 7:
            return _context.abrupt('return', data.data.__schema);

          case 8:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined);
  }));

  return function getGraphQLSchema(_x) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = getGraphQLSchema;
//# sourceMappingURL=getGraphQLSchema.js.map