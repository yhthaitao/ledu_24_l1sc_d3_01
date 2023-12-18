import { UIHelp } from '../../Utils/UIHelp';
import { SoundManager } from '../../Manager/SoundManager';
import GameMsg from '../../SDK/GameMsg';
import BaseMainUI from '../BaseMainUI';

const { ccclass, property } = cc._decorator;

@ccclass
export default class ErrorPanel extends BaseMainUI {
    public static className = 'ErrorPanel';
    @property(cc.Label)
    biaoTi: cc.Label = null;
    @property(cc.Label)
    shuoMing: cc.Label = null;
    @property(cc.Label)
    tiShi: cc.Label = null;
    @property(cc.AudioClip)
    err_audio: cc.AudioClip = null;

    isClose: boolean = false;
    callback: Function;
    start() {
        // cc.director.pause();
    }

    onLoad() { }
    /**
     * 设置错误弹窗数据
     * @param shuoMing 错误说明
     * @param biaoTi 标题文字
     * @param tiShi 提示文字
     * @param callBack 回调函数
     * @param isClose 是否可关闭
     */
    setPanel(
        shuoMing?: string,
        biaoTi?: string,
        tiShi?: string,
        callBack?: Function,
    ) {
        let data = {
            shuoMing: shuoMing,
            biaoTi: biaoTi,
            tiShi: tiShi,
        };

        GameMsg.warn('ErrorPanelLog', data);
        SoundManager.playEffect(this.err_audio, false);
        this.shuoMing.string = shuoMing;
        this.callback = callBack;
        this.biaoTi.string = biaoTi ? biaoTi : this.biaoTi.string;
        this.tiShi.string = tiShi ? tiShi : this.tiShi.string;
    }
}
