import { PackageType } from '../../Data/MainConstValue';
import { MainMsgType } from '../../Data/MainMsgType';
import { ListenerManager } from '../../Manager/ListenerManager';
import { EPANEL_ZORDER } from '../../Manager/UIManager';
import { UIHelp } from '../../Utils/UIHelp';
import BindNode from '../BindNode';

const { ccclass, property } = cc._decorator;

@ccclass
export default class MaskRecover extends BindNode {
    public _nd_mask: cc.Node = null;
    public _nd_loading: cc.Node = null;
    public isShowLoading: boolean = false;

    onLoad() {
        //设置最层级
        this.node.zIndex = EPANEL_ZORDER.MASK;
    }

    start() {
        ListenerManager.on(MainMsgType.MASK_RECOVER, this.onMask, this, PackageType.Main);
        this._nd_loading.active = false;
        this._nd_mask.active = false;
    }

    onMask(isState: boolean) {
        this._nd_mask.active = isState;
    }
}
