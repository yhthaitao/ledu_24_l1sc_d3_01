import { ListenerManager } from '../../../../../../scripts/Manager/ListenerManager';
import { MainMsgType } from '../../../../../../scripts/Data/MainMsgType';
import { UIHelp } from '../../../../../../scripts/Utils/UIHelp';
import { ReportManager } from '../../Manager/ReportManager';
import { SoundManager } from '../../../../../../scripts/Manager/SoundManager';
import { T2M } from '../../SDK/T2M';
import { BaseUI } from '../../../../../../scripts/UI/BaseUI';
import { SubUIHelp } from '../../Utils/SubUIHelp';
import { EditorManager } from '../../../Manager/EditorManager';
import { MainConstValue } from '../../../../../../scripts/Data/MainConstValue';
import BaseSubUI from '../../../../../../scripts/UI/BaseSubUI';
import { UIManager } from '../../../../../../scripts/Manager/UIManager';

const { ccclass, property } = cc._decorator;

@ccclass
export default class UploadAndReturnPanel_24_l1sc_d3_01 extends BaseSubUI {
    public static className = 'UploadAndReturnPanel_24_l1sc_d3_01';
    public static isCommonPanel = true;
    onLoad() {
        this.node.on(cc.Node.EventType.POSITION_CHANGED, () => {
            this.adjustWidget();
        });
    }

    start() {
        ListenerManager.dispatch(MainMsgType.ON_EDIT_STATE_SWITCHING, 1);
    }

    onFanHui() {
        ListenerManager.dispatch(MainMsgType.ON_EDIT_STATE_SWITCHING, 0);
        UIHelp.closeGamePanel();
        SubUIHelp.closeUploadAndReturnPanel();
        SubUIHelp.closeSubmissionPanel();
        SubUIHelp.closeOverTips();
        SubUIHelp.closeAffirmTip();
        SubUIHelp.closeStartLayer();
        ReportManager.reportGameOver();
        SoundManager.stopAll();
        T2M.onReturnToTeacherPanel();
    }

    onTiJiao() {
        const isEdit = EditorManager.isSupportEdit();
        if (!isEdit || ReportManager.isAllOver) {
            SubUIHelp.showSubmissionPanel();
        } else {
            UIHelp.showTip('请先完成一遍题目');
        }
    }

    adjustWidget() {
        let scenceHeight = cc.winSize.height;
        let widget = this.getComponent(cc.Widget);
        if (widget) {
            if (scenceHeight > this.node.height) {
                widget.bottom = (scenceHeight - this.node.height) / 2;
            } else {
                widget.bottom = 0;
            }
            widget.updateAlignment();
        }
    }
}
