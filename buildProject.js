'use strict';
const fs = require('fs');
const path = require('path');
const child_process = require('child_process');
const https = require('https');
const crypto = require('crypto');
const { URL } = require('url');
const zipper = require('zip-local');
const replaceUUID = require('./tools/replace_uuid/main.js');
const replaceTSName = require('./tools/replaceTSName.js');
const arg = process.argv[2];
const buildTest =
  '-t' === arg || '-T' === arg || '-test' === arg || '-TEST' === arg; // 打测试包
/**是否要打完包自动提交推送 */
const autoPush = '-p' === arg || '-P' === arg || '-push' === arg || '-PUSH' === arg;
const curPath = __dirname;
var projectName = path.basename(curPath);
/**
 * 打包的zip名称，打测试包需要上线的话 为了避免包名重复，可以修改这个配置打包
 * 正常打包projectZipName和projectName需要一样
 * */
var projectZipName = projectName;
// projectZipName = projectName + '_test';
var buildCfgJson = path.join(
  curPath,
  'build_cfg.json'
);
/**打包的游戏版本 新包版本默认1.0.0 */
var gameVersion = '1.0.0';
const openDir = process.platform === 'darwin' ? 'open' : 'start';

const coverPath = path.join(curPath, 'assets', projectName, 'cover.jpg');
const cocosVer = '2.4.11';
const sceneFile = path.join(curPath, 'assets/scene');
const mainConstValueFile = 'assets/scripts/Data/MainConstValue.ts';
const subGameAudioPath = path.join(curPath, 'assets', projectName, projectName, 'res/audios');
const subGameConstValueFile = path.join(
  'assets',
  projectName,
  projectName,
  'scripts',
  'Data',
  'ConstValue.ts'
);
let enginePath = '';
if ('darwin' === process.platform) {
  enginePath = `/Applications/Cocos/Creator/${cocosVer}/CocosCreator.app/Contents/MacOS/CocosCreator`;
} else {
  enginePath = `D:/CocosDashboard/resources/.editors/Creator/${cocosVer}/CocosCreator.exe`;
}

const gameCfgFile = 'build-templates/web-mobile/game_cfg.json';

const resFilePaths = {
  teacherPanelFile: {
    name: 'TeacherPanel',
    type: '.prefab',
    path: `assets/${projectName}/${projectName}/res/prefab/ui/panel`,
  },
};

const options = {
  method: 'POST',
  hostname: 'tinypng.com',
  path: '/web/shrink',
  headers: {
    rejectUnauthorized: false,
    'Postman-Token': Date.now(),
    'Cache-Control': 'no-cache',
    'Content-Type': 'application/x-www-form-urlencoded',
    'User-Agent':
      'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36',
  },
};

async function main() {
  if (buildTest) {
    projectZipName = projectName + '_test';
  }
  await checkEnginePath();
  //检测assets目录下的组件文件是否符合命名规范
  checkAssetsDir(path.join('assets', projectName));
  await checkBuildCfgJson();
  upgradeVersion();
  /**修改音频为WebAudio */
  updateAudioModel();
  //把本地工作副本的提交到本地仓库
  await checkGitStatus();
  //替换uuid
  replaceUUID.main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
  //替换ts文件名和引用
  replaceTSName.main();
  //检测是否有预览图
  await checkCover();
  setGameName();
  await build();
  console.log('********** 打包完成 **********');
  // await openBuildDir();
  // 清空git本地工作副本
  child_process.execSync('git reset --hard');
  child_process.execSync('git clean -df');
  if(autoPush){
    updateGitFromJson(buildCfgJson);
  }else{
    await openBuildDir();
    let isContinue = true, inputStr;
    while (isContinue) {
      inputStr = await inputConfirm(`是否自动上传zip包？Y/N (默认不上传)`, 'N');
      console.log('inputStr: ',inputStr);
      if (inputStr == 'y' || inputStr == 'Y') {
        child_process.execSync('git push');
        updateGitFromJson(buildCfgJson);
      }else{
        console.log("您没有选择自动上传zip包,如果需要上传,请手动推送代码并手动上传zip!!!");
        process.exit(0);
      }
    }
  }
}

