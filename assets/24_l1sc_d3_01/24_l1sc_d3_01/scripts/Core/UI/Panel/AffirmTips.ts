import { MainMsgType } from '../../../../../../scripts/Data/MainMsgType';
import { T2M } from '../../SDK/T2M';
import { BaseUI } from '../../../../../../scripts/UI/BaseUI';
import { SubUIHelp } from '../../Utils/SubUIHelp';
import { MainConstValue } from '../../../../../../scripts/Data/MainConstValue';
import BaseSubUI from '../../../../../../scripts/UI/BaseSubUI';

const { ccclass, property } = cc._decorator;
@ccclass
export class AffirmTips_24_l1sc_d3_01 extends BaseSubUI {
    public static className = 'AffirmTips_24_l1sc_d3_01';
    public static isCommonPanel: boolean = true;
    @property(cc.Label)
    private des: cc.Label = null;
    @property(cc.Button)
    private close: cc.Button = null;
    @property(cc.Button)
    private ok: cc.Button = null;
    @property(cc.Node)
    private win: cc.Node = null; //描述节点
    @property(cc.Node)
    private fail: cc.Node = null; //描述节点

    private callback = null;
    private type: number;

    start() {
        T2M.addSyncEventListener(MainMsgType.AFFIRMTIPS_SURE, this.disposeOk.bind(this));
        T2M.addSyncEventListener(MainMsgType.AFFIRMTIPS_CANCEL, this.disposeCancel.bind(this));
    }

    //type 1 带问号的大宽   2 摊手大宽
    init(type: number, des: string, callback: any, isOnlyYesBtn?: boolean, isOnlyCloseBtn?: boolean) {
        this.des.node.active = true;
        this.win.active = type == 1;
        this.fail.active = type == 2;
        this.type = type;
        this.callback = callback;
        //console.log("到了初始化");
        //Tools.playSpine(this.sp_BgAnimator, "fault", false);
        this.des.string = des;
        this.win.active = isOnlyYesBtn;
        this.fail.active = isOnlyCloseBtn;
    }

    setOnlyOneBtnType(btnOkDes?: string) {
        this.close.node.active = false;
        this.ok.node.active = true;
        this.ok.node.position = cc.v3(0, this.ok.node.position.y, 0);
    }

    OnClickClose() {
        //console.log("关闭");
    }

    //通用动画
    TipsAnimatorScale(nodeObj: cc.Node) {
        nodeObj.stopAllActions();
        var seq = cc.sequence(cc.delayTime(1), cc.scaleTo(0.2, 1, 1));
        nodeObj.runAction(seq);
        // nodeObj.runAction(cc.scaleTo(0.2, 1, 1));
    }

    //ok 1 确认 0 取消
    OnClickOk() {
        console.log('确认');
        T2M.dispatch(MainMsgType.AFFIRMTIPS_SURE, null);
    }

    OnClickCancel() {
        console.log('取消');
        T2M.dispatch(MainMsgType.AFFIRMTIPS_CANCEL, null);
    }

    disposeOk() {
        SubUIHelp.closeAffirmTip();
        this.callback && this.callback(1);
    }

    disposeCancel() {
        SubUIHelp.closeAffirmTip();
        this.callback && this.callback(0);
    }

    // update (dt) {}
}
