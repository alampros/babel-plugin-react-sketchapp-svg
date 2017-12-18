/* eslint-disable no-param-reassign */
//
// These visitors normalize the SVG into the primitives from react-sketchapp:
//

import { Svg } from 'react-sketchapp';

function toFirstUpper(str) {
  return str.charAt(0).toUpperCase() + str.substr(1);
}
function prefixNodeName(str) {
  if (str === 'Svg') {
    return str;
  }
  return `Svg.${str}`;
}
function toScopedIdentifier(name) {
  const knownTypes = Object.keys(Svg)
    .filter(n => n.charAt(0) !== n.charAt(0).toLowerCase());
  const lname = name.toLowerCase();
  const cname = toFirstUpper(lname);
  if (knownTypes.includes(cname)) {
    return prefixNodeName(cname);
  }
  return null;
}

export default t => ({
  // converts
  // <circle>
  // to
  // <Svg.Circle>
  JSXOpeningElement(path) {
    const scopedIdentifier = toScopedIdentifier(path.node.name.name);
    // console.log('"%s" => "%s"', path.node.name.name, scopedIdentifier);
    if (scopedIdentifier) {
      path.node.name = t.jSXIdentifier(scopedIdentifier);
    }
  },
});
