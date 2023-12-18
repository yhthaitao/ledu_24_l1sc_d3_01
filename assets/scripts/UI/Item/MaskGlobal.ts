import { PackageType } from '../../Data/MainConstValue';
import { MainMsgType } from '../../Data/MainMsgType';
import { ListenerManager } from '../../Manager/ListenerManager';
import { EPANEL_ZORDER } from '../../Manager/UIManager';
import { UIHelp } from '../../Utils/UIHelp';
import BindNode from '../BindNode';

const { ccclass, property } = cc._decorator;

@ccclass
export default class MaskGlobal extends BindNode {
    public _nd_mask: cc.Node = null;
    public _nd_loading: cc.Node = null;
    public isShowLoading: boolean = false;

    onLoad() {
        //设置最层级
        this.node.zIndex = EPANEL_ZORDER.MASK;
    }

    start() {
        /**
         * 适用方法
         * ListenerManager.dispatch(MainMsgType.ON_MASK,true,true);
         */
        this._nd_mask.on(cc.Node.EventType.TOUCH_START, this.on_touchStart, this);
        ListenerManager.on(MainMsgType.ON_MASK, this.onMask, this, PackageType.Main);
        this._nd_loading.active = false;
        this._nd_mask.active = false;
    }

    onMask(isState: boolean, isShowLoading: boolean = false) {
        this._nd_mask.active = isState;
        this.isShowLoading = isShowLoading;
        this.SetLoading(this.isShowLoading);
    }

    on_touchStart() {
        // if (this.isShowLoading) {
        //     return;
        // }
        // UIHelp.showTip('请稍后再操作');
    }

    SetLoading(isShowLoading: boolean) {
        this._nd_loading.active = isShowLoading;
    }
}
