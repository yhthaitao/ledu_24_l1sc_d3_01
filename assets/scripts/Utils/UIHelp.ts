import { MainMsgType } from '../Data/MainMsgType';
import { GameBundleManager, GamePanelType } from '../Manager/GameBundleManager';
import { ListenerManager } from '../Manager/ListenerManager';
import { EPANEL_ZORDER, UIManager } from '../Manager/UIManager';
import ErrorPanel from '../UI/Panel/ErrorPanel';
import { PopupTips, PopupTipsType } from '../UI/Panel/PopupTips';
import { TipUI } from '../UI/Panel/TipUI';


class UIHelpClass {
    private static _instance: UIHelpClass = null;

    public static getInstance(): UIHelpClass {
        if (!this._instance) {
            this._instance = new UIHelpClass();
        }
        return this._instance;
    }

    /**
     *
     * @param message tips文字内容
     */
    public showTip(message: string) {
        let tipUI = UIManager.getUI(TipUI) as TipUI;
        if (!tipUI) {
            UIManager.openUI(TipUI, null, EPANEL_ZORDER.TIPS, () => {
                this.showTip(message);
            });
        } else {
            tipUI.node.active = true;
            console.log("tipLog:" + message);
            tipUI.showTip(message);
        }
    }

    public showLoadingFull(status: boolean) {
        let loading = document.getElementById('loading-full');
        if (loading) {
            loading.style.display = status ? 'block' : 'none';
        }
    }

    /**
     * 错误弹窗
     * @param biaoTi 标题文字
     * @param shuoMing 错误说明
     * @param tiShi 提示文字
     * @param isChongLian 是否展示重连按钮
     * @param callBack 回调函数
     * @param isClose 是否可关闭
     */
    public showErrorPanel(
        shuoMing: string,
        biaoTi: string = "请点击顶部的刷新按钮，\n刷新游戏",
        tiShi?: string,
    ) {
        let errorPanel = UIManager.getUI(ErrorPanel) as ErrorPanel;
        if (!errorPanel) {
            UIManager.openUI(ErrorPanel, null, EPANEL_ZORDER.ERROR, () => {
                this.showErrorPanel(shuoMing, biaoTi, tiShi);
            });
        } else {
            errorPanel.node.active = true;
            errorPanel.setPanel(shuoMing, biaoTi, tiShi);
        }
    }

    /**
     * 通用弹框
     * @param type 1 带确认和取消的弹框-展示问号大宽   2 只有确认的弹框-展示摊手的大宽  3 只有取消的弹框-展示摊手的大宽
     * @param des   弹框信息
     * @param callback  点击按钮回调 参数 0-取消 1-确认
     * @param clickBgClose  是否可以点击背景关闭弹框 
     */
    public showPopupTips(
        type: PopupTipsType,
        des: string,
        callback: Function,
        clickBgClose?: boolean,
    ){
        let popupTipsPanel = UIManager.getUI(PopupTips) as PopupTips;
        if (!popupTipsPanel) {
            UIManager.openUI(PopupTips, null, EPANEL_ZORDER.POPUP, () => {
                this.showPopupTips(type, des, callback, clickBgClose);
            });
        } else {
            popupTipsPanel.node.active = true;
            popupTipsPanel.init(type, des, callback, clickBgClose);
        }
    }

    public closePopupTips() {
        UIManager.closeUI(PopupTips);
    }

    public closeErrorPanel() {
        UIManager.closeUI(ErrorPanel);
    }

    public showGamePanel(callback?: Function) {
        GameBundleManager.openPanel(GamePanelType.GamePanel, callback);
    }

    public closeGamePanel() {
        GameBundleManager.closePanel(GamePanelType.GamePanel);
    }

    public showTeacherPanel(callback?: Function) {
        GameBundleManager.openPanel(GamePanelType.TeacherPanel, callback);
    }

    public closeTeacherPanel() {
        GameBundleManager.closePanel(GamePanelType.TeacherPanel);
    }

    /**
     * 显示遮罩
     * @param isShowLoading 是否显示Loading
     */
    public showMask(isShowLoading: boolean = false) {
        ListenerManager.dispatch(MainMsgType.ON_MASK, true, isShowLoading);
    }

    /**
     * 隐藏遮罩
     */
    public closeMask() {
        ListenerManager.dispatch(MainMsgType.ON_MASK, false);
    }

    /**
     * 显示数据恢复遮罩
     */
    public showRecoverMask() {
        ListenerManager.dispatch(MainMsgType.MASK_RECOVER, true);
    }

    /**
     * 隐藏数据恢复遮罩
     */
    public closeRecoverMask() {
        ListenerManager.dispatch(MainMsgType.MASK_RECOVER, false);
    }
}
export const UIHelp = UIHelpClass.getInstance();
