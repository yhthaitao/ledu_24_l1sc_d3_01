import GameMsg from "../SDK/GameMsg";
import { OpenUIData } from "../UI/BaseUI";
import { UIHelp } from "../Utils/UIHelp";
import { SoundManager } from "./SoundManager";
import { EPANEL_ZORDER, UIManager } from "./UIManager";
import { NetWork } from "../Http/NetWork";
import { ListenerManager } from "./ListenerManager";
import { MainMsgType } from "../Data/MainMsgType";
import { LoadingUI } from "../UI/Panel/LoadingUI";
import { GameLoadErrType, MainConstValue } from "../Data/MainConstValue";
import { Tools } from "../Utils/Tools";
import { AliLogMsgType } from "../Data/SDKMsgType";
import { CosManager, UpLoadFileData } from "./CosManager";

export enum GamePanelType {
    TeacherPanel,
    GamePanel
}

export interface SubGameInitData {
    name: string,
    urlList: string[],
    params: SubGameParams,
    /** --------以下为游戏自定义数据--------- */
    /** 切换游戏的索引 */
    switchIndex?: number,
    /**正在加载中的bundle，切换游戏时候需要等加载完了在释放 */
    isLoading?: boolean,
    /**当前加载的地址 */
    curUrl?: string
}

/**切换游戏 mcc带过来的当前游戏的数据
 * 预加载也会有这个数据，但是只有coursewareId
 */
export interface SubGameParams {
    coursewareId: string,
    isSync?: boolean,
    supportKeepAndRestart?: boolean,
    gameId?: string,
}

export interface GameEditorData {
    editorData: any,
    upLoadFileMap?: Map<string, UpLoadFileData>
}

class GameBundleManagerClass {
    private static _instance: GameBundleManagerClass = null;
    /** 当前子游戏 */
    private _curSubGame: SubGameInitData = null;

    /** 缓存下来从远端拉取的数据 等游戏准备好了 发给游戏 */
    private gameEditorDataMap: Map<string, GameEditorData> = new Map();

    private cacheEditorDataMap: Map<string, any> = new Map();

    /** 游戏主页面加载完成 */
    private _gamePanelIsOk: boolean = false;
    /** 游戏编辑器数据获取完成 */
    private _gameEditorDateIsOk: boolean = false;

    private _curPreloadSubGame: SubGameInitData = null;

    /** 游戏是否是否是隐藏的  */
    public gameIsHide: boolean = false;

    /**历史加载中的bundle */
    public oldLoadingBundleList: SubGameInitData[] = [];

    /**游戏切换索引 */
    public curSwitchIndex: number = 0;


    // private readonly _preLoadDirProgress: number = 10;
    // private readonly _panelProgress: number = 90;

    public static getInstance(): GameBundleManagerClass {
        if (null === this._instance) {
            this._instance = new GameBundleManagerClass();
        }
        return this._instance;
    }

    public init() {
        GameMsg.recvSwitchGame(this.switchGame.bind(this));
        GameMsg.recvPreloadGame(this.preLoadGame.bind(this));
    }

    public async switchGame(data: any) {
        console.log('测试提示---switchGame');
        this.gameIsHide = false;
        let gameData: SubGameInitData = data.data;
        /** mcc调用切换游戏 */
        if (!gameData.switchIndex) {
            /**避免切换游戏时候，因为清理资源等各种原因导致低端设备卡帧，会先显示上一个游戏画面，才展示loading页面 */
            UIHelp.showLoadingFull(true);
            this.curSwitchIndex = this.curSwitchIndex + 1;
            gameData.switchIndex = this.curSwitchIndex;
            NetWork.getStaticResUrl();
        }
        cc.game.resume();
        this.cleanOldData();
        UIManager.openUI(LoadingUI, null, EPANEL_ZORDER.LOADING, () => {
            UIHelp.showLoadingFull(false);
            ListenerManager.dispatch(MainMsgType.GAME_LOAD_PROGRESS, 0);
        });
        this._curSubGame = gameData;
        if (NetWork.isSubGame) {
            console.log('测试提示-本次加载的是分包');
        } else {
            console.log('测试提示-本次加载的是全量包');
        }
        GameMsg.reportAliLog(AliLogMsgType.recv_switch_game, {
            subGameData: data,
            isSubGame: NetWork.isSubGame
        });
        this.switchCurUrl(this._curSubGame);
        if (!this._curSubGame.curUrl) {
            console.error('测试提示-所有地址都加载失败!!!!!!!');
            GameMsg.requestLoadErr(GameLoadErrType.SubGameLoadErr);
            return;
        }
        /**如果有预加载过，延续预加载的curUrl*/
        this._getPreloadUrl();
        console.log('测试提示-加载地址:' + this._curSubGame.curUrl);
        this._refreshNetWorkData(gameData.params);
        /**避免mcc连续多次切换游戏被覆盖掉，深拷贝一份用来执行加载逻辑 */
        let loadSubGame = Tools.deepCopy(this._curSubGame);
        this.startLoadBunde(loadSubGame);
    }

