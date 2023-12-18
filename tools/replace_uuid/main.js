// let uuid = UuidUtils.compressUuid('c9c49036-49ca-4334-a4bc-5916d0b107f5', false);
// console.log('测试1:' + uuid + '   ' + uuid.length)
// console.log('测试2:' + UuidUtils.decompressUuid('7335dmDEXxK3o/eMFR9rlyM'))
// console.log('测试3:' + UuidUtils.uuidv1())
// console.log('测试4:' + UuidUtils.isUuid('e5GCSOfC9HiKxCodlqmxZ1'))

/**
 * meta 文件uuid 规则
 * "uuid": "156f93eb-ef91-49a7-baa9-a2481720af3f",
 * "rawTextureUuid": "156f93eb-ef91-49a7-baa9-a2481720af3f",
 * "textureUuid": "36a06f42-7f9f-4bc2-8ec7-0bab9774b86b",
 * "subMetas": {"num_1-2ren_out-11.png": {"rawTextureUuid": "1afa63e7-ba6f-42c5-9410-7e9260f3a922",
 *
 *
 */
let file = require('./util/file');
const path = require('path');
const projectPath = path.join(__dirname, '..', '..');
var projectName = path.basename(projectPath);
console.log('1---' + projectPath);
var subGamePath = path.join(projectPath, 'assets', `${projectName}`);
// var subGamePath = path.join(projectPath, 'assets');
console.log('2---' + subGamePath);
async function main() {
  file.createUUIDlist(subGamePath);
  file.replaceUUID(subGamePath);
}
// main();
module.exports = {
    main
}
