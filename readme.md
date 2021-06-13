# alfred-to-arvis

> Help you convert Alfred workflow's `info.plist` to `arvis-workflow.json` of [Arvis](https://github.com/jopemachine/arvis)

## Precaution

* Alfred's `info.plist` is not an open format, so it can be changed at any time.

* This means some parts of this package may not work as per Alfred's update.

* Not all items are supported for conversion. Check [here](./constant.ts) to find out which items will be converted.

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
