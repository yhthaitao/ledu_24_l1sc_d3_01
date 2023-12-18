import { MainMsgType } from "../../../../../../scripts/Data/MainMsgType";
import { AliLogMsgType } from "../../../../../../scripts/Data/SDKMsgType";
import { NetWork } from "../../../../../../scripts/Http/NetWork";
import { ListenerManager } from "../../../../../../scripts/Manager/ListenerManager";
import { SoundManager } from "../../../../../../scripts/Manager/SoundManager";
import GameMsg from "../../../../../../scripts/SDK/GameMsg";
import BaseSubUI from "../../../../../../scripts/UI/BaseSubUI";
import { Tools } from "../../../../../../scripts/Utils/Tools";
import { SyncDataManager } from "../../Manager/SyncDataManager";
import { T2M } from "../../SDK/T2M";

const { ccclass, property } = cc._decorator;

@ccclass
export default class StartGameLayer_24_l1sc_d3_01 extends BaseSubUI {
    public static className = 'StartGameLayer_24_l1sc_d3_01';
    public static isCommonPanel = true;
    /**点击音效 */
    @property(cc.AudioClip)
    private audio_click: cc.AudioClip = null;
    /**是否点击过开始 */
    private _isClickStart: boolean = false;
    onLoad() {

    }

    protected onEnable(): void {
        this._isClickStart = false;

    }

    private onClickStartEnd() {
        GameMsg.reportAliLog(AliLogMsgType.reportCustomInfo, { msg: "点击开始游戏按钮", data: { isClickStart: this._isClickStart } });
        if (this._isClickStart) {
            return;
        }
        if (!NetWork.isTeacher) {
            SoundManager.unmute();
        }
        this.audio_click && SoundManager.playEffect(this.audio_click, false);
        this._isClickStart = true;
        T2M.dispatch(MainMsgType.ON_CLICK_GAME_START, null);
    }
}
