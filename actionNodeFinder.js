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

  getActionNodes (rootNode, conditions) {
    let targetNodeInfo = this.graph[rootNode.uid];

    // Filter by matchmode
    // sourceoutputuid가 없는 노드들을 else 노드로, 있는 노드들을 then 노드로 간주함
    if (conditions === true || conditions === false) {
      targetNodeInfo = _.filter(this.graph[rootNode.uid], (node) => {
        if (conditions === true) return node.sourceoutputuid;
        return node.sourceoutputuid ? false : true;
      });
    }

    const destUids = _.map(
      targetNodeInfo,
      (item) => item.destinationuid
    );

    let destNodes = _.filter(this.nodeInfo, (node) => {
      return destUids.includes(node.uid);
    });

    const actionNodes = [];
    for (const destNode of destNodes) {
      actionNodes.push(this.findDests(rootNode, destNode));
    }
    return actionNodes;
  }

  findDests(prevNode, destNode) {
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

        case "alfred.workflow.output.notification":
          return {
            modifiers,
            type: "notification",
            title: destNode.config.title,
            text: destNode.config.text
          };

        case "alfred.workflow.action.openfile":
          return {
            modifiers,
            type: "open",
            target: destNode.config.sourcefile
          };

        case "alfred.workflow.action.openurl":
          return {
            modifiers,
            type: "open",
            target: destNode.config.url,
          };

        case "alfred.workflow.output.clipboard":
          return {
            modifiers,
            type: "clipboard",
            text: destNode.config.clipboardtext,
          };

        case "alfred.workflow.utility.conditional": {
          const thenNextDestNodes = this.getActionNodes(destNode, true);
          const elseNextDestNodes = this.getActionNodes(destNode, false);

          let conditionStmt = '';
          destNode.config.conditions.map((cond, idx) => {
            const arg = cond.inputstring === '' ? 'query' : cond.inputstring;

            // 0: true when match
            // 1: true when not match
            // 4: regex match
            if (cond.matchmode === 0) {
              conditionStmt += `{${arg}} == "${cond.matchstring}"`
            } else if (cond.matchmode === 1) {
              conditionStmt += `{${arg}} != "${cond.matchstring}"`
            } else if (cond.matchmode === 4) {
              conditionStmt += `new RegExp("${cond.matchstring}").test({${arg}})`
            }

            if (idx !== destNode.config.conditions.length - 1) conditionStmt += ' && ';
          });

          return {
            modifiers,
            type: "cond",
            if: {
              cond: conditionStmt,
              action: {
                then: thenNextDestNodes,
                else: elseNextDestNodes,
              }
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
