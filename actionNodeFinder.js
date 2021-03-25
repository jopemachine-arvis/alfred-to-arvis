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
            modifiers,
            type: "script",
            script: destNode.config.script,
          };

        case "alfred.workflow.action.openurl":
          return {
            modifiers,
            type: "open",
            url: destNode.config.url,
          };

        case "alfred.workflow.output.clipboard":
          return {
            modifiers,
            type: "clipboard",
            text: destNode.config.clipboardtext,
          };

        case "alfred.workflow.utility.conditional": {
          const nextDestNodes = this.getActionNodes(destNode);

          // To do:: check 'Assumption' about index order
          return {
            modifiers,
            type: "cond",
            if: {
              matchstring: destNode.config.conditions[0].matchstring,
            },
            action: {
              true: nextDestNodes[0],
              false: nextDestNodes[1],
            },
          };
        }

        case "alfred.workflow.utility.argument": {
          const nextDestNodes = this.getActionNodes(destNode);
          return {
            modifiers,
            type: "args",
            arg: destNode.config.argument,
            action: nextDestNodes,
          };
        }

        case "alfred.workflow.input.scriptfilter": {
          const nextDestNodes = this.getActionNodes(destNode);

          return {
            modifiers,
            type: "scriptfilter",
            script_filter: destNode.config.script,
            running_subtext: destNode.config.runningsubtext,
            withspace: destNode.config.withspace,
            action: nextDestNodes,
          };
        }

        case "alfred.workflow.input.keyword": {
          const nextDestNodes = this.getActionNodes(destNode);

          return {
            modifiers,
            type: "keyword",
            keyword: destNode.config.keyword,
            withspace: destNode.config.withspace,
            action: nextDestNodes,
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
