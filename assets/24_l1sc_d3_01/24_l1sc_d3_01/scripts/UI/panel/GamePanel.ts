import { MainMsgType } from '../../../../../scripts/Data/MainMsgType';
import { SoundManager } from '../../../../../scripts/Manager/SoundManager';
import { MathUtils } from '../../../../../scripts/Utils/MathUtils';
import { Tools } from '../../../../../scripts/Utils/Tools';
import { UIHelp } from '../../../../../scripts/Utils/UIHelp';
import { SyncDataManager, SyncData } from '../../Core/Manager/SyncDataManager';
import { T2M } from '../../Core/SDK/T2M';
import BaseGamePanel_24_l1sc_d3_01 from '../../Core/UI/Panel/BaseGamePanel';
import { CellH, CellState, CellW, EditorManager, GameModel, SpaceX, SpaceY } from '../../Manager/EditorManager';

const { ccclass, property } = cc._decorator;

@ccclass
export default class GamePanel_24_l1sc_d3_01 extends BaseGamePanel_24_l1sc_d3_01 {
    public static className = 'GamePanel_24_l1sc_d3_01';

    private _gameNode: cc.Node = null;
    private _laba: cc.Node = null;
    private _shapeF: cc.Node = null;
    private _shapeY: cc.Node = null;
    private _cellItem: cc.Node = null;
    private _cellLabel: cc.Node = null;
    private _kuang: cc.Node = null;
    private _levelProgress: cc.Node = null;
    private _lb_curLevel: cc.Node = null;
    private _lb_levelCount: cc.Node = null;

