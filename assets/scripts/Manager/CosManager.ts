import { NetWork } from "../Http/NetWork";
import GameMsg from "../SDK/GameMsg";
import { Tools } from "../Utils/Tools";
import { UIHelp } from "../Utils/UIHelp";
import { ListenerManager } from "./ListenerManager";
import { GameLoadErrType } from "../Data/MainConstValue";
import { MainMsgType } from "../Data/MainMsgType";
import { GameBundleManager, SubGameInitData } from "./GameBundleManager";
import { AliLogMsgType } from "../Data/SDKMsgType";

export interface UpLoadFileData {
    /** 文件名 */
    fileName: string;
    /** 存放在远端的路径 */
    filePath: string;
    /**上传以后的远端链接  */
    url: string;
    staticUrl?: string;
    /** 文件本身 */
    fileBody: File;
    /** 文件资源，可以在cocos直接用的 mp3->cc.AudioClip  png->cc.SpriteFrame */
    fileAsset: cc.Asset;
}

/**编辑器保存的数据结构 */
export interface ServerFileData {
    /**资源远端的链接 */
    url: string;
    /** 资源文件名 带后缀*/
    fileName: string;
}

class CosManagerClass {
    private static _instance: CosManagerClass = null;
    public static getInstance(): CosManagerClass {
        if (null === this._instance) {
            this._instance = new CosManagerClass();
        }
        return this._instance;
    }

    private readonly _roolPath = {
        mainRes: 'cocos/jiaohuyouxi/',
    }

    /** key->fileKey  value->UpLoadFileData */
    public upLoadFileMap: Map<string, UpLoadFileData> = new Map();

    /**
     * 添加需要上传的文件到map里
     * @param key 单项目具有唯一性 
     * @param fileBody 文件本身
     * @param fileAsset 文件资源，上传成功以后才会有，通过url load下来的
     */
    public addFileData(key: string, fileBody: any, fileAsset: any) {
        let randStr = Tools.randomString(6);
        this.upLoadFileMap.set(key, {
            filePath: `${this._roolPath.mainRes}${NetWork.titleId}/${randStr + fileBody.name}`,//、、
            fileName: fileBody.name,
            url: '',
            fileAsset: fileAsset,
            fileBody: fileBody
        })
    }

    /**
     * 删除不需要上传的文件
     * @param key 
     */
    public delFileData(key: string) {
        if (this.upLoadFileMap.has(key)) {
            let fileData = this.upLoadFileMap.get(key);
            if (fileData.url) {
                GameMsg.deleteObject(fileData.url, (err: any, data: any) => {
                    cc.log("删除文件：", err || data);
                })
            }
            this.upLoadFileMap.delete(key);
        }
    }

    /** 保存需要上传的文件数据 */
    public getFilesData() {
        let editorFilesData = {}
        this.upLoadFileMap.forEach((element, key) => {
            if (element.url != '') {
                editorFilesData[key] = { url: element.url, fileName: element.fileName } as ServerFileData;
            }
        });
        return editorFilesData;
    }

    /**
     * 批量上传文件
     * @param callBack 
     */
    public uploadFiles(callBack?: Function) {
        let files = []
        this.upLoadFileMap.forEach(fileData => {
            let file = GameMsg.getFileObject(fileData.filePath, fileData.fileBody);
            files.push(file);
        });
        GameMsg.uploadFiles(files, (err: any, data: any) => {
            cc.log("上传文件===uploadFiles====", err || data)
            if (!err) {
                callBack && callBack(data);
            } else {
                UIHelp.showTip('上传文件失败');
            }
        })
    }

