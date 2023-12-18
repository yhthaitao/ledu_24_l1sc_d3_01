
import { MainMsgType } from '../../../../../../scripts/Data/MainMsgType';
import { SoundManager } from '../../../../../../scripts/Manager/SoundManager';
import BaseSubUI from '../../../../../../scripts/UI/BaseSubUI';
import { Tools } from '../../../../../../scripts/Utils/Tools';
import { UIHelp } from '../../../../../../scripts/Utils/UIHelp';
import { T2M } from '../../SDK/T2M';

const { ccclass, property } = cc._decorator;
@ccclass
export class OverTips_24_l1sc_d3_01 extends BaseSubUI {
    public static className = 'OverTips_24_l1sc_d3_01';
    public static isCommonPanel = true;
    public _node_replay: cc.Node = null;
    public _node_wait: cc.Node = null;
    /**大宽动画 */
    @property(sp.Skeleton)
    private spine_dakuan: sp.Skeleton = null;
    /**点击音效 */
    @property(cc.AudioClip)
    private audio_click: cc.AudioClip = null;
    /**胜利音效 */
    @property(cc.AudioClip)
    private audio_win: cc.AudioClip = null;
    /**是否已经点击过再玩一次 */
    private _isClickReplay: boolean = false;

    /**
     设置显示内容
     @param {boolean} isShowReplay     是否显示重玩按钮
     */
    init(isShowReplay?: boolean, isRecovery?: boolean): void {
        SoundManager.stopAll();
        //个别游戏在展示结算后播放了背景音乐，在此延时一帧再次停掉所有声音
        this.scheduleOnce(() => {
            SoundManager.stopAll();
            if (!isRecovery) {
                this.audio_win && SoundManager.playAudio(this.audio_win, false);
            }
        })

        this._isClickReplay = false;
        this._node_replay.active = false;
        this._node_wait.active = false;
        if (isRecovery) {
            this.playReadBook(isShowReplay);
        } else {
            Tools.playSpine(this.spine_dakuan, 'tbl_start1', false, () => {
                Tools.playSpine(this.spine_dakuan, 'tbl_start2', false, () => {
                    this.playReadBook(isShowReplay);
                });
            });
        }
        UIHelp.closeMask();
    }

    /**播放读书动效 */
    private playReadBook(isShowReplay: boolean) {
        Tools.playSpine(this.spine_dakuan, 'pad_loop', true);
        if (isShowReplay) {
            this._node_replay.active = true;
        } else {
            this._node_wait.active = true;
        }
    }

    onClickReplay() {
        if (this._isClickReplay) {
            return;
        }
        this.audio_click && SoundManager.playEffect(this.audio_click, false);
        this._isClickReplay = true;
        T2M.dispatch(MainMsgType.REPLAY_START, null);
    }
}