async function checkEnginePath(){
  let isErr = false;
  // 定义文件路径
  let filePath = path.join(__dirname, `../build-cfg/engine-path/${cocosVer}.json`);
  if(!fs.existsSync(enginePath)) {
    isErr = true;
    // 检查文件是否存在，不存在则创建
    if(fs.existsSync(filePath)) {
        // 如果文件存在，则读取enginePath
      let fileData = JSON.parse(fs.readFileSync(filePath));
      if(fs.existsSync(fileData.enginePath)){
        enginePath = fileData.enginePath
        console.log(`Engine Path: ${fileData.enginePath}`);
        isErr = false;
      }
    }
  }
  if(isErr){
    // 创建目录，包括任何必要的父目录（类似于'mkdir -p'）
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    console.log("引擎路径不正确");
    let isContinue = true;
    let ePath = '';
    while (isContinue) {
      ePath = await inputConfirm(`请输入引擎路径 `, '');
      if (!fs.existsSync(ePath)) {
        console.log('路径不正确!');
      }else{
        isContinue = false;
        console.log("输入路径检测通过",ePath)
      }
    }
    console.log("跳出循环",enginePath)
    if(!isContinue){
      // 写入新路径到文件中
      let dataToWrite = {
        enginePath: ePath
      };
      enginePath = ePath;
      fs.writeFileSync(filePath, JSON.stringify(dataToWrite)); 
      console.log("写入成功",enginePath)
    }
  }
}

/**检测buildCfg.json */
async function checkBuildCfgJson() {
  let gitPath = '', commitMsg = '';
  if (fs.existsSync(buildCfgJson)) {
    const config = JSON.parse(fs.readFileSync(buildCfgJson));
    gitPath = config.gitPath;
    commitMsg = config.commitMsg;
    if (fs.existsSync(gitPath) && path.basename(gitPath) == 'gameZip') {
      return;
    }else {
      console.log('ZIP包上传路径不正确!');
    }
  }
  let isContinue = true;
  while (isContinue) {
    gitPath = await inputConfirm(`请输入zip包上传地址（到gameZip文件夹）: `, '');
    if (!fs.existsSync(gitPath) || path.basename(gitPath) !== 'gameZip') {
      console.log('路径不正确!');
    }else{
      isContinue = false;
    }
  }
  isContinue = true;
  while (isContinue) {
    commitMsg = await inputConfirm(`请输入提交信息: `, '');
    isContinue = false;
  }
  fs.writeFileSync(buildCfgJson, JSON.stringify({"gitPath": gitPath, "commitMsg": commitMsg}, null, 2), 'utf8');
}

function inputConfirm(txt, defaultValue) {
  return new Promise((resolve, reject) => {
      process.stdout.write('\n' + txt);
      process.stdin.on('data', input => {
          input = input.toString().trim();
          resolve(input || defaultValue);
      });
  });
}

/**矫正audioModel */
function updateAudioModel() {
  // 遍历目录
  let walkDir = (dir, callback) => {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ?
            walkDir(dirPath, callback) :
            callback(path.join(dir, f));
    });
  };

  // 检查并修改文件
  walkDir(subGameAudioPath, function(filePath) { //更换为你需要遍历的目录路径
    if (filePath.endsWith('.mp3.meta') || filePath.endsWith('.wav.meta')) {
        let data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (data.downloadMode === 1) {
            data.downloadMode = 0;
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
            console.log(`矫正声音加载方式: ${filePath}`);
        }
    }
  });
}

/**
 * 升级版本号
 * 每次打包自增
 */