    async uploadFile<T extends cc.Asset>(fileData: UpLoadFileData, callBack?: (Asset?: T) => void) {
        return new Promise<T>((resolve, reject) => {
            let file = GameMsg.getFileObject(fileData.filePath, fileData.fileBody);
            GameMsg.uploadFiles([file], (err: any, data: any) => {
                cc.log("上传文件===uploadFiles====", err || data);
                if (!err) {
                    let oldUrl = "https://" + data.files[0].data.Location;
                    fileData.url = Tools.replaceCosUrl(oldUrl, NetWork.COS_BASE_URL);
                    cc.log('fileData.url:', fileData.url);
                    cc.assetManager.loadRemote(fileData.url, {
                        maxRetryCount: 1,
                        headers: {
                            'Access-Control-Allow-Origin': '*'
                        }
                    }, (err, asset: T) => {
                        if (!err) {
                            callBack && callBack(asset);
                            return resolve(asset);
                        }
                        else {
                            callBack && callBack();
                            UIHelp.showTip('文件加载失败，请重新上传');
                            return reject(err);
                        }
                    })
                } else {
                    UIHelp.showTip('文件上传失败');
                    callBack && callBack();
                    return reject(err);
                }
            })
        });
    }

    /**
     * 删除存储的文件
     * @param key 
     * @param callBack 
     */
    public deleteObject(key: string, callBack: Function) {
        GameMsg.deleteObject(key, callBack);
    }

    /**
     * 批量删除文件
     * @param keys 
     * @param callBack 
     */
    public deleteMultipleObject(keys: Array<any>, callBack: Function) {
        GameMsg.deleteMultipleObject(keys, callBack);
    }

    /**
     * 组装编辑器需要保存的数据，文件名(游戏中需要用到的)对应url  更新upLoadFileMap
     * @param data 上传文件后返回的数据 包含文件的url
     * @returns 
     */
    public getEditorData(data: any) {
        let filesData = {};
        data.files.forEach((fileData: any) => {
            let filePath = '', url = "";
            url = fileData.data.Location;
            filePath = fileData.options.Key;
            this.upLoadFileMap.forEach((element, key) => {
                if (element.filePath == filePath) {
                    filesData[key] = "https://" + url;
                }
            });
        });
        return filesData;
    }

    /**
     * opPanel之前先去下载远端的资源
     * @param callBack 
     */
    async opPanel(data: any, callBack: Function) {
        if (data && data.upLoadFilesData && Object.keys(data.upLoadFilesData).length > 0) {
            let gameData: SubGameInitData = {
                name: NetWork.gameName,
                urlList: [NetWork.gameName],
                params: {
                    coursewareId: NetWork.coursewareId,
                },
            }
            this.downLoadFiles(data.upLoadFilesData, gameData, (isOk: boolean, upLoadFileMap?: Map<string, UpLoadFileData>) => {
                if (isOk) {
                    this.upLoadFileMap = upLoadFileMap;
                    ListenerManager.dispatch(MainMsgType.REFRESH_EDITOR_DOWNLOAD_UI);
                    callBack();
                } else {
                    UIHelp.showErrorPanel("获取资源失败");
                }
            })
        } else {
            callBack();
        }
    }

    /**
     * 获取对象数据存储需要的配置
     * 由于uploadFiles时候才会走new COS({请求})里边的请求，此时uploadFiles里边使用的会是初始化的bucket和region
     * ，所以进游戏先获取bucket和region
     * @returns 
     */
    async getCosData() {
        return new Promise((resolve, reject) => {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', NetWork.COS_URL, true);
            xhr.setRequestHeader('token', 'cocos');
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.onload = (e: any) => {
                var data = JSON.parse(e.target.responseText);
                GameMsg.setCosData({
                    bucket: data.bucketName,
                    region: data.endpoint,
                    url: NetWork.COS_URL
                })
                return resolve(true);
            };
            xhr.send('');
        })
    }

    public releaseFileAssets(upLoadFileMap: Map<string, UpLoadFileData> = null) {
        if (!upLoadFileMap) return;
        upLoadFileMap.forEach((element, key) => {
            cc.assetManager.releaseAsset(element.fileAsset);
            element.fileAsset.destroy();
        });
        upLoadFileMap.clear();
    }

