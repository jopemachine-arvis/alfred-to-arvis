const plist = require('plist');
const fs = require('fs');
const fse = require('fs-extra');
const chalk = require('chalk');
const _ = require('lodash');
const ActionNodeFinder = require('./actionNodeFinder');
const { modifierMap, supportedInputFormat } = require('./constant');
const path = require('path');

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

const convertHotkey = (hotmod, hotstring) => {
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
  return hotkey;
};

const convertArgumentType = (argumenttype) => {
  if (argumenttype === 0) {
    return 'required';
  }
  if (argumenttype === 1) {
    return 'optional';
  }
  if (argumenttype === 2) {
    return 'no';
  }
}

const convert = async (plistPath, outputPath) => {
  const pathArr = plistPath.split(path.sep);
  pathArr.pop();
  const plistDirPath = pathArr.join(path.sep);

  let defaultIcon;
  if (fse.existsSync(`${plistDirPath}${path.sep}icon.png`)) {
    defaultIcon = 'icon.png';
  }

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
      $schema: 'https://github.com/jopemachine/arvis-core/blob/master/workflow-schema.json',
      defaultIcon,
      bundleId,
      category,
      createdby,
      description,
      name,
      readme,
      version,
      webaddress,
      enabled: true,
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
        withspace,
        argumenttype,
        runningsubtext: running_subtext,
      } = inputObject.config;

      const hotkey = convertHotkey(hotmod, hotstring);
      const arg_type = convertArgumentType(argumenttype);
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
          appendNode = script && keyword && keyword !== '';
          break;
        }
      }

      if (appendNode) {
        const actionNodes = actionNodeFinder.getActionNodes(inputObject);

        result.commands.push({
          type,
          command: keyword,
          title: title || text,
          subtitle,
          script_filter: script,
          running_subtext,
          withspace,
          hotkey,
          arg_type,
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
