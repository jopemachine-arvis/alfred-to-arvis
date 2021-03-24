const supportedInputFormat = [
  "alfred.workflow.input.keyword",
  "alfred.workflow.input.scriptfilter",
];

const supportedActionFormat = [
  "alfred.workflow.action.script",
  "alfred.workflow.action.openurl",
  "alfred.workflow.output.clipboard",
  "alfred.workflow.utility.conditional",
  "alfred.workflow.utility.argument",
  "alfred.workflow.input.scriptfilter",
];

const notSupported = (type) => {
  return `"${type}" not supported`;
}

module.exports = {
  notSupported,
  supportedInputFormat,
  supportedActionFormat,
};