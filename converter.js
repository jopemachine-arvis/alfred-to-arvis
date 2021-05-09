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

const convert = async (plistPath, outputPath) => {
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

    if (!bundleId) {
      throw new Error('bundleId is not set on info.plist, parsed plist: ', targetPlist);
    }

    const result = {
      // To do:: Replace it with url path
      $schema: 'some_schema_file_path',
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
        script,
        running_subtext,
        withspace
      } = inputObject.config;

      let hotkey = hotmod;
      if (hotmod) {
        const modifiers = modifierMap[hotmod];
        if (hotstring) {
          if (hotstring === 'double tap') {
            hotkey = `Double ${modifiers}`;
          } else {
            hotkey = `${modifiers} + ${hotstring}`;
          }
        }
      }

      // if hotkey is not set
      if (hotkey === 0) hotkey = undefined;

      const inputType = inputObject.type;
      const type = inputType.split('.')[inputType.split('.').length - 1];
      const keyword = inputObject.config.keyword;

      let appendNode = graph[uid];
      switch (inputType) {
        case 'alfred.workflow.trigger.hotkey': {
          appendNode = hotkey;
          break;
        }
        case 'alfred.workflow.input.keyword': {
          appendNode = keyword;
          break;
        }
        case 'alfred.workflow.input.scriptfilter': {
          appendNode = script;
          break;
        }
      }

      if (appendNode !== undefined) {
        const actionNodes = actionNodeFinder.getActionNodes(inputObject);

        result.commands.push({
          type,
          command: keyword,
          text,
          title,
          subtitle,
          script_filter: script,
          running_subtext,
          withspace,
          hotkey,
          action: actionNodes
        });
      } else {
        console.log(
          chalk.magentaBright(
            `Node '${uid}' (Type: '${type}') doesn't have expected word.`
          )
        );
      }
    }

    const out = outputPath ? outputPath : `${bundleId}.json`;

    await fse.writeJSON(out, result, {
      encoding: 'utf-8',
      spaces: 2
    });

    console.log(chalk.greenBright(`'${bundleId}' info.plist converting is done..`));
  } else {
    throw new Error(`plist file not found! given plist path: ${plistPath}`);
  }
};

module.exports = convert;
