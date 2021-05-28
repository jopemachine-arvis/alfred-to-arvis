import _ from 'lodash';
import { modifierMap } from './constant';

const getModifier = (graph: any, prevNode: any, destNode: any) => {
  return (modifierMap as any)[
    _.filter(
      graph[prevNode.uid],
      item => destNode.uid === item.destinationuid
    )[0].modifiers
  ];
};

export { getModifier };
