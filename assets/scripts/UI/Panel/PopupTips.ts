import { MainMsgType } from "../../Data/MainMsgType";
import BaseMainUI from "../BaseMainUI";

/**
 * 弹窗类型 
*/
export enum PopupTipsType {
    /**1 带确认和取消的弹框-展示问号大宽 */
    ConfirmAndCancel = 1,
    /**2 只有确认的弹框-展示摊手的大宽 */
    OnlyConfirm,
    /**3 只有取消的弹框-展示摊手的大宽 */
    OnlyCancel
}

const { ccclass, property } = cc._decorator;
@ccclass
export class PopupTips extends BaseMainUI {
    public static className = 'PopupTips';
    @property(cc.Label)
    private des: cc.Label = null;
    @property(cc.Button)
    private cancel: cc.Button = null;
    @property(cc.Button)
    private ok: cc.Button = null;
    @property(cc.Node)
    private why: cc.Node = null; //大宽疑问图片
    @property(cc.Node)
    private tanshou: cc.Node = null; //大宽摊手图片
    private callback = null;
    private clickBgClose: boolean = false;

    start() {
    }

    onDestroy(): void {
    }

    /**
     * 弹框初始化方法
     * @param type 1 带确认和取消的弹框-展示问号大宽   2 只有确认的弹框-展示摊手的大宽  3 只有取消的弹框-展示摊手的大宽 
     * @param des 弹框信息
     * @param callback 点击按钮回调 参数 0-取消 1-确认
     * @param clickBgClose 是否可以点击背景关闭弹框
     */
    init(type: PopupTipsType, des: string, callback: any, clickBgClose?: boolean) {
        this.des.node.active = true;
        this.why.active = type == PopupTipsType.ConfirmAndCancel;
        this.tanshou.active = type == PopupTipsType.OnlyCancel || type == PopupTipsType.OnlyConfirm;
        this.ok.node.active = type == PopupTipsType.ConfirmAndCancel || type == PopupTipsType.OnlyConfirm;
        this.cancel.node.active = type == PopupTipsType.ConfirmAndCancel || type == PopupTipsType.OnlyCancel;
        this.callback = callback;
        this.des.string = des;
        this.clickBgClose = clickBgClose;
    }    

    onClickClose() {
        if(!this.clickBgClose) {
            return;
        }
        console.log("关闭");
        this.onClickCancel();
    }

    //通用动画
    private _tipsAnimatorScale(nodeObj: cc.Node) {
        nodeObj.stopAllActions();
        var seq = cc.sequence(cc.delayTime(1), cc.scaleTo(0.2, 1, 1));
        nodeObj.runAction(seq);
        // nodeObj.runAction(cc.scaleTo(0.2, 1, 1));
    }

    //ok 1 确认 0 取消
    onClickOk() {
        console.log('确认');
        console.log('确认');
        this.node.active = false;
        this.callback && this.callback(1);
    }

    onClickCancel() {
        console.log('取消');
        console.log('取消');
        this.node.active = false;
        this.callback && this.callback(0);
    }
}