    public async startLoadBunde(loadSubGame: SubGameInitData) {
        loadSubGame.isLoading = true;
        this.oldLoadingBundleList.push(loadSubGame);
        let loadIsFail = true;
        await this.checkBundleUrlIsOk(loadSubGame.curUrl).catch(() => {
            loadIsFail = false;
            console.error("测试提示-bundle地址检测不通过-----loadSubGame.curUrl" + loadSubGame.curUrl);
        });
        console.log("测试提示-bundle地址检测通过-----" + loadSubGame.curUrl);
        if (!this.checkLoadIsOk(loadSubGame, loadIsFail)) return;

        await this.loadBundleDir(loadSubGame.curUrl, 'res/preload', (finish: number, total: number) => {
            let value = Math.round((finish / total));
            console.log("测试提示-loadBundleDir加载进度value" + value);
        }).catch(() => {
            loadIsFail = false;
            console.error("测试提示-bundle资源加载失败" + loadSubGame.curUrl);
        });
        console.log("测试提示-BundleDir加载成功");
        if (!this.checkLoadIsOk(loadSubGame, loadIsFail)) return;

        await SoundManager.loadGameAudios(loadSubGame, () => {
            if (this.loadGameNotCurGame(loadSubGame, this._curSubGame)) {
                console.log("测试提示-游戏已经切换走");
                return true;
            }
            return false;
        }).catch((err) => {
            loadIsFail = false;
            console.log("测试提示-子包音频预加载失败" + loadSubGame.curUrl);
        });
        console.log("测试提示-BundleDir加载成功");
        if (!this.checkLoadIsOk(loadSubGame, loadIsFail)) return;
        //发送准备就绪，可以接收消息了
        GameMsg.request_event_ready();
        if (MainConstValue.IS_TEACHER) {
            this.loadTeacherPanel();
        } else {
            this.loadGamePanel(loadSubGame);
            this.getNet(loadSubGame);
        }
    }

    /** 检测正在加载的bundle是否是当前页的bundle load失败的进行重试 */
    public checkLoadIsOk(loadSubGame: SubGameInitData, loadIsFail: boolean) {
        if (this.loadGameNotCurGame(loadSubGame, this._curSubGame)) {
            console.log("测试提示-checkLoadIsOk -- false");
            this.bundleLoadend(loadSubGame);
            return false;
        }
        if (!loadIsFail) {
            GameMsg.reportAliLog(AliLogMsgType.loadBundleFail, this._curSubGame);
            this.bundleLoadend(loadSubGame);
            this.switchGame({ data: this._curSubGame });
            return false;
        }
        console.log("测试提示-checkLoadIsOk -- true");
        return true;
    }

    /**当前游戏加载结束 */
    public bundleLoadend(loadSubGame: SubGameInitData) {
        if (loadSubGame) {
            loadSubGame.isLoading = false;
            this.oldLoadingBundleList.forEach((element) => {
                if (!element.isLoading) {
                    element = null;
                }
            })
        }
    }

    /**检测加载的游戏是否已经被切换走了 */
    public loadGameNotCurGame(loadSubGame: SubGameInitData, curSubGame: SubGameInitData, isPanelLoadEnd = false) {
        if (!this._isSameBundle(curSubGame, loadSubGame)) {
            isPanelLoadEnd && loadSubGame && UIManager.closeUI(this._getGameBundelUIData(GamePanelType.GamePanel, loadSubGame));
            /**检测要清理的是否和预加载的或者当前的是一个bundle */
            if (!this._isSameBundle(loadSubGame, this._curSubGame) && !this._isSameBundle(loadSubGame, this._curPreloadSubGame)) {
                let bundle = cc.assetManager.getBundle(loadSubGame.name);
                if (bundle) {
                    console.log('测试提示--加载的bundle不是当前bundle - 清理资源1:', loadSubGame.name);
                    curSubGame && console.log('测试提示--加载的bundle不是当前bundle - 清理资源2:', curSubGame.name);
                    //遍历loadSubGame的index属性是否再this.oldLoadingBundleList里边
                    if (this.checkNotSameBundle(loadSubGame)) {
                        // 释放所有属于 Asset Bundle 的资源
                        bundle.releaseAll();
                        cc.assetManager.removeBundle(bundle);
                        this.removeCacheUpLoadFileData(loadSubGame.params?.coursewareId);
                    }
                }
            }
            GameMsg.reportAliLog(AliLogMsgType.loadGameNotCurGame, {
                loadSubGame: loadSubGame || '',
                curSubGame: curSubGame || '',
                curPreloadSubGame: this._curPreloadSubGame || "",
            });
            return true;
        } else {
            /**加载的是同一个子包，但是是重复加载的情况，停止后续流程，不清理bundle */
            if (loadSubGame && curSubGame && loadSubGame.switchIndex != curSubGame.switchIndex) {
                GameMsg.reportAliLog(AliLogMsgType.loadGameNotCurGame, {
                    loadSubGame: loadSubGame || '',
                    curSubGame: curSubGame || '',
                });
                isPanelLoadEnd && UIManager.closeUI(this._getGameBundelUIData(GamePanelType.GamePanel, loadSubGame));
                return true;
            }
        }
        return false;
    }

