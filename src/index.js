import { extname, dirname } from 'path';
import { readFileSync } from 'fs';
import template from 'babel-template';
import traverse from 'babel-traverse';
import { parse } from 'babylon';
import resolveFrom from 'resolve-from';

import optimize from './optimize';
import escapeBraces from './escapeBraces';
import transformSvg from './transformSvg';
import fileExistsWithCaseSync from './fileExistsWithCaseSync';

const buildSvg = template(`
  var SVG_NAME = function SVG_NAME(props) { return SVG_CODE; };
`);

const buildSvgWithDefaults = template(`
  var SVG_NAME = function SVG_NAME(props) { return SVG_CODE; };
  SVG_NAME.defaultProps = SVG_DEFAULT_PROPS_CODE;
`);

let ignoreRegex;

function getDefaultDimensionOptionProperty(t, propVal) {
  switch (typeof propVal) {
    case 'string':
      return t.stringLiteral(propVal);
    case 'number':
      return t.numericLiteral(propVal);
      // no default
  }
  return t.stringLiteral('100%');
}

export default ({ types: t }) => ({
  visitor: {
    Program: {
      enter({ scope, node }, { file }) {
        if (!scope.hasBinding('Svg')) {
          const reactSketchAppImportDeclaration = t.importDeclaration([
            t.importSpecifier(t.identifier('Svg'), t.identifier('Svg')),
          ], t.stringLiteral('react-sketchapp'));
          file.set('ensureReactSketchapp', () => { node.body.unshift(reactSketchAppImportDeclaration); });
        } else {
          file.set('ensureReactSketchapp', () => {});
        }
        if (!scope.hasBinding('React')) {
          const reactImportDeclaration = t.importDeclaration([
            t.importDefaultSpecifier(t.identifier('React')),
          ], t.stringLiteral('react'));
          file.set('ensureReact', () => { node.body.unshift(reactImportDeclaration); });
        } else {
          file.set('ensureReact', () => {});
        }
      },
    },
    ImportDeclaration(path, state) {
      const importPath = path.node.source.value;
      const { ignorePattern, caseSensitive, defaultWidth, defaultHeight } = state.opts;
      const { file } = state;
      if (ignorePattern) {
        // Only set the ignoreRegex once:
        ignoreRegex = ignoreRegex || new RegExp(ignorePattern);
        // Test if we should ignore this:
        if (ignoreRegex.test(importPath)) {
          return;
        }
      }
      // This plugin only applies for SVGs:
      if (extname(importPath) === '.svg') {
        // We only support the import default specifier, so let's use that identifier:
        const importIdentifier = path.node.specifiers[0].local;
        const iconPath = state.file.opts.filename;
        const svgPath = resolveFrom(dirname(iconPath), importPath);
        if (caseSensitive && !fileExistsWithCaseSync(svgPath)) {
          throw new Error(`File path didn't match case of file on disk: ${svgPath}`);
        }
        const rawSource = readFileSync(svgPath, 'utf8');
        const optimizedSource = state.opts.svgo === false
          ? rawSource
          : optimize(rawSource, state.opts.svgo);

        const escapeSvgSource = escapeBraces(optimizedSource);

        const parsedSvgAst = parse(escapeSvgSource, {
          sourceType: 'module',
          plugins: ['jsx'],
        });

        traverse(parsedSvgAst, transformSvg(t, path, state));

        const svgCode = traverse.removeProperties(parsedSvgAst.program.body[0].expression);

        const opts = {
          SVG_NAME: importIdentifier,
          SVG_CODE: svgCode,
        };

        // Move props off of element and into defaultProps
        if (svgCode.openingElement.attributes.length > 1) {
          const keepProps = [t.jSXSpreadAttribute(t.identifier('props'))];
          const defaultProps = [
            t.objectProperty(t.identifier('width'), getDefaultDimensionOptionProperty(t, defaultWidth)),
            t.objectProperty(t.identifier('height'), getDefaultDimensionOptionProperty(t, defaultHeight)),
          ];

          svgCode.openingElement.attributes.forEach((prop) => {
            if (prop.type === 'JSXSpreadAttribute') {
              keepProps.push(prop);
            } else {
              defaultProps.push(t.objectProperty(
                t.identifier(prop.name.name),
                prop.value,
              ));
            }
          });

          svgCode.openingElement.attributes = keepProps;
          opts.SVG_DEFAULT_PROPS_CODE = t.objectExpression(defaultProps);
        }

        if (opts.SVG_DEFAULT_PROPS_CODE) {
          const svgReplacement = buildSvgWithDefaults(opts);
          path.replaceWithMultiple(svgReplacement);
        } else {
          const svgReplacement = buildSvg(opts);
          path.replaceWith(svgReplacement);
        }
        file.get('ensureReact')();
        file.get('ensureReactSketchapp')();
        file.set('ensureReact', () => {});
        file.set('ensureReactSketchapp', () => {});
      }
    },
  },
});
