import { MainMsgType } from './Data/MainMsgType';
import { NetWork } from './Http/NetWork';
import { ListenerManager } from './Manager/ListenerManager';
import { SoundManager } from './Manager/SoundManager';
import { EPANEL_ZORDER, UIManager } from './Manager/UIManager';
import GameMsg from './SDK/GameMsg';
import { LoadingUI } from './UI/Panel/LoadingUI';
import { GameBundleManager, SubGameInitData } from './Manager/GameBundleManager';
import { GameLoadErrType, MainConstValue } from './Data/MainConstValue';
import { UIHelp } from './Utils/UIHelp';
import { AliLogMsgType } from './Data/SDKMsgType';
import { PopupTipsType } from './UI/Panel/PopupTips';

const { ccclass, property } = cc._decorator;

// 开启抗锯齿
cc.macro.ENABLE_WEBGL_ANTIALIAS = true;
@ccclass
export class GameMain extends cc.Component {
    onLoad() {
        this.loadMainAssets();
    }

    private async loadMainAssets() {
        NetWork.setNetWorkData();
        this.reportVersion();
        cc.game.setFrameRate(NetWork.gameFps || 30);
        let isErr = false;
        await SoundManager.loadMainAudioClips().catch(() => {
            GameMsg.requestLoadErr(GameLoadErrType.MainGameLoadErr);
            isErr = true;
        });
        if (isErr) return;
        GameMsg.reportAliLog(AliLogMsgType.reportCustomInfo, {msg:"主包音频加载成功"});
        await UIManager.openUI(LoadingUI, null, EPANEL_ZORDER.LOADING, () => {
            cc.log("")
        }, null, () => {
            GameMsg.requestLoadErr(GameLoadErrType.MainGameLoadErr);
            isErr = true;
        });
        if (isErr) return;
        GameMsg.reportAliLog(AliLogMsgType.reportCustomInfo, {msg:"loading页面加载成功"});
        /** 目前只有编辑器才可以上传，如果游戏中也需要上传，可以去掉这个判断 */
        if (MainConstValue.IS_TEACHER || CC_DEBUG) {
            await this.getCosData().catch(() => {
                isErr = true;
                GameMsg.requestLoadErr(GameLoadErrType.MainGameLoadErr);
            });
        }
        if (isErr) return;

        NetWork.isSubGame && GameMsg.requestMainResLoadEnd();

        console.log('引擎资源加载完成');
        UIHelp.showLoadingFull(false);
        if (NetWork.isOffline) { //课件离线模式需要先发gameStart,否则获取不到离线json数据（端上逻辑收到game_Start才给json。。。。）
            // 发送GameStart
            GameMsg.gameStart();
        }
        if (NetWork.isSubGame || MainConstValue.GAME_NAME == 'maingame_cocos') {
            GameBundleManager.gameIsHide = true;
            cc.game.pause();
        } else {
            if (!NetWork.gameName) NetWork.gameName = MainConstValue.GAME_NAME;
            let game_data: SubGameInitData = {
                name: NetWork.gameName, urlList: [NetWork.gameName],
                params: { coursewareId: NetWork.coursewareId, isSync: NetWork.isSync, supportKeepAndRestart: NetWork.isSupportKeepPlay}
            };
            GameBundleManager.switchGame({ data: game_data });
        }
        /**主包加载完成再添加监听 */
        this.addSDKEventListener();
        GameBundleManager.init();
    }

    /**上报版本信息 */
    private reportVersion() {
        if (NetWork.isSubGame) {
            /**分包情况 记录主包版本 统计灰度情况*/
           GameMsg.reportDarkTag(NetWork.chapterId, NetWork.gradeId, NetWork.belongCityId, MainConstValue.MainGameVer, NetWork.gameId);
       } else {
           GameMsg.reportAliLog(AliLogMsgType.reportCustomInfo, {
               msg: '全量包主包版本', data: {
                   chapterId: NetWork.chapterId,
                   gradeId: NetWork.gradeId,
                   belongCityId: NetWork.belongCityId,
                   mainGameVer: MainConstValue.MainGameVer,
                   gameId: NetWork.gameId
               }
           });
       }
    }

    /**
     * 获取对象数据存储需要的配置
     * 由于uploadFiles时候才会走new COS({请求})里边的请求，此时uploadFiles里边使用的会是初始化的bucket和region
     * ，所以进游戏先获取bucket和region
     * @returns 
     */
    private async getCosData() {
        return new Promise((resolve, reject) => {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', NetWork.COS_URL, true);
            xhr.setRequestHeader('token', 'cocos');
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.timeout = 2000;
            xhr.onload = (e: any) => {
                var data = JSON.parse(e.target.responseText);
                GameMsg.setCosData({
                    bucket: data.bucketName,
                    region: data.endpoint,
                    url: NetWork.COS_URL
                })
                resolve(true);
            };
            xhr.onerror = ((err) => {
                reject(err);
            })
            xhr.ontimeout = (() => {
                reject();
            })
            xhr.send('');
        })
    }

