const chalk = require('chalk');
const _ = require('lodash');
const {
  supportedActionFormat,
  supportedInputFormat,
  notSupported,
} = require("./constant");

module.exports = class ActionNodeFinder {
  constructor(graph, nodeInfo) {
    this.graph = graph;
    this.nodeInfo = nodeInfo;
  }

  getActionNodes (destNodes) {
    const actionNodes = [];
    for (const destNode of destNodes) {
      actionNodes.push(this.#find(destNode));
    }
    return actionNodes;
  }

  #find(destNode) {
    if (supportedActionFormat.includes(destNode.type)) {
      switch (destNode.type) {
        case "alfred.workflow.action.script":
          return {
            type: "script",
            script: destNode.config.script,
          };

        case "alfred.workflow.action.openurl":
          return {
            type: "open",
            url: destNode.config.url,
          };

        case "alfred.workflow.output.clipboard":
          return {
            type: "clipboard",
            text: destNode.config.clipboardtext,
          };

        case "alfred.workflow.utility.conditional": {
          const destUids = _.map(this.graph[destNode.uid], item => item.destinationuid);
          const destNodes = _.filter(this.nodeInfo, node => destUids.includes(node.uid));
          const newDestNodes = this.getActionNodes(destNodes);

          return {
            type: "cond",
            conditions: {
              matchstring: destNode.config.conditions[0].matchstring,
            },
            action: newDestNodes,
          };
        }

        case "alfred.workflow.utility.argument": {
          const destUids = _.map(this.graph[destNode.uid], item => item.destinationuid);
          const destNodes = _.filter(this.nodeInfo, node => destUids.includes(node.uid));
          const newDestNodes = this.getActionNodes(destNodes);

          return {
            type: "args",
            action: newDestNodes,
          };
        }

        case "alfred.workflow.input.scriptfilter": {
          const destUids = _.map(this.graph[destNode.uid], item => item.destinationuid);
          const destNodes = _.filter(this.nodeInfo, node => destUids.includes(node.uid));
          const newDestNodes = this.getActionNodes(destNodes);

          return {
            type: "scriptfilter",
            action: newDestNodes,
            script_filter: destNode.config.script,
            running_subtext: destNode.config.runningsubtext
          };
        }

        case "alfred.workflow.input.keyword": {
          const destUids = _.map(this.graph[destNode.uid], item => item.destinationuid);
          const destNodes = _.filter(this.nodeInfo, node => destUids.includes(node.uid));
          const newDestNodes = this.getActionNodes(destNodes);

          return {
            type: "keyword",
            action: newDestNodes,
            keyword: destNode.config.keyword
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
      return notSupported(destNode.type);
    }
  }
};
