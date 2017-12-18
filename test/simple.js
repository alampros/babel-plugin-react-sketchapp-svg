import { transformFile } from 'babel-core';

function assertReactImport(result) {
  const match = result.code.match(/import React from 'react'/);
  if (!match) {
    throw new Error('no React import found');
  }
  if (match.length !== 1) {
    throw new Error('more or less than one match found');
  }
}

function assertReactSketchappImport(result) {
  const match = result.code.match(/import Svg from 'react-sketchapp'/);
  if (!match) {
    throw new Error('no react-sketchapp import found');
  }
  if (match.length !== 1) {
    throw new Error('more or less than one react-sketchapp match found');
  }
}

transformFile('test/fixtures/test.jsx', {
  babelrc: false,
  presets: ['react'],
  plugins: [
    '../../src/index',
  ],
}, (err, result) => {
  if (err) throw err;
  assertReactImport(result);
  assertReactSketchappImport(result);
  console.log('test/fixtures/test.jsx', result.code);
});
