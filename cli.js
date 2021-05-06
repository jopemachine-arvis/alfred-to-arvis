#!/usr/bin/env node
const meow = require('meow');
const converter = require('./converter');

const cli = meow(
  `
	Usage
	  $ wf-creator-plist-converter [info.plist file]

	Examples
	  $ wf-creator-plist-converter info.plist
`,
  {
    flags: {}
  }
);

converter(cli.input[0], cli.flags);
