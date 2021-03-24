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

const notSupported = () => {
  return `Not supported`;
}

const modifierMap = {
  0: 'normal',
  131072: 'shift',
  262144: 'ctrl',
  524288: 'option',
  1048576: 'cmd',
  8388608: 'fn',
};

module.exports = {
  notSupported,
  modifierMap,
  supportedInputFormat,
  supportedActionFormat,
};