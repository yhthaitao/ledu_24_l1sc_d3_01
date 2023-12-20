
import { MainMsgType } from '../../../../../scripts/Data/MainMsgType';
import { CosManager } from '../../../../../scripts/Manager/CosManager';
import { GameBundleManager, GamePanelType } from '../../../../../scripts/Manager/GameBundleManager';
import { ListenerManager } from '../../../../../scripts/Manager/ListenerManager';
import { MathUtils } from '../../../../../scripts/Utils/MathUtils';
import { Tools } from '../../../../../scripts/Utils/Tools';
import { UIHelp } from '../../../../../scripts/Utils/UIHelp';
import { UploadAudio_24_l1sc_d3_01 } from '../../Components/UploadAudio';
import { UploadImg_24_l1sc_d3_01 } from '../../Components/UploadImg';
import { ReportManager } from '../../Core/Manager/ReportManager';
import BaseTeacherPanel_24_l1sc_d3_01 from '../../Core/UI/Panel/BaseTeacherPanel';
import { SubUIHelp } from '../../Core/Utils/SubUIHelp';
import { EventType } from '../../Data/EventType';
import { CellData, CellH, CellState, CellW, EditorManager, GameData, GameModel, Keyboard, SpaceX, SpaceY } from '../../Manager/EditorManager';
import ConfigPanel from '../Item/ConfigPanel';
import levelList from '../Item/levelList';

const { ccclass, property } = cc._decorator;

@ccclass
export default class TeacherPanel_24_l1sc_d3_01 extends BaseTeacherPanel_24_l1sc_d3_01 {
    public static className = 'TeacherPanel_24_l1sc_d3_01';
    /** 是否支持星级评判 */
    @property(cc.ToggleContainer)
    private toggle_stars: cc.ToggleContainer = null;
    /** 是否支持重玩 */
    @property(cc.ToggleContainer)
    private toggle_replay: cc.ToggleContainer = null;
    /** 是否自动播放标题语音 */
    @property(cc.ToggleContainer)
    private toggle_titleAudio: cc.ToggleContainer = null;
    /** 是否播放引导 */
    @property(cc.ToggleContainer)
    private toggle_playGuide: cc.ToggleContainer = null;

    @property(cc.Node)
    _layout_defOptions: cc.Node = null;

    //再玩一次
    @property(cc.Toggle)
    private toggle_playAgin: cc.Toggle = null;
    //自动播放标题
    @property(cc.Toggle)
    private toggle_playTitle: cc.Toggle = null;
    //是否开启背景音
    @property(cc.Toggle)
    private toggle_playBgm: cc.Toggle = null;
    @property(levelList)
    levelList: levelList = null;
    @property(ConfigPanel)
    configPanel: ConfigPanel = null;

    /** 背景音乐设置 */
    @property(cc.Node)
    private r_music: cc.Node = null;
    /** 背景图设置 */
    @property(cc.Node)
    private r_back: cc.Node = null;
    /** 模式 */
    @property(cc.ToggleContainer)
    private r_model_toggle: cc.ToggleContainer = null;
    /** 方形设置-行列数量 */
    @property(cc.Node)
    private r_cellNum: cc.Node = null;
    /** 方形设置-填数或清除 */
    @property(cc.Node)
    private r_cellSet: cc.Node = null;
    /** 方形设置-凌冽标注 */
    @property(cc.Node)
    private r_cellSign: cc.Node = null;
    /** 方形设置-分数判定 */
    @property(cc.Node)
    private r_cellScore: cc.Node = null;
    /** 圆形分割 */
    @property(cc.Node)
    private r_cycleSet: cc.Node = null;
    /** 圆形设置-分数判定 */
    @property(cc.Node)
    private r_cycleScore: cc.Node = null;
    /** 触摸节点 */
    @property(cc.Node)
    private l_bg: cc.Node = null;
    /** 框选节点 */
    @property(cc.Node)
    private l_kuang: cc.Node = null;
    /** 方形节点 */
    @property(cc.Node)
    private l_shapeF: cc.Node = null;
    /** 方块 */
    @property(cc.Node)
    private l_cellItem: cc.Node = null;
    /** 行列 */
    @property(cc.Node)
    private l_cellLabel: cc.Node = null;
    /** 圆形节点 */
    @property(cc.Node)
    private l_shapeY: cc.Node = null;

    private _btn_save: cc.Node = null;
    private _btn_view: cc.Node = null;

