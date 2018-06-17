'use strict';

const versions = {
  react: '^16.0.0',
  'react-dom': '^16.0.0',
  'react-router': '^4.1.1',
  'react-scripts': '1.1.0',
  'react-router-dom': '^4.1.1',
  'apollo-client': '^2.2.2',
  'react-apollo': '^2.0.4',
  'apollo-link-http': '^1.3.2',
  'apollo-cache-inmemory': '^1.1.7',
  'apollo-link-context': '^1.0.3',
  'styled-components': '^3.1.6',
  'graphql-tag': '^2.7.3',
};

module.exports = name => {
  const v = versions[name];

  if (!v) {
    throw new Error(`Unknown package: ${name}`);
  }

  return v;
};
