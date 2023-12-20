import { MainMsgType } from '../../../../../scripts/Data/MainMsgType';
import { CosManager } from '../../../../../scripts/Manager/CosManager';
import { SoundManager } from '../../../../../scripts/Manager/SoundManager';
import { MathUtils } from '../../../../../scripts/Utils/MathUtils';
import { Tools } from '../../../../../scripts/Utils/Tools';
import { UIHelp } from '../../../../../scripts/Utils/UIHelp';
import cutPicture_24_l1sc_d3_01 from '../../Components/cutPicture';
import { SyncDataManager, SyncData } from '../../Core/Manager/SyncDataManager';
import { T2M } from '../../Core/SDK/T2M';
import BaseGamePanel_24_l1sc_d3_01 from '../../Core/UI/Panel/BaseGamePanel';
import { EventType } from '../../Data/EventType';
import { CellH, CellState, CellW, EditorManager, GameModel, SpaceX, SpaceY } from '../../Manager/EditorManager';

const { ccclass, property } = cc._decorator;

@ccclass
export default class GamePanel_24_l1sc_d3_01 extends BaseGamePanel_24_l1sc_d3_01 {
    @property(cutPicture_24_l1sc_d3_01)
    private Capture: cutPicture_24_l1sc_d3_01 = null;

    public static className = 'GamePanel_24_l1sc_d3_01';

    private _changeSprite: cc.Node = null;//切换关卡截图
    private _changeSpine: cc.Node = null;
    private _changeMask: cc.Node = null;
    private _levelProgress: cc.Node = null;
    private _laba: cc.Node = null;
    private _titleString: cc.Node = null;

    private _gameNode: cc.Node = null;
    private _bg: cc.Node = null;
    private _btnSubmit: cc.Node = null;
    private _shapeF: cc.Node = null;
    private _shapeY: cc.Node = null;
    private _cellItem: cc.Node = null;
    private _cellLabel: cc.Node = null;
    private _lb_curLevel: cc.Node = null;
    private _lb_levelCount: cc.Node = null;

    initColorId = 0;
    specialColorId = 4;
    brushColors: { back: cc.Color, label: cc.Color }[] = [
        { back: cc.color(255, 138, 209), label: cc.color(254, 255, 231) },
        { back: cc.color(141, 213, 79), label: cc.color(254, 255, 231) },
        { back: cc.color(38, 193, 252), label: cc.color(254, 255, 231) },
        { back: cc.color(191, 143, 253), label: cc.color(254, 255, 231) },
        { back: cc.color(254, 255, 231), label: cc.color(255, 204, 148) },
    ];
    objPool = {
        cell: { pool: new cc.NodePool(), max: 100 },
        label: { pool: new cc.NodePool(), max: 20 },
    };
    objTouch = {
        touchId: -1,
    };
    isTitlePlaying = false;

    start() {
        super.start();
    }

    onDestroy() {
        super.onDestroy();
    }

    /**
     * 游戏入口
     * 这里已经拿到数据
     */
    protected setPanel() {
        super.setPanel();
        // TODO 业务逻辑
        this.addListener();
        this.initData();
        this.initDataSync();
        this.initGame();
    }