    /** 避免卸载bundle时候把正在加载中的bundle卸载掉   */
    public checkNotSameBundle(waitDelSubGame: SubGameInitData) {
        let oldSameBundleNum = 0;
        this.oldLoadingBundleList.forEach((element) => {
            if (element && element.name == waitDelSubGame.name && element.isLoading) {
                oldSameBundleNum = oldSameBundleNum + 1;
            }
        });
        console.log("测试提示---oldSameBundleNum:", oldSameBundleNum, waitDelSubGame.name)
        if (oldSameBundleNum == 0) {
            return true;
        }
        return false;
    }

    /**
     * 切换子包加载地址
     */
    public switchCurUrl(subGame: SubGameInitData) {
        this.replaceUrl(subGame.urlList);
        if (subGame.curUrl) {
            let index = subGame.urlList.indexOf(subGame.curUrl)
            if (index < 0) {
                subGame.curUrl = subGame.urlList[0];
            } else {
                if (index < subGame.urlList.length - 1 && index >= 0) {
                    subGame.curUrl = subGame.urlList[index + 1];
                } else {
                    subGame.curUrl = null;
                }
            }
        } else {
            subGame.curUrl = subGame.urlList[0];
        }
    }

    public replaceUrl(urlList: string[]) {
        for (let index = 0; index < urlList.length; index++) {
            //TODO --测试代码
            if (urlList[index].slice(0, 7) !== "http://" && urlList[index].slice(0, 6) === "http:/") {
                urlList[index] = "http://" + urlList[index].slice(6);
            }
            if (urlList[index].slice(0, 8) !== "https://" && urlList[index].slice(0, 7) === "https:/") {
                urlList[index] = "https://" + urlList[index].slice(7);
            }
        }
    }

    public loadGamePanel(loadSubGame: SubGameInitData) {
        let onProgress = (completedCount: number, totalCount: number, item: any) => {
            let value = Math.round((completedCount / totalCount) * 99);
            if (!this._curSubGame || loadSubGame.switchIndex != this._curSubGame.switchIndex) {
                return;
            }
            cc.log("测试提示-主页面加载进度:" + value + "%");
            //新课堂上报
            GameMsg.resLoading(value);
            ListenerManager.dispatch(MainMsgType.GAME_LOAD_PROGRESS, value);
        };

        console.log("测试提示-开始加载游戏主页面" + loadSubGame.curUrl);
        let loadErr = (err) => {
            console.log('测试提示-游戏切换失败，更换链路 err:' + err);
            this.bundleLoadend(loadSubGame);
            if (this.loadGameNotCurGame(loadSubGame, this._curSubGame)) {
                return;
            }
            /** 切换线路 */
            this.switchGame({ data: this._curSubGame });
        }
        console.log('测试提示-开始切换:' + loadSubGame.name);
        this.openPanel(GamePanelType.GamePanel, () => {
            console.log('测试提示-主页面加载成功:' + loadSubGame.name);
            this.bundleLoadend(loadSubGame);
            if (this.loadGameNotCurGame(loadSubGame, this._curSubGame, true)) {
                return;
            }
            console.log('测试提示-切换成功-loadGamePanel:' + loadSubGame.name);
            GameMsg.resLoadEnd();
        }, onProgress, loadErr);
    }

    public async checkBundleUrlIsOk(url: string) {
        return new Promise((resolve, reject) => {
            if (NetWork.isSubGame && !CC_DEBUG) {
                url = `${url}/config.json`;
                NetWork.checkRemoteFileExists(url).then(() => {
                    console.log("测试提示-bundle地址检测通过===========");
                    resolve(true);
                }).catch(() => {
                    console.log("测试提示-bundle地址检测不通过" + url);
                    reject(false);
                })
            } else {
                console.log("测试提示-bundle地址检测通过=======222====");
                resolve(true);
            }
        })
    }

    public loadTeacherPanel() {
        UIManager.openUI(LoadingUI, null, EPANEL_ZORDER.LOADING);
        let onProgress = (completedCount: number, totalCount: number, item: any) => {
            let value = Math.round((completedCount / totalCount) * 99);
            ListenerManager.dispatch(MainMsgType.GAME_LOAD_PROGRESS, value);
        };
        this.openPanel(GamePanelType.TeacherPanel, () => {
            UIManager.closeUI(LoadingUI);
            console.log('测试提示-切换成功-loadTeacherPanel:' + this._curSubGame.name);
        }, onProgress);
    }

