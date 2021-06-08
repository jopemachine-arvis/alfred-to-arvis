import plist from 'plist';
import fs from 'fs';
import fse from 'fs-extra';
import chalk from 'chalk';
import _ from 'lodash';
import ActionNodeFinder from './actionNodeFinder';
import { modifierMap, supportedInputFormat } from './constant';
import path from 'path';

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
  const pathArr = plistPath.split(path.sep);
  pathArr.pop();
  const plistDirPath = pathArr.join(path.sep);

  let defaultIcon;
  if (fse.existsSync(`${plistDirPath}${path.sep}icon.png`)) {
    defaultIcon = 'icon.png';
  }

  if (fs.existsSync(plistPath)) {
    const targetPlist: any = plist.parse(fs.readFileSync(plistPath, 'utf8'));
    const {
      bundleid,
      category,
      createdby,
      description,
      name,
      readme,
      version,
      webaddress
    } = targetPlist;

    let bundleId;
    if (!name || !createdby) {
      console.error(
        chalk.redBright(
          'There is missing name or createdby. Please make sure to fill this before creating workflow'
        )
      );
    }

    if (name && createdby) {
      bundleId = `@${createdby}.${name}`;
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
      $schema: 'https://github.com/jopemachine/arvis-core/blob/master/workflow-schema.json',
      defaultIcon,
      category,
      createdby,
      description,
      name,
      readme,
      version,
      webaddress,
      enabled: true,
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

    const out = outputPath ? outputPath : `arvis-workflow.json`;

    await fse.writeJSON(out, result, {
      encoding: 'utf-8',
      spaces: 2
    });

    console.log(chalk.greenBright(`'${bundleId}' info.plist converting is done..`));
  } else {
    throw new Error(`plist file not found! given plist path: ${plistPath}`);
  }
};

export default convert;
