
import { ListenerManager } from "../../../../../scripts/Manager/ListenerManager";
import { MathUtils } from "../../../../../scripts/Utils/MathUtils";
import { UIHelp } from "../../../../../scripts/Utils/UIHelp";
import { UploadAudio_24_l1sc_d3_01 } from "../../Components/UploadAudio";
import { EventType } from "../../Data/EventType";
import { EditorManager, GameData } from "../../Manager/EditorManager";



const { ccclass, property } = cc._decorator;

@ccclass
export default class ConfigPanel_24_l1sc_d3_01 extends cc.Component {

    @property(cc.EditBox)
    private title: cc.EditBox = null;
    @property(cc.Node)
    private audio_mask: cc.Node = null;
    @property(cc.Node)
    private uploadAudio_Item: cc.Node = null;
    @property(cc.Toggle)
    private toggle_playTitle: cc.Toggle = null;
    @property(cc.Label)
    private gameTitle: cc.Label = null;
    @property(cc.Node)
    private preview: cc.Node = null;
    private gameData: GameData = null;

    onLoad() {
        ListenerManager.on(EventType.SELECTLEVEL, this.updateConfigPanel, this);
    }
    onDestroy() {
        ListenerManager.off(EventType.SELECTLEVEL, this.updateConfigPanel, this);
    }

    //触摸事件
    public touchStart(event: cc.Event.EventTouch) {
        let data = EditorManager.editorData.GameData[EditorManager.editorData.curLevel];
    }

    public touchMove(event: cc.Event.EventTouch) {
        let startPosition = event.getStartLocation();
        let endPos: cc.Vec2 = event.getLocation();
        let moveV = endPos.sub(startPosition);
        if (Math.abs(moveV.x) < 10 && Math.abs(moveV.y) < 10) {//点击
            return;
        }
    }

    public touchEnd(event: cc.Event.EventTouch) {
        let startPosition = event.getStartLocation();
        let endPos: cc.Vec2 = event.getLocation();
        let moveV = endPos.sub(startPosition);
        let pos = this.node.convertToNodeSpaceAR(event.getLocation());
        
    }

    public updateConfigPanel() {
        cc.audioEngine.stopAllEffects();
        // console.log("updateConfigPanel", EditorManager.editorData.GameData[EditorManager.editorData.curLevel]);
        this.gameData = EditorManager.editorData.GameData[EditorManager.editorData.curLevel];
        this.toggle_playTitle.isChecked = this.gameData.auto_play_title;
        this.title.string = this.gameData.title;
        this.onHandleBgChange();
        this.onHandleShowTitle();
        this.onHandleShowLevel();
        this.initTitleAudio();
        this.initGameLayer();
    }
    private initGameLayer() {
        let data = EditorManager.editorData.GameData[EditorManager.editorData.curLevel];
    }
    private initTitleAudio() {
        this.uploadAudio_Item.getComponent(UploadAudio_24_l1sc_d3_01).setFileKey(this.gameData.titleAudio);
        this.uploadAudio_Item.getComponent(UploadAudio_24_l1sc_d3_01).refresh();
    }

    onTogglePlayTitle(toggle: cc.Toggle) {
        this.gameData.auto_play_title = toggle.isChecked;
    }

    onHandleBgChange() {

        // this.preview_node.getChildByName("btn_reset").active = this.gameData.mode == 2;
        // this.preview_node.getChildByName("btn_check").active = this.gameData.mode != 2 && this.gameData.mode != 3;
    }

    onHandleShowTitle() {
        this.gameTitle.string = this.gameData.title;
    }

    onHandleShowLevel() {
        this.preview.getChildByName("_levelProgress").getChildByName("layout").getChildByName("_lb_curLevel").getComponent(cc.Label).string = (EditorManager.editorData.curLevel + 1).toString();
        this.preview.getChildByName("_levelProgress").getChildByName("layout").getChildByName("_lb_levelCount").getComponent(cc.Label).string = EditorManager.editorData.GameData.length.toString();
        this.preview.getChildByName("_levelProgress").active = EditorManager.editorData.GameData.length > 1;
    }

    //题干文字
    onHandleTitleChanged(editbox: cc.EditBox, customEventData: string) {
        let index = this.title.string.indexOf("\n")
        if (index != -1) {
            this.title.string = this.title.string.replace('\n', '');
            this.title.blur();
        }
        if (this.title.string.length == 72) {
            UIHelp.showTip("最多输入72个字符哦！");
            return;
        }
        this.gameData.title = this.title.string;
        this.onHandleShowTitle();
    }

    onHAndleTitleEnd(editbox: cc.EditBox, customEventData: string) {
        this.gameData.title = this.title.string;
        this.onHandleShowTitle();
    }
}