    public async preLoadGame(data: any) {
        let preLoadData: SubGameInitData = data.data;
        if (!preLoadData.switchIndex) {
            this.curSwitchIndex = this.curSwitchIndex + 1;
            preLoadData.switchIndex = this.curSwitchIndex;
        }
        if (this._curPreloadSubGame && this._curPreloadSubGame.curUrl) {
            this.cleanPreLoadBundle();
        }
        this._curPreloadSubGame = preLoadData;
        GameMsg.reportAliLog(AliLogMsgType.recv_preload_game, this._curPreloadSubGame);
        console.log('测试提示-开始预加载' + this._curPreloadSubGame.urlList[0]);
        /**预加载的和当前是一个bundle  直接用当前的地址 */
        if (this._isSameBundle(this._curPreloadSubGame, this._curSubGame)) {
            console.log('测试提示-预加载的和当前是一个地址：' + this._curSubGame.name);
            this._curPreloadSubGame.curUrl = this._curSubGame.curUrl;
            GameMsg.reportAliLog(AliLogMsgType.preLoadIsSameLoadBunde, this._curPreloadSubGame.curUrl);
            this.getNet(this._curPreloadSubGame, true);
            return;
        }

        this.switchCurUrl(this._curPreloadSubGame);
        if (!this._curPreloadSubGame.curUrl) {
            console.error('测试提示-预加载所有地址都失败!!!!!!!');
            this._curPreloadSubGame = null;
            this._preloadIsEnd();
            return;
        }
        this._startPreLoadBunde();
    }

    private async _startPreLoadBunde() {
        cc.game.resume();
        console.log('测试提示-预加载开始：' + this._curPreloadSubGame.curUrl);
        let preLoadIsFail = true;
        let preLoadSubGame = this._copyGameData(this._curPreloadSubGame);
        preLoadSubGame.isLoading = true;
        this.oldLoadingBundleList.push(preLoadSubGame);
        await this.checkBundleUrlIsOk(preLoadSubGame.curUrl).catch(() => {
            console.log("测试提示-bundle地址检测bu通过-----urlIsOk" + preLoadIsFail);
            preLoadIsFail = false;
        });
        if (!this._checkPreLoadIsOk(preLoadSubGame, preLoadIsFail)) {
            return;
        }
        GameMsg.reportAliLog(AliLogMsgType.reportCustomInfo, { msg: "预加载-bundleUrl检测通过" });
        this.getNet(preLoadSubGame, true);
        await SoundManager.preLoadGameAudios(this._curPreloadSubGame).catch((err) => {
            console.log('测试提示-预加载音频失败');
            preLoadIsFail = false;
            GameMsg.reportAliLog(AliLogMsgType.reportCustomInfo, { msg: "预加载-游戏音频预加载失败" });
        });
        if (!this._checkPreLoadIsOk(preLoadSubGame, preLoadIsFail)) {
            return;
        }
        GameMsg.reportAliLog(AliLogMsgType.reportCustomInfo, { msg: "预加载-游戏音频预加载完成" });
        await this.preLoadBundleDir(this._curPreloadSubGame.curUrl, 'res/preload').catch((err) => {
            console.log('测试提示-preload资源预加载失败');
            preLoadIsFail = false;
            GameMsg.reportAliLog(AliLogMsgType.reportCustomInfo, { msg: "预加载-游戏PreLoad文件预加载失败", err: err });
        });
        if (!this._checkPreLoadIsOk(preLoadSubGame, preLoadIsFail)) {
            return;
        }
        GameMsg.reportAliLog(AliLogMsgType.reportCustomInfo, { msg: "预加载-游戏PreLoad文件预加载完成" });
        let uiData: OpenUIData = this._getGameBundelUIData(GamePanelType.GamePanel, preLoadSubGame);
        UIManager.preLoadGamePanelUI(uiData).then((prefab) => {
            this.bundleLoadend(preLoadSubGame);
            if (!this._checkPreLoadIsOk(preLoadSubGame)) {
                return;
            }
            GameMsg.reportAliLog(AliLogMsgType.reportCustomInfo, { msg: "预加载-游戏主页面预加载完成" });
            console.log('测试提示-预加载主页面完成')
            console.log('测试提示-预加载完成')
            this._preloadIsEnd();
        }).catch((err) => {
            GameMsg.reportAliLog(AliLogMsgType.reportCustomInfo, { msg: "预加载-游戏主页面预加载失败", err: err });
            this.bundleLoadend(preLoadSubGame);
            this._checkPreLoadIsOk(preLoadSubGame, false);
        });

    }

