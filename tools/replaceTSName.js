/** 打包前给所有ts脚本文件名添加报名后缀 import也对应修改 */
const fs = require('fs');
const path = require('path');

var projectName = path.basename(path.join(__dirname, '..'));
// projectName = "23_l1sqd1_02";
const dir = path.join(__dirname, '../assets', projectName, projectName);
const nameMap = {};
const renamedFiles = [];
function traverse(dir) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    //判断file是否存在
    if (!fs.existsSync(path.join(dir, file))) {
      return;
    }
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      traverse(path.join(dir, file));
    } else {
      if (path.extname(file) === '.ts') {
        const oldTsName = file;
        const reg = new RegExp(`_${projectName}.ts`);
        let isOk = reg.test(oldTsName);
        if (!isOk) {
          const newTsName = file.replace(/\.ts$/, `_${projectName}.ts`);
          nameMap[oldTsName.replace(/\.ts$/, '')] = newTsName.replace(
            /\.ts$/,
            ''
          );
          fs.renameSync(path.join(dir, oldTsName), path.join(dir, newTsName));
          // 保存重命名后的文件名
          renamedFiles.push(path.join(dir, newTsName));
          // 处理 meta 文件
          const oldMetaName = oldTsName + '.meta';
          const newMetaName = newTsName + '.meta';
          fs.renameSync(
            path.join(dir, oldMetaName),
            path.join(dir, newMetaName)
          );
        }
      }
    }
  });
}

function updateContents() {
  renamedFiles.forEach((file) => {
    let contents = fs.readFileSync(file, 'utf8');
    // 获取所有导入语句
    const imports = contents.match(/from ['"][^'"]+['"];/g);

    if (!imports) {
      return;
    }
    imports.forEach((imp) => {
      // 提取文件名
      const importPath = imp.match(/from ['"]([^'"]+)['"]/)[1];
      const fileName = path.basename(importPath);
      // 检查是否需要替换
      if (nameMap[fileName]) {
        const newFileName = nameMap[fileName];
        /**替换最后一个 */
        let regex = new RegExp(fileName + "(?!.*" + fileName + ")");
        let newImp = imp.replace(regex, newFileName);
        // 替换内容中的导入语句
        contents = contents.replace(imp, newImp);
      }
    });
    fs.writeFileSync(file, contents);
  });
}

function main() {
  traverse(dir);
  updateContents();
}
// main();
module.exports = {
  main,
};
