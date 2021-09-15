import plist from 'plist';
import fs from 'fs';
import fse from 'fs-extra';
import chalk from 'chalk';
import _ from 'lodash';
import ActionNodeFinder from './actionNodeFinder';
import { removeRunNode } from './util';
import { modifierMap, supportedInputFormat } from './constant';

const getInputObjects = (nodeInfo: any) => {
  let inputObjects: any[] = [];
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

const convertHotkey = (hotmod: any, hotstring: string) => {
  let hotkey = hotmod;
  if (hotmod) {
    const modifiers = (modifierMap as any)[hotmod];
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

const convertArgumentType = (argumenttype: any) => {
  if (argumenttype === 0) {
    return 'required';
  }
  if (argumenttype === 1) {
    return 'optional';
  }
  if (argumenttype === 2) {
    return 'no';
  }

  console.error('argumenttype in not proper!');
  return 'optional';
}

const convert = async (plistPath: string, outputPath?: string) => {
  if (fs.existsSync(plistPath)) {
    const targetPlist: any = plist.parse(fs.readFileSync(plistPath, 'utf8'));
    const {
      bundleid,
      category,
      createdby: creator,
      description,
      name,
      readme,
      version,
      webaddress: webAddress,
      variables
    } = targetPlist;

    let bundleId;
    if (!name || !creator) {
      console.error(
        chalk.redBright(
          'There is missing "name" or "creator". Please make sure to fill this before creating workflow'
        )
      );
    }

    if (name && creator) {
      bundleId = `@${creator}.${name}`;
    } else if (name) {
      bundleId = `@unknown.${name}`;
    } else if (bundleid) {
      bundleId = bundleid;
    } else {
      throw new Error(
        'Required attributes are not set on info.plist, parsed plist: ' +
          targetPlist
      );
    }

    const result = {
      $schema: 'https://raw.githubusercontent.com/jopemachine/arvis-extension-validator/master/workflow-schema.json',
      defaultIcon: 'icon.png',
      category,
      creator,
      description,
      name,
      readme,
      version,
      webAddress,
      enabled: true,
      variables,
      commands: [] as any[]
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
        runningsubtext: runningSubtext,
      } = inputObject.config;

      const hotkey = convertHotkey(hotmod, hotstring);
      const argType = convertArgumentType(argumenttype);
      const inputType = inputObject.type;
      let type = inputType.split('.')[inputType.split('.').length - 1];
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
          type = 'scriptFilter';
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
          scriptFilter: removeRunNode(script),
          runningSubtext,
          withspace,
          hotkey,
          argType,
          actions: actionNodes
        });
      } else {
        console.log(
          chalk.magentaBright(
            `Node '${uid}' (Type: '${type}') doesn't have expected word.`
          )
        );
      }
    }

    const out = outputPath ? outputPath : `arvis-workflow.json`;

    await fse.writeJSON(out, result, {
      encoding: 'utf-8',
      spaces: 2
    });

    console.log(chalk.white(`${chalk.greenBright('✔')} '${bundleId}' info.plist converting is done..`));
  } else {
    throw new Error(`plist file not found! given plist path: ${plistPath}`);
  }
};

export default convert;