    objPool = {
        cell: { pool: new cc.NodePool(), max: 100 },
        label: { pool: new cc.NodePool(), max: 20 },
    };
    objTouch = {
        isClick: false,
        pStart: null,
    };

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
        this.initGame();
    }

    public addListener() {
        T2M.addSyncEventListener(MainMsgType.ON_TOUCH_CLICK, (data: any) => {
            let levelData = EditorManager.editorData.GameData[SyncDataManager.syncData.customSyncData.curLevel];
            if (data.type == 'cut') {
                // UIHelp.showMask();
                // let msg: { model: number, dir: number } = data.msg;
                // SoundManager.playEffect('click_again', false);
                // let strQues = stepData.model + '' + stepData.dir;
                // let strAnswer = msg.model + '' + msg.dir;
                // if (strQues == strAnswer) {
                //     SyncDataManager.syncData.customSyncData.curStep++;
                //     this.answerRight(true);
                //     SoundManager.playEffect('star', false);
                //     this.initAreaCut();
                //     this.initAreaDrag();
                //     if (SyncDataManager.syncData.customSyncData.curStep > totalCut - 1) {
                //         this._touch.off(cc.Node.EventType.TOUCH_START);
                //         this._touch.off(cc.Node.EventType.TOUCH_MOVE);
                //         this._touch.off(cc.Node.EventType.TOUCH_END);
                //         this._touch.off(cc.Node.EventType.TOUCH_CANCEL);

                //         let areaCut = this._ques.getChildByName('areaCut');
                //         cc.tween(areaCut).to(0.383, { x: -300 }).start();
                //         let areaDrag = this._ques.getChildByName('areaDrag');
                //         areaDrag.active = true;
                //         areaDrag.opacity = 0;
                //         cc.tween(areaDrag).to(0.383, { opacity: 255 }).call(()=>{
                //             UIHelp.closeMask();
                //         }).start();
                //     }
                //     else{
                //         UIHelp.closeMask();
                //     }
                // } else {
                //     SoundManager.playEffect('wrong', false);
                //     this.answerWrong(false);
                //     UIHelp.closeMask();
                // }
            }
            else if (data.type == 'drag') {
                // UIHelp.showMask();
                // let msg: { dragIndex: number, cutBodyIndex: number } = data.msg;
                // SoundManager.playEffect('click_again', false);
                // if (msg.cutBodyIndex < 0) {
                //     SoundManager.playEffect('wrong', false);
                //     this.answerWrong(false);
                //     let areaDrag = this._ques.getChildByName('areaDrag');
                //     let layout = areaDrag.getChildByName('layout');
                //     let dragItem = layout.getChildByName('item' + msg.dragIndex);
                //     if (dragItem) {
                //         let sp = dragItem.getChildByName('sp');
                //         cc.tween(sp)
                //             .to(0.15, { angle: -5 }).to(0.15, { angle: 5 })
                //             .to(0.15, { angle: -5 }).to(0.15, { angle: 0 })
                //             .to(0.383, { position: cc.v3(0, 0) }).call(() => {
                //                 dragItem.zIndex = 0;
                //                 UIHelp.closeMask();
                //             }).start();
                //     }
                // }
                // else {
                //     this.answerRight(true);
                //     SoundManager.playEffect('star', false);
                //     SyncDataManager.syncData.customSyncData.curStep++;
                //     SyncDataManager.syncData.customSyncData.arrDrag[msg.dragIndex] = 'cut' + msg.cutBodyIndex;
                //     this.initAreaDrag();
                //     if (SyncDataManager.syncData.customSyncData.curStep > totalCut * 2 - 1) {
                //         SyncDataManager.syncData.customSyncData.curStep = 0;
                //         SyncDataManager.syncData.customSyncData.curLevel += 1;
                //         if (SyncDataManager.syncData.customSyncData.curLevel < EditorManager.editorData.GameData.length) {
                //             this.initData();
                //             this.initGame();
                //             UIHelp.closeMask();
                //         }
                //         else {
                //             SyncDataManager.syncData.frameSyncData.isGameOver = true;
                //             this.scheduleOnce(this.gameOver, 1.0);
                //         }
                //     }
                //     else{
                //         UIHelp.closeMask();
                //     }
                // }
            }
        });
    }

    public initData() {
        this._gameNode.on(cc.Node.EventType.TOUCH_START, this.touchStart, this);
        this._gameNode.on(cc.Node.EventType.TOUCH_MOVE, this.touchMove, this);
        this._gameNode.on(cc.Node.EventType.TOUCH_END, this.touchEnd, this);
        this._gameNode.on(cc.Node.EventType.TOUCH_CANCEL, this.touchEnd, this);
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

    public initGame() {
        this._laba.getComponent(cc.Animation).play("stop");
        this._lb_curLevel.getComponent(cc.Label).string = (SyncDataManager.syncData.customSyncData.curLevel + 1).toString();
        this._lb_levelCount.getComponent(cc.Label).string = EditorManager.editorData.GameData.length.toString();

        let data = EditorManager.editorData.GameData[EditorManager.editorData.curLevel];
        if (data.gameModel == GameModel.square) {
            this._shapeF.active = true;
            this._shapeY.active = false;
            this.initSquareCell();
            this.initSquareSign();
            this.initSquareQues();
        }
        else if (data.gameModel == GameModel.cycle) {
            this._shapeF.active = false;
            this._shapeY.active = true;
            this.initCycle();
        }
    }

    /** 刷新方块 */
    public initSquareCell() {
        let data = EditorManager.editorData.GameData[EditorManager.editorData.curLevel];
        let obj = data.squareObj;
        let left = this._shapeF.getChildByName('left');
        let center = left.getChildByName('center');
        center.width = CellW * obj.col + SpaceX * (obj.col - 1);
        center.height = CellH * obj.row + SpaceY * (obj.row - 1);
        let layoutCenter = center.getComponent(cc.Layout);
        layoutCenter.spacingX = SpaceX;
        layoutCenter.spacingY = SpaceY;
        center.children.forEach((cellItem) => { cellItem.active = false; });
        for (let i = 0; i < obj.row; i++) {
            for (let j = 0; j < obj.col; j++) {
                let index = i * obj.col + j;
                let cellName = '' + index;
                let cellItem = center.getChildByName(cellName);
                if (!cellItem) {
                    cellItem = this.poolGet(this._cellItem, this.objPool.cell);
                    cellItem.name = cellName;
                    cellItem.parent = center;
                }
                // 数字
                cellItem.active = true;
                let cellData = obj.allCellData[index];
                cellItem.opacity = cellData.state == CellState.show ? 255 : 0;
                if (cellItem.opacity > 0) {
                    let label = cellItem.getChildByName('label');
                    label.active = true;
                    label.getComponent(cc.Label).string = cellData.chars;
                }
            }
        }
    }

    /** 刷新行列标注 */
    public initSquareSign() {
        let data = EditorManager.editorData.GameData[EditorManager.editorData.curLevel];
        let left = this._shapeF.getChildByName('left');
        let row = left.getChildByName('row');
        let col = left.getChildByName('col');
        if (data.squareObj.isSign) {
            let width = CellW * data.squareObj.col + SpaceX * (data.squareObj.col - 1);
            let height = CellH * data.squareObj.row + SpaceY * (data.squareObj.row - 1);
            row.active = true;
            row.x = -(width + CellW) * 0.5 - SpaceX;
            row.y = height * 0.5;
            row.height = height;
            row.getComponent(cc.Layout).spacingY = SpaceY;
            row.children.forEach((item) => { item.active = false; });
            for (let index = 0; index < data.squareObj.row; index++) {
                let item = row.getChildByName('' + index);
                if (!item) {
                    item = this.poolGet(this._cellLabel, this.objPool.label);
                    item.name = '' + index;
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

    public initSquareQues(){
        let right = this._shapeF.getChildByName('right');

    }

    /** 刷新圆形 */
    public initCycle() {
        let data = EditorManager.editorData.GameData[EditorManager.editorData.curLevel];
        let obj = data.cycleObj;
        let fillStart = 0;
        let fillRange = 0;
        let fillDis = Math.round(1000 / obj.cutNum) / 1000;
        let left = this._shapeF.getChildByName('left');
        let cycle = left.getChildByName('cycle');
        for (let index = 0; index < cycle.childrenCount; index++) {
            let item = cycle.getChildByName('item' + index);
            item.active = index < obj.cutNum;
            if (!item.active) {
                continue;
            }
            fillStart = fillDis * index;
            if (index == obj.cutNum - 1) {
                fillRange = 1;
            }
            else {
                fillRange = fillDis * (index + 1);
            }
            item.getComponent(cc.Sprite).fillStart = fillStart;
            item.getComponent(cc.Sprite).fillRange = fillRange;
        }
        // 线
        let angleDis = fillDis * 360;
        let line = left.getChildByName('line');
        for (let index = 0; index < line.childrenCount; index++) {
            let item = line.getChildByName('item' + index);
            item.active = index < obj.cutNum;
            if (!item.active) {
                continue;
            }
            item.angle = -90 + angleDis * index;
        }
    }

    private touchStart(event: cc.Event.EventTouch) {
        this.objTouch.isClick = true;
        this.objTouch.pStart = cc.v3(event.getLocationX(), event.getLocationY());
    }

    private touchMove(event: cc.Event.EventTouch) {
        let data = EditorManager.editorData.GameData[EditorManager.editorData.curLevel];
        // 移动事件 打断点击
        if (this.objTouch.isClick) {
            if (Math.abs(event.getDeltaX()) + Math.abs(event.getDeltaY()) > 2) {
                this.objTouch.isClick = false;
            }
        }
        // let isRefreshUI = false;
        // data.squareObj.allCellData.forEach((cellData, index) => {
        //     let item = center.getChildByName('' + index);
        //     if (cc.Intersection.rectRect(cc.rect(x, y, w, h), item.getBoundingBox())) {
        //         if (cellData.state == CellState.hide) {
        //             cellData.state = CellState.hideChose;
        //             isRefreshUI = true;
        //         }
        //         else if (cellData.state == CellState.show) {
        //             cellData.state = CellState.showChose;
        //             isRefreshUI = true;
        //         }
        //     }
        // });
        // isRefreshUI && this.initLeft();
    }

    private touchEnd(event: cc.Event.EventTouch) {
        // let data = EditorManager.editorData.GameData[EditorManager.editorData.curLevel];
        // let center = this.l_shapeF.getChildByName('center');
        // // 点击事件触发
        // if (this.objTouch.isClick) {

        // }
    }

    protected onGameStart(): void {
        super.onGameStart();
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
    }

    /**
     * 重玩
     */
    protected onReplay() {
        super.onReplay();
    }

    update(dt) {
        super.update(dt);
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