    /**检测预加载是否安全 */
    private _checkPreLoadIsOk(preLoadSubGame: SubGameInitData, preLoadIsFail: boolean = true) {
        if (this.loadGameNotCurGame(preLoadSubGame, this._curPreloadSubGame)) {
            GameMsg.reportAliLog(AliLogMsgType.reportCustomInfo, { msg: "预加载-预加载的游戏已经被切走", preLoadSubGame: preLoadSubGame, curPreloadSubGame: this._curPreloadSubGame });
            this.bundleLoadend(preLoadSubGame);
            this._preloadIsEnd();
            return false;
        }
        if (!preLoadIsFail) {
            GameMsg.reportAliLog(AliLogMsgType.preLoadBundleFail, {
                curPreloadSubGame: this._curPreloadSubGame || '',
            });
            this.bundleLoadend(preLoadSubGame);
            this.preLoadGame({ data: this._curPreloadSubGame });
            return false;
        }
        return true;
    }

    private _copyGameData(subGameData: SubGameInitData) {
        let newGameData = {} as SubGameInitData;
        for (const key in subGameData) {
            newGameData[key] = Tools.deepCopy(subGameData[key]);
        }
        return newGameData;
    }

    private _preloadIsEnd() {
        GameMsg.reportAliLog(AliLogMsgType.preLoadBundleFinish, {
            curUrl: this._curPreloadSubGame && this._curPreloadSubGame.curUrl || '',
            gameIsHide: this.gameIsHide
        });
        if (this.gameIsHide) {
            GameMsg.reportAliLog(AliLogMsgType.reportCustomInfo, { msg: "预加载结束暂停引擎" });
            console.log('测试提示-预加载结束暂停引擎')
            cc.game.pause();
        }
    }

    /**如果有加载过的bundle 先移除 */
    private _cleanCurBundle() {
        /**当前bundle和预加载是一个 不能清理  */
        if (!this._curSubGame || this._isSameBundle(this._curSubGame, this._curPreloadSubGame)) {
            this._curSubGame = null;
            return;
        }
        let bundle = cc.assetManager.getBundle(this._curSubGame.name);
        if (bundle) {
            /*如果bundle正在加载中或者等待加载中，需要加载完了再清理* */
            if (this.checkNotSameBundle(this._curSubGame)) {
                // 释放所有属于 Asset Bundle 的资源
                bundle.releaseAll();
                cc.assetManager.removeBundle(bundle);
                this.removeCacheUpLoadFileData(this._curSubGame.params.coursewareId);
            }
        }
        this._curSubGame = null;
    }

    /** 清楚遗留数据 */
    public cleanOldData() {
        this.saveEditorDatas();
        /**个别游戏切换时候会把之前编辑器数据清了，所以需要暂存起来 */
        ListenerManager.dispatch(MainMsgType.ON_SWITCH_GAME);
        this.getEditorDatas();

        this._gameEditorDateIsOk = false;
        this._gamePanelIsOk = false;
        try {
            if (NetWork.cacheXhr) {
                NetWork.cacheXhr.abort();
                NetWork.cacheXhr = null;
            }
        } catch (error) {
            console.error("error:", error);
        }
        SoundManager.stopAll();
        cc.Tween.stopAll();
        /**避免上个游戏影响 先恢复声音 */
        SoundManager.unmute();
        UIManager.closeAllUI();
        // SoundManager.removeGameAudio();
        cc.macro.ENABLE_MULTI_TOUCH = false;
        ListenerManager.removeAllGameEvent();
        this._cleanCurBundle();
    }

    /**暂存editorData */
    public saveEditorDatas() {
        this.cacheEditorDataMap.clear();
        if (!this.gameEditorDataMap) return;
        this.gameEditorDataMap.forEach((value, key) => {
            if (value && value.editorData && value.editorData.data && value.editorData.data.upLoadFilesData) {
                this.cacheEditorDataMap.set(key, value.editorData.data.upLoadFilesData);
            }
        })
    }

    /**获取EditorData*/
    public getEditorDatas() {
        if (!this.cacheEditorDataMap) return;
        this.cacheEditorDataMap.forEach((value, key) => {
            this.gameEditorDataMap.get(key).editorData.data.upLoadFilesData = value;
        })
    }

    /** 当前子游戏和加载的子游戏是否是同一个bundle */
    private _isSameBundle(curSubGame: SubGameInitData, loadSubGame: SubGameInitData) {
        if (curSubGame && loadSubGame
            && loadSubGame.name == curSubGame.name) {
            return true;
        }
        return false;
    }

    private _getPreloadUrl() {
        if (this._isSameBundle(this._curSubGame, this._curPreloadSubGame)) {
            this._curSubGame.curUrl = this._curPreloadSubGame.curUrl;
        }
        this.cleanPreLoadBundle();
    }

    private _refreshNetWorkData(params?: SubGameParams) {
        NetWork.gameName = this._curSubGame.name;
        params && NetWork.refreshNetWorkData(params);
    }

    public openPanel(panelType: GamePanelType, callback?: Function, onProgress?: Function, loadErr?: Function) {
        let uiData: OpenUIData = this._getGameBundelUIData(panelType);
        UIManager.openUI(
            uiData,
            null,
            EPANEL_ZORDER.NORMAL,
            callback,
            onProgress,
            loadErr
        );
    }

