import { MainConstValue } from '../../../../../../scripts/Data/MainConstValue';
import { MainMsgType } from '../../../../../../scripts/Data/MainMsgType';
import { AliLogMsgType } from '../../../../../../scripts/Data/SDKMsgType';
import { NetWork } from '../../../../../../scripts/Http/NetWork';
import { CosManager } from '../../../../../../scripts/Manager/CosManager';
import { GameBundleManager } from '../../../../../../scripts/Manager/GameBundleManager';
import { ListenerManager } from '../../../../../../scripts/Manager/ListenerManager';
import { SoundManager } from '../../../../../../scripts/Manager/SoundManager';
import { UIManager, EPANEL_ZORDER } from '../../../../../../scripts/Manager/UIManager';
import GameMsg from '../../../../../../scripts/SDK/GameMsg';
import BaseSubUI from '../../../../../../scripts/UI/BaseSubUI';
import { UIHelp } from '../../../../../../scripts/Utils/UIHelp';
import { ConstValue } from '../../../Data/ConstValue';
import { EditorManager } from '../../../Manager/EditorManager';
import { ReportManager } from '../../Manager/ReportManager';
import { SyncDataManager, SyncData } from '../../Manager/SyncDataManager';
import { T2M, Action, SendData } from '../../SDK/T2M';
import { SubUIHelp } from '../../Utils/SubUIHelp';
import StartGameLayer_24_l1sc_d3_01 from './StartGameLayer';


const { ccclass, property } = cc._decorator;

@ccclass
export default class BaseGamePanel_24_l1sc_d3_01 extends BaseSubUI {
    public static className = 'BaseGamePanel_24_l1sc_d3_01';
    public static isCommonPanel = true;
    private _isPanelReady: boolean = false;

    start() {
        GameMsg.reportDarkTag(NetWork.chapterId, NetWork.gradeId, NetWork.belongCityId, ConstValue.SubGameVer, NetWork.gameId);
        ListenerManager.on(MainMsgType.GAME_PANEL_READ, this.gameAndDataIsOk, this);
        ListenerManager.on(MainMsgType.ON_SWITCH_GAME, this.onCleanGameData, this);
        GameBundleManager.gamePanelIsOk = true;
        console.log('测试提示-主页面加载成功')
        if (NetWork.isMCCVersion2() || NetWork.isTeacher) {
            SoundManager.mute(ConstValue['USE_SPECIAL_SOUND']);
        }
        if (!MainConstValue.IS_TEACHER && GameBundleManager.gameEditorDateIsOk) {
            this.scheduleOnce(() => {
                GameBundleManager.finishedLoading();
                this.gameAndDataIsOk();
            });
        }
        this.addSDKEventListener();
        if (NetWork.isSync && !NetWork.isMaster) {
            UIHelp.showRecoverMask();
        }
        if (MainConstValue.IS_TEACHER) {
            ListenerManager.dispatch(MainMsgType.TEACHER_PANEL_LOADING, false);
            this.scheduleOnce(() => {
                this.panelReady();
            });
            SubUIHelp.showUploadAndReturnPanel();
            // 发送GameStart
            GameMsg.gameStart();
        }
    }

    onCleanGameData() {
        T2M.reset();
        SyncDataManager.initSyncData();
    }

    /**
     * 游戏和数据都准备好了 检测数据准确性，进入游戏
     */
    gameAndDataIsOk() {
        console.log('测试提示-进入游戏----');
        /**课件离线加载获取json需要先发gameStart----否则获取不到，所以isOffline存在时候需要提前发送gameStart */
        if (!NetWork.isOffline) {
            // 发送GameStart
            GameMsg.gameStart();
        }
        if (GameBundleManager.gameEditorData.CoursewareKey == ConstValue.CoursewareKey) {
            EditorManager.setData(GameBundleManager.gameEditorData.data);
            this.panelReady();
        } else {
            // coursewareKey错误
            GameMsg.differntKey('CoursewareKey错误！');
            UIHelp.showErrorPanel('CoursewareKey错误');
        }
    }

    onDestroy() {
        super.onDestroy();
        UIHelp.closeMask();
        ReportManager.reportGameOver();
        T2M.onReturnToTeacherPanel();
    }

    private panelReady() {
        this._isPanelReady = true;
        if (UIManager.isGameShowing) {
            this.setPanel();
        } else {
            cc.game.pause();
        }
    }

