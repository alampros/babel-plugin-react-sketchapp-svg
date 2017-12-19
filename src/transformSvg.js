/* eslint-disable no-param-reassign */
import { dirname } from 'path';
import resolveFrom from 'resolve-from';
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
  JSXOpeningElement(path) {
    const memberIdentifier = toMemberIdentifier(path.node.name.name);
    // console.log('"%s" => "%s"', path.node.name.name, memberIdentifier);
    if (!memberIdentifier) {
      const importPath = ancestor.node.source.value;
      const iconPath = state.file.opts.filename;
      const svgPath = resolveFrom(dirname(iconPath), importPath);
      console.warn('WARNING: Removing incompatible node "%s" in file "%s".', path.node.name.name, svgPath);
      path.parentPath.remove();
    } else if (memberIdentifier === 'Svg') {
      path.node.name = t.jSXIdentifier(memberIdentifier);
    } else {
      path.node.name = t.jSXMemberExpression(t.jSXIdentifier('Svg'), t.jSXIdentifier(memberIdentifier));
    }
  },
});