    public closePanel(panelType: GamePanelType) {
        let uiData: OpenUIData = this._getGameBundelUIData(panelType);
        UIManager.closeUI(uiData);
    }

    private _getGameBundelUIData(panelType: GamePanelType = GamePanelType.GamePanel, subGame: SubGameInitData = null) {
        subGame = subGame || this._curSubGame;
        let prefabName = panelType == GamePanelType.TeacherPanel ? "TeacherPanel" : "GamePanel";
        let className = prefabName + "_" + subGame.name;
        let uiData: OpenUIData = {
            className: className,
            resPath: `${MainConstValue.GAME_PREFAB_PANEL_DIR + prefabName}`,
            bundlePath: subGame.curUrl,
            bundleName: subGame.name,
        }
        return uiData;
    }

    public async cleanPreLoadBundle() {
        if (!this._curPreloadSubGame || this._isSameBundle(this._curSubGame, this._curPreloadSubGame)) {
            /** 正在加载中的，先清楚数据，等加载完了，校验数据不一致会自动清理bundle */
            this._curPreloadSubGame = null;
            return;
        }
        let bundle = cc.assetManager.getBundle(this._curPreloadSubGame.name);
        if (bundle) {
            console.log('测试提示-释放预加载过的资源' + this._curPreloadSubGame.name);
            // 释放所有属于 Asset Bundle 的资源
            if (this.checkNotSameBundle(this._curPreloadSubGame)) {
                // 释放所有属于 Asset Bundle 的资源
                bundle.releaseAll();
                cc.assetManager.removeBundle(bundle);
                this.removeCacheUpLoadFileData(this._curPreloadSubGame.params?.coursewareId);
            }
        }
        this._curPreloadSubGame = null;
    }

    public async loadBundle(url: string) {
        return new Promise((resolve, reject) => {
            cc.assetManager.loadBundle(url, (err: Error, bundle: cc.AssetManager.Bundle) => {
                if (err) {
                    cc.error(err);
                    reject(null);
                }
                resolve(true);
            });
        });
    }

    /**
     * 每个阶段结束检测是否已经被切换走了
     * @param loadSubGame 
     * @param isPreload 
     * @returns 
     */
    public async getNet(loadSubGame: SubGameInitData, isPreload = false) {
        let coursewareId = loadSubGame.params.coursewareId;
        let cacheData = this.gameEditorDataMap.get(coursewareId);
        if (cacheData) {
            console.log('测试提示-本地数据已经缓存');
            GameMsg.reportAliLog(AliLogMsgType.staticAssetsLoad, { msg: "json数据已经缓存", coursewareId: coursewareId });
            this.downLoadUpLoadFiles(loadSubGame, cacheData, isPreload);
            return;
        }
        console.log('测试提示-本地数据未缓存，开始拉去 coursewareId' + coursewareId);
        /**第一次预加载 没有NetWork.coursewareId，需要存一个 */
        if (!NetWork.coursewareId) {
            NetWork.setCoursewareId(coursewareId);
        }
        //json、 配置文件
        let responseData = null, editorData = null;
        /**获取离线地址的json */
        await this.getStaicConfigJson(coursewareId).then((data: any) => {
            if (data && data.json) {
                responseData = data.json;
            }
        });
        /**检测游戏是否被切走 */
        if (this.loadGameNotCurGame(loadSubGame, isPreload ? this._curPreloadSubGame : this._curSubGame)) {
            return;
        }
        editorData = responseData;
        /**离线地址加载失败走远端 */
        if (!responseData) {
            await this.getServeConfigJson(coursewareId).then((json: any) => {
                let jsonIsOk = false;
                if (json) {
                    jsonIsOk = true;
                    responseData = json;
                }
                GameMsg.reportAliLog(AliLogMsgType.staticAssetsLoad, { msg: "配置文件-在线地址-成功", coursewareId: coursewareId, jsonIsOk: jsonIsOk });
            }).catch((err) => {
                GameMsg.reportAliLog(AliLogMsgType.staticAssetsLoad, { msg: "配置文件-在线地址-失败", err: err });
            });
        }
        /**检测游戏是否被切走 */
        if (this.loadGameNotCurGame(loadSubGame, isPreload ? this._curPreloadSubGame : this._curSubGame)) {
            return;
        }
        if (!editorData) {
            /**检测资源合理性 */
            if (Array.isArray(responseData.data)) {
                UIHelp.showErrorPanel("数据为空");
                return;
            }
            editorData = JSON.parse(responseData.data.courseware_content);
        }
        console.log('测试提示-远端数据拉取成功');
        if (editorData) {
            console.log('测试提示-远端数据拉取成功');
            let data = { editorData: editorData, upLoadFileMap: null };
            this.gameEditorDataMap.set(coursewareId, data);
            this.downLoadUpLoadFiles(loadSubGame, data, isPreload);
        } else {
            UIHelp.showErrorPanel("获取数据失败");
        }
    }

