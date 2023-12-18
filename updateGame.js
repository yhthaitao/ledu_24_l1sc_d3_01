/**
 * 更新mainGame
 */

const path = require('path');
const fs = require('fs-extra');
const child_process = require('child_process');

const curPath = __dirname;
var projectName = path.basename(curPath);
// projectName = '23_zcd4_01_test';
var subGameName = projectName;
// subGameName = '23_zcd4_01';

const curFileName = __filename;
const CD = process.platform === 'darwin' ? 'cd' : 'cd /d';
const mainGameGitUrl =
  'https://git.xuepeiyou.com/ledu_jiaohuyouxi_cocos/maingame_cocos.git'; // mainGame的git地址
const mainGameName = 'maingame_cocos';
// const cloneMainGamePath = path.join(curPath, 'copyMainGame');
const cloneMainGamePath = path.join(curPath, '..', 'copyMainGame');
const constValueFile = 'assets/scripts/Data/MainConstValue.ts';
const gameCfgFile = 'build-templates/web-mobile/game_cfg.json';

// 需要更新的目录列表
var updateDirList = ['updateGame.js', '.gitignore'];
// updateDirList = ['.gitignore'];

const updateCoreDirList = [`/res/core`, `/scripts/Core`];
const arg = process.argv[2];
const isNotUpdateCore =
  '-o' === arg || '-O' === arg || '-only' === arg || '-ONLY' === arg; // 是否只更新主包，不更新core
//是否是改造运行
const isReform = '-r' === arg || '-R' === arg;
const mainGameBranch = 'main';

//项目改造数据
const assetsDir = 'assets';
const gameDir = path.join(assetsDir, 'game');
const resDir = path.join(gameDir, 'res');
const scriptsDir = path.join(gameDir, 'scripts');
const resourcesDir = path.join(assetsDir, 'resources');
const coverDir = 'cover.jpg';
const wendang = ['.xlsx', '.docx'];