    public addListener() {
        this._gameNode.on(cc.Node.EventType.TOUCH_START, this.touchStart, this);
        this._gameNode.on(cc.Node.EventType.TOUCH_MOVE, this.touchMove, this);
        this._gameNode.on(cc.Node.EventType.TOUCH_END, this.touchEnd, this);
        this._gameNode.on(cc.Node.EventType.TOUCH_CANCEL, this.touchEnd, this);

        T2M.addSyncEventListener(EventType.event_touch_click, (msg: any) => {
            let gameData = EditorManager.editorData.GameData;
            let syncData = SyncDataManager.syncData;
            let data = gameData[syncData.customSyncData.curLevel];

            this.stopHint();
            this.stopGuide();

            let info: { custom: string, brushId?: number } = msg;
            if (info.custom == 'brush') {
                SoundManager.playEffect("click", false);
                syncData.customSyncData.brushId = info.brushId;
                if (data.gameModel == GameModel.square) {
                    this.initSquareRight();
                }
                else if (data.gameModel == GameModel.cycle) {
                    this.initCycleRight();
                }
            }
            else if (info.custom == 'submit') {
                SoundManager.stopAllAudio();
                SoundManager.stopAllEffect();
                let result = this.getQuesResult();
                if (result.ques == result.answer) {
                    SoundManager.playEffect("star", false);
                    UIHelp.showMask();
                    if (syncData.customSyncData.curLevel < gameData.length - 1) {
                        syncData.customSyncData.curLevel++;
                        syncData.customSyncData.time = 10;
                        syncData.customSyncData.playTitle = true;
                        this.isTitlePlaying = false;
                        this.answerRight(true);
                    }
                    else {
                        syncData.frameSyncData.isGameOver = true;
                        this.answerRight(true);
                    }
                    this.scheduleOnce(() => {
                        if (syncData.frameSyncData.isGameOver) {
                            this.gameOver();
                        }
                        else {
                            SoundManager.stopAudioTitle();
                            this._changeSprite.active = true;
                            this._changeSprite.getComponent(cc.Sprite).spriteFrame = this.Capture.CapturePicture();
                            this.scheduleOnce(() => {
                                this.initDataSync();
                                this.initGame();
                                this._gameNode.y = 1152;
                                this._changeMask.active = true;
                                this._changeMask.opacity = 100;
                                this._changeSpine.active = true;
                                SoundManager.playEffect("nextLevel", false);
                                cc.tween(this._changeMask).delay(1).to(0.5, { opacity: 0 }).start();
                                Tools.playSpine(this._changeSpine.getComponent(sp.Skeleton), "animation", false, () => {
                                    this._changeMask.stopAllActions();
                                    this._changeMask.active = false;
                                    this._changeSpine.active = false;
                                    UIHelp.closeMask();
                                    this.playTitleAudio();
                                });
                                cc.tween(this._gameNode).delay(0.93).to(0.3, { y: 0 }).start();
                            }, 0);
                        }
                    }, 1);
                }
                else {
                    this.answerWrong(false);
                    SoundManager.playEffect("wrong", false);
                    UIHelp.showMask();
                    if (data.gameModel == GameModel.square) {
                        let left = this._shapeF.getChildByName('left');
                        let center = left.getChildByName('center');
                        syncData.customSyncData.colorCell.forEach((value, index) => {
                            if (value != this.specialColorId) {
                                let item = center.getChildByName('' + index);
                                let tip = item.getChildByName('tip');
                                tip.active = true;
                                tip.color = cc.color(255, 0, 0);
                                tip.getComponent(cc.Animation).stop();
                                tip.getComponent(cc.Animation).play();
                            }
                        });
                        this.scheduleOnce(() => {
                            syncData.customSyncData.colorCell.forEach((value, index) => {
                                if (value != this.specialColorId) {
                                    let item = center.getChildByName('' + index);
                                    item.getChildByName('tip').active = false;
                                }
                            });
                            UIHelp.closeMask();
                        }, 1.0);
                    }
                    else if (data.gameModel == GameModel.cycle) {
                        let left = this._shapeY.getChildByName('left');
                        let center = left.getChildByName('center');
                        syncData.customSyncData.colorCell.forEach((value, index) => {
                            if (value != this.specialColorId) {
                                let item = center.getChildByName('' + index);
                                let tip = item.getChildByName('tip');
                                tip.active = true;
                                tip.color = cc.color(255, 0, 0);
                                tip.getComponent(cc.Sprite).fillStart = item.getComponent(cc.Sprite).fillStart;
                                tip.getComponent(cc.Sprite).fillRange = item.getComponent(cc.Sprite).fillRange;
                                tip.getComponent(cc.Animation).stop();
                                tip.getComponent(cc.Animation).play();
                            }
                        });
                        this.scheduleOnce(() => {
                            syncData.customSyncData.colorCell.forEach((value, index) => {
                                if (value != this.specialColorId) {
                                    let item = center.getChildByName('' + index);
                                    item.getChildByName('tip').active = false;
                                }
                            });
                            UIHelp.closeMask();
                        }, 1.0);
                    }
                }
            }
        });

        T2M.addSyncEventListener(EventType.event_touch_start, (msg: any) => {
            let gameData = EditorManager.editorData.GameData;
            let syncData = SyncDataManager.syncData;
            let data = gameData[syncData.customSyncData.curLevel];

            this.stopHint();
            this.stopGuide();

            let info: { custom: string, touchId: number } = msg;
            if (info.custom == 'start') {
                SoundManager.playEffect("click", false);
            }
            else if (info.custom == 'move') {
                SoundManager.playEffect("drag", false);
            }

            if (syncData.customSyncData.brushId == syncData.customSyncData.colorCell[info.touchId]) {
                syncData.customSyncData.colorCell[info.touchId] = this.specialColorId;
            }
            else {
                syncData.customSyncData.colorCell[info.touchId] = syncData.customSyncData.brushId;
            }

            if (data.gameModel == GameModel.square) {
                this.initSquareLeft();
            }
            else if (data.gameModel == GameModel.cycle) {
                this.initCycleLeft();
            }
        });
    }