    protected setPanel() {
        T2M.init();
        SyncDataManager.initSyncData();
        ReportManager.initReportData(EditorManager.getLevelCount());
        if (NetWork.isTeacher || !NetWork.isSync) {
            UIHelp.closeRecoverMask();
        }
        this.showCommonStartLayer();
        GameBundleManager.preLoadBundleDir(GameBundleManager.curSubGame.curUrl, 'res/core/prefab/panel/OverTips');
    }

    protected onRecoveryData(recovery: SyncData) {
        SyncDataManager.setSyncData(recovery);
        if (SyncDataManager.syncData.frameSyncData.isGameOver) {
            SubUIHelp.closeStartLayer();
            this.showGameOverPanel(true);
        } else {
            SubUIHelp.closeOverTips();
            this.showCommonStartLayer();
        }
    }

    protected answerRight(isCurLevelFinish: boolean) {
        ReportManager.reportLevelResult(true, isCurLevelFinish);
    }

    protected answerWrong(isCurLevelFinish: boolean = false) {
        ReportManager.reportLevelResult(false, isCurLevelFinish);
    }

    protected gameOver(showOverPanel = true) {
        SyncDataManager.syncData.frameSyncData.isGameOver = true;
        if (showOverPanel) {
            this.showGameOverPanel();
        }
    }

    protected showGameOverPanel(isRecovery = false) {
        UIHelp.showMask();
        SoundManager.stopAll();
        if (ConstValue['NOT_SHOW_OVER_PANEL']) {
            return;
        }
        let isShowReplay: boolean =
            EditorManager.editorData.isReplay &&
            SyncDataManager.syncData.frameSyncData.hasReplayCount < EditorManager.editorData.replayCount;
        SubUIHelp.showOverTips(isShowReplay, isRecovery);
    }

    private onGameShow() {
        if (this._isPanelReady) {
            cc.game.resume();
            this.setPanel();
        }
    }

    protected onReplay() {
        SubUIHelp.closeOverTips();

        SyncDataManager.replay();
        ReportManager.replayGame();
    }

    private addSDKEventListener() {
        // 小组课
        ListenerManager.on(MainMsgType.STOP, this.onSDKMsgStopReceived.bind(this), this);
        // 小班课
        ListenerManager.on(MainMsgType.ON_RECOVERY_DATA, this.onRecoveryData, this);

        T2M.addSyncEventListener(MainMsgType.REPLAY_START, this.onReplay.bind(this));

        T2M.addSyncEventListener(MainMsgType.ON_CLICK_GAME_START, this.onClickGameStart.bind(this));

        // 预加载：监听窗口打开
        ListenerManager.on(MainMsgType.PRELOAD_GAME_SHOW, this.onGameShow.bind(this), this);

        ListenerManager.on(MainMsgType.REC_KEEP_PLAYING, this.recKeepPlaying, this);
        ListenerManager.on(MainMsgType.REC_CANCEL_KEEP_PLAYING, this.recCancelKeepPlaying, this);
        ListenerManager.on(MainMsgType.REC_RESTART, this.recRestart, this);
        ListenerManager.on(MainMsgType.REC_IS_MASTER, this.recIsMaster, this);

        ListenerManager.on(MainMsgType.REC_GAME_HIDE, this.recGameHide, this);
        ListenerManager.on(MainMsgType.REC_GAME_SHOW, this.recGameShow, this);

        ListenerManager.on(MainMsgType.UPDATE_AUTHORIZATION, this.updateAuthorization, this);

        ListenerManager.on(MainMsgType.ON_CLICK_GAME_START, this.onGameStart, this);
    }

    private recKeepPlaying() {
        //发送接着玩数据
        let syncAction = new Action();
        syncAction.type = MainMsgType.ON_HEART_BREAK;
        // syncAction.syncData.frameSyncData.actionId = -1;
        let sendData = new SendData(true, [syncAction]);
        GameMsg.request_keep_playing(sendData);
        // UIHelp.showRecoverMask();

    }

    private recCancelKeepPlaying() {
        T2M.setFastHeartBreakState();
    }

    private recRestart() {
        //发送重新玩成功回调
        GameMsg.request_restart_over();
        SoundManager.stopAll();
        SyncDataManager.initSyncData();
        ReportManager.initReportData(EditorManager.editorData.levelCount);
        SubUIHelp.closeOverTips();
        SubUIHelp.closeAffirmTip();
        SubUIHelp.closeStartLayer();
        UIHelp.closeGamePanel();
    }

