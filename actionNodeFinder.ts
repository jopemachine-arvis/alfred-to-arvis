import chalk from 'chalk';
import _ from 'lodash';
import { supportedActionFormat, notSupported } from './constant';
import { getModifier } from './util';

export default class ActionNodeFinder {
  graph: any;
  nodeInfo: any;

  constructor(graph: any, nodeInfo: any) {
    this.graph = graph;
    this.nodeInfo = nodeInfo;
  }

  getActionNodes(rootNode: any, conditions?: any): any {
    let targetNodeInfo = this.graph[rootNode.uid];

    // Nodes without sourceoutput are considered 'else' nodes,
    // And nodes with sourceoutput are considered 'then' nodes
    if (conditions === true || conditions === false) {
      targetNodeInfo = _.filter(this.graph[rootNode.uid], node => {
        if (conditions === true) return node.sourceoutputuid;
        return node.sourceoutputuid ? false : true;
      });
    }

    const destUids = _.map(targetNodeInfo, item => item.destinationuid);

    let destNodes = _.filter(this.nodeInfo, node => {
      return destUids.includes(node.uid);
    });

    const actionNodes: any[] = [];
    for (const destNode of destNodes) {
      actionNodes.push(this.findDests(rootNode, destNode));
    }
    return actionNodes;
  }

  findDests(prevNode: any, destNode: any) {
    const modifiers = getModifier(this.graph, prevNode, destNode);

    if (supportedActionFormat.includes(destNode.type)) {
      switch (destNode.type) {
        case 'alfred.workflow.action.script': {
          const nextDestNodes = this.getActionNodes(destNode);

          return {
            modifiers,
            type: 'script',
            script: destNode.config.script,
            actions: nextDestNodes.length > 0 ? nextDestNodes : undefined
          };
        }

        case 'alfred.workflow.output.notification': {
          const nextDestNodes = this.getActionNodes(destNode);

          return {
            modifiers,
            type: 'notification',
            title: destNode.config.title,
            text: destNode.config.text,
            actions: nextDestNodes.length > 0 ? nextDestNodes : undefined
          };
        }

        case 'alfred.workflow.action.openfile': {
          const nextDestNodes = this.getActionNodes(destNode);
          let target = destNode.config.sourcefile;
          // If target is empty, replace it with '{query}'
          if (!target || target === '') {
            target = '{query}';
          }

          return {
            modifiers,
            type: 'open',
            target,
            actions: nextDestNodes.length > 0 ? nextDestNodes : undefined
          };
        }

        case 'alfred.workflow.action.openurl': {
          const nextDestNodes = this.getActionNodes(destNode);
          let target = destNode.config.url;
          // If target is empty, replace it with '{query}'
          if (!target || target === '') {
            target = '{query}';
          }

          return {
            modifiers,
            type: 'open',
            target,
            actions: nextDestNodes.length > 0 ? nextDestNodes : undefined
          };
        }

        case 'alfred.workflow.output.clipboard': {
          const nextDestNodes = this.getActionNodes(destNode);
          let target = destNode.config.clipboardtext;
          // If target is empty, replace it with '{query}'
          if (!target || target === '') {
            target = '{query}';
          }

          return {
            modifiers,
            type: 'clipboard',
            text: destNode.config.clipboardtext,
            actions: nextDestNodes.length > 0 ? nextDestNodes : undefined
          };
        }

        case 'alfred.workflow.utility.filter': {
          const thenNextDestNodes = this.getActionNodes(destNode);

          let conditionStmt = '';
          const cond = destNode.config;
          const arg = cond.inputstring === '' ? '{query}' : cond.inputstring;

          if (cond.matchmode === 0) {
            conditionStmt += `${arg} == "${cond.matchstring}"`;
          } else if (cond.matchmode === 1) {
            conditionStmt += `${arg} != "${cond.matchstring}"`;
          } else if (cond.matchmode === 2) {
            conditionStmt += `new RegExp("${cond.matchstring}").test(${arg})`;
          }

          return {
            modifiers,
            type: 'cond',
            if: {
              cond: conditionStmt,
              actions: {
                then: thenNextDestNodes
              }
            }
          };
        }

        case 'alfred.workflow.utility.conditional': {
          const thenNextDestNodes = this.getActionNodes(destNode, true);
          const elseNextDestNodes = this.getActionNodes(destNode, false);

          let conditionStmt = '';
          destNode.config.conditions.map((cond: any, idx: number) => {
            const arg = cond.inputstring === '' ? 'query' : cond.inputstring;

            // * About match mode
            // 0: true when match
            // 1: true when not match
            // 2: greater than
            // 3: lesser than
            // 4: regex match
            if (cond.matchmode === 0) {
              conditionStmt += `{${arg}} == "${cond.matchstring}"`;
            } else if (cond.matchmode === 1) {
              conditionStmt += `{${arg}} != "${cond.matchstring}"`;
            } else if (cond.matchmode === 2) {
              conditionStmt += `{${arg}} > "${cond.matchstring}"`;
            } else if (cond.matchmode === 3) {
              conditionStmt += `{${arg}} < "${cond.matchstring}"`;
            } else if (cond.matchmode === 4) {
              conditionStmt += `new RegExp("${cond.matchstring}").test({${arg}})`;
            }

            if (idx !== destNode.config.conditions.length - 1)
              conditionStmt += ' && ';
          });

          return {
            modifiers,
            type: 'cond',
            if: {
              cond: conditionStmt,
              actions: {
                then: thenNextDestNodes,
                else: elseNextDestNodes
              }
            }
          };
        }

        case 'alfred.workflow.utility.argument': {
          const nextDestNodes = this.getActionNodes(destNode);
          return {
            modifiers,
            type: 'args',
            arg: destNode.config.argument,
            actions: nextDestNodes
          };
        }

        case 'alfred.workflow.input.scriptfilter': {
          const nextDestNodes = this.getActionNodes(destNode);

          return {
            modifiers,
            command: destNode.config.keyword,
            title: destNode.config.title,
            type: 'scriptFilter',
            scriptFilter: destNode.config.script,
            runningSubtext: destNode.config.runningsubtext,
            withspace: destNode.config.withspace,
            actions: nextDestNodes
          };
        }

        case 'alfred.workflow.input.keyword': {
          const nextDestNodes = this.getActionNodes(destNode);

          return {
            modifiers,
            type: 'keyword',
            keyword: destNode.config.keyword,
            title: destNode.config.title,
            subtitle: destNode.config.subtext,
            actions: nextDestNodes
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
        error: notSupported()
      };
    }
  }
}