function upgradeVersion() {
  var scriptPath, script, searchField, defaultValue;
  if(projectName == 'maingame_cocos'){
    scriptPath = path.join(curPath, mainConstValueFile);
    script = fs.readFileSync(scriptPath, 'utf8');
    searchField = 'MainGameVer';
    defaultValue = `    public static readonly MainGameVer = "${gameVersion}"; //主包的版本  主包每次打包自增`;
  }else{
    scriptPath = path.join(curPath, subGameConstValueFile);
    script = fs.readFileSync(scriptPath, 'utf8');
    searchField = 'SubGameVer';
    defaultValue = `    public static readonly SubGameVer = "${gameVersion}"; //子包的版本 每次打包自增`;
  }
  let lines = script.split('\n');
  let index = lines.findIndex(line => line.includes(searchField));

  if (index === -1) {
    const readonlyIndex = lines.findIndex(line => line.includes('public static readonly'));
    if (readonlyIndex !== -1) {
      lines.splice(readonlyIndex, 0, defaultValue);
    }
  } else {
    const versionIndex = lines.findIndex(line => line.includes(searchField));
    const versionLine = lines[versionIndex];
    const currentVersion = extractVersionFromLine(versionLine);
    const newVersion = incrementVersion(currentVersion);
    gameVersion = newVersion;
    // 构建新的替换行
    const newVersionLine = versionLine.replace(currentVersion, newVersion);
    lines[versionIndex] = newVersionLine;
  }
  script = lines.join('\n');
  fs.writeFileSync(scriptPath, script);

  function incrementVersion(version) {
    const parts = version.split('.');
    const lastPart = parts[parts.length - 1];
    parts[parts.length - 1] = (parseInt(lastPart) + 1).toString();
    return parts.join('.');
  }

  function extractVersionFromLine(line) {
    const regex = new RegExp(`${searchField}\\s*=\\s*"(.*?)"`);
    const match = line.match(regex);
    if (match && match[1]) {
      return match[1];
    }
    return '';
  }
}

function checkAssetsDir(dir) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const absPath = path.join(dir, file);
    const stats = fs.statSync(absPath);

    if (stats.isDirectory()) {
      // 递归遍历子目录
      checkAssetsDir(absPath);
    } else {
      // 检查文件后缀
      if (/\.ts$/.test(file)) {
        checkTsClassName(absPath);
        // checkTsFileName(absPath);
      }
    }
  });
}

function checkTsFileName(tsFilePath) {
  let fileName = path.basename(tsFilePath, '.ts');

  if (!fileName.endsWith(`_${projectName}`)) {
    console.error(`文件名 ${fileName} 不符合要求!`);
    process.exit(1);
  }
}

function checkGitStatus() {
  return new Promise((resolve, reject) => {
    child_process.exec('git status --porcelain', (err, stdout) => {
      if (err) {
        console.error(err);
        console.error('git status 命令执行失败');
        process.exit(1);
      } else {
        if (stdout.trim()) {
          //git命令
          let gitCommand = `git add . && git commit -am "打包提交${gameVersion}"`;
          if(autoPush){
            gitCommand += ' && git push';
          }
          child_process.exec(
            gitCommand,
            (err) => {
              if (!err) resolve();
              else {
                console.error(err);
                console.error('git commit 命令执行失败');
                process.exit(1);
              }
            }
          );
        } else {
          resolve();
        }
      }
    });
  });
}

