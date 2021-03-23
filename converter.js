const plist = require('plist');
const fse = require('fs-extra');

const convert = async (plistPath, flags) => {
  if (fs.existsSync(plistPath)) {
    const targetPlist = plist.parse(fs.readFileSync(plistPath, "utf8"));
    const {
      bundleId,
      category,
      createdby,
      description,
      name,
      readme,
      version,
      webaddress,
    } = targetPlist;

    const graph = targetPlist.connections;

    await fse.writeJSON(`${name}.json`, {});
  } else {
    console.error("plist file not found!");
    return;
  }
};

module.exports = convert;