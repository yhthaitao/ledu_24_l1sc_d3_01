const fs = require('fs');
const path = require('path');
const curPath = __dirname;
const baseDir = path.basename(curPath);
const assetsDir = 'assets';
const gameDir = path.join(assetsDir, 'game');
const resDir = path.join(gameDir, 'res');
const scriptsDir = path.join(gameDir, 'scripts');
const resourcesDir = path.join(assetsDir, 'resources');
const coverDir = 'cover.jpg';
const wendang = '.xlsx';

//改造目录
function changeDir() {
    // assets文件夹
    if (!fs.existsSync(assetsDir)) {
        fs.mkdirSync(assetsDir);
    }

    // assets/23_ZCD4_02文件夹
    const newDir1 = path.join(assetsDir, baseDir);
    if (!fs.existsSync(newDir1)) {
        fs.mkdirSync(newDir1);
    }

    if (fs.existsSync(coverDir)) {
        fs.renameSync(coverDir, path.join(newDir1, coverDir));
    }

    // 移动根目录下.xlsx文档到子包目录
    fs.readdirSync(curPath).forEach((file) => {
        if (file.substring(file.length - 5) == wendang) {
            fs.renameSync(file, path.join(newDir1, file));
        }
    });

    // 移动assets/game/res文件夹到assets/23_ZCD4_02文件夹下
    const newResDir = path.join(newDir1, 'res');
    if (!fs.existsSync(newResDir)) {
        fs.mkdirSync(newResDir);
    }
    const sourceResDir = path.join(resDir);
    if (fs.existsSync(sourceResDir)) {
        fs.renameSync(sourceResDir, newResDir);
    }

    // 创建assets/23_ZCD4_02/23_ZCD4_02文件夹
    const newDir2 = path.join(newDir1, baseDir);
    if (!fs.existsSync(newDir2)) {
        fs.mkdirSync(newDir2);
    }

    // 移动assets/game/scripts文件夹到assets/23_ZCD4_02/23_ZCD4_02文件夹下
    const newScriptsDir = path.join(newDir2, 'scripts');
    if (!fs.existsSync(newScriptsDir)) {
        fs.mkdirSync(newScriptsDir);
    }

    const sourceScriptsDir = path.join(scriptsDir);
    if (fs.existsSync(sourceScriptsDir)) {
        fs.renameSync(sourceScriptsDir, newScriptsDir);
    }

    // 创建assets/23_ZCD4_02/23_ZCD4_02/res文件夹
    const newResDir2 = path.join(newDir2, 'res');
    if (!fs.existsSync(newResDir2)) {
        fs.mkdirSync(newResDir2);
    }

    // 移动assets/resources下的所有内容到assets/23_ZCD4_02/23_ZCD4_02/res文件夹下
    const sourceResourcesDir = resourcesDir;
    if (fs.existsSync(sourceResourcesDir)) {
        fs.readdirSync(sourceResourcesDir).forEach((file) => {
            const sourceFilePath = path.join(sourceResourcesDir, file);
            const destFilePath = path.join(newResDir2, file);
            fs.renameSync(sourceFilePath, destFilePath);
        });
    }
}

changeDir();
removeImports(path.join(curPath, 'assets', baseDir, baseDir));
// 移除import
function removeImports(dir) {
    const files = fs.readdirSync(dir);
    files.forEach((file) => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            removeImports(filePath);
        } else if (path.extname(filePath) === '.ts') {
            console.log(filePath);
            let content = fs.readFileSync(filePath, 'utf8');
            content = content.replace(/import\s+.*?;?\n/g, '');
            fs.writeFileSync(filePath, content);
        }
    });
}