    /**通过远端地址获取配置文件 */
    private async getServeConfigJson(coursewareId: string) {
        return new Promise((resolve, reject) => {
            NetWork.httpRequest(
                NetWork.GET_QUESTION + '?courseware_id=' + coursewareId,
                'GET',
                'application/json;charset=utf-8',
                (err: any, response: any) => {
                    if (!err) {
                        return resolve(response);
                    } else {
                        return reject(err);
                    }
                },
                null
            );
        })
    }

    /**获取离线地址对应的配置文件json */
    private async getStaicConfigJson(coursewareId: string) {
        return new Promise((resolve, reject) => {
            NetWork.getStaticResUrl((basePath: boolean) => {
                if (basePath) {
                    let jsonPath = cc.path.join(basePath, coursewareId, `${coursewareId}.json`);
                    cc.assetManager.loadRemote(jsonPath, {
                        maxRetryCount: 0,
                        headers: {
                            'Access-Control-Allow-Origin': '*'
                        }
                    }, (err1: Error, json: any) => {
                        if (!err1) {
                            GameMsg.reportAliLog(AliLogMsgType.staticAssetsLoad, { msg: "配置文件-离线地址-成功", jsonPath: jsonPath });
                            return resolve(json);
                        } else {
                            GameMsg.reportAliLog(AliLogMsgType.staticAssetsLoad, { msg: "配置文件-离线地址-失败", err: err1, jsonPath: jsonPath });
                            return resolve(null);
                        }
                    });
                } else {
                    return resolve(null);
                }
            })
        })
    }

    private removeCacheUpLoadFileData(coursewareId: string) {
        if (!coursewareId) return;
        let cacheData = this.gameEditorDataMap.get(coursewareId);
        if (cacheData) {
            CosManager.releaseFileAssets(cacheData.upLoadFileMap);
        }
    }

    /**
     * 
     * @param loadSubGame 需要下载文件的子包
     * @param cacheData  缓存的数据
     * @param isPreload 是否是预加载 预加载不走后续流程
     * @returns 
     */
    private async downLoadUpLoadFiles(loadSubGame: SubGameInitData, cacheData: GameEditorData = null, isPreload = false) {
        let loadEnd = (fileDatas: Map<string, UpLoadFileData>) => {
            if (isPreload) return;
            if (fileDatas) {
                CosManager.upLoadFileMap = fileDatas;
                ListenerManager.dispatch(MainMsgType.REFRESH_EDITOR_DOWNLOAD_UI);
            }
            this._gameEditorDateIsOk = true;
            if (this._gamePanelIsOk) {
                this.finishedLoading();
                ListenerManager.dispatch(MainMsgType.GAME_PANEL_READ);
            }
        }
        let loadGameEditorData = this.getLoadEditorDataById(loadSubGame.params?.coursewareId);
        if (loadGameEditorData && loadGameEditorData.data && loadGameEditorData.data.upLoadFilesData && Object.keys(loadGameEditorData.data.upLoadFilesData).length > 0) {
            GameMsg.reportAliLog(AliLogMsgType.staticAssetsLoad, { msg: "远端资源-开始下载", coursewareId: loadSubGame.params.coursewareId });

            console.log('测试提示-远端资源，开始下载');
            if (cacheData && cacheData.upLoadFileMap && cacheData.upLoadFileMap.size > 0) {
                console.log('测试提示-远端资源，已经缓存');
                GameMsg.reportAliLog(AliLogMsgType.staticAssetsLoad, { msg: "远端资源-游戏已经缓存", coursewareId: loadSubGame.params.coursewareId, filesMapSize: cacheData.upLoadFileMap.size });
                loadEnd(cacheData.upLoadFileMap);
                return;
            }
            console.log('测试提示-远端资源未缓存，开始下载');
            GameMsg.reportAliLog(AliLogMsgType.staticAssetsLoad, { msg: "远端资源-游戏未缓存，开始下载", coursewareId: loadSubGame.params.coursewareId });
            CosManager.downLoadFiles(loadGameEditorData.data.upLoadFilesData, loadSubGame, (isOk: boolean, upLoadFileMap?: Map<string, UpLoadFileData>) => {
                GameMsg.reportAliLog(AliLogMsgType.staticAssetsLoad, { msg: "远端资源-加载结束", isOk: isOk, isPreload: isPreload, coursewareId: loadSubGame.params.coursewareId });
                if (!this.checkSwitchIndexIsOk(loadSubGame.switchIndex, isPreload)) {
                    return;
                }
                if (isOk) {
                    console.log('测试提示-远端资源下载完成');
                    cacheData && (cacheData.upLoadFileMap = upLoadFileMap);
                    loadEnd(upLoadFileMap);
                } else if (!isPreload) {
                    UIHelp.showErrorPanel("获取资源失败");
                }
            }, isPreload)
        } else {
            GameMsg.reportAliLog(AliLogMsgType.staticAssetsLoad, { msg: "没有远端资源，不需要下载", coursewareId: loadSubGame.params.coursewareId });
            loadEnd(null);
        }
    }

