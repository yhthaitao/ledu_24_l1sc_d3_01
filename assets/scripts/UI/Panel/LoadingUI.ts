import { MainConstValue, PackageType } from '../../Data/MainConstValue';
import { MainMsgType } from '../../Data/MainMsgType';
import { GameBundleManager } from '../../Manager/GameBundleManager';
import { ListenerManager } from '../../Manager/ListenerManager';
import { UIManager } from '../../Manager/UIManager';
import GameMsg from '../../SDK/GameMsg';
import BaseMainUI from '../BaseMainUI';

const { ccclass, property } = cc._decorator;

@ccclass
export class LoadingUI extends BaseMainUI {
    public static className = 'LoadingUI';

    private _pb_loading: cc.Node = null;
    private _lb_percent: cc.Node = null;

    onLoad() {
        this.setLoadingProgressUI(0);
        ListenerManager.on(MainMsgType.GAME_LOAD_PROGRESS, this.setLoadingProgressUI, this, PackageType.Main);
    }

    setLoadingProgressUI(value: number) {
        this._pb_loading.getComponent(cc.ProgressBar).progress = value / 100;
        this._lb_percent.getComponent(cc.Label).string = value.toString() + '%';
    }
}