    public initData() {
        /** 缓存节点 */
        for (let index = 0; index < this.objPool.cell.max; index++) {
            if (this.objPool.cell.pool.size() < this.objPool.cell.max) {
                this.poolPut(cc.instantiate(this._cellItem), this.objPool.cell);
            }
            else {
                break;
            }
        }
        for (let index = 0; index < this.objPool.label.max; index++) {
            if (this.objPool.label.pool.size() < this.objPool.label.max) {
                this.poolPut(cc.instantiate(this._cellLabel), this.objPool.label);
            }
            else {
                break;
            }
        }
    }

    public initDataSync() {
        let gameData = EditorManager.editorData.GameData;
        let syncData = SyncDataManager.syncData;
        let data = gameData[syncData.customSyncData.curLevel];

        syncData.customSyncData.brushId = this.initColorId;
        if (data.gameModel == GameModel.square) {
            for (let index = 0, length = data.squareObj.allCellData.length; index < length; index++) {
                let cellData = data.squareObj.allCellData[index];
                if (this.checkCellShow(cellData.state)) {
                    syncData.customSyncData.colorCell[index] = this.specialColorId;
                }
            }
        }
        else if (data.gameModel == GameModel.cycle) {
            for (let index = 0; index < data.cycleObj.cutNum; index++) {
                syncData.customSyncData.colorCell[index] = this.specialColorId;
            }
        }
    }

    public initGame() {
        let gameData = EditorManager.editorData.GameData;
        let syncData = SyncDataManager.syncData;
        let data = gameData[syncData.customSyncData.curLevel];
        // 没有题干 不显示喇叭
        this._laba.active = data.titleAudio.length > 0;
        this._laba.getComponent(cc.Animation).play("stop");
        this._titleString.parent.active = data.title.length > 0;
        this._titleString.getComponent(cc.Label).string = data.title;

        this._lb_curLevel.getComponent(cc.Label).string = (syncData.customSyncData.curLevel + 1).toString();
        this._lb_levelCount.getComponent(cc.Label).string = gameData.length.toString();
        this._bg.children.forEach((item) => {
            if (data.gameModel == GameModel.square) {
                item.active = item.name == '0';
            }
            else {
                item.active = item.name == '1';
            }
        });
        if (data.gameModel == GameModel.square) {
            this._shapeF.active = true;
            this._shapeY.active = false;
            this._btnSubmit.active = data.squareObj.isScore;
            this.initSquareLeft();
            this.initSquareRight();
        }
        else if (data.gameModel == GameModel.cycle) {
            this._shapeF.active = false;
            this._shapeY.active = true;
            this._btnSubmit.active = data.cycleObj.isScore;
            this.initCycleLeft();
            this.initCycleRight();
        }
    }

