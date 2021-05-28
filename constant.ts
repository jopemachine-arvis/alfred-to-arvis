const supportedInputFormat = [
  'alfred.workflow.trigger.hotkey',
  'alfred.workflow.input.keyword',
  'alfred.workflow.input.scriptfilter'
];

const supportedActionFormat = [
  'alfred.workflow.output.notification',
  'alfred.workflow.action.openfile',
  'alfred.workflow.action.script',
  'alfred.workflow.action.openurl',
  'alfred.workflow.output.clipboard',
  'alfred.workflow.utility.conditional',
  'alfred.workflow.utility.argument',
  'alfred.workflow.input.scriptfilter',
  'alfred.workflow.input.keyword'
];

const notSupported = () => {
  return `Not supported`;
};

// To do:: The current method cannot handle more than two modifiers being pressed at the same time
const modifierMap = {
  0: 'normal',
  131072: 'shift',
  262144: 'ctrl',
  524288: 'option',
  1048576: 'cmd',
  8388608: 'fn'
};

export {
  notSupported,
  modifierMap,
  supportedActionFormat,
  supportedInputFormat
}