    private addSDKEventListener() {
        GameMsg.pauseGame(this.pauseGame.bind(this));
        GameMsg.recv_show_gamePanel(this.onReceiveGameShow.bind(this));
        GameMsg.recv_hide_gamePanel(this.onReceiveGameHide.bind(this));
        GameMsg.recv_keep_playing(this.onReceiveKeepPlaying.bind(this));
        GameMsg.recv_cancel_keep_playing(this.onReceiveCancellKeepPlaying.bind(this));
        GameMsg.recv_restart(this.onReceiveRestart.bind(this));
        GameMsg.recv_is_master(this.onReceiveIsMaster.bind(this));
        GameMsg.addGameStopEvent(this.onSDKMsgStopReceived.bind(this));
        GameMsg.recv_sync_data(this.onactionSyncHandler.bind(this));
        GameMsg.recv_cancel_authorization(this.onRecvCancelAuthorization.bind(this));
        GameMsg.recv_open_authorization(this.onRecvOpenAuthorization.bind(this));
    }

    /** 打开授权 */
    private onRecvOpenAuthorization(data: any) {
        UIHelp.closeRecoverMask();
        let isRecover = data && data.data && data.data.isRecover || false;
        NetWork.isAuthorization = true;
        GameMsg.reportAliLog(AliLogMsgType.reportGameAuthChange, { isRecover: isRecover, isAuth: true });
        ListenerManager.dispatch(MainMsgType.UPDATE_AUTHORIZATION, isRecover);
    }

    /** 取消授权 */
    private onRecvCancelAuthorization() {
        NetWork.isAuthorization = false;
        GameMsg.reportAliLog(AliLogMsgType.reportGameAuthChange, { isAuth: false });
        ListenerManager.dispatch(MainMsgType.UPDATE_AUTHORIZATION);
    }

    /** mcc暂停游戏 */
    private async pauseGame() {
        GameMsg.reportAliLog(AliLogMsgType.pauseGame, { curSubGame: GameBundleManager.curSubGame, gameIsHide: GameBundleManager.gameIsHide });
        console.log('测试提示---pauseGame');
        GameBundleManager.cleanOldData();
        this.showLoadPanel().then(()=>{
            if (!GameBundleManager.gameIsHide) {
                GameBundleManager.gameIsHide = true;
                cc.game.pause();
            }
        })
    }

    private async showLoadPanel(){
        return new Promise((resolve, reject) => {
            UIManager.showUI(LoadingUI, null, EPANEL_ZORDER.LOADING, ()=>{
                return resolve(true);
            });
        })
    }

    private onactionSyncHandler(data: any) {
        ListenerManager.dispatch(MainMsgType.RECV_SYNC_DATA, data);
    }

    private onSDKMsgStopReceived() {
        ListenerManager.dispatch(MainMsgType.STOP);
    }

    /**
     * 监听接着玩
     */
    private onReceiveKeepPlaying() {
        console.log('onReceiveKeepPlaying');
        if (!UIManager.isGameShowing) return;
        ListenerManager.dispatch(MainMsgType.REC_KEEP_PLAYING);
    }

    /**
     * 监听取消接着玩
     */
    private onReceiveCancellKeepPlaying() {
        console.log('onReceiveCancellKeepPlaying');
        if (!UIManager.isGameShowing) return;
        ListenerManager.dispatch(MainMsgType.REC_CANCEL_KEEP_PLAYING);
    }

    /**
     * 监听重新玩
     */
    private onReceiveRestart() {
        console.log('onReceiveRestart');
        if (!UIManager.isGameShowing) return;
        ListenerManager.dispatch(MainMsgType.REC_RESTART);
        this.scheduleOnce(() => {
            UIHelp.showGamePanel();
        });
    }

    /**
     * 监听窗口打开
     */
    private onReceiveGameShow() {
        console.log('onReceiveGameShow');
        if (UIManager.isGameShowing) return;

        UIManager.isGameShowing = true;
        ListenerManager.dispatch(MainMsgType.PRELOAD_GAME_SHOW);
        ListenerManager.dispatch(MainMsgType.REC_GAME_SHOW);
    }

    /**
     * 监听窗口关闭
     */
    private onReceiveGameHide() {
        console.log('onReceiveGameHide');
        if (!UIManager.isGameShowing) return;
        UIManager.isGameShowing = false;
        SoundManager.stopAll();
        ListenerManager.dispatch(MainMsgType.REC_GAME_HIDE);
        if (!NetWork.isSubGame) {
            this.scheduleOnce(() => {
                UIHelp.showGamePanel();
            });
        }
    }

    /**
     * 监听是否为主动发送心跳的一端
     */
    private onReceiveIsMaster(data: any) {
        NetWork.isMaster = data.data;
        if (!NetWork.isMaster) {
            UIHelp.showRecoverMask();
        } else {
            //如果是老版本 直接关闭mask 新版本在onRecvOpenAuthorization关闭
            if (!NetWork.isMCCVersion2()) {
                UIHelp.closeRecoverMask();
            }
        }
        GameMsg.reportAliLog(AliLogMsgType.reportGameIsMasterChange, { isMaster: data.data });
        ListenerManager.dispatch(MainMsgType.REC_IS_MASTER);
    }
}
