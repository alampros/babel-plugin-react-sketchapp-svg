import React from 'react';
import { Svg } from 'react-sketchapp';
import MySvg from './close.svg';

export function MyFunctionIcon() {
  return <MySvg />;
}

export class MyClassIcon extends React.Component {
  render() {
    return <MySvg />;
  }
}
