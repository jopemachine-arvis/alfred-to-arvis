const plist = require('plist');
const fs = require('fs');
const fse = require('fs-extra');
const chalk = require('chalk');
const _ = require('lodash');
const ActionNodeFinder = require('./actionNodeFinder');
const { modifierMap, supportedInputFormat } = require('./constant');

const getInputObjects = nodeInfo => {
  let inputObjects = [];
  for (const format of supportedInputFormat) {
    inputObjects = [
      ...inputObjects,
      ..._.filter(nodeInfo, item => {
        return item.type === format;
      })
    ];
  }
  return inputObjects;
};

const convert = async (plistPath, flags) => {
  if (fs.existsSync(plistPath)) {
    const targetPlist = plist.parse(fs.readFileSync(plistPath, 'utf8'));
    const {
      bundleid: bundleId,
      category,
      createdby,
      description,
      name,
      readme,
      version,
      webaddress
    } = targetPlist;

    const result = {
      bundleId,
      category,
      createdby,
      description,
      name,
      readme,
      version,
      webaddress,
      commands: []
    };

    const graph = targetPlist.connections;
    const nodeInfo = targetPlist.objects;
    const actionNodeFinder = new ActionNodeFinder(graph, nodeInfo);
    const inputObjects = getInputObjects(nodeInfo);

    for (const inputObject of inputObjects) {
      const uid = inputObject.uid;
      const {
        // common
        text,
        title,
        subtext: subtitle,

        // hotkey
        hotmod,
        hotstring,

        // scriptfilter
        script_filter,
        running_subtext,
        withspace
      } = inputObject.config;

      let hotkey = hotmod;
      if (hotmod) {
        const modifiers = modifierMap[hotmod];
        if (hotstring) {
          hotkey = `${modifiers} + ${hotstring}`;
        }
      }

      const inputType = inputObject.type;
      const type = inputType.split('.')[inputType.split('.').length - 1];
      const keyword = inputObject.config.keyword;

      switch (inputType) {
        case 'alfred.workflow.trigger.hotkey': {
          break;
        }
        case 'alfred.workflow.input.keyword': {
          break;
        }

        case 'alfred.workflow.input.scriptfilter': {
          script_filter = inputObject.config.script;
          running_subtext = inputObject.config.runningsubtext;
          withspace = inputObject.config.withspace;
          break;
        }
      }

      if (graph[uid]) {
        const actionNodes = actionNodeFinder.getActionNodes(inputObject);

        result.commands.push({
          type,
          command: keyword,
          text,
          title,
          subtitle,
          script_filter,
          running_subtext,
          withspace,
          hotkey,
          action: actionNodes
        });
      } else {
        console.error(
          chalk.red(`'${uid}' doesn't have uid. plist seems to be not valid`)
        );
      }
    }

    await fse.writeJSON(`${bundleId}.json`, result, {
      encoding: 'utf-8',
      spaces: 2
    });

    console.log(chalk.greenBright(`Works done.. result: '${bundleId}.json'`));
  } else {
    console.error(chalk.red('plist file not found!'));
    return;
  }
};

module.exports = convert;