function checkTsClassName(tsFilePath) {
  const content = fs.readFileSync(tsFilePath, 'utf8');
  const regexp =
    /(@ccclass\s+)(export(\s+default)?\s+)?(abstract\s+)?(class|interface)\s+(\w+)(\s*.*\s*{)/g;
  let className;
  while ((className = regexp.exec(content)) != null) {
    className = className[6];
    if (!className.endsWith(`_${projectName}`)) {
      console.error(`类名 ${className} 不符合要求`);
      process.exit(1);
    }
  }
}

// 执行命令
function runExec(command, needExit = true, options = { cwd: curPath }) {
  return new Promise((resolve, reject) => {
    console.log('cmd: ', command);
    let workerProcess = child_process.exec(
      command,
      options,
      (error, stdout, stderr) => {
        if (!error) {
          // console.log('成功', stdout);
          return resolve(stdout);
        } else {
          console.log('失败:::', command, error, stdout, stderr);
          if (needExit) process.exit(-1);
          else return resolve(null);
        }
      }
    );

    workerProcess.stdout.on('data', function (data) {
      // console.log('stdout: ' + data);
    });

    workerProcess.stderr.on('data', function (data) {
      // console.log('stderr: ' + data);
    });
  });
}

function setGameName() {
  const gameCfgPath = path.join(curPath, gameCfgFile);
  let gameCfgScript = fs.readFileSync(gameCfgPath, 'utf8');
  let gameCfgData = JSON.parse(gameCfgScript);
  gameCfgData.gameName = projectName;
  fs.writeFileSync(gameCfgPath, JSON.stringify(gameCfgData));
}

/**
 * 检测是否有预览图
 */
async function checkCover() {
  console.log(coverPath);
  // 检测是否存在预览图
  if (!fs.existsSync(coverPath)) {
    console.log('未找到预览图！请将预览图命名为cover.jpg，放在项目根目录下。');
    process.exit(-1);
  }

  let states = fs.statSync(coverPath);
  if (states.size > 200 * 1024) {
    // 预览图超过200KB则进行压缩
    // 将预览图进行压缩
    // await compressImage(coverPath);
    console.log('预览图压缩完成!');
  }
}

/**
 * 打包
 */
async function build() {
  // 先删除旧包
  const buildPath = path.join(curPath, 'build');
  if (fs.existsSync(buildPath)) {
    rmDirAndFiles(buildPath);
  }
  //学生端不需要teacherPanel，打包前移走
  moveUselessFile(true, resFilePaths.teacherPanelFile);
  // 打包学生端
  await buildByRore(false);
  //打完学生包再移回来
  moveUselessFile(false, resFilePaths.teacherPanelFile);
  // 打包教师端
  await buildByRore(true);
  // 压缩
  await compressZip();
}

async function openBuildDir() {
  const buildPath = path.join(curPath, 'build');
  const command = `${openDir} ${buildPath}`;
  await runExec(command);
}

/**
 * 根据角色打包
 * @param {boolean} isTeacher 是否是老师
 */
async function buildByRore(isTeacher) {
  modifyScript(isTeacher); // 修改配置文件
  await buildWebMobile(isTeacher);
}

/**
 * 压缩图片
 */
async function compressImage(img) {
  if (!img) return;
  let obj = await fileUpload(img);
  await fileUpdate(img, obj);
}

// 压缩图片
async function fileUpload(img) {
  return new Promise((resolve, reject) => {
    var req = https.request(options, function (res) {
      res.on('data', (buf) => {
        let obj = JSON.parse(buf.toString());
        if (obj.error) {
          reject(`[${img}]：压缩失败！报错：${obj.message}`);
        } else {
          resolve(obj);
        }
      });
    });

    req.write(fs.readFileSync(img), 'binary');
    req.on('error', (e) => {
      reject(e);
    });
    req.end();
  });
}

// 获取压缩后的图片
async function fileUpdate(imgpath, obj) {
  return new Promise((resolve, reject) => {
    let options = new URL(obj.output.url);
    let req = https.request(options, (res) => {
      let body = '';
      res.setEncoding('binary');
      res.on('data', function (data) {
        body += data;
      });

      res.on('end', function () {
        fs.writeFile(imgpath, body, 'binary', (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    });
    req.on('error', (e) => {
      console.error(e);
      reject(e);
    });
    req.end();
  });
}

function moveUselessFile(isMove, fileCfg) {
  let oldFilePath = path.join(
    curPath,
    fileCfg.path,
    `${fileCfg.name}${fileCfg.type}`
  );
  let oldFileMetaPath = path.join(
    curPath,
    fileCfg.path,
    `${fileCfg.name}${fileCfg.type}.meta`
  );

  let newFilePath = path.join(curPath, `${fileCfg.name}${fileCfg.type}`);
  let newFileMetaPath = path.join(
    curPath,
    `${fileCfg.name}${fileCfg.type}.meta`
  );
  if (isMove) {
    if (!oldFilePath || !oldFileMetaPath) {
      return;
    }
    fs.renameSync(oldFilePath, newFilePath);
    fs.renameSync(oldFileMetaPath, newFileMetaPath);
  } else {
    if (!newFilePath || !newFileMetaPath) {
      return;
    }
    fs.renameSync(newFilePath, oldFilePath);
    fs.renameSync(newFileMetaPath, oldFileMetaPath);
  }
}

/**
 * 修改配置文件
 * @param {boolean} isTeacher 是否是老师
 */
function modifyScript(isTeacher) {
  // 修改 ConstValue.ts
  const scriptPath = path.join(curPath, mainConstValueFile);
  let script = fs.readFileSync(scriptPath, 'utf8');

  script = script.replace('IS_EDITIONS = false', 'IS_EDITIONS = true');
  if (isTeacher) {
    script = script.replace('IS_TEACHER = false', 'IS_TEACHER = true');
  } else {
    script = script.replace('IS_TEACHER = true', 'IS_TEACHER = false');
  }
  fs.writeFileSync(scriptPath, script);

  // 修改 builder.json
  const builderPath = path.join(curPath, 'settings/builder.json');
  if (fs.existsSync(builderPath)) {
    let builderScript = fs.readFileSync(builderPath, 'utf8');
    let builderData = JSON.parse(builderScript);
    builderData.excludeScenes = [];
    fs.writeFileSync(builderPath, JSON.stringify(builderData));
  }
}

// 删除文件夹及文件夹内所有文件
function rmDirAndFiles(rmPath) {
  if (fs.existsSync(rmPath)) {
    if (fs.statSync(rmPath).isDirectory()) {
      let files = fs.readdirSync(rmPath);
      files.forEach((file) => {
        let curPath = path.join(rmPath, file);
        if (fs.statSync(curPath).isDirectory()) {
          rmDirAndFiles(curPath);
        } else {
          fs.unlinkSync(curPath);
        }
      });
    }
    rmOneFile(rmPath);
  }
}

// 删除单一文件夹或文件
function rmOneFile(rmPath) {
  if (fs.existsSync(rmPath)) {
    if (fs.statSync(rmPath).isDirectory()) {
      fs.rmdirSync(rmPath);
    } else {
      fs.unlinkSync(rmPath);
    }
  }
}

// 复制文件到指定目录
function copyFile(sourcePath, targetPath) {
  if (fs.statSync(sourcePath).isDirectory()) {
    if (!fs.existsSync(targetPath)) {
      fs.mkdirSync(targetPath);
    }
  } else {
    fs.copyFileSync(sourcePath, targetPath);
  }
}

async function buildWebMobile(isTeacher) {
  console.log('构建 ...', isTeacher ? '教师端' : '学生端');

  const buildPath = path.join(curPath, 'build');
  const startScene = isTeacher
    ? path.join(sceneFile, 'Teacher.fire')
    : path.join(sceneFile, 'Student.fire');
  const startSceneUuid = getSceneUUid(startScene);

  const params = `--path ${curPath} --build "platform=web-mobile;debug=false;md5Cache=false;buildPath=${buildPath};startScene=${startSceneUuid}"`;
  const command = `${enginePath} ${params}`;
  await runExec(command);

  const baseName = path.join(buildPath, 'web-mobile');
  const outputName = isTeacher
    ? path.join(buildPath, 'teacher')
    : path.join(buildPath, 'student');
  fs.renameSync(baseName, outputName);
  copyFile(coverPath, path.join(outputName, 'cover.jpg'));

  console.log(isTeacher ? '教师端' : '学生端', '构建完成');
}

async function compressZip() {
  let zipName = projectZipName;
  const buildPath = path.join(curPath, 'build');
  var projectNamePath = path.join(buildPath, zipName);

  if (fs.existsSync(projectNamePath)) {
    rmDirAndFiles(projectNamePath);
  }

  //创建一个文件夹
  var destFile = path.join(buildPath, zipName, zipName); // `${src}\\build\\${projectName}\\${projectName}`;
  var studentFile = path.join(buildPath, zipName, zipName + 'student');
  var destFile1 = path.join(studentFile, zipName);
  mkdir(destFile);
  mkdir(destFile1);

  //文件夹copy
  var studentFilePath = path.join(buildPath, 'student'); //src + '\\build\\teacher';
  var teacherFilePath = path.join(buildPath, 'teacher'); // src + '\\build\\student';

  copyDirectory(studentFilePath, path.join(destFile, 'student'));
  copyDirectory(teacherFilePath, path.join(destFile, 'teacher'));
  copyDirectory(studentFilePath, path.join(destFile1, 'student'));

  // //文件压缩
  packZip(studentFile, destFile + '.zip');
  rmDirAndFiles(studentFile);

  packZip(projectNamePath, projectNamePath + '.zip');
  rmDirAndFiles(projectNamePath);

  rmDirAndFiles(studentFilePath);
  rmDirAndFiles(teacherFilePath);
}

/**
 *
 * @param {string} scenePath 场景文件
 */
function getSceneUUid(scenePath) {
  const metaPath = scenePath + '.meta';
  console.log(metaPath);
  if (fs.existsSync(metaPath)) {
    let metaContent = fs.readFileSync(metaPath, 'utf8');
    metaContent = JSON.parse(metaContent);
    // console.log(`metaContent: ${metaContent}`);
    return metaContent.uuid;
  }
}

//使用时第二个参数可以忽略 文件夹创建
function mkdir(dirpath, dirname) {
  //判断是否是第一次调用
  if (typeof dirname === 'undefined') {
    //检查路径是否存在 同步
    if (fs.existsSync(dirpath)) {
      return;
    } else {
      mkdir(dirpath, path.dirname(dirpath));
    }
  } else {
    //判断第二个参数是否正常，避免调用时传入错误参数
    if (dirname !== path.dirname(dirpath)) {
      mkdir(dirpath);
      return;
    }
    if (fs.existsSync(dirname)) {
      //创建一个文件夹 同步
      fs.mkdirSync(dirpath);
    } else {
      mkdir(dirname, path.dirname(dirname));
      fs.mkdirSync(dirpath);
    }
  }
}

//文件压缩 projectName:文件保存的位置
function packZip(path, projectName, callBack) {
  zipper.sync.zip(path).compress().save(projectName);
}

// 文件夹copy
function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest);
  }
  if (fs.existsSync(src) == false) {
    return false;
  }
  // console.log("src:" + src + ", dest:" + dest);
  // 拷贝新的内容进去
  var dirs = fs.readdirSync(src);
  dirs.forEach(function (item) {
    var item_path = path.join(src, item);
    var temp = fs.statSync(item_path);
    if (temp.isFile()) {
      // 是文件
      // console.log("Item Is File:" + item);
      fs.copyFileSync(item_path, path.join(dest, item));
    } else if (temp.isDirectory()) {
      // 是目录
      // console.log("Item Is Directory:" + item);
      copyDirectory(item_path, path.join(dest, item));
    }
  });
}

const simpleGit = require('simple-git');

/**
 * 从指定路径下的JSON文件中读取git路径和提交信息，拉取git项目并提交本地修改到远端
 * @param {string} jsonPath JSON文件路径
 * @returns {Promise<string>} 返回Promise对象，当操作成功时返回成功信息，否则返回错误信息
 */
async function updateGitFromJson(jsonPath) {
  let zipName = projectZipName;
  // 读取配置
  const config = JSON.parse(fs.readFileSync(jsonPath));
  const { gitPath, commitMsg } = config;

  try {
    // 切换目录
    process.chdir(gitPath);
  } catch (err) {
    console.error('切换目录失败' + gitPath);
    process.exit(1);
  }

  // 切换分支到develop
  try {
    child_process.execSync('git checkout develop');
  } catch (e) {
    console.error('切换分支失败,退出进程');
    process.exit(1);
  }

  // 拉取最新代码
  try {
    child_process.execSync('git pull');
  } catch (e) {
    console.error('拉取代码失败,退出进程');
    process.exit(1);
  }

  // 移动文件
  const gamePath = path.join(curPath, 'build', zipName + '.zip');
  const newPath = path.join(gitPath, zipName + '.zip');
  fs.renameSync(gamePath, newPath);

  // 提交代码
  try {
    child_process.execSync(
      `git add . && git commit -m "${commitMsg} ${gameVersion}" && git push`
      // `git add . && git commit -m "${commitMsg}"`
    );
    console.log('提交代码成功');
    
  } catch (e) {
    console.error('提交代码失败');
  }
  process.exit(0);
}

main();
