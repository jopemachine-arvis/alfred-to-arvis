# alfred-to-arvis
[![CodeFactor](https://www.codefactor.io/repository/github/jopemachine/alfred-to-arvis/badge)](https://www.codefactor.io/repository/github/jopemachine/alfred-to-arvis)
[![NPM download total](https://img.shields.io/npm/dt/alfred-to-arvis)](http://badge.fury.io/js/alfred-to-arvis)
[![NPM version](https://badge.fury.io/js/alfred-to-arvis.svg)](http://badge.fury.io/js/alfred-to-arvis)
[![MIT license](https://img.shields.io/badge/License-MIT-blue.svg)](https://lbesson.mit-license.org/)
[![PR's Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat)](http://makeapullrequest.com)
[![GitHub issues](https://img.shields.io/github/issues/jopemachine/alfred-to-arvis.svg)](https://GitHub.com/jopemachine/alfred-to-arvis/issues/)

> Help you convert Alfred workflow's `info.plist` to `arvis-workflow.json` of [Arvis](https://github.com/jopemachine/arvis)

## Precaution

* Alfred's `info.plist` is not an open format, so it can be changed at any time.

* This means some parts of this package may not work as per Alfred's update.

* Not all type's items are supported for conversion. Check [here](./constant.ts) to find out which items will be converted.

* Unsupported types are displayed in console, json both if there are

## Getting started

### Install

```
$ npm i -g alfred-to-arvis
```

### Usage

```
$ alfred-to-arvis [alfred workflow's "info.plist" file]
```

### Build and development

```
$ npm i && npm run build
```
