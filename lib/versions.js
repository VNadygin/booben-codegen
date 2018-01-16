/**
 * @author Dmitriy Bizyaev
 */

'use strict';

const versions = {
  react: '^16.0.0',
  'react-dom': '^16.0.0',
  'react-router': '^4.1.1',
  'react-scripts': '1.1.0',
  'react-router-dom': '^4.1.1',
  'apollo-client': '^1.8.0',
  'react-apollo': '^1.4.6',
};

module.exports = name => {
  const v = versions[name];

  if (!v) {
    throw new Error(`Unknown package: ${name}`);
  }

  return v;
};