    private recIsMaster() {
        if (!NetWork.isMaster) {
            T2M.isRecover = false;
            if (0 !== SyncDataManager.syncData.frameSyncData.actionId) {
                SyncDataManager.syncData.frameSyncData.actionId = -999;
            }
        }
        console.log(`onReceiveIsMaster isMaster: ${NetWork.isMaster}`);
    }

    private recGameHide() {
        if (NetWork.isSubGame) {
            SyncDataManager.initSyncData();
            ReportManager.initReportData(EditorManager.editorData.levelCount);
            T2M.isRecover = false;
            this.onRecoveryData(SyncDataManager.getSyncData());
        } else {
            T2M.isRecover = false;
            SyncDataManager.initSyncData();
            ReportManager.initReportData(EditorManager.editorData.levelCount);
            SubUIHelp.closeOverTips();
            SubUIHelp.closeAffirmTip();
            SubUIHelp.closeStartLayer();
            UIHelp.closeGamePanel();
        }
    }

    private recGameShow() {

    }

    private updateAuthorization(isRecover: boolean) {
        /**重连给到的数据不算重新授权 不重制isClickedStartBtn */
        if (!isRecover) {
            SyncDataManager.getSyncData().frameSyncData.isClickedStartBtn = false;
        }
        this.showCommonStartLayer();
        //取消授权时候 静音
        if (!NetWork.isAuthorization) {
            SoundManager.mute(ConstValue['USE_SPECIAL_SOUND']);
        }
    }

    /**
     * 
     * @param isOld  兼容老版本，默认展示开始按钮
     * @returns 
     */
    private showCommonStartLayer() {
        if (!ConstValue['USE_COMMON_START_PANEL']) {
            //不使用通用开始页的，收到授权的学生恢复声音
            if (NetWork.isAuthorization && !NetWork.isTeacher) {
                SoundManager.unmute();
            }
            return;
        }
        //被授权的学生已经点过开始按钮的恢复声音 没有点击过开始按钮的 需要点击开始按钮后恢复
        if (!NetWork.isTeacher && NetWork.isAuthorization && SyncDataManager.syncData.frameSyncData.isClickedStartBtn) {
            SoundManager.unmute();
        }
        let isOld = !NetWork.isMCCVersion2();
        //非同步、教师、授权、老版本 没有点击过开始按钮的展示开始页面,否则关闭开始页面
        if ((!NetWork.isSync || NetWork.isTeacher || NetWork.isAuthorization || isOld) && !SyncDataManager.syncData.frameSyncData.isClickedStartBtn) {
            UIManager.openUI(StartGameLayer_24_l1sc_d3_01, null, EPANEL_ZORDER.STARTPANEL);
        } else {
            SubUIHelp.closeStartLayer();
        }
    }

    protected onGameStart() {

    }

    public onClickGameStart() {
        /**收到点击事件 */
        GameMsg.reportAliLog(AliLogMsgType.reportCustomInfo, { msg: "收到点击开始游戏按钮", data: { frameSyncData: SyncDataManager.syncData.frameSyncData } });
        SyncDataManager.getSyncData().frameSyncData.isClickedStartBtn = true;
        SubUIHelp.closeStartLayer();
        if (SyncDataManager.getSyncData().frameSyncData.isGameStart) {
            SyncDataManager.getSyncData().frameSyncData.isGameStart = false;
            ListenerManager.dispatch(MainMsgType.ON_CLICK_GAME_START);
        } else if (SyncDataManager.getSyncData().frameSyncData.isGameStart == undefined) {
            SyncDataManager.getSyncData().frameSyncData.isGameStart = false;
            /**兼容授课端老开始页学生新开始页的情况 */
            ListenerManager.dispatch(MainMsgType.ON_CLICK_GAME_START, { isOldClick: true });
        }
    }

    // 游戏结束消息监听
    private onSDKMsgStopReceived() {
        //各游戏独立处理  先上报当前作答数据  后发送finish消息
        GameMsg.gameStop();
        //新课堂上报
        ReportManager.reportGameOver();
        GameMsg.finished();
    }

    update(dt) {
        T2M.update();
    }
}
