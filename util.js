const _ = require('lodash');
const { modifierMap } = require('./constant');

const getModifier = (graph, prevNode, destNode) => {
  return modifierMap[
    _.filter(
      graph[prevNode.uid],
      item => destNode.uid === item.destinationuid
    )[0].modifiers
  ];
};

module.exports = {
  getModifier
};
