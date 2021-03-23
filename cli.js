#!/usr/bin/env node
const meow = require('meow');
const converter = require('./converter');

const cli = meow(`
	Usage
	  $ wf-creator-plist-converter [input]

	Options

	Examples
	  $ 
`, {
	flags: {
	}
});

converter(cli.input[0], cli.flags);
