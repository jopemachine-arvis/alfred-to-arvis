import _ from 'lodash';
import { modifierMap } from './constant';

export const getModifier = (graph: any, prevNode: any, destNode: any) => {
  return (modifierMap as any)[
    _.filter(
      graph[prevNode.uid],
      item => destNode.uid === item.destinationuid
    )[0].modifiers
  ];
};

export const removeRunNode = (script: string) => {
  return script.replace('./node_modules/.bin/run-node', 'node');
};