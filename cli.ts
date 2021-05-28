#!/usr/bin/env node
import meow from 'meow';
import converter from './converter';

const cli = meow(
  `
	Usage
	  $ arvis-plist-converter [alfred workflow's "info.plist" file]

	Examples
	  $ arvis-plist-converter info.plist
`
);

if (cli.input.length === 1) {
  converter(cli.input[0]);
} else if (cli.input.length > 1) {
  converter(cli.input[0], cli.input[1]);
}