    /**远端资源没获取完，只能加载到99，资源和页面全部加在完，才走到100 */
    public finishedLoading() {
        //新课堂上报
        GameMsg.resLoading(100);
        console.log("测试提示-loadGamePanel加载进度value --  index一样 100");
        ListenerManager.dispatch(MainMsgType.GAME_LOAD_PROGRESS, 100);
        UIManager.closeUI(LoadingUI);
    }

    public preLoadBundleDir(bundleUrl: string, path: string) {
        return new Promise((resolve, reject) => {
            cc.assetManager.loadBundle(bundleUrl, (err: Error, bundle: cc.AssetManager.Bundle) => {
                if (err) {
                    cc.error(err);
                    return reject(err);
                }
                bundle.preloadDir(path, (error: Error) => {
                    if (error) {
                        cc.error(error);
                        return reject(error);
                    }
                    resolve(true);
                });
            });
        })
    }

    public loadBundleDir(bundleUrl: string, path: string, onProgress?: Function) {
        return new Promise((resolve, reject) => {
            cc.assetManager.loadBundle(bundleUrl, (err: Error, bundle: cc.AssetManager.Bundle) => {
                if (err) {
                    cc.error(err);
                    return;
                }
                bundle.loadDir(path, (finish: number, total: number) => {
                    onProgress && onProgress(finish, total);
                }, (error: Error) => {
                    if (error) {
                        cc.error(error);
                        return reject(error);
                    }
                    resolve(true);
                });
            });
        })
    }

    /**
     * 动态加载并获取自定义bundle目录中的资源
     * @param bundlePath 自定义bundle地址
     * @param path bundle下的资源路径
     * @param type
     * @param callback
     * @returns asset
     */
    public loadBundleRes<T extends cc.Asset>(
        bundlePath: string = null,
        path: string,
        type: typeof cc.Asset,
        callback?: (asset: T) => void,
    ) {
        bundlePath = bundlePath || this._curSubGame.curUrl;
        return new Promise<T>((resolve, reject) => {
            cc.assetManager.loadBundle(bundlePath, (err: Error, bundle: cc.AssetManager.Bundle) => {
                if (err) {
                    cc.error(err);
                    return reject(err);
                }
                bundle.load(path, type, (error: Error, asset: T) => {
                    if (error) {
                        cc.log(error);
                        return reject(error);
                    } else {
                        callback && callback(asset);
                        return resolve(asset);
                    }
                });
            });
        });
    }

    /**
     * 获取自定义bundle目录中的资源 必须是已经加载完成的
     * @param bundlePath 自定义bundle地址
     * @param path bundle下的资源路径
     * @param type 类型化
     * @returns asset
     */
    public getBundleRes<T extends cc.Asset>(
        path: string,
        type: typeof cc.Asset,
        bundlePath: string = null
    ) {
        bundlePath = bundlePath || this._curSubGame.curUrl;
        let bundle = cc.assetManager.getBundle(cc.path.basename(bundlePath));
        let asset: T = bundle.get(path, type);
        return asset || null;
    }

    /**
     * 检测index是否正确
     */
    public checkSwitchIndexIsOk(switchIndex: number, isPreload: boolean) {
        /**编辑器环境没有switchIndex */
        if (!switchIndex) return true;
        if (isPreload && !this._curPreloadSubGame || !isPreload && !this._curSubGame) return false;
        let curSwitchIndex = isPreload ? this._curPreloadSubGame.switchIndex : this._curSubGame.switchIndex;
        if (switchIndex != curSwitchIndex) {
            return false;
        }
        return true;
    }

    private _cleanCurBundleData() {
        this._curSubGame = null;
    }

    public getLoadEditorDataById(coursewareId: string) {
        return coursewareId && this.gameEditorDataMap.get(coursewareId)?.editorData || null;
    }

    public set gamePanelIsOk(isOk: boolean) {
        this._gamePanelIsOk = isOk;
    }

    public get gameEditorDateIsOk() {
        return this._gameEditorDateIsOk;
    }

    public get gameEditorData() {
        return this.gameEditorDataMap.get(NetWork.coursewareId)?.editorData || null;
    }

    public set gameEditorData(data) {
        if (this.gameEditorData) {
            this.gameEditorData = data;
        } else {
            if (!NetWork.coursewareId) {
                NetWork.coursewareId = 0;
            }
            let value = { editorData: data, upLoadFileMap: null };
            this.gameEditorDataMap.set(NetWork.coursewareId, value);
        }
    }

    public get curSubGame() {
        return this._curSubGame;
    }

    public get curPreSubGame() {
        return this._curPreloadSubGame;
    }

}

export const GameBundleManager = GameBundleManagerClass.getInstance();
