import { MainMsgType } from '../../../../../scripts/Data/MainMsgType';
import { SoundManager } from '../../../../../scripts/Manager/SoundManager';
import { MathUtils } from '../../../../../scripts/Utils/MathUtils';
import { Tools } from '../../../../../scripts/Utils/Tools';
import { UIHelp } from '../../../../../scripts/Utils/UIHelp';
import { SyncDataManager, SyncData } from '../../Core/Manager/SyncDataManager';
import { T2M } from '../../Core/SDK/T2M';
import BaseGamePanel_24_l1sc_d3_01 from '../../Core/UI/Panel/BaseGamePanel';
import { AreaCutH, AreaCutW, BodyData, BodyState, CutDir, CutModel, CutPoints, EditorManager, GameModel } from '../../Manager/EditorManager';

const { ccclass, property } = cc._decorator;

@ccclass
export default class GamePanel_24_l1sc_d3_01 extends BaseGamePanel_24_l1sc_d3_01 {
    public static className = 'GamePanel_24_l1sc_d3_01';

    private _gameNode: cc.Node = null;
    private _laba: cc.Node = null;
    private _touch: cc.Node = null;
    private _ques: cc.Node = null;
    private _show: cc.Node = null;
    private _cutLine: cc.Node = null;
    private _levelProgress: cc.Node = null;
    private _lb_curLevel: cc.Node = null;
    private _lb_levelCount: cc.Node = null;

