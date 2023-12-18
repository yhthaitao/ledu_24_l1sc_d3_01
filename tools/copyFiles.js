const fs = require('fs-extra');
const path = require('path');

const srcDir = '23_zcd4_01';
const destDir = '23_zcd5_02a';

const coreDir = 'assets/23_zcd4_01/res/core';
const scriptsDir = 'assets/23_zcd4_01/scripts/Core';

const srcCoreDir = path.join(srcDir, coreDir);
const srcScriptsDir = path.join(srcDir, scriptsDir);

const destCoreDir = path.join(destDir, coreDir);
const destScriptsDir = path.join(destDir, scriptsDir);

// 删除目标文件夹
fs.removeSync(destDir);

// 拷贝文件夹
fs.copySync(srcCoreDir, destCoreDir);
fs.copySync(srcScriptsDir, destScriptsDir);

console.log('拷贝完成');