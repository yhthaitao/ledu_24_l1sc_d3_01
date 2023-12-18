import { PackageType } from '../../Data/MainConstValue';
import { MainMsgType } from '../../Data/MainMsgType';
import { ListenerManager } from '../../Manager/ListenerManager';

const { ccclass, property } = cc._decorator;

@ccclass
export default class TitileNode extends cc.Component {
    @property(cc.Label)
    bianJiLabel: cc.Label = null;
    @property(cc.Label)
    jianYanLabel: cc.Label = null;
    @property(cc.Node)
    tiaoNode: cc.Node = null;

    heiSe = cc.color(0, 0, 0);
    huiSe = cc.color(127, 127, 127);

    start() {
        this.bianJiLabel.node.color = this.heiSe;
        this.jianYanLabel.node.color = this.huiSe;
        this.tiaoNode.color = this.huiSe;
        ListenerManager.on(MainMsgType.ON_EDIT_STATE_SWITCHING, this.onStateSwitching, this, PackageType.Main);
    }

    onStateSwitching(state: number) {
        if (0 === state) {
            this.jianYanLabel.node.color = this.huiSe;
            this.tiaoNode.color = this.huiSe;
        } else {
            this.jianYanLabel.node.color = this.heiSe;
            this.tiaoNode.color = this.heiSe;
        }
    }
}