    cutObj = { dis: 10, pStart: cc.v3(), cutStart: cc.v3(), keyA: 0, keyB: 0, keyC: 0, signW: 50, signH: 50, pSigns: {} };

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
            let curStep = SyncDataManager.syncData.customSyncData.curStep;
            let totalCut = levelData.listCutBodyData.length;
            if (data.type == 'cut') {
                UIHelp.showMask();
                let msg: { model: number, dir: number } = data.msg;
                SoundManager.playEffect('click_again', false);
                let stepData = levelData.listCutBodyData[curStep];
                let strQues = stepData.model + '' + stepData.dir;
                let strAnswer = msg.model + '' + msg.dir;
                if (strQues == strAnswer) {
                    SyncDataManager.syncData.customSyncData.curStep++;
                    this.answerRight(true);
                    SoundManager.playEffect('star', false);
                    this.initAreaCut();
                    this.initAreaDrag();
                    if (SyncDataManager.syncData.customSyncData.curStep > totalCut - 1) {
                        this._touch.off(cc.Node.EventType.TOUCH_START);
                        this._touch.off(cc.Node.EventType.TOUCH_MOVE);
                        this._touch.off(cc.Node.EventType.TOUCH_END);
                        this._touch.off(cc.Node.EventType.TOUCH_CANCEL);

                        let areaCut = this._ques.getChildByName('areaCut');
                        cc.tween(areaCut).to(0.383, { x: -300 }).start();
                        let areaDrag = this._ques.getChildByName('areaDrag');
                        areaDrag.active = true;
                        areaDrag.opacity = 0;
                        cc.tween(areaDrag).to(0.383, { opacity: 255 }).call(()=>{
                            UIHelp.closeMask();
                        }).start();
                    }
                    else{
                        UIHelp.closeMask();
                    }
                } else {
                    SoundManager.playEffect('wrong', false);
                    this.answerWrong(false);
                    UIHelp.closeMask();
                }
            }
            else if (data.type == 'drag') {
                UIHelp.showMask();
                let msg: { dragIndex: number, cutBodyIndex: number } = data.msg;
                SoundManager.playEffect('click_again', false);
                if (msg.cutBodyIndex < 0) {
                    SoundManager.playEffect('wrong', false);
                    this.answerWrong(false);
                    let areaDrag = this._ques.getChildByName('areaDrag');
                    let layout = areaDrag.getChildByName('layout');
                    let dragItem = layout.getChildByName('item' + msg.dragIndex);
                    if (dragItem) {
                        let sp = dragItem.getChildByName('sp');
                        cc.tween(sp)
                            .to(0.15, { angle: -5 }).to(0.15, { angle: 5 })
                            .to(0.15, { angle: -5 }).to(0.15, { angle: 0 })
                            .to(0.383, { position: cc.v3(0, 0) }).call(() => {
                                dragItem.zIndex = 0;
                                UIHelp.closeMask();
                            }).start();
                    }
                }
                else {
                    this.answerRight(true);
                    SoundManager.playEffect('star', false);
                    SyncDataManager.syncData.customSyncData.curStep++;
                    SyncDataManager.syncData.customSyncData.arrDrag[msg.dragIndex] = 'cut' + msg.cutBodyIndex;
                    this.initAreaDrag();
                    if (SyncDataManager.syncData.customSyncData.curStep > totalCut * 2 - 1) {
                        SyncDataManager.syncData.customSyncData.curStep = 0;
                        SyncDataManager.syncData.customSyncData.curLevel += 1;
                        if (SyncDataManager.syncData.customSyncData.curLevel < EditorManager.editorData.GameData.length) {
                            this.initData();
                            this.initGame();
                            UIHelp.closeMask();
                        }
                        else {
                            SyncDataManager.syncData.frameSyncData.isGameOver = true;
                            this.scheduleOnce(this.gameOver, 1.0);
                        }
                    }
                    else{
                        UIHelp.closeMask();
                    }
                }
            }
        });
    }

    public initData() {
        let data = EditorManager.editorData.GameData[SyncDataManager.syncData.customSyncData.curLevel];
        let curStep = SyncDataManager.syncData.customSyncData.curStep;
        let totalCut = data.listCutBodyData.length;
        if (curStep < totalCut) {
            this._touch.on(cc.Node.EventType.TOUCH_START, this.eventCutStart, this);
            this._touch.on(cc.Node.EventType.TOUCH_MOVE, this.eventCutMove, this);
            this._touch.on(cc.Node.EventType.TOUCH_END, this.eventCutEnd, this);
            this._touch.on(cc.Node.EventType.TOUCH_CANCEL, this.eventCutEnd, this);
        }
        let areaDrag = this._ques.getChildByName('areaDrag');
        let layout = areaDrag.getChildByName('layout');
        layout.children.forEach((item) => {
            let back = item.getChildByName('back');
            back.on(cc.Node.EventType.TOUCH_START, this.eventDragStart, this);
            back.on(cc.Node.EventType.TOUCH_MOVE, this.eventDragMove, this);
            back.on(cc.Node.EventType.TOUCH_END, this.eventDragEnd, this);
            back.on(cc.Node.EventType.TOUCH_CANCEL, this.eventDragEnd, this);
        });
    }

    public initGame() {
        this._laba.getComponent(cc.Animation).play("stop");
        this._lb_curLevel.getComponent(cc.Label).string = (SyncDataManager.syncData.customSyncData.curLevel + 1).toString();
        this._lb_levelCount.getComponent(cc.Label).string = EditorManager.editorData.GameData.length.toString();

        let data = EditorManager.editorData.GameData[SyncDataManager.syncData.customSyncData.curLevel];
        let curStep = SyncDataManager.syncData.customSyncData.curStep;
        let totalCut = data.listCutBodyData.length;
        let areaCut = this._ques.getChildByName('areaCut');
        areaCut.x = curStep < totalCut ? 0 : -300;
        let areaDrag = this._ques.getChildByName('areaDrag');
        areaDrag.active = curStep >= totalCut;

        this.initAreaCut();
        this.initAreaDrag();
    }

    public initAreaCut() {
        this.initBodyCut();
        this.initBodySign();
    }

    public initBodyCut() {
        let data = EditorManager.editorData.GameData[SyncDataManager.syncData.customSyncData.curLevel];
        let curStep = SyncDataManager.syncData.customSyncData.curStep;
        let totalCut = data.listCutBodyData.length;

        if (data.gameModel == GameModel.ques) {
            let areaCut = this._ques.getChildByName('areaCut');
            let center = areaCut.getChildByName('center');
            let copy = areaCut.getChildByName('copy');
            let light = areaCut.getChildByName('light');
            let dark = areaCut.getChildByName('dark');
            let refreshUI = (body: cc.Node, bodyType: number, number: number, isShowNumber: boolean) => {
                let size = body.getContentSize();
                let icon = body.getChildByName('icon');
                if (bodyType == 0) {
                    icon.getComponent(cc.Sprite).spriteFrame = light.getComponent(cc.Sprite).spriteFrame;
                }
                else {
                    icon.getComponent(cc.Sprite).spriteFrame = dark.getComponent(cc.Sprite).spriteFrame;
                }
                icon.setContentSize(size);
                body.getChildByName('select').active = false;
                body.getChildByName('editBox').active = false;
                let label = body.getChildByName('label');
                label.opacity = isShowNumber ? 255 : 0;
                label.setContentSize(size);
                label.getComponent(cc.Label).string = '' + number;
            };

            // 待切割块
            let waitCutBodyData = this.getWaitCutBodyData();
            let waitCutBody = center.getChildByName(waitCutBodyData.name);
            if (!waitCutBody) {
                waitCutBody = cc.instantiate(copy);
                waitCutBody.name = waitCutBodyData.name;
                waitCutBody.zIndex = 1;
                waitCutBody.parent = center;
            }
            waitCutBody.active = true;
            waitCutBody.x = waitCutBodyData.x;
            waitCutBody.y = waitCutBodyData.y;
            waitCutBody.width = waitCutBodyData.w - this.cutObj.dis;
            waitCutBody.height = waitCutBodyData.h - this.cutObj.dis;
            refreshUI(waitCutBody, 0, waitCutBodyData.number, curStep >= totalCut);

            // 已切割块
            if (curStep > 0) {
                for (let index = 0; index < totalCut; index++) {
                    if (index >= curStep) {
                        break;
                    }
                    let cutBodyData: BodyData = data.listCutBodyData[index].cutBody;
                    let cutBody = center.getChildByName(cutBodyData.name);
                    if (!cutBody) {
                        cutBody = cc.instantiate(copy);
                        cutBody.name = cutBodyData.name;
                        cutBody.zIndex = 0;
                        cutBody.parent = center;
                    }
                    cutBody.active = true;
                    cutBody.x = cutBodyData.x;
                    cutBody.y = cutBodyData.y;
                    cutBody.width = cutBodyData.w - this.cutObj.dis;
                    cutBody.height = cutBodyData.h - this.cutObj.dis;
                    refreshUI(cutBody, 1, cutBodyData.number, false);
                }
            }
        }
    }

    public initBodySign() {
        let data = EditorManager.editorData.GameData[SyncDataManager.syncData.customSyncData.curLevel];
        let areaCut = this._ques.getChildByName('areaCut');
        let center = areaCut.getChildByName('center');
        let waitCutBody = center.getChildByName('cut0');
        if (!waitCutBody) {
            return;
        }
        let curStep = SyncDataManager.syncData.customSyncData.curStep;
        let sign = waitCutBody.getChildByName('sign');
        sign.active = curStep < data.listCutBodyData.length;
        if (!sign.active) {
            return;
        }
        sign.children.forEach((item) => { item.active = false; });
        let baseW = Math.floor(AreaCutW * 0.125);
        let baseH = Math.floor(AreaCutH * 0.125);
        let checkW = waitCutBody.width + this.cutObj.dis;
        let checkH = waitCutBody.height + this.cutObj.dis;
        let radio = data.cutModel == CutModel.small ? 0.125 : data.cutModel == CutModel.mid ? 0.250 : 0.375;
        let cur_hor_0 = sign.getChildByName('cur_hor_0');
        let cur_hor_1 = sign.getChildByName('cur_hor_1');
        let cur_ver_0 = sign.getChildByName('cur_ver_0');
        let cur_ver_1 = sign.getChildByName('cur_ver_1');
        // 当前切割模式 水平方向 切割标识存在
        let isHaveCurHor = checkW * 0.5 >= baseW && checkH * radio >= baseH;
        if (isHaveCurHor) {
            cur_hor_0.active = true;
            cur_hor_1.active = true;
            cur_hor_0.position = cc.v3(-checkW * 0.5, checkH * (0.5 - radio));
            cur_hor_1.position = cc.v3(checkW * 0.5, checkH * (0.5 - radio));
        }
        // 当前切割模式 竖直方向 切割标识存在
        let isHaveCurVer = checkW * radio >= baseW && checkH * 0.5 >= baseH;
        if (isHaveCurVer) {
            cur_ver_0.active = true;
            cur_ver_1.active = true;
            cur_ver_0.position = cc.v3(checkW * (radio - 0.5), checkH * 0.5);
            cur_ver_1.position = cc.v3(checkW * (radio - 0.5), -checkH * 0.5);
        }
        let else_hor_0 = sign.getChildByName('else_hor_0');
        let else_hor_1 = sign.getChildByName('else_hor_1');
        let else_ver_0 = sign.getChildByName('else_ver_0');
        let else_ver_1 = sign.getChildByName('else_ver_1');
        // 特殊切割模式 水平方向 切割标识存在
        let isHaveElseHor = Math.floor(checkH * 0.5) >= baseH;
        if (isHaveElseHor) {
            else_hor_0.active = true;
            else_hor_1.active = true;
            else_hor_0.position = cc.v3(-checkW * 0.5, 0);
            else_hor_1.position = cc.v3(checkW * 0.5, 0);
        }
        // 特殊切割模式 竖直方向 切割标识存在
        let isHaveElseVer = Math.floor(checkW * 0.5) >= baseW;
        if (isHaveElseVer) {
            else_ver_0.active = true;
            else_ver_1.active = true;
            else_ver_0.position = cc.v3(0, checkH * 0.5);
            else_ver_1.position = cc.v3(0, -checkH * 0.5);
        }

        // 组装画线检测数据
        this.cutObj.pSigns = {};
        if (isHaveCurHor || isHaveCurVer) {
            this.cutObj.pSigns[data.cutModel] = {};
            if (isHaveCurHor) {
                this.cutObj.pSigns[data.cutModel][CutDir.hor] = {};
                this.cutObj.pSigns[data.cutModel][CutDir.hor][CutPoints.start] = cur_hor_0.position;
                this.cutObj.pSigns[data.cutModel][CutDir.hor][CutPoints.finish] = cur_hor_1.position;
            }
            if (isHaveCurVer) {
                this.cutObj.pSigns[data.cutModel][CutDir.ver] = {};
                this.cutObj.pSigns[data.cutModel][CutDir.ver][CutPoints.start] = cur_ver_0.position;
                this.cutObj.pSigns[data.cutModel][CutDir.ver][CutPoints.finish] = cur_ver_1.position;
            }
        }
        if (isHaveElseHor || isHaveElseVer) {
            this.cutObj.pSigns[CutModel.else] = {};
            if (isHaveElseHor) {
                this.cutObj.pSigns[CutModel.else][CutDir.hor] = {};
                this.cutObj.pSigns[CutModel.else][CutDir.hor][CutPoints.start] = else_hor_0.position;
                this.cutObj.pSigns[CutModel.else][CutDir.hor][CutPoints.finish] = else_hor_1.position;
            }
            if (isHaveElseVer) {
                this.cutObj.pSigns[CutModel.else][CutDir.ver] = {};
                this.cutObj.pSigns[CutModel.else][CutDir.ver][CutPoints.start] = else_ver_0.position;
                this.cutObj.pSigns[CutModel.else][CutDir.ver][CutPoints.finish] = else_ver_1.position;
            }
        }
        // 检测点坐标变换
        for (const keyA in this.cutObj.pSigns) {
            if (!Object.prototype.hasOwnProperty.call(this.cutObj.pSigns, keyA)) {
                continue;
            }
            let signsModel = this.cutObj.pSigns[keyA];
            for (const keyB in signsModel) {
                if (!Object.prototype.hasOwnProperty.call(signsModel, keyB)) {
                    continue;
                }
                let points = signsModel[keyB];
                for (const keyC in points) {
                    if (!Object.prototype.hasOwnProperty.call(points, keyC)) {
                        continue;
                    }
                    points[keyC] = this.getLocalPos(waitCutBody, points[keyC], this._touch);
                }
            }
        }
    }

    public initAreaDrag() {
        let arrSyncDrag = SyncDataManager.syncData.customSyncData.arrDrag;
        let data = EditorManager.editorData.GameData[SyncDataManager.syncData.customSyncData.curLevel];
        let areaCut = this._ques.getChildByName('areaCut');
        let center = areaCut.getChildByName('center');
        let cutWait = center.getChildByName('cut0');
        let labelWait = cutWait.getChildByName('label');
        let numWait = Number(labelWait.getComponent(cc.Label).string);
        let arrNumber = [];
        data.arrNumber.forEach((value, key)=>{
            arrNumber[key] = value;
        });
        arrNumber.splice(arrNumber.indexOf(numWait), 1);
        // 组合数字
        let areaDrag = this._ques.getChildByName('areaDrag');
        let layout = areaDrag.getChildByName('layout');
        let copy = areaDrag.getChildByName('copy');
        for (let index = 0, length = layout.childrenCount; index < length; index++) {
            const item = layout.getChildByName('item' + index);
            if (index >= arrNumber.length) {
                item.active = false;
                continue;
            }
            let sync = arrSyncDrag[index];
            if (sync) {
                item.active = false;
                let cutBody = center.getChildByName(sync);
                if (cutBody) {
                    cutBody.getChildByName('label').opacity = 255;
                }
                continue;
            }
            item.active = true;
            let number = arrNumber[index];
            let label = item.getChildByName('label');
            label.getComponent(cc.Label).string = '' + number;
            // 拼数字
            let sp = item.getChildByName('sp');
            let sp0 = sp.getChildByName('0');
            let sp1 = sp.getChildByName('1');
            if (number < 10) {
                sp0.active = true;
                sp0.position = cc.v3(0, 10);
                sp1.active = false;
                let copy0 = copy.getChildByName('' + number);
                sp0.getComponent(cc.Sprite).spriteFrame = copy0.getComponent(cc.Sprite).spriteFrame;
            }
            else {
                sp0.active = true;
                sp0.position = cc.v3(-30, 10);
                sp1.active = true;
                sp1.position = cc.v3(30, 10);
                let copy0 = copy.getChildByName('' + Math.floor(number / 10));
                sp0.getComponent(cc.Sprite).spriteFrame = copy0.getComponent(cc.Sprite).spriteFrame;
                let copy1 = copy.getChildByName('' + Math.floor(number % 10));
                sp1.getComponent(cc.Sprite).spriteFrame = copy1.getComponent(cc.Sprite).spriteFrame;
            }
        }
    }

    eventCutStart(event: cc.Event.EventTouch) {
        console.log('touchStart');
        this.cutObj.pStart = cc.v3(event.getLocationX(), event.getLocationY());
        this.cutObj.cutStart = null;
    }

    eventCutMove(event: cc.Event.EventTouch) {
        // 点击位置 在touch节点内的相对坐标
        let pos = this._touch.convertToNodeSpaceAR(event.getLocation());
        if (this.cutObj.cutStart) {
            this._cutLine.active = true;
            this._cutLine.position = this.cutObj.cutStart;
            this._cutLine.width = MathUtils.getInstance().getDistance(this.cutObj.cutStart, cc.v3(pos.x, pos.y));
            this._cutLine.angle = -MathUtils.getInstance().getTwoPointsRadian2(this.cutObj.cutStart, cc.v3(pos.x, pos.y)) + 90;
            return;
        }
        for (const keyA in this.cutObj.pSigns) {
            if (!Object.prototype.hasOwnProperty.call(this.cutObj.pSigns, keyA)) {
                continue;
            }
            let signsModel = this.cutObj.pSigns[keyA];
            for (const keyB in signsModel) {
                if (!Object.prototype.hasOwnProperty.call(signsModel, keyB)) {
                    continue;
                }
                let points = signsModel[keyB];
                for (const keyC in points) {
                    if (!Object.prototype.hasOwnProperty.call(points, keyC)) {
                        continue;
                    }
                    const point: cc.Vec3 = points[keyC];
                    let rect = cc.rect(point.x - this.cutObj.signW * 0.5, point.y - this.cutObj.signH * 0.5, this.cutObj.signW, this.cutObj.signH);
                    if (rect.contains(pos)) {
                        this.cutObj.cutStart = cc.v3(pos.x, pos.y);
                        this.cutObj.keyA = Number(keyA);
                        this.cutObj.keyB = Number(keyB);
                        this.cutObj.keyC = Number(keyC);
                        return;
                    }
                }
            }
        }
    }

    eventCutEnd(event: cc.Event.EventTouch) {
        this._cutLine.active = false;
        // 切割判断
        if (!this.cutObj.cutStart) {
            return;
        }
        // 点击位置 在touch节点内的相对坐标
        let pos = this._touch.convertToNodeSpaceAR(event.getLocation());
        let opjPoint = this.cutObj.pSigns[this.cutObj.keyA][this.cutObj.keyB];
        let keyC = this.cutObj.keyC == CutPoints.start ? CutPoints.finish : CutPoints.start;
        let pointElse = opjPoint[keyC];
        let rectX = pointElse.x - this.cutObj.signW * 0.5;
        let rectY = pointElse.y - this.cutObj.signH * 0.5;
        let rect = cc.rect(rectX, rectY, this.cutObj.signW, this.cutObj.signH);
        let isCut = cc.Intersection.lineRect(cc.v2(this.cutObj.cutStart.x, this.cutObj.cutStart.y), pos, rect);
        if (isCut) {
            T2M.dispatch(MainMsgType.ON_TOUCH_CLICK, { type: 'cut', msg: { model: this.cutObj.keyA, dir: this.cutObj.keyB } });
        }
    }

    eventDragStart(event: cc.Event.EventTouch) {
        event.target.parent.zIndex = cc.macro.MAX_ZINDEX;
    }

    eventDragMove(event: cc.Event.EventTouch) {
        let item: cc.Node = event.target.parent;
        let sp = item.getChildByName('sp');
        sp.x += event.getDeltaX();
        sp.y += event.getDeltaY();
    }

    eventDragEnd(event: cc.Event.EventTouch) {
        let areaCut = this._ques.getChildByName('areaCut');
        let center = areaCut.getChildByName('center');
        let item: cc.Node = event.target.parent;
        let sp = item.getChildByName('sp');
        let label = item.getChildByName('label');
        let dragNumber = Number(label.getComponent(cc.Label).string);
        let rectA = sp.getBoundingBoxToWorld();
        let data = EditorManager.editorData.GameData[SyncDataManager.syncData.customSyncData.curLevel];
        let arrSyncDrag = SyncDataManager.syncData.customSyncData.arrDrag;
        let cutBodyIndex = -1;
        for (let index = 0, length = data.listCutBodyData.length; index < length; index++) {
            let cutBodyData: BodyData = data.listCutBodyData[index].cutBody;
            // 切割块已填数
            if (arrSyncDrag.indexOf(cutBodyData.name) >= 0) {
                continue;
            }
            // 切割块数字 与 拖拽数字 不同
            if (cutBodyData.number != dragNumber) {
                continue;
            }
            let cutBody = center.getChildByName(cutBodyData.name);
            if (!cutBody) {
                continue;
            }
            if (cc.Intersection.rectRect(rectA, cutBody.getBoundingBoxToWorld())) {
                cutBodyIndex = Number(cutBodyData.name.slice(3));
                break;
            }
        }
        let dragItem: cc.Node = event.target.parent;
        let dragIndex = Number(dragItem.name.slice(4));
        T2M.dispatch(MainMsgType.ON_TOUCH_CLICK, { type: 'drag', msg: { dragIndex: dragIndex, cutBodyIndex: cutBodyIndex } });
    }

    /** 切割部分点击事件 */
    eventBtnCutBody(cutBody: cc.Node) {
        let areaCut = this._ques.getChildByName('areaCut');
        let center = areaCut.getChildByName('center');
        let data = EditorManager.editorData.GameData[SyncDataManager.syncData.customSyncData.curLevel];
        let list = [data.waitCutBodyData];
        data.listCutBodyData.forEach((bodyData) => {
            list.push(bodyData.cutBody);
        });

        list.forEach((bodyData) => {
            if (bodyData.name == cutBody.name) {
                cutBody.getChildByName('select').active = true;
                cutBody.getChildByName('editBox').active = true;
                cutBody.getChildByName('label').active = false;
            }
            else {
                let elseBody = center.getChildByName(bodyData.name);
                if (elseBody) {
                    elseBody.getChildByName('select').active = false;
                    elseBody.getChildByName('editBox').active = false;
                    elseBody.getChildByName('label').active = bodyData.number > 0;
                }
            }
        });
    }

    onEditDidEnd(editBox: cc.EditBox, costom: string) {
        let chars = editBox.string;
        if (chars.length < 1) {
            return;
        }
        let num = Number(editBox.string);
        if (num < 1) {
            num = 1;
        }
        if (costom == 'body') {
            let data = EditorManager.editorData.GameData[SyncDataManager.syncData.customSyncData.curLevel];
            let name = editBox.node.parent.name;
            if (name == data.waitCutBodyData.name) {
                data.waitCutBodyData.number = num;
            }
            else {
                data.listCutBodyData.forEach((bodyData) => {
                    if (bodyData.cutBody.name == editBox.node.parent.name) {
                        bodyData.cutBody.number = num;
                    }
                });
            }
            this.initBodyCut();
        }
        else if (costom == 'digit') {

        }
        this.initAreaDrag();
    }

    getWaitCutBodyData() {
        let data = EditorManager.editorData.GameData[SyncDataManager.syncData.customSyncData.curLevel];
        let curStep = SyncDataManager.syncData.customSyncData.curStep;
        let totalCut = data.listCutBodyData.length;
        if (totalCut == 0 || curStep > totalCut - 1) {
            return data.waitCutBodyData;
        }
        let waitIndex = curStep < totalCut ? curStep : totalCut - 1;
        return data.listCutBodyData[waitIndex].waitCutBody;
    }

    /**
     * 获取 父节点上的当前坐标 在 目标节点上的 相对坐标
     * @param nodeParent 父节点
     * @param pointCur 父节点上的坐标
     * @param nodeGoal 目标节点
     * @returns 
     */
    getLocalPos(nodeParent: cc.Node, pointCur: cc.Vec3, nodeGoal: cc.Node) {
        let pointWorld = nodeParent.convertToWorldSpaceAR(pointCur);
        return nodeGoal.convertToNodeSpaceAR(pointWorld);
    };

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
}
