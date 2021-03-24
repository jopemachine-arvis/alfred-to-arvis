const chalk = require('chalk');
const _ = require('lodash');
const { supportedActionFormat, supportedInputFormat } = require("./constant");

module.exports = class ActionNodeFinder {
  constructor(graph, nodeInfo) {
    this.graph = graph;
    this.nodeInfo = nodeInfo;
  }

  find(destNode) {
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
            url: "",
          };

        case "alfred.workflow.utility.conditional": {
          const destUid = this.graph[destNode.uid][0].destinationuid;
          const newDestNode = _.filter(
            this.nodeInfo,
            (item) => item.uid === destUid
          )[0];

          return {
            type: "cond",
            conditions: {
              matchstring: destNode.config.conditions[0].matchstring,
            },
            action: this.find(newDestNode) ?? `Action_not_supported`,
          };
        }

        case "alfred.workflow.utility.argument": {
          const destUid = this.graph[destNode.uid][0].destinationuid;
          const newDestNode = _.filter(
            this.nodeInfo,
            (item) => item.uid === destUid
          )[0];

          return {
            type: "args",
            action: this.find(newDestNode) ?? "Action_not_supported",
          };
        }

        case "alfred.workflow.input.scriptfilter": {
          const destUid = this.graph[destNode.uid][0].destinationuid;
          const newDestNode = _.filter(
            this.nodeInfo,
            (item) => item.uid === destUid
          )[0];

          return {
            type: "scriptfilter",
            action: this.find(newDestNode) ?? "Action_not_supported",
            script_filter: destNode.config.script,
            running_subtext: destNode.config.runningsubtext
          };
        }

        case "alfred.workflow.input.keyword": {
          const destUid = this.graph[destNode.uid][0].destinationuid;
          const newDestNode = _.filter(
            this.nodeInfo,
            (item) => item.uid === destUid
          )[0];

          return {
            type: "keyword",
            action: this.find(newDestNode) ?? "Action_not_supported",
            keyword: destNode.config.keyword
          };
        }

      }
    } else {
      console.error(
        chalk.cyanBright(
          `Skipped.. destination type not supported: '${destNode.type}'.`
        )
      );
    }
  }
};
