import { UIManager, EPANEL_ZORDER } from "../../../../../scripts/Manager/UIManager";
import { AffirmTips_24_l1sc_d3_01 } from "../UI/Panel/AffirmTips";
import { OverTips_24_l1sc_d3_01 } from "../UI/Panel/OverTips";
import StartGameLayer_24_l1sc_d3_01 from "../UI/Panel/StartGameLayer";
import SubmissionPanel_24_l1sc_d3_01 from "../UI/Panel/SubmissionPanel";
import UploadAndReturnPanel_24_l1sc_d3_01 from "../UI/Panel/UploadAndReturnPanel";


class SubUIHelpClass {
    private static _instance: SubUIHelpClass = null;

    public static getInstance(): SubUIHelpClass {
        if (!this._instance) {
            this._instance = new SubUIHelpClass();
        }
        return this._instance;
    }

    /**
     * 二次确认框
     * @param type tips类型  0:内容tips   1:系统tips
     * @param des tips文字内容
     * @param callback 按钮回调
     */
    public showAffirmTip(
        type: number,
        des: string,
        callback: (type: number) => void,
        test1?: any,
        test2?: any
    ) {
        let affirmTips = UIManager.getUI(AffirmTips_24_l1sc_d3_01) as AffirmTips_24_l1sc_d3_01;
        if (!affirmTips) {
            UIManager.openUI(AffirmTips_24_l1sc_d3_01, null, EPANEL_ZORDER.POPUP, () => {
                this.showAffirmTip(type, des, callback);
            });
        } else {
            affirmTips.node.active = true;
            affirmTips.init(type, des, callback);
        }
    }

    public closeAffirmTip() {
        UIManager.closeUI(AffirmTips_24_l1sc_d3_01);
    }

    public closeStartLayer() {
        UIManager.closeUI(StartGameLayer_24_l1sc_d3_01);
    }

    /**
     * 结束tip
     * @param type tips类型   0: 错误  1：答对了  2：闯关成功(一直显示不会关闭)
     * @param {string} str           提示内容
     * @param {Function} callback    回调函数
     * @param {string} endTitle      end动效提示文字
     * @param {boolean} isShowReplay     是否显示重玩按钮
     * @param {boolean} isShowClose     是否显示关闭按钮
     * @param {boolean} autoOff     是否自动关闭
     */
    public showOverTips(
        isShowReplay?: boolean,
        isRecovery?: boolean,
    ) {
        let overTips = UIManager.getUI(OverTips_24_l1sc_d3_01) as OverTips_24_l1sc_d3_01;
        if (!overTips) {
            UIManager.openUI(OverTips_24_l1sc_d3_01, null, EPANEL_ZORDER.POPUP, () => {
                this.showOverTips(isShowReplay, isRecovery);
            });
        } else {
            overTips.node.active = true;
            overTips.init(isShowReplay, isRecovery);
        }
    }

    public closeOverTips() {
        UIManager.closeUI(OverTips_24_l1sc_d3_01);
    }

    /**
     * 提交、返回
     */
    public showUploadAndReturnPanel() {
        UIManager.showUI(UploadAndReturnPanel_24_l1sc_d3_01, null, EPANEL_ZORDER.SUBMISSION);
    }

    public closeUploadAndReturnPanel() {
        UIManager.closeUI(UploadAndReturnPanel_24_l1sc_d3_01);
    }

    public showSubmissionPanel() {
        UIManager.showUI(SubmissionPanel_24_l1sc_d3_01, null, EPANEL_ZORDER.SUBMISSION);
    }

    public closeSubmissionPanel() {
        UIManager.closeUI(SubmissionPanel_24_l1sc_d3_01);
    }
}
export const SubUIHelp = SubUIHelpClass.getInstance();
