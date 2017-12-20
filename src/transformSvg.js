/* eslint-disable no-param-reassign */
import { dirname } from 'path';
import resolveFrom from 'resolve-from';
import { namespaceToCamel, hyphenToCamel } from './camelize';
import cssToObj from './cssToObj';
//
// These visitors normalize the SVG into the primitives from react-sketchapp:
//

// TODO: derrive known types from react-sketchapp
// import { Svg } from 'react-sketchapp';

const knownTypes = [
  'Svg',
  'Circle',
  'ClipPath',
  'Defs',
  'Ellipse',
  'G',
  'Image',
  'Line',
  'LinearGradient',
  'Path',
  'Pattern',
  'Polygon',
  'Polyline',
  'RadialGradient',
  'Rect',
  'Stop',
  'Symbol',
  'Text',
  'TextPath',
  'TSpan',
];

/**
 * Converts first character of `str` to uppercase
 * @param str {String}
 * @returns String
 */
function toFirstUpper(str) {
  return str.charAt(0).toUpperCase() + str.substr(1);
}

/**
 * Converts `circle` to `Circle` if it is a known type
 * @param name {String}
 * @returns String
 */
function toMemberIdentifier(name) {
  // const knownTypes = Object.keys(Svg)
    // .filter(n => n.charAt(0) !== n.charAt(0).toLowerCase());
  const lname = name.toLowerCase();
  const cname = toFirstUpper(lname);
  if (knownTypes.includes(cname)) {
    return cname;
  }
  // Unknown node
  return null;
}

/**
 * Converts `<circle>` to `<Svg.Circle>` member expressions
 */
export default (t, ancestor, state) => ({
  JSXAttribute(path) {
    if (t.isJSXNamespacedName(path.node.name)) {
      // converts
      // <svg xmlns:xlink="asdf">
      // to
      // <svg xmlnsXlink="asdf">
      path.node.name = t.jSXIdentifier(
        namespaceToCamel(path.node.name.namespace.name, path.node.name.name.name)
      );
    } else if (t.isJSXIdentifier(path.node.name)) {
      // converts
      // <tag class="blah blah1"/>
      // to
      // <tag className="blah blah1"/>
      if (path.node.name.name === 'class') {
        path.node.name.name = 'className';
      }

      // converts
      // <tag style="text-align: center; width: 50px">
      // to
      // <tag style={{textAlign: 'center', width: '50px'}}>
      if (path.node.name.name === 'style') {
        const csso = cssToObj(path.node.value.value);
        const properties = Object.keys(csso).map(prop => t.objectProperty(
          t.identifier(hyphenToCamel(prop)),
          t.stringLiteral(csso[prop])
        ));
        path.node.value = t.jSXExpressionContainer(
          t.objectExpression(properties)
        );
      }

      // converts
      // <svg stroke-width="5">
      // to
      // <svg strokeWidth="5">
      // don't convert any custom data-* attributes
      if (!path.node.name.name.startsWith('data-')) {
        path.node.name.name = hyphenToCamel(path.node.name.name);
      }
    }
  },
  JSXOpeningElement(path) {
    const memberIdentifier = toMemberIdentifier(path.node.name.name);
    // console.log('"%s" => "%s"', path.node.name.name, memberIdentifier);
    if (!memberIdentifier) {
      const importPath = ancestor.node.source.value;
      const iconPath = state.file.opts.filename;
      const svgPath = resolveFrom(dirname(iconPath), importPath);
      if (state.opts.verbose) {
        console.warn('WARNING: Removing incompatible node "%s" in file "%s".', path.node.name.name, svgPath);
      }
      path.parentPath.remove();
    } else if (memberIdentifier === 'Svg') {
      path.node.name = t.jSXIdentifier(memberIdentifier);
    } else {
      path.node.name = t.jSXMemberExpression(t.jSXIdentifier('Svg'), t.jSXIdentifier(memberIdentifier));
    }
  },
});