(async () => {

  console.log(cloneMainGamePath);
  // 克隆mainGame
  await gitClone(cloneMainGamePath, mainGameGitUrl, mainGameBranch);
  console.log('模板工程克隆成功');
  //如果updateGame.js有更新，则执行最新的updateMainGame.js脚本
  const updateGameName = path.basename(curFileName);
  if (updateDirList.includes(updateGameName)) {
    const oldPath = path.join(curPath, updateGameName);
    const newPath = path.join(cloneMainGamePath, updateGameName);
    if (fs.existsSync(oldPath) && fs.existsSync(newPath)) {
      const oldScript = fs.readFileSync(oldPath, 'utf8');
      const newScript = fs.readFileSync(newPath, 'utf8');
      if (oldScript != newScript) {
        console.log('********* updateGame.js 有更新 **********');
        let testPath = path.join(curPath, 'updateMainGame_temp.js');
        fs.writeFileSync(oldPath, newScript);
        fs.writeFileSync(testPath, newScript);
        if(isReform){
          await runExec(`node ${testPath} -r`);
        }else{
          await runExec(`node ${testPath}`);
        }
        rmDirAndFiles(testPath);
        process.exit();
      }
    }
  }
  
  if (isReform) {
    changeDir();
    replaceScript(path.join(curPath, 'assets', projectName, projectName));
  }

  // 遍历更新目录列表，替换成最新的core文件
  for (let i = 0; i < updateDirList.length; ++i) {
    const needUpdatePath = path.join(curPath, updateDirList[i]);
    const mainGameUpdatePath = path.join(cloneMainGamePath, updateDirList[i]);
    rmDirAndFiles(needUpdatePath);
    deepDirAndCopyFiles(mainGameUpdatePath, needUpdatePath);
  }
  if (!isNotUpdateCore) {
    // 遍历更新目录列表，替换成最新的core文件
    for (let i = 0; i < updateCoreDirList.length; ++i) {
      const needUpdatePath = path.join(
        curPath,
        'assets',
        projectName,
        projectName,
        updateCoreDirList[i]
      );

      const mainGameUpdatePath = path.join(
        cloneMainGamePath,
        'assets',
        mainGameName,
        mainGameName,
        updateCoreDirList[i]
      );
      if (!fs.existsSync(needUpdatePath)) {
        fs.ensureDirSync(needUpdatePath);
      }
      rmDirAndFiles(needUpdatePath);
      deepDirAndCopyFiles(mainGameUpdatePath, needUpdatePath);
    }
  }
  console.log('mainGame文件替换成功');
  await replaceGameMain(cloneMainGamePath);;
  traverseDirectory('./assets');
  setGameName();
  console.log('********* 【mainGame】更新完成 **********');
  process.exit(0);

  async function replaceGameMain(cloneMainGamePath) {
    const excludeDir = 'assets';
    const delExcludeDirList = [
      'updateGame.js',
      '.git',
      '.vscode',
      'node_modules',
      'updateMainGame_temp.js',
      'build_cfg.json',
    ];

    const copyExcludeDirList = [
      '.git',
      'updateGame.js',
      'library',
      'temp',
      'local',
      'build',
      'packages',
      'node_modules',
      'package-lock.json',
    ];
    // 删除 curPath 文件夹下的内容，除了 subGamePath
    const filesToDelete = await fs.readdir(curPath);
    for (const file of filesToDelete) {
      const filePath = path.join(curPath, file);
      if (delExcludeDirList.indexOf(file) >= 0) {
        continue;
      }
      if (file === excludeDir) {
        const filesToDelete_m = await fs.readdir(filePath);
        for (const file_m of filesToDelete_m) {
          const filePath_m = path.join(filePath, file_m);
          if (file_m !== subGameName) {
            await fs.remove(filePath_m);
          }
        }
        continue;
      }
      await fs.remove(filePath);
    }
    // 复制 cloneMainGamePath 文件夹下除了 子包外 的所有内容到当前文件夹
    const filesToCopy = await fs.readdir(cloneMainGamePath);
    for (const file of filesToCopy) {
      const srcPath = path.join(cloneMainGamePath, file);
      const destPath = path.join(curPath, file);
      if (file === excludeDir) {
        const filesToCopy_m = await fs.readdir(srcPath);
        for (const file_m of filesToCopy_m) {
          const srcPath_m = path.join(srcPath, file_m);
          const destPath_m = path.join(destPath, file_m);
          if (file_m === mainGameName) {
            console.log('白名单不拷贝成功。' + srcPath_m);
            continue;
          }
          await fs.copy(srcPath_m, destPath_m);
          console.log('拷贝成功。' + srcPath_m);
        }
        continue;
      }
      if (copyExcludeDirList.indexOf(file) >= 0) {
        console.log('白名单不拷贝成功。' + srcPath);
        continue;
      }
      await fs.copy(srcPath, destPath);
    }
    modifyScript();
    console.log('操作成功完成。');
  }

  function setGameName() {
    const gameCfgPath = path.join(curPath, gameCfgFile);
    let gameCfgScript = fs.readFileSync(gameCfgPath, 'utf8');
    let gameCfgData = JSON.parse(gameCfgScript);
    gameCfgData.gameName = projectName;
    fs.writeFileSync(gameCfgPath, JSON.stringify(gameCfgData));
  }

  /**
   * 修改配置文件
   */
  function modifyScript() {
    // 修改 ConstValue.ts
    const scriptPath = path.join(curPath, constValueFile);
    let script = fs.readFileSync(scriptPath, 'utf8');

    script = script.replace(mainGameName, projectName);
    fs.writeFileSync(scriptPath, script);
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
            console.log('成功', stdout);
            return resolve(stdout);
          } else {
            console.log('失败:::', command, error, stdout, stderr);
            if (needExit) process.exit(-1);
            else return resolve(null);
          }
        }
      );

      workerProcess.stdout.on('data', function (data) {
        console.log('stdout: ' + data);
      });

      workerProcess.stderr.on('data', function (data) {
        console.log('stderr: ' + data);
      });
    });
  }

  // 克隆工程
  async function gitClone(copyMainGamePath, url, curBranch) {
    let projectName = path.basename(copyMainGamePath);
    const currentDir = process.cwd(); // 记录当前工作目录
    if (fs.existsSync(copyMainGamePath)) {
      process.chdir(path.join('..', projectName));
      console.log(`该目录下存在同名工程：${copyMainGamePath}`);
      // 拉取最新代码
      try {
        //清空当前工作副本
        child_process.execSync('git reset --hard');
        child_process.execSync('git clean -df');
        //切换分支
        child_process.execSync(`git checkout ${curBranch}`);
        //拉取最新代码
        child_process.execSync('git pull');
        process.chdir(currentDir); // 切换回当前工作目录
        return
      } catch (e) {
        process.chdir(currentDir); // 切换回当前工作目录
        console.error('拉取最新代码失败，请重新执行');
        process.exit(1);
      }
    }
    let cmd = `cd ../ && git clone -b ${curBranch} ${url} ${projectName}`;
    await runExec(cmd);
    process.chdir(currentDir); // 切换回当前工作目录
  }

  // 递归文件夹，将所有文件拷贝到目标文件夹下
  function deepDirAndCopyFiles(sourcePath, targetPath) {
    if (fs.statSync(sourcePath).isDirectory()) {
      if (!fs.existsSync(targetPath)) {
        fs.ensureDirSync(targetPath);
      }

      let files = fs.readdirSync(sourcePath);
      files.forEach((file) => {
        let curSourcePath = path.join(sourcePath, file);
        let curTargetPath = path.join(targetPath, file);
        let fileState = fs.statSync(curSourcePath);
        if (fileState.isFile()) {
          copyFile(curSourcePath, curTargetPath);
        } else if (fileState.isDirectory()) {
          deepDirAndCopyFiles(curSourcePath, curTargetPath);
        }
      });
    } else {
      copyFile(sourcePath, targetPath);
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
        fs.ensureDirSync(targetPath);
      }
    } else {
      fs.copyFileSync(sourcePath, targetPath);
    }
  }

  function traverseDirectory(dir) {
    fs.readdirSync(dir).forEach((file) => {
      const filePath = path.join(dir, file);
      if (fs.statSync(filePath).isDirectory()) {
        traverseDirectory(filePath);
      } else {
        processFile(filePath);
      }
    });
  }

  function processFile(filePath) {
    const oldFilePath = filePath;
    const fileName = path.basename(filePath);
    const dirName = path.dirname(filePath);
    const newFileName = fileName.replace(
      new RegExp(mainGameName, 'g'),
      subGameName
    );
    const newFilePath = path.join(dirName, newFileName);
    const isTsFile = /\.ts$/.test(filePath);
    if (isTsFile) {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const newContent = fileContent.replace(
          new RegExp('_' + mainGameName, 'g'),
          '_' + subGameName
        );
        fs.writeFileSync(newFilePath, newContent, 'utf8');
    }

    if (newFileName !== fileName) {
      fs.unlinkSync(oldFilePath);
      console.log(`Processed file: ${oldFilePath} -> ${newFilePath}`);
    }
  }

  //改造目录
  function changeDir() {
    // assets文件夹
    if (!fs.existsSync(assetsDir)) {
      fs.ensureDirSync(assetsDir);
      console.log("创建assets",assetsDir);
    }

    // assets/23_ZCD4_02文件夹
    const newDir1 = path.join(assetsDir, projectName);
    if (!fs.existsSync(newDir1)) {
      fs.ensureDirSync(newDir1);
      console.log("创建assets/subGame",newDir1);
    }

    // assets/23_ZCD4_02文件夹下
    const newResDir = path.join(newDir1, 'res');
    if (!fs.existsSync(newResDir)) {
      fs.ensureDirSync(newResDir);
      console.log("创建assets/subGame/res",newResDir);
    }

    // 创建assets/23_ZCD4_02/23_ZCD4_02文件夹
    const newDir2 = path.join(newDir1, projectName);
    if (!fs.existsSync(newDir2)) {
      fs.ensureDirSync(newDir2);
      console.log("创建subGame/subGame:",newDir2);
    }

    // 创建assets/23_ZCD4_02/23_ZCD4_02/res文件夹
    const newResDir2 = path.join(newDir2, 'res');
    if (!fs.existsSync(newResDir2)) {
      fs.ensureDirSync(newResDir2);
      console.log("创建subRes",newResDir2);
    }

    //检测有无assets/23_ZCD4_02/23_ZCD4_02/scripts文件夹 
    const newScriptsDir = path.join(newDir2, 'scripts');
    if (!fs.existsSync(newScriptsDir)) {
      fs.ensureDirSync(newScriptsDir);
      console.log("创建scritt",newScriptsDir);
    }

    // await delayOneSecond(100);
    if (fs.existsSync(coverDir)) {
      fs.renameSync(coverDir, path.join(newDir1, coverDir));
      console.log("移动cover",coverDir);
    }

    // 移动根目录下.xlsx文档到子包目录
    const files = fs.readdirSync(curPath);
    for (const file of files) {
      if (wendang.indexOf(file.substring(file.length - 5)) >= 0) {
        fs.renameSync(file, path.join(newDir1, file));
        console.log("移动文档",file);
      }
    }

    const sourceResDir = path.join(resDir);
    if (fs.existsSync(sourceResDir)) {
      deepTraversalAndMove(sourceResDir, newResDir);
      console.log("移动res",sourceResDir,newResDir);
    }
    
    const sourceScriptsDir = path.join(scriptsDir);
    deepTraversalAndMove(sourceScriptsDir, newScriptsDir);
    console.log("移动scripts",sourceScriptsDir,newScriptsDir);
  
    // await delayOneSecond(100);
    // 移动assets/resources下的所有内容到assets/23_ZCD4_02/23_ZCD4_02/res文件夹下
    const sourceResourcesDir = resourcesDir;
    if (fs.existsSync(sourceResourcesDir)) {
      deepTraversalAndMove(sourceResourcesDir, newResDir2);
      console.log("移动resources",sourceResourcesDir);
    }

    let skeletonExtFilePath = path.join(curPath, 'assets', projectName, projectName, "scripts", "SkeletonExt.js");
    if (fs.existsSync(skeletonExtFilePath)) {
      fs.unlinkSync(skeletonExtFilePath);
    }
  }

  function deepTraversalAndMove(dirPath, targetDir) {
    // 检查路径是否存在
    if (!fs.existsSync(dirPath)) {
      console.log("Directory does not exist:", dirPath);
      return;
    }
  
    // 遍历目录下所有文件和子目录
    const items = fs.readdirSync(dirPath);
    
    for (let i=0; i<items.length; i++) {
      let fullPath = path.join(dirPath, items[i]);
      
      // 检查当前项是一个目录还是一个文件
      let stat = fs.lstatSync(fullPath);
  
      if (stat.isDirectory()) {
        // 如果是目录，则在新位置创建同名子目录，并递归遍历该子目录
        let newDirFullPath = path.join(targetDir, items[i]);
        
        try{
          fs.ensureDirSync(newDirFullPath); 
          deepTraversalAndMove(fullPath, newDirFullPath);
        } catch(err) { 
          console.error(`Error creating/moving directory: ${err}`);
        }
        
      } else {
        // 如果是文件，则移动到指定的新位置（targetDir）
        let newFileFullPath = path.join(targetDir, items[i]);
        
        try{
          fs.moveSync(fullPath, newFileFullPath);
        } catch(err) { 
          console.error(`Error moving file: ${err}`);
        }
        
      }
    }
  }

  // 移除import
  function replaceScript(dir) {
    const files = fs.readdirSync(dir);
    files.forEach((file) => {
      const filePath = path.join(dir, file);
      if (fs.statSync(filePath).isDirectory()) {
        replaceScript(filePath);
      } else if (path.extname(filePath) === '.ts') {
        // console.log(filePath);
        let content = fs.readFileSync(filePath, 'utf8');
        content = content.replace(/import\s+.*?;?\n/g, '');
        // 替换 FrameMsgType 为 MainMsgType
        content = content.replace(/FrameMsgType/g, 'MainMsgType');
        // 替换 CosManager.saveFilesData() 为 EditorManager.setUpLoadFilesData(CosManager.getFilesData());
        content = content.replace(/CosManager\.saveFilesData\(\)/g, 'EditorManager.setUpLoadFilesData(CosManager.getFilesData())');
        // 替换 UIManager.showUI(GamePanel); 为 GameBundleManager.openPanel(GamePanelType.GamePanel);
        content = content.replace(/UIManager\.showUI\(GamePanel\);/g, 'GameBundleManager.openPanel(GamePanelType.GamePanel);');
        
        // 替换 UIHelp.showAffirmTip 为 SubUIHelp.showAffirmTip 
        content = content.replace(/UIHelp\.showAffirmTip/g, 'SubUIHelp.showAffirmTip');
        // 替换 UIHelp.showSubmissionPanel 为 SubUIHelp.showSubmissionPanel   
        content = content.replace(/UIHelp\.showSubmissionPanel/g, 'SubUIHelp.showSubmissionPanel');

        fs.writeFileSync(filePath, content);
      }
    });
  }
})();
