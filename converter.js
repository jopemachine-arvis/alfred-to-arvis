const plist = require('plist');
const fs = require('fs');
const fse = require('fs-extra');
const _ = require('lodash');

const supportedInputFormat = [
  "alfred.workflow.input.keyword", 
  "alfred.workflow.input.scriptfilter",
];

const supportedActionFormat = [
  "alfred.workflow.action.script",
  "alfred.workflow.action.openurl",
];

const convert = async (plistPath, flags) => {
  if (fs.existsSync(plistPath)) {
    const targetPlist = plist.parse(fs.readFileSync(plistPath, "utf8"));
    const {
      bundleid: bundleId,
      category,
      createdby,
      description,
      name,
      readme,
      version,
      webaddress,
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

    const keywords = _.filter(nodeInfo, item => item.type === 'alfred.workflow.input.keyword');
    const scriptFilters = _.filter(nodeInfo, item => item.type === 'alfred.workflow.input.scriptfilter');
    const inputObjects = [...keywords, ...scriptFilters];

    for (const inputObject of inputObjects) {
      const uid = inputObject.uid;
      if (graph[uid]) {
        // To do :: fix hack by using loop
        const destUid = graph[uid][0].destinationuid;

        // not hack
        const destNode = _.filter(nodeInfo, item => item.uid === destUid)[0];

        if (supportedActionFormat.includes(destNode.type)) {
          const {
            text: title,
            subtext: subtitle,
          } = inputObject.config;

          const inputType = inputObject.type;
          const keyword = inputObject.keyword;

          switch (destNode.type) {
            case 'alfred.workflow.action.script':
              result.commands.push({
                title,
                subtitle,
                type: inputType.split('alfred.workflow.input.')[1],
                action: {
                  type: "script",
                  script: destNode.config.script,
                },
                command: keyword
              });
              break;
            case 'alfred.workflow.action.openurl':
              result.commands.push({
                title,
                subtitle,
                type: inputType.split('alfred.workflow.input.')[1],
                action: {
                  type: "open",
                  url: destNode.config.url,
                },
                command: keyword
              });
              break;
            default:
              console.error(`${destNode.type} type not supported`);
              break;
          }
        } else {
          console.error(`'${destNode.type}' type is not supported.`);
        }
      } else {
        console.error(`'${uid}' doesn't have uid`);
      }
    }

    await fse.writeJSON(`${name}.json`, result, {
      encoding: 'utf-8',
      spaces: 2
    });

  } else {
    console.error("plist file not found!");
    return;
  }
};

module.exports = convert;