    /**
     * 批量下载文件
     * @returns 
     */
    public async downLoadFiles(upLoadFilesData: any, subGameData: SubGameInitData, callBack: Function, isPreload: boolean = false) {
        if (!isPreload) {
            this.releaseFileAssets(this.upLoadFileMap);
        }
        let keys = Object.keys(upLoadFilesData);
        let maxCatchNum = 3;
        let loadedNum = 0;
        let loadCatchNum = 0;
        let upLoadFileMap = new Map<string, UpLoadFileData>();
        let timeoutId = null;
        /**游戏已经切换走的话就停止后续流程 */
        let getIsErr = (serverFileData: any) => {
            if (!upLoadFilesData || !serverFileData || !GameBundleManager.checkSwitchIndexIsOk(subGameData && subGameData.switchIndex, isPreload)) {
                this.releaseFileAssets(upLoadFileMap);
                callBack(null);
                return true;
            }
            return false;
        }
        /**启用检测 */
        let checkTimeOut = (url: string) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                GameMsg.reportAliLog(AliLogMsgType.staticAssetsLoad, { msg: "远端资源加载超时", isPreload: isPreload, coursewareId: subGameData.params.coursewareId, url: url});
            }, 3000);
        }
        for (let index = 0; index < keys.length; index++) {
            let name = keys[index];
            let isBreak = false;
            let serverFileData: ServerFileData = upLoadFilesData[name];
            console.log("测试提示-- 下载资源-：", index + "  name:" + name);
            isBreak = getIsErr(serverFileData);
            clearTimeout(timeoutId);
            if (isBreak) {
                break;
            }
            /**排除空资源的问题，避免进不去游戏 */
            if (serverFileData.url == '') {
                loadedNum = loadedNum + 1;
                if (loadedNum == keys.length) {
                    console.log("测试提示-- 资源全部下载成功")
                    callBack(true, upLoadFileMap);
                    break;
                }
                continue;
            }
            let callThen = (arr: any) => {
                upLoadFileMap.set(arr[0], arr[1]);
                loadedNum = loadedNum + 1;
                loadCatchNum = 0;
                console.log("测试提示-- 资源下载成功", name + loadedNum);
                isBreak = getIsErr(serverFileData);
                if (isBreak) {
                    return;
                }
                if (loadedNum == keys.length) {
                    console.log("测试提示-- 资源全部下载成功")
                    callBack(true, upLoadFileMap);
                    isBreak = true;
                }
            }
            let callCatch = () => {
                isBreak = getIsErr(serverFileData);
                if (isBreak) {
                    return;
                }
                loadCatchNum = loadCatchNum + 1;
                if (loadCatchNum < maxCatchNum) {
                    index = index - 1;
                }
            }
            let staticLoadFail = false;
            if (!NetWork.staticResUrl) {
                staticLoadFail = true;
            }
            let fileName = cc.path.basename(serverFileData.url);
            let fileUrl = cc.path.join(NetWork.staticResUrl, subGameData.params.coursewareId, fileName);

            // let sameFileData = this.isSameFileData(name, serverFileData, upLoadFileMap);
            // if (sameFileData) {
            //     callThen(sameFileData);
            //     continue;
            // }
            cc.log('下载资源====:', name, serverFileData, upLoadFileMap);
            checkTimeOut(fileUrl);
            /**离线地址加载 */
            !staticLoadFail && await this.downLoadFileByStaticUrl(serverFileData, name, subGameData.params.coursewareId).then((arr) => {
                clearTimeout(timeoutId);
                callThen(arr);
            }).catch((err) => {
                clearTimeout(timeoutId);
                staticLoadFail = true;
                GameMsg.reportAliLog(AliLogMsgType.staticAssetsLoad, { msg: "远端资源-离线地址-加载失败", data: { err: err, serverUrl: serverFileData.url, fileUrl: fileUrl } });
            });
            /**在线地址加载 */
            if(staticLoadFail){
                checkTimeOut(serverFileData.url);
                await this.downLoadFile(serverFileData, name).then((arr) => {
                    clearTimeout(timeoutId);
                    callThen(arr);
                    /** 有离线地址还走在线，说明离线失败了，记录在线是否成功*/
                    if (NetWork.staticResUrl) {
                        GameMsg.reportAliLog(AliLogMsgType.staticAssetsLoad, { msg: "远端资源-在线地址-成功", data: { serverUrl: serverFileData.url, fileUrl: fileUrl } });
                    }
                }).catch((err) => {
                    clearTimeout(timeoutId);
                    callCatch();
                    GameMsg.reportAliLog(AliLogMsgType.staticAssetsLoad, { msg: "远端资源-在线地址-失败", data: { err: err, serverUrl: serverFileData.url, loadCatchNum: loadCatchNum, fileUrl: fileUrl } });
                });
            }
            /**游戏已经切换走了 */
            if (isBreak) {
                break;
            }
            /**重试次数超上限 */
            if (loadCatchNum >= maxCatchNum) {
                GameMsg.requestLoadErr(GameLoadErrType.SeverAssetsLoadErr);
                this.releaseFileAssets(upLoadFileMap);
                callBack(null);
                break;
            }
        }
    }

    public isSameFileData(name: string, serverFileData: ServerFileData, upLoadFileMap: Map<string, UpLoadFileData>) {
        for (const key in upLoadFileMap) {
            let fileData = upLoadFileMap[key];
            if (fileData && fileData.url === serverFileData.url) {
                return [name, fileData];
            }
        }
        return null;
    }

    /**
     * 下载单个文件
     * @returns 
     */
    public async downLoadFile(serverFileData: ServerFileData, name: string) {
        return new Promise((resolve, reject) => {
            let fileType = serverFileData.fileName.slice(serverFileData.fileName.length - 3);
            if (fileType == 'png' || fileType == 'jpg' || fileType == 'peg') {
                fetch(serverFileData.url)
                    .then(response => response.blob())
                    .then(blob => {
                        const url = URL.createObjectURL(blob);
                        let img = new Image();
                        img.src = url;
                        img.onload = () => {
                            const texture = new cc.Texture2D();
                            texture.initWithElement(img);
                            const spriteFrame = new cc.SpriteFrame();
                            spriteFrame.setTexture(texture);
                            return resolve([name, {
                                filePath: '',
                                fileName: serverFileData.fileName,
                                url: serverFileData.url,
                                fileBody: null,
                                fileAsset: spriteFrame
                            }]);
                        }
                        img.onerror = (err) => {
                            return reject(false);
                        }
                    }).catch(() => {
                        return reject(false);
                    });
            } else {
                cc.assetManager.loadRemote(serverFileData.url, {
                    maxRetryCount: 1,
                    headers: {
                        'Access-Control-Allow-Origin': '*'
                    }
                }, (err, asset: cc.AudioClip) => {
                    if (!err) {
                        return resolve([name, {
                            filePath: '',
                            fileName: serverFileData.fileName,
                            url: serverFileData.url,
                            fileBody: null,
                            fileAsset: asset
                        }]);
                    }
                    else {
                        return reject(false);
                    }
                })
            }
        });

    }

    /**通过离线地址下载文件 */
    public async downLoadFileByStaticUrl(serverFileData: ServerFileData, name: string, coursewareId: string) {
        return new Promise((resolve, reject) => {
            let fileType = serverFileData.fileName.slice(serverFileData.fileName.length - 3);
            let isImg = false;
            if (fileType == 'png' || fileType == 'jpg' || fileType == 'peg') {
                isImg = true;
            }
            let fileName = cc.path.basename(serverFileData.url);
            let fileUrl = cc.path.join(NetWork.staticResUrl, coursewareId, fileName);
            cc.assetManager.loadRemote(fileUrl, {
                maxRetryCount: 0,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                }
            }, (err, asset: any) => {
                if (!err) {
                    if (isImg) {
                        const spriteFrame = new cc.SpriteFrame();
                        spriteFrame.setTexture(asset);
                        return resolve([name, {
                            filePath: '',
                            fileName: serverFileData.fileName,
                            url: serverFileData.url,
                            staticUrl: fileUrl,
                            fileBody: null,
                            fileAsset: spriteFrame
                        }]);
                    } else {
                        return resolve([name, {
                            filePath: '',
                            fileName: serverFileData.fileName,
                            url: serverFileData.url,
                            staticUrl: fileUrl,
                            fileBody: null,
                            fileAsset: asset
                        }]);
                    }
                }
                else {
                    return reject(false);
                }
            })
        });
    }
}

export const CosManager = CosManagerClass.getInstance();