    /** 刷新方块 */
    public initSquareLeft() {
        let gameData = EditorManager.editorData.GameData;
        let syncData = SyncDataManager.syncData;
        let data = gameData[syncData.customSyncData.curLevel];
        let width = CellW * data.squareObj.col + SpaceX * (data.squareObj.col - 1);
        let height = CellH * data.squareObj.row + SpaceY * (data.squareObj.row - 1);

        let left = this._shapeF.getChildByName('left');
        // 设置 cell
        let center = left.getChildByName('center');
        center.setContentSize(width, height);
        let layoutCenter = center.getComponent(cc.Layout);
        layoutCenter.spacingX = SpaceX;
        layoutCenter.spacingY = SpaceY;
        center.children.forEach((item) => { item.active = false; });
        for (let i = 0; i < data.squareObj.row; i++) {
            for (let j = 0; j < data.squareObj.col; j++) {
                let index = i * data.squareObj.col + j;
                let cellName = '' + index;
                let item = center.getChildByName(cellName);
                if (!item) {
                    item = this.poolGet(this._cellItem, this.objPool.cell);
                    item.name = cellName;
                    item.width = CellW;
                    item.height = CellH;
                    item.parent = center;
                }
                // 数字
                item.active = true;
                let cellData = data.squareObj.allCellData[index];
                item.opacity = this.checkCellShow(cellData.state) ? 255 : 0;
                if (item.opacity > 0) {
                    let brushId = syncData.customSyncData.colorCell[index];
                    let back = item.getChildByName('back');
                    back.color = this.brushColors[brushId].back;
                    let label = item.getChildByName('label');
                    label.active = true;
                    label.color = this.brushColors[brushId].label;
                    label.getComponent(cc.Label).string = cellData.chars;
                }
            }
        }
        // 设置 sign
        let row = left.getChildByName('row');
        let col = left.getChildByName('col');
        if (data.squareObj.isSign) {
            row.active = true;
            row.x = -(width + CellW) * 0.5 - SpaceX;
            row.y = -height * 0.5;
            row.height = height;
            row.getComponent(cc.Layout).spacingY = SpaceY;
            row.children.forEach((item) => { item.active = false; });
            for (let index = 0; index < data.squareObj.row; index++) {
                let item = row.getChildByName('' + index);
                if (!item) {
                    item = this.poolGet(this._cellLabel, this.objPool.label);
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
                    item = this.poolGet(this._cellLabel, this.objPool.label);
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

    public initSquareRight() {
        let syncData = SyncDataManager.syncData;
        let right = this._shapeF.getChildByName('right');
        let answers = right.getChildByName('answer');
        answers.children.forEach((item) => {
            let isSelect = syncData.customSyncData.brushId == Number(item.name);
            item.scale = isSelect ? 1.1 : 1.0;
            item.getChildByName('select').active = isSelect;
        });
    }

    /** 刷新圆形 */
    public initCycleLeft() {
        let gameData = EditorManager.editorData.GameData;
        let syncData = SyncDataManager.syncData;
        let data = gameData[syncData.customSyncData.curLevel];
        let fillStart = 0;
        let fillDis = Math.round(1000 / data.cycleObj.cutNum) / 1000;
        let left = this._shapeY.getChildByName('left');
        let center = left.getChildByName('center');
        for (let index = 0; index < center.childrenCount; index++) {
            let item = center.getChildByName('' + index);
            item.active = index < data.cycleObj.cutNum;
            if (!item.active) {
                continue;
            }
            fillStart = fillDis * index;
            item.getComponent(cc.Sprite).fillStart = fillStart;
            item.getComponent(cc.Sprite).fillRange = fillDis;
            let brushId = syncData.customSyncData.colorCell[index];
            item.color = this.brushColors[brushId].back;
        }
        // 线
        let angleDis = fillDis * 360;
        let line = left.getChildByName('line');
        for (let index = 0; index < line.childrenCount; index++) {
            let item = line.getChildByName('' + index);
            item.active = index < data.cycleObj.cutNum;
            if (!item.active) {
                continue;
            }
            item.angle = -90 + angleDis * index;
        }
    }

    public initCycleRight() {
        let syncData = SyncDataManager.syncData;
        let right = this._shapeY.getChildByName('right');
        let answers = right.getChildByName('answer');
        answers.children.forEach((item) => {
            let isSelect = syncData.customSyncData.brushId == Number(item.name);
            item.scale = isSelect ? 1.1 : 1.0;
            item.getChildByName('select').active = isSelect;
        });
    }

    public eventButton(event: cc.Event.EventTouch, custom: string) {
        if (custom == 'brush') {
            let item: cc.Node = event.target.parent;
            let obj = {
                custom: custom,
                brushId: Number(item.name),
            };
            T2M.dispatch(EventType.event_touch_click, obj, true);
        }
        else if (custom == 'submit') {
            let obj = {
                custom: custom,
            };
            T2M.dispatch(EventType.event_touch_click, obj, true);
        }
    }

    public touchStart(event: cc.Event.EventTouch) {
        let gameData = EditorManager.editorData.GameData;
        let syncData = SyncDataManager.syncData;
        let data = gameData[syncData.customSyncData.curLevel];
        if (data.gameModel == GameModel.square) {
            let left = this._shapeF.getChildByName('left');
            let center = left.getChildByName('center');
            let pos = center.convertToNodeSpaceAR(event.getLocation());
            for (let index = 0, length = data.squareObj.allCellData.length; index < length; index++) {
                const cellData = data.squareObj.allCellData[index];
                if (!this.checkCellShow(cellData.state)) {
                    continue;
                }
                let item = center.getChildByName('' + index);
                if (item.getBoundingBox().contains(pos)) {
                    let obj = {
                        custom: 'start',
                        touchId: Number(item.name),
                    };
                    this.objTouch.touchId = obj.touchId;
                    T2M.dispatch(EventType.event_touch_start, obj, true);
                    break;
                }
            }
        }
        else if (data.gameModel == GameModel.cycle) {
            let left = this._shapeY.getChildByName('left');
            let center = left.getChildByName('center');
            let pos = center.convertToNodeSpaceAR(event.getLocation());
            let radius = center.getChildByName('0').width * 0.5;
            let distance = MathUtils.getInstance().getDistance(cc.v3(pos.x, pos.y), cc.v3(0, 0));
            if (distance > radius) {
                return;
            }
            let disA = Math.round(360 / data.cycleObj.cutNum);
            let angle = -MathUtils.getInstance().getTwoPointsRadian2(cc.v3(0, 0), cc.v3(pos.x, pos.y)) + 90;
            angle = (angle + 360) % 360;
            let touchId = Math.floor(angle / disA);
            if (touchId > data.cycleObj.cutNum) {
                touchId = data.cycleObj.cutNum;
            }
            let obj = {
                custom: 'start',
                touchId: touchId,
            };
            this.objTouch.touchId = obj.touchId;
            T2M.dispatch(EventType.event_touch_start, obj, true);
        }
    }

    public touchMove(event: cc.Event.EventTouch) {
        let gameData = EditorManager.editorData.GameData;
        let syncData = SyncDataManager.syncData;
        let data = gameData[syncData.customSyncData.curLevel];
        if (data.gameModel == GameModel.square) {
            let left = this._shapeF.getChildByName('left');
            let center = left.getChildByName('center');
            let pos = center.convertToNodeSpaceAR(event.getLocation());
            if (this.objTouch.touchId >= 0) {
                let item = center.getChildByName('' + this.objTouch.touchId);
                if (item && item.getBoundingBox().contains(pos)) {
                    return;
                }
            }
            for (let index = 0, length = data.squareObj.allCellData.length; index < length; index++) {
                const cellData = data.squareObj.allCellData[index];
                if (!this.checkCellShow(cellData.state)) {
                    continue;
                }
                let item = center.getChildByName('' + index);
                if (item.getBoundingBox().contains(pos)) {
                    let obj = {
                        custom: 'move',
                        touchId: Number(item.name),
                    };
                    this.objTouch.touchId = obj.touchId;
                    T2M.dispatch(EventType.event_touch_start, obj, true);
                    break;
                }
            }
        }
        else if (data.gameModel == GameModel.cycle) {
            let left = this._shapeY.getChildByName('left');
            let center = left.getChildByName('center');
            let pos = center.convertToNodeSpaceAR(event.getLocation());
            let radius = center.getChildByName('0').width * 0.5;
            let distance = MathUtils.getInstance().getDistance(cc.v3(pos.x, pos.y), cc.v3(0, 0));
            if (distance > radius) {
                return;
            }
            let disA = Math.round(360 / data.cycleObj.cutNum);
            let angle = -MathUtils.getInstance().getTwoPointsRadian2(cc.v3(0, 0), cc.v3(pos.x, pos.y)) + 90;
            angle = (angle + 360) % 360;
            let touchId = Math.floor(angle / disA);
            if (touchId > data.cycleObj.cutNum) {
                touchId = data.cycleObj.cutNum;
            }
            if (touchId != this.objTouch.touchId) {
                let obj = {
                    custom: 'move',
                    touchId: touchId,
                };
                this.objTouch.touchId = obj.touchId;
                T2M.dispatch(EventType.event_touch_start, obj, true);
            }
        }
    }

    public touchEnd(event: cc.Event.EventTouch) {
        this.objTouch.touchId = -1;
    }

    public getQuesResult(): { ques: Number, answer: Number } {
        let gameData = EditorManager.editorData.GameData;
        let syncData = SyncDataManager.syncData;
        let data = gameData[syncData.customSyncData.curLevel];
        let result = { ques: 0, answer: 0 };
        if (data.gameModel == GameModel.square) {
            result.ques = data.squareObj.score;
        }
        else if (data.gameModel == GameModel.cycle) {
            result.ques = data.cycleObj.score;
        }
        for (let i = 0; i < syncData.customSyncData.colorCell.length; i++) {
            if (syncData.customSyncData.colorCell[i] != this.specialColorId) {
                result.answer++;
            }
        }
        return result;
    }

    public playTitleAudio() {
        SoundManager.stopAllAudio();
        let syncData = SyncDataManager.syncData;
        syncData.customSyncData.playTitle = false;
        let gameData = EditorManager.editorData.GameData;
        let data = gameData[syncData.customSyncData.curLevel];
        let funcGuide = ()=>{
            this.scheduleOnce(()=>{
                this.stopHint();
                this.showGuide();
            }, 0.5);
        }
        if (data.auto_play_title) {
            let fileAudio = CosManager.upLoadFileMap.get(data.titleAudio);
            if (fileAudio && fileAudio.fileAsset) {
                this.isTitlePlaying = true;
                this._laba.getComponent(cc.Animation).play("play");
                SoundManager.playAudio(fileAudio.fileAsset as cc.AudioClip, false, true, false, () => {
                    this._laba.getComponent(cc.Animation).play("stop");
                    this.isTitlePlaying = false;
                    funcGuide();
                }, true);
            }
            else{
                funcGuide();
            }
        }
        else {
            funcGuide();
        }
    }

    /**
     * 引导 显示
     * 1.分数设置才有引导
     */
    public showGuide() {
        console.log('引导 显示');
        let gameData = EditorManager.editorData.GameData;
        let syncData = SyncDataManager.syncData;
        let data = gameData[syncData.customSyncData.curLevel];
        if (data.gameModel == GameModel.square) {
            if (data.squareObj.isScore) {
                syncData.customSyncData.playGuide = true;
            }
            else {
                syncData.customSyncData.playGuide = false;
            }
            let left = this._shapeF.getChildByName('left');
            let back = left.getChildByName('back');
            back.active = syncData.customSyncData.playGuide;
            if (syncData.customSyncData.playGuide) {
                let width = CellW * data.squareObj.col + SpaceX * (data.squareObj.col - 1);
                let height = CellH * data.squareObj.row + SpaceY * (data.squareObj.row - 1);
                back.active = true;
                back.color = cc.color(0, 255, 0);
                back.setContentSize(width + 10, height + 10);
                back.getComponent(cc.Animation).stop();
                back.getComponent(cc.Animation).play();
            }
            else {
                back.active = false;
            }
        }
        else if (data.gameModel == GameModel.cycle) {
            if (data.cycleObj.isScore) {
                syncData.customSyncData.playGuide = true;
            }
            else {
                syncData.customSyncData.playGuide = false;
            }
            let left = this._shapeY.getChildByName('left');
            let back = left.getChildByName('back');
            if (syncData.customSyncData.playGuide) {
                let width = CellW * data.squareObj.col + SpaceX * (data.squareObj.col - 1);
                let height = CellH * data.squareObj.row + SpaceY * (data.squareObj.row - 1);
                back.active = true;
                back.color = cc.color(0, 255, 0);
                back.setContentSize(width, height);
                back.getComponent(cc.Animation).stop();
                back.getComponent(cc.Animation).play();
            }
            else {
                back.active = false;
            }
        }
    }

    /** 引导 停止 */
    public stopGuide() {
        console.log('引导 停止');
        let syncData = SyncDataManager.syncData;
        syncData.customSyncData.playGuide = false;

        let gameData = EditorManager.editorData.GameData;
        let data = gameData[syncData.customSyncData.curLevel];
        if (data.gameModel == GameModel.square) {
            let left = this._shapeF.getChildByName('left');
            let back = left.getChildByName('back');
            back.getComponent(cc.Animation).stop();
            back.active = false
        }
        else if (data.gameModel == GameModel.cycle) {
            let left = this._shapeY.getChildByName('left');
            let back = left.getChildByName('back');
            back.getComponent(cc.Animation).stop();
            back.active = false
        }
    }

    /** 10s提示 提示 */
    public showHint() {
        console.log('10s提示 显示');
        let syncData = SyncDataManager.syncData;
        syncData.customSyncData.isHint = true;

        let gameData = EditorManager.editorData.GameData;
        let data = gameData[syncData.customSyncData.curLevel];
        if (data.gameModel == GameModel.square) {
            let result = this.getQuesResult();
            if (result.ques == result.answer) {
                syncData.customSyncData.isHint = false;
                return;
            }
            let left = this._shapeF.getChildByName('left');
            let center = left.getChildByName('center');
            // 色块不足
            if (result.ques > result.answer) {
                let id = -1;
                for (let i = data.squareObj.row - 1; i >= 0; i--) {
                    for (let j = 0; j < data.squareObj.col; j++) {
                        let index = i * data.squareObj.col + j;
                        if (syncData.customSyncData.colorCell[index] == this.specialColorId) {
                            id = index;
                            break;
                        }
                    }
                    if (id >= 0) {
                        break;
                    }
                }
                let item = center.getChildByName('' + id);
                let tip = item.getChildByName('tip');
                tip.active = true;
                tip.color = cc.color(0, 255, 0);
                tip.getComponent(cc.Animation).stop();
                tip.getComponent(cc.Animation).play();
            }
            // 色块过多
            else if (result.ques < result.answer) {
                let id = -1;
                for (let i = data.squareObj.row - 1; i >= 0; i--) {
                    for (let j = 0; j < data.squareObj.col; j++) {
                        let index = i * data.squareObj.col + j;
                        if (syncData.customSyncData.colorCell[index] != this.specialColorId) {
                            id = index;
                            break;
                        }
                    }
                    if (id >= 0) {
                        break;
                    }
                }
                let item = center.getChildByName('' + id);
                let tip = item.getChildByName('tip');
                tip.active = true;
                tip.color = cc.color(255, 0, 0);
                tip.getComponent(cc.Animation).stop();
                tip.getComponent(cc.Animation).play();
            }
        }
        else if (data.gameModel == GameModel.cycle) {
            let result = this.getQuesResult();
            if (result.ques == result.answer) {
                syncData.customSyncData.isHint = false;
                return;
            }
            let left = this._shapeY.getChildByName('left');
            let center = left.getChildByName('center');
            // 色块不足
            if (result.ques > result.answer) {
                let id = -1;
                for (let i = 0, length = syncData.customSyncData.colorCell.length; i < length; i++) {
                    if (syncData.customSyncData.colorCell[i] == this.specialColorId) {
                        id = i;
                        break;
                    }
                }
                let item = center.getChildByName('' + id);
                let tip = left.getChildByName('tip');
                tip.active = true;
                tip.color = cc.color(0, 255, 0);
                tip.getComponent(cc.Sprite).fillStart = item.getComponent(cc.Sprite).fillStart;
                tip.getComponent(cc.Sprite).fillRange = item.getComponent(cc.Sprite).fillRange;
                tip.getComponent(cc.Animation).stop();
                tip.getComponent(cc.Animation).play();
            }
            // 色块过多
            else if (result.ques < result.answer) {
                let id = -1;
                for (let i = 0, length = syncData.customSyncData.colorCell.length; i < length; i++) {
                    if (syncData.customSyncData.colorCell[i] != this.specialColorId) {
                        id = i;
                        break;
                    }
                }
                let item = center.getChildByName('' + id);
                let tip = left.getChildByName('tip');
                tip.active = true;
                tip.color = cc.color(255, 0, 0);
                tip.getComponent(cc.Sprite).fillStart = item.getComponent(cc.Sprite).fillStart;
                tip.getComponent(cc.Sprite).fillRange = item.getComponent(cc.Sprite).fillRange;
                tip.getComponent(cc.Animation).stop();
                tip.getComponent(cc.Animation).play();
            }
        }
    }

    /** 10s提示 停止 */
    public stopHint() {
        console.log('10s提示 停止');
        let syncData = SyncDataManager.syncData;
        syncData.customSyncData.isHint = false;
        syncData.customSyncData.time = 10;

        let gameData = EditorManager.editorData.GameData;
        let data = gameData[syncData.customSyncData.curLevel];
        if (data.gameModel == GameModel.square) {
            let left = this._shapeF.getChildByName('left');
            let center = left.getChildByName('center');
            center.children.forEach((item) => {
                item.getChildByName('tip').active = false;
            });
        }
        else if (data.gameModel == GameModel.cycle) {
            let left = this._shapeY.getChildByName('left');
            left.getChildByName('tip').active = false
        }
    }

    checkCellShow(state: CellState) {
        return state == CellState.show || state == CellState.showChose;
    }

    protected onGameStart(): void {
        super.onGameStart();
        this.initGame();
        this.playTitleAudio();
        console.log('游戏 开始');
    }

    /**
     * 心跳回调（当actionId不相等时才会触发）
     * @param recovery
     */
    protected onRecoveryData(recovery: SyncData): void {
        super.onRecoveryData(recovery);
    }

    /**
     * 作答正确
     * 父类实现了数据上报
     * @param isCurLevelFinish 本关是否完成
     */
    protected answerRight(isCurLevelFinish: boolean) {
        super.answerRight(isCurLevelFinish);
    }

    /**
     * 作答错误
     * 父类实现了数据上报
     * @param isCurLevelFinish 本关是否完成
     */
    protected answerWrong(isCurLevelFinish: boolean = false) {
        super.answerWrong(isCurLevelFinish);
    }

    /**
     * 游戏结束
     * 父类实现了结算界面（游戏结束或星级评判）的弹出
     */
    protected gameOver() {
        super.gameOver();
        console.log('游戏 结束');
    }

    /**
     * 重玩
     */
    protected onReplay() {
        super.onReplay();

        this.isTitlePlaying = false;
        SyncDataManager.syncData.customSyncData.playGuide = false;

        this.initData();
        this.initDataSync();
        this.initGame();
        this.playTitleAudio();
        console.log('游戏 重玩');
    }

    update(dt) {
        super.update(dt);
        let syncData = SyncDataManager.syncData;
        let frameData = syncData.frameSyncData;
        if (frameData.isGameOver || frameData.isGameStart) {
            return;
        }
        let costomData = syncData.customSyncData;
        if (costomData.playGuide || costomData.time == -1) {
            return;
        }
        costomData.time -= dt;
        if (costomData.time < 0) {
            costomData.time = -1
            this.showHint();
        }
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
}
