const fs = require('fs');
const path = require('path');
const curPath = __dirname;
const { minify } = require('uglify-js');

// 要压缩的 JavaScript 文件列表
const filesToCompress = [
  path.join(curPath, '../build-templates/web-mobile/game-msg.min.js'),
  path.join(curPath, '../preview-templates/game-msg.min.js'),
];

// 循环遍历文件列表
filesToCompress.forEach((file) => {
  console.log(`Compressing ${file}...`);

  // 读取文件内容
  const content = fs.readFileSync(file, 'utf8');

  // 压缩文件内容
  const compressedContent = minify(content).code;

  // 覆盖原始文件
  fs.writeFileSync(file, compressedContent, 'utf8');

  console.log(`${file} compressed and overwritten.`);
});
