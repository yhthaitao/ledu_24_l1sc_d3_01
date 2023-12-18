
import { MainMsgType } from '../../../../../scripts/Data/MainMsgType';
import { CosManager } from '../../../../../scripts/Manager/CosManager';
import { GameBundleManager, GamePanelType } from '../../../../../scripts/Manager/GameBundleManager';
import { ListenerManager } from '../../../../../scripts/Manager/ListenerManager';
import { MathUtils } from '../../../../../scripts/Utils/MathUtils';
import { Tools } from '../../../../../scripts/Utils/Tools';
import { UIHelp } from '../../../../../scripts/Utils/UIHelp';
import { ReportManager } from '../../Core/Manager/ReportManager';
import BaseTeacherPanel_24_l1sc_d3_01 from '../../Core/UI/Panel/BaseTeacherPanel';
import { SubUIHelp } from '../../Core/Utils/SubUIHelp';
import { EventType } from '../../Data/EventType';
import { CellH, CellW, EditorManager, GameData, GameModel, SpaceX, SpaceY } from '../../Manager/EditorManager';
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
    private l_touch: cc.Node = null;
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
    }

    onLoad() {
        super.onLoad();
        ListenerManager.on(EventType.SELECTLEVEL, this.updatePanel, this);
        this.l_touch.on(cc.Node.EventType.TOUCH_START, this.touchStart, this);
        this.l_touch.on(cc.Node.EventType.TOUCH_MOVE, this.touchMove, this);
        this.l_touch.on(cc.Node.EventType.TOUCH_END, this.touchEnd, this);
        this.l_touch.on(cc.Node.EventType.TOUCH_CANCEL, this.touchEnd, this);
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

        let gameData: GameData[] = [
            {
                auto_play_title: true,
                titleAudio: '',
                title: '',
                gameModel: GameModel.square,
                squareObj: {
                    isSign: false,
                    row: 10,
                    col: 10,
                    isScore: false,
                    score: 5,
                    cellChars: [],
                },
                cycleObj: {
                    cutNum: 4,
                    isScore: false,
                    score: 2,
                },
            },
        ];
        if (EditorManager.editorData.GameData.length == 0) {
            EditorManager.editorData.GameData = gameData;
        }
        this.levelList.node.active = true;
        this.levelList.initLevel(EditorManager.editorData.GameData, EditorManager.editorData.MaxLevel, this.createLevel.bind(this));
        this.configPanel.node.active = true;
        this.configPanel.updateConfigPanel();
        this.updatePanel();
    }
    public createLevel(_level) { }

    public updatePanel() {
        let data = EditorManager.editorData.GameData[EditorManager.editorData.curLevel];
        this.r_model_toggle.toggleItems[data.gameModel].isChecked = true;
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
            let toggleCellScore = this.r_cellSign.getChildByName('toggle');
            toggleCellScore.getComponent(cc.Toggle).isChecked = data.squareObj.isScore;
            let editBoxCellScore = this.r_cellScore.getChildByName('editBox');
            editBoxCellScore.getComponent(cc.EditBox).string = '' + data.squareObj.score;
            // 隐藏圆形相关选项
            this.r_cycleSet.active = false;
            this.r_cycleScore.active = false;
        }
        else if (data.gameModel == GameModel.cycle) {
            // 隐藏方形相关选项
            this.r_cellNum.active = false;
            this.r_cellSet.active = false;
            this.r_cellSign.active = false;
            this.r_cellScore.active = false;
            // 转盘分割
            this.r_cycleSet.active = true;
            let editBoxCycleSet = this.r_cellScore.getChildByName('editBox');
            editBoxCycleSet.getComponent(cc.EditBox).string = '' + data.cycleObj.cutNum;
            // 分数判定
            this.r_cycleScore.active = true;
            let toggleCycleScore = this.r_cellSign.getChildByName('toggle');
            toggleCycleScore.getComponent(cc.Toggle).isChecked = data.cycleObj.isScore;
            let editBoxCycleScore = this.r_cellScore.getChildByName('editBox');
            editBoxCycleScore.getComponent(cc.EditBox).string = '' + data.cycleObj.score;
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
        console.log('data：', data);
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
                let cellId = i * obj.col + j + 1;
                console.log('i: ', i, '; j: ', j, '; id: ', cellId);
                let cellName = '' + cellId;
                let item = center.getChildByName(cellName);
                if (!item) {
                    item = this.poolGet(this.l_cellItem, this.objPool.cell);
                    item.name = cellName;
                    item.parent = center;
                }
                // 数字
                item.active = true;
                let editBox = item.getChildByName('editBox');
                if (obj.cellChars.length > cellId && obj.cellChars[cellId]) {
                    editBox.active = true;
                    editBox.getComponent(cc.EditBox).string = obj.cellChars[cellId];
                }
                else {
                    editBox.active = false;
                }
            }
        }
    }

    /** 刷新行列标注 */
    public initSquareSign() {
        let data = EditorManager.editorData.GameData[EditorManager.editorData.curLevel];
        let obj = data.squareObj;
        let row = this.l_shapeF.getChildByName('row');
        let col = this.l_shapeF.getChildByName('col');
        obj.isSign = true;
        if (obj.isSign) {
            let width = CellW * obj.col + SpaceX * (obj.col - 1);
            let height = CellH * obj.row + SpaceY * (obj.row - 1);
            row.active = true;
            row.x = -(width + CellW) * 0.5 - SpaceX;
            row.y = height * 0.5;
            row.height = height;
            row.getComponent(cc.Layout).spacingY = SpaceY;
            row.children.forEach((item) => { item.active = false; });
            for (let index = 0; index < obj.row; index++) {
                let item = row.getChildByName('' + index);
                if (!item) {
                    item = this.poolGet(this.l_cellLabel, this.objPool.label);
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
            for (let index = 0; index < obj.col; index++) {
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
        let fillRange = 0;
        let fillDis = Math.round(1000 / obj.cutNum) / 1000;
        let cycle = this.l_shapeY.getChildByName('cycle');
        for (let index = 0; index < cycle.childrenCount; index++) {
            let item = cycle.getChildByName('item' + index);
            item.active = index < obj.cutNum;
            if (!item.active) {
                continue;
            }
            fillStart = fillDis * index;
            if (index == obj.cutNum - 1) {
                fillRange = 360;
            }
            else {
                fillRange = fillDis * (index + 1);
            }
            item.getComponent(cc.Sprite).fillStart = fillStart;
            item.getComponent(cc.Sprite).fillRange = fillRange;
        }
        // 线
        let line = this.l_shapeY.getChildByName('line');
        for (let index = 0; index < line.childrenCount; index++) {
            let item = line.getChildByName('item' + index);
            item.active = index < obj.cutNum;
            if (!item.active) {
                continue;
            }
            item.angle = -90 + fillDis * index;
        }
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

    }

    private touchMove(event: cc.Event.EventTouch) {
        // 点击位置 在touch节点内的相对坐标
        // let pos = this.nodeTouch.convertToNodeSpaceAR(event.getLocation());
        // if (this.cutObj.cutStart) {
        //     this.nodeCutLine.active = true;
        //     this.nodeCutLine.position = this.cutObj.cutStart;
        //     this.nodeCutLine.width = MathUtils.getInstance().getDistance(this.cutObj.cutStart, cc.v3(pos.x, pos.y));
        //     this.nodeCutLine.angle = -MathUtils.getInstance().getTwoPointsRadian2(this.cutObj.cutStart, cc.v3(pos.x, pos.y)) + 90;
        //     return;
        // }
        // for (const keyA in this.cutObj.pSigns) {
        //     if (!Object.prototype.hasOwnProperty.call(this.cutObj.pSigns, keyA)) {
        //         continue;
        //     }
        //     let signsModel = this.cutObj.pSigns[keyA];
        //     for (const keyB in signsModel) {
        //         if (!Object.prototype.hasOwnProperty.call(signsModel, keyB)) {
        //             continue;
        //         }
        //         let points = signsModel[keyB];
        //         for (const keyC in points) {
        //             if (!Object.prototype.hasOwnProperty.call(points, keyC)) {
        //                 continue;
        //             }
        //             const point: cc.Vec3 = points[keyC];
        //             let rect = cc.rect(point.x - this.cutObj.signW * 0.5, point.y - this.cutObj.signH * 0.5, this.cutObj.signW, this.cutObj.signH);
        //             if (rect.contains(pos)) {
        //                 this.cutObj.cutStart = cc.v3(pos.x, pos.y);
        //                 this.cutObj.keyA = Number(keyA);
        //                 this.cutObj.keyB = Number(keyB);
        //                 this.cutObj.keyC = Number(keyC);
        //                 return;
        //             }
        //         }
        //     }
        // }
    }

    private touchEnd(event: cc.Event.EventTouch) {
        // this.nodeCutLine.active = false;
        // console.log('touchEnd()');
        // // 选中判断(触摸位移小于2，作为点击的判断)
        // if (Math.abs(event.getLocationX() - this.cutObj.pStart.x) + Math.abs(event.getLocationY() - this.cutObj.pStart.y) < 2) {
        //     // 点击切割块
        //     let areaCut = this.nodeQues.getChildByName('areaCut');
        //     let center = areaCut.getChildByName('center');
        //     let pos = center.convertToNodeSpaceAR(event.getLocation());
        //     for (let index = 0, length = center.childrenCount; index < length; index++) {
        //         let cutBody = center.children[index];
        //         if (cutBody.getBoundingBox().contains(pos)) {
        //             this.eventBtnCutBody(cutBody);
        //             break;
        //         }
        //     }
        //     return;
        // }

        // // 切割判断
        // if (!this.cutObj.cutStart) {
        //     return;
        // }
        // // 点击位置 在touch节点内的相对坐标
        // let pos = this.nodeTouch.convertToNodeSpaceAR(event.getLocation());
        // let opjPoint = this.cutObj.pSigns[this.cutObj.keyA][this.cutObj.keyB];
        // let keyC = this.cutObj.keyC == CutPoints.start ? CutPoints.finish : CutPoints.start;
        // let pointElse = opjPoint[keyC];
        // let rectX = pointElse.x - this.cutObj.signW * 0.5;
        // let rectY = pointElse.y - this.cutObj.signH * 0.5;
        // let rect = cc.rect(rectX, rectY, this.cutObj.signW, this.cutObj.signH);
        // let isCut = cc.Intersection.lineRect(cc.v2(this.cutObj.cutStart.x, this.cutObj.cutStart.y), pos, rect);
        // if (!isCut) {
        //     return;
        // }
        // let data = EditorManager.editorData.GameData[EditorManager.editorData.curLevel];
        // let initX = data.waitCutBodyData.x;
        // let initY = data.waitCutBodyData.y;
        // let initW = data.waitCutBodyData.w;
        // let initH = data.waitCutBodyData.h;
        // if (data.listCutBodyData.length > 5) {
        //     return;
        // }
        // let radio = 0.5;
        // switch (this.cutObj.keyA) {
        //     case CutModel.small:
        //         radio = 0.125;
        //         break;
        //     case CutModel.mid:
        //         radio = 0.250;
        //         break;
        //     case CutModel.big:
        //         radio = 0.375;
        //         break;
        //     default:
        //         break;
        // }

        // let cutBody: BodyData = {
        //     state: BodyState.cut,
        //     x: this.cutObj.keyB == CutDir.hor ? initX : initX - initW * 0.5 + initW * radio * 0.5,
        //     y: this.cutObj.keyB == CutDir.ver ? initY : initY + initH * 0.5 - initH * radio * 0.5,
        //     w: this.cutObj.keyB == CutDir.hor ? initW : initW * radio,
        //     h: this.cutObj.keyB == CutDir.ver ? initH : initH * radio,
        //     number: -1,
        //     name: 'cut' + (data.listCutBodyData.length + 1),
        // };
        // let waitCutBody: BodyData = {
        //     state: BodyState.start,
        //     x: this.cutObj.keyB == CutDir.hor ? initX : initX + initW * 0.5 - initW * (1 - radio) * 0.5,
        //     y: this.cutObj.keyB == CutDir.ver ? initY : initY - initH * 0.5 + initH * (1 - radio) * 0.5,
        //     w: this.cutObj.keyB == CutDir.hor ? initW : initW * (1 - radio),
        //     h: this.cutObj.keyB == CutDir.ver ? initH : initH * (1 - radio),
        //     number: data.waitCutBodyData.number,
        //     name: data.waitCutBodyData.name,
        // };
        // let listOne = {
        //     model: this.cutObj.keyA,
        //     dir: this.cutObj.keyB,
        //     cutBody: cutBody,
        //     waitCutBody: Tools.deepCopy(data.waitCutBodyData)
        // };
        // data.listCutBodyData.push(listOne);
        // data.waitCutBodyData = waitCutBody;

        // this.initAreaCut();
    }

    /** 切割部分点击事件 */
    eventBtnCutBody(cutBody: cc.Node) {
        // let areaCut = this.nodeQues.getChildByName('areaCut');
        // let center = areaCut.getChildByName('center');
        // let data = EditorManager.editorData.GameData[EditorManager.editorData.curLevel];
        // let list = [data.waitCutBodyData];
        // data.listCutBodyData.forEach((bodyData) => {
        //     list.push(bodyData.cutBody);
        // });

        // list.forEach((bodyData) => {
        //     if (bodyData.name == cutBody.name) {
        //         cutBody.getChildByName('select').active = true;
        //         cutBody.getChildByName('editBox').active = true;
        //         cutBody.getChildByName('label').active = false;
        //     }
        //     else {
        //         let elseBody = center.getChildByName(bodyData.name);
        //         if (elseBody) {
        //             elseBody.getChildByName('select').active = false;
        //             elseBody.getChildByName('editBox').active = false;
        //             elseBody.getChildByName('label').active = bodyData.number > 0;
        //         }
        //     }
        // });
    }

    /** 删除上次的切割 */
    eventBtnDelete(event: cc.Event.EventTouch) {
        // let data = EditorManager.editorData.GameData[EditorManager.editorData.curLevel];
        // if (data.listCutBodyData.length > 0) {
        //     let listLast = data.listCutBodyData.pop();
        //     data.waitCutBodyData = Tools.deepCopy(listLast.waitCutBody);
        //     this.initAreaCut();
        //     this.initAreaDrag();
        // }
    }

    eventToggle(toggle: cc.Toggle, costom: string) {
        // 游戏模式选择
        if (costom == 'model') {
            let data = EditorManager.editorData.GameData[EditorManager.editorData.curLevel];
            data.gameModel = this.r_model_toggle.toggleItems[0].isChecked ? GameModel.square : GameModel.cycle;
            this.initUI();
        }
    }

    eventEditbox(editBox: cc.EditBox, costom: string) {
        let chars = editBox.string;
        if (costom == 'row' || costom == 'col') {
            if (chars.length < 1) {
                editBox.string = '1';
            }
            let num = Number(editBox.string);
            if (num < 1) {
                num = 1;
            }
            editBox.string = '' + num;
            let data = EditorManager.editorData.GameData[EditorManager.editorData.curLevel];
            data.squareObj[costom] = num;
            this.initUI();
        }
        // let chars = editBox.string;
        // if (chars.length < 1) {
        //     return;
        // }
        // let num = Number(editBox.string);
        // if (num < 1) {
        //     num = 1;
        // }
        // if (costom == 'body') {
        //     let data = EditorManager.editorData.GameData[EditorManager.editorData.curLevel];
        //     let name = editBox.node.parent.name;
        //     if (name == data.waitCutBodyData.name) {
        //         data.waitCutBodyData.number = num;
        //     }
        //     else {
        //         data.listCutBodyData.forEach((bodyData) => {
        //             if (bodyData.cutBody.name == editBox.node.parent.name) {
        //                 bodyData.cutBody.number = num;
        //             }
        //         });
        //     }
        //     this.initBodyCut();
        // }
        // else if (costom == 'digit') {

        // }
        // this.initAreaDrag();
    }

    eventButton(event: cc.Event.EventTouch, costom: string) {

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
        const isEdit = EditorManager.isSupportEdit();
        if (!isEdit || ReportManager.isAllOver) {
            SubUIHelp.showSubmissionPanel();
        } else {
            UIHelp.showTip('请先完成一遍题目');
        }
    }
    // 预览课件按钮
    public onBtnViewClicked() {
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
