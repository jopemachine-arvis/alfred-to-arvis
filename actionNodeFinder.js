const chalk = require('chalk');
const _ = require('lodash');
const {
  supportedActionFormat,
  notSupported,
  modifierMap
} = require("./constant");

module.exports = class ActionNodeFinder {

  constructor(graph, nodeInfo) {
    this.graph = graph;
    this.nodeInfo = nodeInfo;
  }

  getActionNodes (rootNode) {
    const destUids = _.map(this.graph[rootNode.uid], item => item.destinationuid);
    const destNodes = _.filter(this.nodeInfo, node => destUids.includes(node.uid));

    const actionNodes = [];
    for (const destNode of destNodes) {
      actionNodes.push(this.#findDests(rootNode, destNode));
    }
    return actionNodes;
  }

  #findDests(prevNode, destNode) {
    const modifiers =
      modifierMap[
        _.filter(
          this.graph[prevNode.uid],
          (item) => destNode.uid === item.destinationuid
        )[0].modifiers
      ];

    if (supportedActionFormat.includes(destNode.type)) {
      switch (destNode.type) {
        case "alfred.workflow.action.script":
          return {
            type: "script",
            script: destNode.config.script,
            modifiers,
          };

        case "alfred.workflow.action.openurl":
          return {
            type: "open",
            url: destNode.config.url,
            modifiers,
          };

        case "alfred.workflow.output.clipboard":
          return {
            type: "clipboard",
            text: destNode.config.clipboardtext,
            modifiers,
          };

        case "alfred.workflow.utility.conditional": {
          const nextDestNodes = this.getActionNodes(destNode);

          // To do:: check 'Assumption' about index order
          return {
            type: "cond",
            if: {
              matchstring: destNode.config.conditions[0].matchstring,
            },
            modifiers,
            action: {
              true: nextDestNodes[0],
              false: nextDestNodes[1],
            },
          };
        }

        case "alfred.workflow.utility.argument": {
          const nextDestNodes = this.getActionNodes(destNode);

          return {
            type: "args",
            action: nextDestNodes,
            modifiers,
          };
        }

        case "alfred.workflow.input.scriptfilter": {
          const nextDestNodes = this.getActionNodes(destNode);

          return {
            type: "scriptfilter",
            action: nextDestNodes,
            script_filter: destNode.config.script,
            running_subtext: destNode.config.runningsubtext,
            modifiers,
          };
        }

        case "alfred.workflow.input.keyword": {
          const nextDestNodes = this.getActionNodes(destNode);

          return {
            type: "keyword",
            action: nextDestNodes,
            keyword: destNode.config.keyword,
            modifiers,
          };
        }
        default: 
          return notSupported();
      }
    } else {
      console.error(
        chalk.cyanBright(
          `Skipped.. destination type not supported: '${destNode.type}'.`
        )
      );
      return {
        type: destNode.type,
        error: notSupported(),
      };
    }
  }
};
