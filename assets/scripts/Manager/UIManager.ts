import { BaseUI, OpenUIData } from '../UI/BaseUI';
import { GameBundleManager } from './GameBundleManager';
class UIManagerClass {
    private static _instance: UIManagerClass = null;
    private uiList: Map<string, BaseUI> = new Map();
    private uiRoot: cc.Node = null;
    private stateList = new Object();
    public isGameShowing: boolean = true;
    public subGameIsLoading: boolean = false;
    public static getInstance(): UIManagerClass {
        if (null === this._instance) {
            this._instance = new UIManagerClass();
        }
        return this._instance;
    }

    constructor() {
        // this.uiRoot = cc.find("Canvas");
    }

    public loadUI(uiData: OpenUIData, callback?: Function, onProgress?: Function, ...args: any[]) {
        return new Promise<cc.Prefab>((resolve, reject) => {
            let progressFunc = (completedCount: number, totalCount: number, item: any) => {
                if (onProgress) {
                    onProgress(completedCount, totalCount, item);
                }
            };
            let completeFunc = (error: Error, asset: cc.Prefab) => {
                if (error) {
                    cc.log(error);
                    return reject(null);
                }
                if (callback) {
                    callback(asset);
                }
                return resolve(asset);
            };
            if (uiData.isMainPanel) {
                cc.resources.load(uiData.resPath, progressFunc, completeFunc);
            } else {
                if (!uiData.bundlePath) {
                    uiData.bundlePath = GameBundleManager.curSubGame.curUrl;
                }
                cc.assetManager.loadBundle(uiData.bundlePath, (err: Error, bundle: cc.AssetManager.Bundle) => {
                    if (err) {
                        cc.error(err);
                        return reject(null);
                    }
                    bundle.load(uiData.resPath, progressFunc, completeFunc);
                });
            }
        });
    }

    public async openUI(
        uiData: OpenUIData,
        data?: any,
        zOrder?: number,
        callback?: Function,
        onProgress?: Function,
        loadErr?: Function,
        ...args: any[]
    ) {
        if (!this.uiRoot) {
            this.uiRoot = cc.find('Canvas');
        }
        let loadedUI = this.getUI(uiData);
        this.stateList[uiData.className] = true;
        //已经加载过直接用
        if (loadedUI) {
            loadedUI.node.active = true;
            loadedUI.node.zIndex = zOrder;
            callback && callback(args);
            return true;
        }

        this.uiList.set(uiData.className, null);
        let prefab: cc.Prefab = null;
        let loadIsErr = false;
        //没有加载过的去加载
        prefab = await this.loadUI(uiData, (asset: cc.Asset) => { }, onProgress).catch((err) => {
            loadErr && loadErr(err);
            loadIsErr = true;
        }) as cc.Prefab;

        if (prefab && !loadIsErr && prefab.loaded) {
            if (!this.stateList[uiData.className]) {
                return true;
            }
            //因为有await延时，所以再次检测有没有
            loadedUI = this.getUI(uiData);
            //已经加载过直接用
            if (loadedUI) {
                loadedUI.node.active = true;
                loadedUI.node.zIndex = zOrder;
                callback && callback(args);
                return true;
            }

            let uiNode: cc.Node = cc.instantiate(prefab);
            uiNode.parent = this.uiRoot;
            uiNode.zIndex = zOrder;
            let ui = uiNode.getComponent(BaseUI);
            ui.data = data || null;
            ui.openUIData = uiData;
            ui.tag = uiData.className;
            this.uiList.set(uiData.className, ui);
            if (callback) {
                callback(args);
            }
            return true;
        } else {
            loadErr && loadErr();
            return false;
        }
    }

    public preLoadGamePanelUI(uiData: OpenUIData) {
        return new Promise((resolve, reject) => {
            cc.assetManager.loadBundle(uiData.bundlePath, (err: Error, bundle: cc.AssetManager.Bundle) => {
                if (err) {
                    return reject(err);
                }
                bundle.preload(uiData.resPath, cc.Prefab, (error: Error, items: cc.AssetManager.RequestItem[]) => {
                    if (error) {
                        return reject(error);
                    }
                    bundle.load(uiData.resPath, cc.Prefab, (error: Error, prefab: cc.Prefab) => {
                        if (error) {
                            return reject(error);
                        }
                        return resolve(prefab);
                    });
                });
            });
        })
    }

    public closeUI(uiData: OpenUIData) {
        this.stateList[uiData.className] = false;
        let ui = this.uiList.get(uiData.className);
        if (!ui) return;
        if (uiData.isMainPanel) {
            ui.node.active = false;
        } else {
            ui.node.destroy();
            this.uiList.delete(uiData.className);
        }
    }

    public closeAllUI() {
        this.uiList.forEach((ui, name) => {
            this.stateList[name] = false;
            if (!ui || !ui.openUIData) {
                ui && ui.node && ui.node.destroy();
                this.uiList.delete(name);
            } else {
                if (ui.openUIData.isMainPanel) {
                    ui.node.active = false;
                } else {
                    ui.node.destroy();
                    this.uiList.delete(name);
                }
            }

        });
    }

    public async showUI(uiData: OpenUIData, data?: any, zOrder?: number, callback?: Function) {
        let ui = this.getUI(uiData);
        if (ui) {
            this.stateList[uiData.className] = true;
            ui.data = data;
            ui.node.active = true;
            ui.onShow();
            if (callback) {
                callback();
            }
            return true;
        } else {
            const isOpen = await this.openUI(uiData, null, zOrder);
            if (isOpen) {
                callback && callback();
                let ui = this.getUI(uiData);
                ui.onShow();
            }
            return isOpen;
        }
    }

    public hideUI(uiData: OpenUIData) {
        let ui = this.getUI(uiData);
        if (ui) {
            this.stateList[uiData.className] = false;
            ui.node.active = false;
        }
    }

    public getUI<T extends BaseUI>(uiData: OpenUIData): T {
        return this.uiList.get(uiData.className) as T;
    }

    /**
     * 动态加载并获取resources目录中的资源
     * @param path resources下的资源路径
     * @param type
     * @param callback
     * @returns asset
     */
    public getRes<T extends cc.Asset>(path: string, type: typeof cc.Asset, callback?: (asset: T) => void) {
        return new Promise<T>((resolve, reject) => {
            cc.resources.load(path, type, (error: Error, asset: T) => {
                if (error) {
                    cc.log(error);
                    return reject(error);
                } else {
                    callback && callback(asset);
                    return resolve(asset);
                }
            });
        });
    }

    /**
     * 动态加载tResources中的资源
     * @param path tResources下的资源路径
     * @param type
     * @param callback
     * @returns asset
     */
    public getResourcesAssets<T extends cc.Asset>(
        path: string,
        type: typeof cc.Asset,
        callback?: (asset: T) => void,
    ) {
        return new Promise<T>((resolve, reject) => {
            cc.assetManager.resources.load(path, type, (err, asset: T) => {
                if (err) {
                    return reject(false);
                }
                callback && callback(asset);
                return resolve(asset);
            })
        });
    }
}

export const UIManager = UIManagerClass.getInstance();

export enum EPANEL_ZORDER {
    NORMAL = 1, //游戏界面
    LOADING = 5, //loading页面，需要盖上游戏
    POPUP = 10, //弹窗
    STARTPANEL = 12, //开始页面
    MASK = 15, //遮罩
    TIPS = 20, //提示框
    ERROR = 30, //错误提示
    SUBMISSION = 40, //提交答案
}
