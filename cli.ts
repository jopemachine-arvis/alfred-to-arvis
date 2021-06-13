#!/usr/bin/env node
import meow from 'meow';
import converter from './converter';

const cli = meow(
  `
	Usage
	  $ alfred-to-arvis [alfred workflow's "info.plist" file]

	Examples
	  $ alfred-to-arvis info.plist
`
);

if (cli.input.length === 1) {
  converter(cli.input[0]);
} else if (cli.input.length > 1) {
  converter(cli.input[0], cli.input[1]);
}
