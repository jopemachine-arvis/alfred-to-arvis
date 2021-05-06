#!/usr/bin/env node
const meow = require('meow');
const converter = require('./converter');

const cli = meow(
  `
	Change the info.plist file format of Alfred workflow to the config file of the wf-creator and write it.

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