    objPool = {
        cell: { pool: new cc.NodePool(), max: 100 },
        label: { pool: new cc.NodePool(), max: 20 },
    };
    objTouch = {
        isClick: false,
        pStart: null,
        tStart: 0,
        shiftState: 0,
    };

    onLoad() {
        super.onLoad();
        ListenerManager.on(EventType.SELECTLEVEL, this.updatePanel, this);
        this.l_bg.on(cc.Node.EventType.TOUCH_START, this.touchStart, this);
        this.l_bg.on(cc.Node.EventType.TOUCH_MOVE, this.touchMove, this);
        this.l_bg.on(cc.Node.EventType.TOUCH_END, this.touchEnd, this);
        this.l_bg.on(cc.Node.EventType.TOUCH_CANCEL, this.touchEnd, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
    }

    start() {
        super.start();

        // 可编辑的游戏，不展示保存按钮
        const isEdit = EditorManager.isSupportEdit();
        if (this._btn_save) {
            this._btn_save.active = !isEdit;
        }
        this._layout_defOptions.active = false;
        // this._btn_save.active = true;
    }

    onDestroy() {
        ListenerManager.off(EventType.SELECTLEVEL, this.updatePanel, this);
        this.l_bg.off(cc.Node.EventType.TOUCH_START);
        this.l_bg.off(cc.Node.EventType.TOUCH_MOVE);
        this.l_bg.off(cc.Node.EventType.TOUCH_END);
        this.l_bg.off(cc.Node.EventType.TOUCH_CANCEL);
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
    }

    /**
     * 设置界面（这里已经拿到了网络请求数据）
     */
    setPanel() {
        this._layout_defOptions.active = true
        super.setPanel();
        this.initData();
        this.toggle_playAgin.isChecked = EditorManager.editorData.isReplay;
        this.toggle_playTitle.isChecked = EditorManager.editorData.isPlayTitle;
        this.toggle_playBgm.isChecked = EditorManager.editorData.isPlayBgm;
        if (EditorManager.editorData.GameData.length == 0) {
            EditorManager.editorData.GameData = [this.createLevel(null)];
        }
        this.levelList.node.active = true;
        this.levelList.initLevel(EditorManager.editorData.GameData, EditorManager.editorData.MaxLevel, this.createLevel.bind(this));
        this.configPanel.node.active = true;
        this.configPanel.updateConfigPanel();
        this.updatePanel();
    }
    public createLevel(_level) {
        let level = new GameData();
        if (_level) {
            level = JSON.parse(JSON.stringify(_level));
        }
        else{
            let allCellData: CellData[] = [];
            for (let index = 0; index < 100; index++) {
                allCellData[index] = { state: CellState.show, chars: '' };
            }
            level.squareObj.allCellData = allCellData;
        }
        return level;
    }

    public updatePanel() {
        let data = EditorManager.editorData.GameData[EditorManager.editorData.curLevel];
        this.r_model_toggle.toggleItems[data.gameModel].isChecked = true;
        this.r_music.getChildByName('nodeUpload').getComponent(UploadAudio_24_l1sc_d3_01).refresh();
        this.r_back.getChildByName('nodeUpload').getComponent(UploadImg_24_l1sc_d3_01).refresh();
        // 游戏初始化
        this.initUI();
    }

    public initData() {
        /** 缓存节点 */
        for (let index = 0; index < this.objPool.cell.max; index++) {
            if (this.objPool.cell.pool.size() < this.objPool.cell.max) {
                this.poolPut(cc.instantiate(this.l_cellItem), this.objPool.cell);
            }
            else {
                break;
            }
        }
        for (let index = 0; index < this.objPool.label.max; index++) {
            if (this.objPool.label.pool.size() < this.objPool.label.max) {
                this.poolPut(cc.instantiate(this.l_cellLabel), this.objPool.label);
            }
            else {
                break;
            }
        }
    }

    public initUI() {
        this.initRight();
        this.initLeft();
    }

    public initRight() {
        let data = EditorManager.editorData.GameData[EditorManager.editorData.curLevel];
        // 隐藏相关选项
        this.r_cellNum.active = false;
        this.r_cellSet.active = false;
        this.r_cellSign.active = false;
        this.r_cellScore.active = false;
        this.r_cycleSet.active = false;
        this.r_cycleScore.active = false;
        if (data.gameModel == GameModel.square) {
            // 方形模式 分数限制
            let scoreTotal = data.squareObj.row * data.squareObj.col;
            if (data.squareObj.score > scoreTotal) {
                data.squareObj.score = scoreTotal;
            }
            // 行列数量
            this.r_cellNum.active = true;
            this.r_cellNum.getChildByName('item0').getComponent(cc.EditBox).string = '' + data.squareObj.row;
            this.r_cellNum.getChildByName('item1').getComponent(cc.EditBox).string = '' + data.squareObj.col;
            // 行列设置
            this.r_cellSet.active = true;
            // 行列标注
            this.r_cellSign.active = true;
            let toggleCellSign = this.r_cellSign.getChildByName('toggle');
            toggleCellSign.getComponent(cc.Toggle).isChecked = data.squareObj.isSign;
            // 分数判定
            this.r_cellScore.active = true;
            let toggleCellScore = this.r_cellScore.getChildByName('toggle');
            toggleCellScore.getComponent(cc.Toggle).isChecked = data.squareObj.isScore;
            let editBoxCellScore = this.r_cellScore.getChildByName('editBox');
            editBoxCellScore.getComponent(cc.EditBox).string = '' + data.squareObj.score;
            // 保存按钮
            this._btn_save.active = data.squareObj.isScore;
        }
        else if (data.gameModel == GameModel.cycle) {
            // 转盘分割
            this.r_cycleSet.active = true;
            let editBoxCycleSet = this.r_cycleSet.getChildByName('editBox');
            editBoxCycleSet.getComponent(cc.EditBox).string = '' + data.cycleObj.cutNum;
            // 分数判定
            this.r_cycleScore.active = true;
            let toggleCycleScore = this.r_cycleScore.getChildByName('toggle');
            toggleCycleScore.getComponent(cc.Toggle).isChecked = data.cycleObj.isScore;
            let editBoxCycleScore = this.r_cycleScore.getChildByName('editBox');
            editBoxCycleScore.getComponent(cc.EditBox).string = '' + data.cycleObj.score;
            // 保存按钮
            this._btn_save.active = data.cycleObj.isScore;
        }
    }

    public initLeft() {
        let data = EditorManager.editorData.GameData[EditorManager.editorData.curLevel];
        if (data.gameModel == GameModel.square) {
            this.l_shapeF.active = true;
            this.l_shapeY.active = false;
            this.initSquareCell();
            this.initSquareSign();
        }
        else if (data.gameModel == GameModel.cycle) {
            this.l_shapeF.active = false;
            this.l_shapeY.active = true;
            this.initCycle();
        }
    }

    /** 刷新方块 */
    public initSquareCell() {
        let data = EditorManager.editorData.GameData[EditorManager.editorData.curLevel];
        let obj = data.squareObj;
        let center = this.l_shapeF.getChildByName('center');
        center.width = CellW * obj.col + SpaceX * (obj.col - 1);
        center.height = CellH * obj.row + SpaceY * (obj.row - 1)
        let layoutCenter = center.getComponent(cc.Layout);
        layoutCenter.spacingX = SpaceX;
        layoutCenter.spacingY = SpaceY;
        center.children.forEach((item) => { item.active = false; });
        for (let i = 0; i < obj.row; i++) {
            for (let j = 0; j < obj.col; j++) {
                let index = i * obj.col + j;
                let cellName = '' + index;
                let item = center.getChildByName(cellName);
                if (!item) {
                    item = this.poolGet(this.l_cellItem, this.objPool.cell);
                    item.name = cellName;
                    item.width = CellW;
                    item.height = CellH;
                    item.parent = center;
                }
                // 数字
                item.active = true;
                let cellData = obj.allCellData[index];
                if (cellData.state == CellState.show) {
                    item.color = cc.color(255, 255, 255);
                    item.opacity = 255;
                    let editBox = item.getChildByName('editBox');
                    editBox.getComponent(cc.EditBox).string = cellData.chars;
                    editBox.active = false;
                }
                else if (cellData.state == CellState.showChose || cellData.state == CellState.hideChose) {
                    item.color = cc.color(100, 100, 100);
                    item.opacity = 150;
                    item.getChildByName('editBox').active = false;
                    item.getChildByName('label').active = false;
                }
                else {
                    item.color = cc.color(100, 100, 100);
                    item.opacity = 70;
                    item.getChildByName('editBox').active = false;
                    item.getChildByName('label').active = false;
                }
                let label = item.getChildByName('label');
                label.active = true;
                label.getComponent(cc.Label).string = cellData.chars;
            }
        }
    }

    /** 刷新行列标注 */
    public initSquareSign() {
        let data = EditorManager.editorData.GameData[EditorManager.editorData.curLevel];
        let row = this.l_shapeF.getChildByName('row');
        let col = this.l_shapeF.getChildByName('col');
        if (data.squareObj.isSign) {
            let width = CellW * data.squareObj.col + SpaceX * (data.squareObj.col - 1);
            let height = CellH * data.squareObj.row + SpaceY * (data.squareObj.row - 1);
            row.active = true;
            row.x = -(width + CellW) * 0.5 - SpaceX;
            row.y = -height * 0.5;
            row.height = height;
            row.getComponent(cc.Layout).spacingY = SpaceY;
            row.children.forEach((item) => { item.active = false; });
            for (let index = 0; index < data.squareObj.row; index++) {
                let item = row.getChildByName('' + index);
                if (!item) {
                    item = this.poolGet(this.l_cellLabel, this.objPool.label);
                    item.name = '' + index;
                    item.width = CellW;
                    item.height = CellH;
                    item.parent = row;
                }
                item.active = true;
                item.getComponent(cc.Label).string = '' + (index + 1);
            }

            col.active = true;
            col.x = -width * 0.5;
            col.y = -(height + CellH) * 0.5 - SpaceY;
            col.width = width;
            col.getComponent(cc.Layout).spacingX = SpaceX;
            col.children.forEach((item) => { item.active = false; });
            for (let index = 0; index < data.squareObj.col; index++) {
                let item = col.getChildByName('' + index);
                if (!item) {
                    item = this.poolGet(this.l_cellLabel, this.objPool.label);
                    item.name = '' + index;
                    item.parent = col;
                }
                item.active = true;
                item.getComponent(cc.Label).string = '' + (index + 1);
            }
        }
        else {
            row.active = false;
            col.active = false;
        }
    }

    /** 刷新圆形 */
    public initCycle() {
        let data = EditorManager.editorData.GameData[EditorManager.editorData.curLevel];
        let obj = data.cycleObj;
        let fillStart = 0;
        let fillDis = Math.round(1000 / obj.cutNum) / 1000;
        let cycle = this.l_shapeY.getChildByName('cycle');
        for (let index = 0; index < cycle.childrenCount; index++) {
            let item = cycle.getChildByName('item' + index);
            item.active = index < obj.cutNum;
            if (!item.active) {
                continue;
            }
            fillStart = fillDis * index;
            item.getComponent(cc.Sprite).fillStart = fillStart;
            item.getComponent(cc.Sprite).fillRange = fillDis;
        }
        // 线
        let angleDis = fillDis * 360;
        let line = this.l_shapeY.getChildByName('line');
        for (let index = 0; index < line.childrenCount; index++) {
            let item = line.getChildByName('item' + index);
            item.active = index < obj.cutNum;
            if (!item.active) {
                continue;
            }
            item.angle = -90 + angleDis * index;
        }
    }

    getLevelTitle(gameType) {
        if (gameType < 4) {
            return "请把下面的图形切一刀（直线），使得切出的几部分能拼出一个正方形。";
        } else {
            return "请在图形上画一条直线，把图形平均分成两份吧！";
        }
    }

    private randomString() {
        let $chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678';
        let maxPos = $chars.length;
        let str = '';
        for (let i = 0; i < 8; i++) {
            str += $chars.charAt(Math.floor(Math.random() * maxPos));
        }
        return "24_l1sc_d3_01_" + str;
    }

    private copyLevelUpLoadData(fileKey: any, file: any, type = "audio") {
        let isUpload = true;
        if (file.fileBody == null) {
            isUpload = false;
        }
        CosManager.upLoadFileMap.set(fileKey, {
            filePath: file.filePath,
            fileName: file.fileName,
            url: file.url,
            fileAsset: file.fileAsset,
            fileBody: file.fileBody,
        });
        let fileData = CosManager.upLoadFileMap.get(fileKey);
        if (type == "image") {
            if (isUpload) {
                /** 上传成功再展示*/
                CosManager.uploadFile(fileData, (texture2D: cc.Texture2D) => {
                    let spriteFrame = new cc.SpriteFrame(texture2D);
                    fileData.fileAsset = spriteFrame;
                    ListenerManager.dispatch(EventType.SELECTLEVEL, fileKey);
                });
            }
        } else if (type == "audio") {
            if (isUpload) {
                CosManager.uploadFile(fileData, (asset: cc.AudioClip) => {
                    fileData.fileAsset = asset;
                    ListenerManager.dispatch(EventType.SELECTLEVEL, fileKey);
                });
            }
        }
    }

    private touchStart(event: cc.Event.EventTouch) {
        let data = EditorManager.editorData.GameData[EditorManager.editorData.curLevel];
        if (data.gameModel != GameModel.square) {
            return;
        }

        let center = this.l_shapeF.getChildByName('center');
        center.children.forEach((item) => {
            item.getChildByName('editBox').active = false;
        });
        // 非shift选择
        if (this.objTouch.shiftState != 1) {
            // 选中取消
            let isRefreshUI = false;
            data.squareObj.allCellData.forEach((cellData) => {
                if (cellData.state == CellState.showChose) {
                    cellData.state = CellState.show;
                    isRefreshUI = true;
                }
                else if (cellData.state == CellState.hideChose) {
                    cellData.state = CellState.hide;
                    isRefreshUI = true;
                }
            });
            isRefreshUI && this.initLeft();
        }

        this.objTouch.isClick = true;
        this.objTouch.pStart = this.l_bg.convertToNodeSpaceAR(event.getLocation());
        // 框选判断
        this.l_kuang.active = true;
        this.l_kuang.x = this.objTouch.pStart.x;
        this.l_kuang.y = this.objTouch.pStart.y;
        this.l_kuang.width = 0;
        this.l_kuang.height = 0;
    }

    private touchMove(event: cc.Event.EventTouch) {
        let data = EditorManager.editorData.GameData[EditorManager.editorData.curLevel];
        if (data.gameModel != GameModel.square) {
            return;
        }
        // 移动事件 打断点击
        if (this.objTouch.isClick) {
            if (Math.abs(event.getDeltaX()) + Math.abs(event.getDeltaY()) > 2) {
                this.objTouch.isClick = false;
            }
        }
        // 框选
        let pFinish = this.l_bg.convertToNodeSpaceAR(event.getLocation());
        this.l_kuang.width = pFinish.x - this.objTouch.pStart.x;
        this.l_kuang.height = pFinish.y - this.objTouch.pStart.y;

        let isRefreshUI = false;
        let center = this.l_shapeF.getChildByName('center');
        let pStart = this.getLocalPos(this.l_bg, this.objTouch.pStart, center);
        let x = pStart.x;
        let y = pStart.y;
        let w = pFinish.x - this.objTouch.pStart.x;
        let h = pFinish.y - this.objTouch.pStart.y;
        if (w < 0) { x += w; w = Math.abs(w); }
        if (h < 0) { y += h; h = Math.abs(h); }
        data.squareObj.allCellData.forEach((cellData, index) => {
            let item = center.getChildByName('' + index);
            if (cc.Intersection.rectRect(cc.rect(x, y, w, h), item.getBoundingBox())) {
                if (cellData.state == CellState.hide) {
                    cellData.state = CellState.hideChose;
                    isRefreshUI = true;
                }
                else if (cellData.state == CellState.show) {
                    cellData.state = CellState.showChose;
                    isRefreshUI = true;
                }
            }
        });
        isRefreshUI && this.initLeft();
    }

    private touchEnd(event: cc.Event.EventTouch) {
        let data = EditorManager.editorData.GameData[EditorManager.editorData.curLevel];
        if (data.gameModel != GameModel.square) {
            return;
        }

        this.l_kuang.active = false;
        let center = this.l_shapeF.getChildByName('center');
        // 点击事件触发
        if (this.objTouch.isClick) {
            let pos = center.convertToNodeSpaceAR(event.getLocation());
            let funcChose = () => {
                for (let index = 0, length = data.squareObj.allCellData.length; index < length; index++) {
                    let cellItem = center.getChildByName('' + index);
                    if (cellItem && cellItem.getBoundingBox().contains(pos)) {
                        const cellData = data.squareObj.allCellData[index];
                        if (cellData.state == CellState.show) {
                            cellData.state = CellState.showChose;
                        }
                        else if (cellData.state == CellState.showChose) {
                            cellData.state = CellState.show;
                        }
                        else if (cellData.state == CellState.hide) {
                            cellData.state = CellState.hideChose;
                        }
                        else if (cellData.state == CellState.hideChose) {
                            cellData.state = CellState.hide;
                        }
                        this.initLeft();
                        break;
                    }
                }
            }
            let funcInput = () => {
                for (let index = 0, length = data.squareObj.allCellData.length; index < length; index++) {
                    const cellData = data.squareObj.allCellData[index];
                    if (cellData.state != CellState.show) {
                        continue;
                    }
                    let cellItem = center.getChildByName('' + index);
                    if (cellItem && cellItem.getBoundingBox().contains(pos)) {
                        this.eventTouchEditbox(cellItem);
                        break;
                    }
                }
            }
            // shift点击
            if (this.objTouch.shiftState == 1) {
                funcChose();
            }
            // 普通点击
            else {
                let disTime = 200;
                let isDouble = false;
                // 双击
                if (this.objTouch.tStart) {
                    let time = new Date().getTime() - this.objTouch.tStart;
                    isDouble = time < disTime;
                    this.objTouch.tStart = new Date().getTime();
                    if (isDouble) {
                        this.unscheduleAllCallbacks();
                        funcInput();
                    }
                    else {
                        funcChose();
                    }
                }
                // 单击
                else {
                    this.objTouch.tStart = new Date().getTime();
                    funcChose();
                }
            }
        }
    }

    /** 切割部分点击事件 */
    eventTouchEditbox(cellItem: cc.Node) {
        if (!cellItem) {
            return;
        }
        let center = cellItem.parent;
        let data = EditorManager.editorData.GameData[EditorManager.editorData.curLevel];
        let length = data.squareObj.row * data.squareObj.col;
        for (let index = 0; index < length; index++) {
            const item = center.getChildByName('' + index);
            let label = item.getChildByName('label');
            let editBox = item.getChildByName('editBox');
            if (item.name == cellItem.name) {
                label.active = false;
                editBox.active = true;
                editBox.getComponent(cc.EditBox).string = label.getComponent(cc.Label).string;
                editBox.getComponent(cc.EditBox).focus();
            }
            else {
                label.active = true;
                editBox.active = false;
                label.getComponent(cc.Label).string = editBox.getComponent(cc.EditBox).string;
            }
        }
    }

    public onKeyDown(event: cc.Event.EventKeyboard) {
        switch (event.keyCode) {
            case Keyboard.space:
                {
                    let isRefreshUI = false;
                    let data = EditorManager.editorData.GameData[EditorManager.editorData.curLevel];
                    data.squareObj.allCellData.forEach((cellData) => {
                        if (cellData.state == CellState.showChose) {
                            cellData.state = CellState.hide;
                            isRefreshUI = true;
                        }
                        else if (cellData.state == CellState.hideChose) {
                            cellData.state = CellState.show;
                            isRefreshUI = true;
                        }
                    });
                    isRefreshUI && this.initLeft();
                }
                break;
            case Keyboard.shift:
                this.objTouch.shiftState = 1;
                break;
            default:
                break;
        }
    }

    public onKeyUp(event: cc.Event.EventKeyboard) {
        switch (event.keyCode) {
            case Keyboard.shift:
                this.objTouch.shiftState = 0;
                break;
            default:
                break;
        }
    }

    eventToggle(toggle: cc.Toggle, costom: string) {
        // 游戏模式选择
        let data = EditorManager.editorData.GameData[EditorManager.editorData.curLevel];
        if (costom == 'model') {
            data.gameModel = this.r_model_toggle.toggleItems[0].isChecked ? GameModel.square : GameModel.cycle;
            this.initUI();
        }
        // 方形 行列标注
        else if (costom == 'cellSign') {
            data.squareObj.isSign = toggle.isChecked;
            this.initSquareSign();
        }
        // 方形 分数判定
        else if (costom == 'cellScore') {
            data.squareObj.isScore = toggle.isChecked;
            if (data.squareObj.isScore) {
                let isShowTip = false;
                let cellScore = toggle.node.parent;
                let editBox = cellScore.getChildByName('editBox');
                let chars = editBox.getComponent(cc.EditBox).string;
                if (chars.length < 1) {
                    isShowTip = true;
                }
                else {
                    let num = Number(chars);
                    if (num < 1 || num > 10) {
                        isShowTip = true;
                    }
                }
                if (isShowTip) {
                    UIHelp.showTip('涂色格数不正确');
                }
            }
            this.initRight();
            this.initLeft();
        }
        // 圆形 分数判定
        else if (costom == 'cycleScore') {
            data.cycleObj.isScore = toggle.isChecked;
            if (data.cycleObj.isScore) {
                let isShowTip = false;
                let cellScore = toggle.node.parent;
                let editBox = cellScore.getChildByName('editBox');
                let chars = editBox.getComponent(cc.EditBox).string;
                if (chars.length < 1) {
                    isShowTip = true;
                }
                else {
                    let num = Number(chars);
                    if (num < 1 || num > 10) {
                        isShowTip = true;
                    }
                }
                if (isShowTip) {
                    UIHelp.showTip('涂色格数不正确');
                }
            }
            this.initRight();
            this.initLeft();
        }
    }

    eventEditbox(editBox: cc.EditBox, costom: string) {
        let data = EditorManager.editorData.GameData[EditorManager.editorData.curLevel];
        let chars = editBox.string;
        // 方形 行列设置
        if (costom == 'row' || costom == 'col') {
            if (chars.length < 1) {
                editBox.string = '1';
            }
            let num = Number(editBox.string);
            if (num < 1) {
                num = 1;
                UIHelp.showTip('输入的行列不能小于1');
            }
            else if (num > 10) {
                num = 10;
                UIHelp.showTip('输入的行列不能超过10x10');
            }
            editBox.string = '' + num;
            data.squareObj[costom] = num;
            data.squareObj.allCellData.forEach((cellData) => {
                cellData.state = CellState.show;
            });
            this.initLeft();
        }
        // 方形 分数设置
        else if (costom == 'cellScore') {
            if (chars.length < 1) {
                editBox.string = '1';
            }
            let num = Number(editBox.string);
            if (num < 1) {
                num = 1;
            }
            else if (num > 100) {
                num = 100;
                UIHelp.showTip('分数不能超过100');
            }
        }
        // 方格输入
        else if (costom == 'cellItem') {
            console.log('char: ', chars, '; len: ', chars.length);
            if (chars.length > 0) {
                let type = 0;// 字符种类
                let isNumber = false;
                let isWordEN = false;
                let isWordCN = false;
                for (let index = 0; index < chars.length; index++) {
                    const element = chars.slice(index, index + 1);
                    if (this.isNumber(element)) {
                        type += 1;
                        isNumber = true;
                    }
                    else if (this.isWordEN(element)) {
                        type += 1;
                        isWordEN = true;
                    }
                    else if (this.isWordCN(element)) {
                        type += 1;
                        isWordCN = true;
                    }
                }
                if (type != 1) {
                    UIHelp.showTip('只能单独输入汉字、字母或数字');
                    editBox.string = '';
                    return;
                }
                if (isNumber) {
                    if (chars.length > 3) {
                        UIHelp.showTip('数字最多输入三位');
                        chars = chars.slice(0, 3);
                    }
                }
                else if (isWordEN) {
                    if (chars.length > 1) {
                        UIHelp.showTip('字母最多输入一位');
                        chars = chars.slice(0, 1);
                    }
                }
                else if (isWordCN) {
                    if (chars.length > 1) {
                        UIHelp.showTip('汉字最多输入一位');
                        chars = chars.slice(0, 1);
                    }
                }
            }
            let cellName = editBox.node.parent.name;
            data.squareObj.allCellData[Number(cellName)].chars = chars;
            this.initLeft();
        }
        // 圆形 等分设置
        else if (costom == 'cycleCut') {
            if (chars.length < 1) {
                editBox.string = '2';
            }
            let num = Number(editBox.string);
            if (num < 2) {
                num = 2;
            }
            else if (num > 10) {
                num = 10;
                UIHelp.showTip('等分数量不能超过10');
            }
            editBox.string = '' + num;
            data.cycleObj.cutNum = num;
            this.initLeft();
        }
        // 圆形 分数设置
        else if (costom == 'cycleScore') {
            if (chars.length < 1) {
                editBox.string = '1';
            }
            let num = Number(editBox.string);
            if (num < 1) {
                num = 1;
            }
            else if (num > 10) {
                num = 10;
                UIHelp.showTip('分数不能超过10');
            }
        }
    }

    eventButton(event: cc.Event.EventTouch, costom: string) {
        let data = EditorManager.editorData.GameData[EditorManager.editorData.curLevel];
        if (costom == 'fill') {
            let length = data.squareObj.row * data.squareObj.col;
            for (let index = 0; index < length; index++) {
                data.squareObj.allCellData[index].chars = '' + (index + 1);
            }
        }
        else if (costom == 'clear') {
            data.squareObj.allCellData.forEach((cellData) => {
                cellData.chars = '';
            });
        }
        this.initSquareCell();
    }

    onTogglePlayAgin(toggle: cc.Toggle) {
        EditorManager.editorData.isReplay = toggle.isChecked;
    }

    onTogglePlayTitle(toggle: cc.Toggle) {
        EditorManager.editorData.isPlayTitle = toggle.isChecked;
    }

    onTogglePlayBgm(toggle: cc.Toggle) {
        EditorManager.editorData.isPlayBgm = toggle.isChecked;
    }

    // 重玩开关
    public onToggleReplay(toggle: cc.Toggle): void {
        let index = this.toggle_replay.toggleItems.indexOf(toggle);
        EditorManager.editorData.isReplay = 0 === index;
    }

    // 自动播放题干语音开关
    public onToggleTitleAudio(toggle: cc.Toggle): void {
        let index = this.toggle_titleAudio.toggleItems.indexOf(toggle);
        EditorManager.editorData.isPlayTitle = 0 === index;
    }

    // 自动播放新手引导开关
    public onToggleGuideAudio(toggle: cc.Toggle): void {
        let index = this.toggle_playGuide.toggleItems.indexOf(toggle);
        EditorManager.editorData.isPlayGuide = 0 === index;
    }

    // 保存课件按钮
    public onBtnSaveClicked() {
        if (!this.checkQuestion()) {
            return;
        }
        const isEdit = EditorManager.isSupportEdit();
        if (!isEdit || ReportManager.isAllOver) {
            SubUIHelp.showSubmissionPanel();
        }
        // else {
        //     UIHelp.showTip('请先完成一遍题目');
        // }
        SubUIHelp.showSubmissionPanel();
    }
    // 预览课件按钮
    public onBtnViewClicked() {
        if (!this.checkQuestion()) {
            return;
        }
        cc.audioEngine.stopAllEffects();
        EditorManager.setUpLoadFilesData(CosManager.getFilesData());
        // console.log(JSON.stringify(EditorManager.editorData.upLoadFilesData));
        EditorManager.editorData.levelCount = EditorManager.editorData.GameData.length;
        if (
            -1 === EditorManager.getCoursewareLevel() ||
            null === EditorManager.getCoursewareLevel() ||
            void 0 === EditorManager.getCoursewareLevel()
        ) {
            UIHelp.showTip('请先设置coursewareLevel');
        } else {
            ListenerManager.dispatch(MainMsgType.TEACHER_PANEL_LOADING, true);
            GameBundleManager.openPanel(GamePanelType.GamePanel);
        }
    }

    checkQuestion(){
        let totalLevel = EditorManager.editorData.GameData.length;
        for (let i = 0; i < totalLevel; i++) {
            let data = EditorManager.editorData.GameData[i];
            if (data.gameModel == GameModel.square) {
                if (data.squareObj.isScore) {
                    let totalScore = 0;
                    for (let j = 0, length = data.squareObj.row*data.squareObj.col; j < length; j++) {
                        if (data.squareObj.allCellData[j].state == CellState.show
                            || data.squareObj.allCellData[j].state == CellState.showChose) {
                            totalScore++;
                        }
                    }
                    if (data.squareObj.score >= totalScore) {
                        UIHelp.showTip('分数设置不能超过总分数');
                        return false;
                    }
                }
                else{
                    if (totalLevel > 1) {
                        UIHelp.showTip('演示模式只能设定1关');
                        return false;
                    }
                }
            }
            else if (data.gameModel == GameModel.cycle) {
                if (data.cycleObj.isScore) {
                    if (data.squareObj.score >= data.cycleObj.cutNum) {
                        UIHelp.showTip('分数设置不能超过总分数');
                        return false;
                    }
                }
                else{
                    if (totalLevel > 1) {
                        UIHelp.showTip('演示模式只能设定1关');
                        return false;
                    }
                }
            }
        }
        return true;
    }

    /** 获取 父节点上的当前坐标 在 目标节点上的 相对坐标 */
    getLocalPos(nodeParent: cc.Node, pointCur: cc.Vec3, nodeGoal: cc.Node) {
        let pointWorld = nodeParent.convertToWorldSpaceAR(pointCur);
        return nodeGoal.convertToNodeSpaceAR(pointWorld);
    };

    /** 缓冲池 放入 */
    public poolPut(node: cc.Node, objPool: { pool: cc.NodePool, max: number }) {
        if (objPool.pool.size() <= objPool.max) {
            objPool.pool.put(node);
        } else {
            node.destroy();
        }
    };

    /** 缓冲池 取出 */
    public poolGet(node: any, objPool: { pool: cc.NodePool, max: number }): cc.Node {
        return objPool.pool.size() > 0 ? objPool.pool.get() : cc.instantiate(node);
    };

    public isNumber(str: string) {
        return /^\d+(\.\d+)?$/.test(str);
    }

    public isWordEN(str: string) {
        return /[_a-zA-Z]/.test(str);
    }

    public isWordCN(str: string) {
        return /^[\u4e00-\u9fa5]+$/.test(str);
    }
}
