
import { ListenerManager } from "../../../../../scripts/Manager/ListenerManager";
import { Tools } from "../../../../../scripts/Utils/Tools";
import { UIHelp } from "../../../../../scripts/Utils/UIHelp";
import { EventType } from "../../../scripts/Data/EventType";
import { EditorManager } from "../../../scripts/Manager/EditorManager";
import { SubUIHelp } from "../../Core/Utils/SubUIHelp";
// import { EventType } from "../../Data/EventType";
// import { EditorManager } from "../../Manager/EditorManager";

const { ccclass, property } = cc._decorator;

@ccclass
export default class levelList_24_l1sc_d3_01 extends cc.Component {
    private addBtnIndex = 88;

    private Layout: cc.Node = null;
    private deleteNode: cc.Node = null;
    private center: cc.Node = null;
    private tempNode: cc.Node = null;

    private operation: cc.Node = null;
    private operationTemp: cc.Node = null;
    private operationIndex: number = 0;

    private scrollView: cc.ScrollView = null;

    private btnList: cc.Node[] = [];
    private AddBtn: cc.Node = null;

    private isDelete: boolean = false;

    private startIndex: number = 0;
    private endIndex: number = 0;

    private isMove: boolean = false;
    private moveNode: cc.Node = null;

    private isMoveTopOrBontton: number = 0;

    private starTime: number = 0;

    private isTouchMouse: boolean = false;

    private LevelMove: boolean = false;

    private isItemMove: boolean = false;

    private operationObj = ["新建关卡", "复制关卡", "删除关卡", "批量删除"];
    private MaxLevel: number = 10;

    private LevelData = [];

    private deleteList = [];
    private state: number = 0;

    private creatorLevel: Function = null;
    onLoad() {
        // ListenerManager.on(EventType.CLOSE_VIEW,this._closeView,this);

        this.Layout = this.node.getChildByName("layout");
        this.operationTemp = this.node.getChildByName("operationTemp");
        this.operation = this.node.getChildByName("operation");

        this.deleteNode = this.Layout.getChildByName("deleteNode");
        this.scrollView = this.Layout.getChildByName("ScrollView").getComponent(cc.ScrollView);
        this.center = this.scrollView.node.getChildByName("center");
        this.tempNode = this.Layout.getChildByName("temp");



        this.operation.active = false;


        this.node.zIndex = 99;
    }

    onDestroy() {
        ;

        this.center.off(cc.Node.EventType.TOUCH_START, this.touchStart, this);
        this.center.off(cc.Node.EventType.TOUCH_MOVE, this.touchMove, this);
        this.center.off(cc.Node.EventType.TOUCH_END, this.touchEnd, this);
        this.center.off(cc.Node.EventType.TOUCH_CANCEL, this.touchCancel, this);

        this.scrollView.verticalScrollBar.node.off(cc.Node.EventType.TOUCH_MOVE, this.touchMove1, this);

        this.center.off("mousewheel");
    }


    initLevel(levelData, MaxLevel, creatorLevel) {
        this.creatorLevel = creatorLevel;
        this.MaxLevel = MaxLevel;
        this.LevelData = levelData;
        ////*** AddListener ***////

        this.center.on(cc.Node.EventType.TOUCH_START, this.touchStart, this);
        this.center.on(cc.Node.EventType.TOUCH_MOVE, this.touchMove, this);
        this.center.on(cc.Node.EventType.TOUCH_END, this.touchEnd, this);
        this.center.on(cc.Node.EventType.TOUCH_CANCEL, this.touchCancel, this);

        this.scrollView.verticalScrollBar.node.on(cc.Node.EventType.TOUCH_MOVE, this.touchMove1, this);


        this.center.on("mouseup", (event) => {
            this.isTouchMouse = false;
        }, this);

        this.center.on("mousedown", this.centerMousedown, this);

        this.center.on("mousewheel", (event) => {
            this.moveCenter(this.center.height - this.scrollView.node.height, event.getScrollY());
        }, this);

        this.operation.on("mousemove", (event) => {
            let pos = this.operation.convertToNodeSpaceAR(event.getLocation());

            let index = Math.ceil(Math.abs(pos.y == 0 ? 1 : pos.y) / this.operationTemp.height);


            for (let i = 0; i < this.operation.children.length; i++) {
                const element = this.operation.children[i];

                element.getChildByName("label").color = i == index - 1 ? new cc.Color(255, 255, 255, 255) : new cc.Color(125, 125, 125, 255);
                element.getChildByName("icon2").active = i == index - 1;
                // console.log(element.getChildByName("label"),index);
            }
        }, this);

        this.operation.on("mousedown", (event) => {
            let pos = this.operation.convertToNodeSpaceAR(event.getLocation());

            let index = Math.ceil(Math.abs(pos.y == 0 ? 1 : pos.y) / this.operationTemp.height);

            if (event.getButton() == cc.Event.EventMouse.BUTTON_LEFT) {
                this.isTouchMouse = false;
                this.operation.active = false;
                this.node.zIndex = 99;
                this.onOperation(index);
            }
        }, this);

        this.operation.on("mouseleave", (event) => {
            this.operation.active = false;
            this.node.zIndex = 99;
        }, this);


        ///////////////////////////////////////////

        this.initOperation();
        this.initLevelList(this.MaxLevel);
        this.updateView();
        this.setLevelList(this.LevelData, this.MaxLevel);
        let stateNode = this.deleteNode.getChildByName("state");
        this.addBtnEvent(stateNode.getChildByName("brack"), "onBrack");
        this.addBtnEvent(stateNode.getChildByName("delete"), "onDeleteList");
    }

    private onBrack() {
        this.state = 0;
        this.deleteList = [];
        this.updateView();
    }

    private onDeleteList() {
        // this.state = 0;
        // this.deleteList = [];
        if (this.LevelData.length - this.deleteList.length < 1) {
            UIHelp.showTip("至少要保留1关，无法删除关卡")
        } else {
            SubUIHelp.showAffirmTip(0, "删除后，关卡所有信息将被清空", function (type: number) {
                if (type == 1) {
                    this.deleteListLevel();
                }
            }.bind(this), "取消", "删除")
        }
    }

    private deleteListLevel() {
        if (this.deleteList.length <= 0) {
            this.state = 0;
            // this.deleteList = [];
            this.updateView();
        } else {
            let deleteIndex = this.LevelData.indexOf(this.deleteList[0]);
            this.deleteList.splice(0, 1);
            this.DeleteLevel(deleteIndex);
            this.deleteListLevel();
        }

    }

    ////列表鼠标点击
    centerMousedown(event) {
        let pos = event.target.convertToNodeSpaceAR(event.getLocation());
        let index = Math.ceil(((Math.abs(pos.y))) / this.tempNode.height);

        if (event.getButton() == cc.Event.EventMouse.BUTTON_RIGHT && index <= this.LevelData.length && this.state == 0) {
            this.isTouchMouse = true;
            this.operationIndex = index;
            this.operation.active = true;
            this.node.zIndex = 101;

            let _pos = this.operation.parent.convertToNodeSpaceAR(event.target.convertToWorldSpaceAR(pos));
            this.operation.x = _pos.x;
            this.operation.y = _pos.y;

            for (let i = 0; i < this.operation.children.length; i++) {
                const element = this.operation.children[i];
                element.getChildByName("label").color = new cc.Color(125, 125, 125, 255);
                element.getChildByName("icon2").active = false;
            }
        }
        if (event.getButton() == cc.Event.EventMouse.BUTTON_LEFT) {
            if (index == this.LevelData.length + 1 && this.LevelData.length != this.MaxLevel) {
                this.onTouchAddNode();
            }
        }
    }

    private setScrollBar() {
        this.scrollView.verticalScrollBar.node.active = this.scrollView.node.height <= this.center.height;

        if (this.center.height - this.scrollView.node.height < 0) {
            this.scheduleOnce(() => {
                this.scrollView.scrollToTop();
            }, 0.1);
        } else {
            let max = this.center.height - this.scrollView.node.height;
            let y = this.center.y - this.scrollView.node.height / 2;
            this.scrollView.scrollTo(cc.v2(0, y / max), 0.1);
        }
    }

    private _closeView() {
        this.operation.active = false;
        this.node.zIndex = 99;
    }

    private onOperation(index) {
        let data = this.LevelData
        switch (index) {
            case 1:
                this.addLevel();
                this.exchangeLevel(data.length - 1, this.operationIndex);
                EditorManager.editorData.curLevel = this.operationIndex;
                this.updateView();
                ListenerManager.dispatch(EventType.SELECTLEVEL);
                break
            case 2:
                this.addLevel(data[this.operationIndex - 1]);
                this.exchangeLevel(data.length - 1, this.operationIndex);
                EditorManager.editorData.curLevel = this.operationIndex;
                this.updateView();
                ListenerManager.dispatch(EventType.SELECTLEVEL);
                break
            case 3:
                if (data.length > 1) {
                    SubUIHelp.showAffirmTip(0, "删除后，关卡所有信息将被清空", function (type: number) {
                        if (type == 1) {
                            this.DeleteLevel(this.operationIndex - 1);
                        }
                    }.bind(this), "取消", "删除")
                } else {
                    UIHelp.showTip("至少要保留1关，无法删除关卡")
                }


                break
            case 4:
                this.state = 1;
                this.deleteList = [];
                for (let index = 0; index < this.LevelData.length; index++) {
                    let data = this.LevelData[index];
                    this.deleteList.push(data);
                }
                this.updateView();
                break
        }
    }

    private touchStart(event) {
        let pos = event.target.convertToNodeSpaceAR(event.getLocation());
        let index = Math.ceil(((Math.abs(pos.y))) / this.tempNode.height);

        this.startIndex = index;

        console.log("this.startIndex", this.startIndex);


        this.starTime = new Date().getTime();

        this._closeView();
    }

    update(dt: number) {
        if (this.isMoveTopOrBontton != 0 && this.moveNode != null) {
            let y = dt * 200 * this.isMoveTopOrBontton;
            if (this.moveNode && Math.ceil((Math.abs(this.moveNode.y + y - this.tempNode.height / 2)) / this.tempNode.height) > this.LevelData.length) {
                return
            }

            let height = this.center.height - this.scrollView.node.height
            if (this.scrollView.node.height / 2 < (this.center.y - y) && this.scrollView.node.height / 2 + height > (this.center.y - y)) {
                this.center.y += y * -1
                this.moveNode.y += y;
            }
            let index = Math.ceil((Math.abs(this.moveNode.y) / this.tempNode.height));
            this.itemMove(index - 1);
            this.setScrollBar();
        }
    }

    private moveCenter(height, y) {
        if (height > 0) {
            if (this.scrollView.node.height / 2 < (this.center.y + y) && this.scrollView.node.height / 2 + height > (this.center.y + y)) {
                this.center.y += y
            } else if (this.scrollView.node.height / 2 >= (this.center.y + y)) {
                this.center.y = this.scrollView.node.height / 2;
            } else if (this.scrollView.node.height / 2 + height <= (this.center.y + y)) {
                this.center.y = this.scrollView.node.height / 2 + height;
            }

            this.setScrollBar();
        }

    }

    private touchMove1(event) {
        let pos = event.getDelta();
        let height = this.center.height - this.scrollView.node.height
        if (height > 0) {
            this.moveCenter(height, pos.y * -1);
            this.LevelMove = true;
        }
    }

    private touchMove(event) {

        let pos = event.getDelta();
        this.isMove = true;
        let tiem = new Date().getTime()
        cc.game.canvas.style.cursor = "move";

        let _pos = event.target.convertToNodeSpaceAR(event.getLocation())
        let index = Math.ceil((Math.abs(_pos.y)) / this.tempNode.height);
        if (index != this.operationIndex) {
            this._closeView();
        }
        if (this.moveNode && Math.ceil((Math.abs(this.moveNode.y + pos.y - this.tempNode.height / 2)) / this.tempNode.height) > this.LevelData.length) {
            return
        }

        if (this.moveNode == null) {
            if (this.startIndex <= this.btnList.length && this.btnList[this.startIndex - 1].active) {
                this.moveNode = cc.instantiate(this.btnList[this.startIndex - 1]);
                let defaultNode = this.moveNode.getChildByName("default");
                defaultNode.getChildByName("checked").active = true;
                this.moveNode["index"] = this.btnList[this.startIndex - 1]["index"];
                this.moveNode.zIndex = 100;
                this.center.addChild(this.moveNode);
                this.btnList[this.startIndex - 1]["index"] = -1;
                this.btnList[this.startIndex - 1].opacity = 0;

            }
        } else {
            let scrollPos1 = this.scrollView.node.convertToWorldSpaceAR(cc.v2(0, this.scrollView.node.height / 2 - this.moveNode.height / 2));
            let scrollPos2 = this.scrollView.node.convertToWorldSpaceAR(cc.v2(0, (this.scrollView.node.height / 2 - this.moveNode.height / 2) * -1));

            let maxY = this.scrollView.node.height / 2 - this.moveNode.height / 2;
            let minY = (this.scrollView.node.height / 2 - this.moveNode.height / 2) * -1;
            let nodepos = this.scrollView.node.convertToNodeSpaceAR(event.getLocation())
            let y = this.scrollView.node.convertToNodeSpaceAR(cc.v2(0, this.center.convertToWorldSpaceAR(cc.v2(event.getLocation().x, this.moveNode.y + pos.y)).y)).y;
            if (y < maxY
                && y > minY) {
                this.moveNode.y += pos.y;
                this.isMoveTopOrBontton = 0;
            } else {


                if (index > 1 && index < this.LevelData.length && this.isMoveTopOrBontton == 0) {
                    this.isMoveTopOrBontton = y >= maxY ? 1 : -1;

                    let topY = this.center.convertToNodeSpaceAR(cc.v2(event.getLocation().x, scrollPos1.y)).y;
                    let bY = this.center.convertToNodeSpaceAR(cc.v2(event.getLocation().x, scrollPos2.y)).y;
                    this.moveNode.y = this.isMoveTopOrBontton == 1 ? topY : bY;
                }

            }
        }


        let _index = Math.ceil((Math.abs(this.moveNode.y) / this.tempNode.height));
        this.itemMove(_index - 1);

        this.setScrollBar();
    }

    private touchEnd(event) {
        this.starTime = 0;
        this.LevelMove = false;
        cc.game.canvas.style.cursor = "default";
        let pos = event.target.convertToNodeSpaceAR(event.getLocation());
        let index = Math.ceil(((Math.abs(pos.y))) / this.tempNode.height);

        this.isMoveTopOrBontton = 0;

        let length = this.LevelData.length
        let endIndex = index;
        if (length < index) {
            endIndex = this.LevelData.length;
        } else if (index == 0) {
            endIndex = 1;
        }

        if (this.startIndex != endIndex) {

            if (this.startIndex <= this.btnList.length && this.btnList[this.startIndex - 1].active) {

                this.exchangeLevel(this.startIndex - 1, endIndex - 1);
                EditorManager.editorData.curLevel = endIndex - 1;
                ListenerManager.dispatch(EventType.SELECTLEVEL)
            }
        }

        this.updateView();

        if (this.startIndex == index && !this.isTouchMouse) {
            for (let i = 0; i < this.btnList.length; i++) {
                let node = this.btnList[i];
                if (node["index"] == index - 1) {
                    if (this.state == 0) {
                        this.onTouchNode({ target: node });
                    } else {
                        // this.onTouchNode({ target: node });
                        console.log(node["index"]);
                        let deleteIndex = this.deleteList.indexOf(this.LevelData[node["index"]]);
                        if (deleteIndex == -1) {
                            this.deleteList.push(this.LevelData[node["index"]]);
                        } else {
                            this.deleteList.splice(deleteIndex, 1);
                        }
                        this.updateLevel();
                    }

                    break;
                }
            }

        }

        this.isMove = false;
        if (this.moveNode != null) {
            this.moveNode.destroy()
        }
        this.moveNode = null;

    }

    private touchCancel(event) {
        this.LevelMove = false;
        this.starTime = 0;
        cc.game.canvas.style.cursor = "default";
        if (this.moveNode == null) {
            return;
        }
        let pos = event.target.convertToNodeSpaceAR(event.getLocation());
        let index = Math.ceil(((Math.abs(pos.y))) / this.tempNode.height);
        let length = this.LevelData.length
        let endIndex = index;
        if (length < index) {
            endIndex = this.LevelData.length;
        } else if (index == 0) {
            endIndex = 1;
        }

        if (this.startIndex != endIndex) {

            if (this.startIndex <= this.btnList.length && this.btnList[this.startIndex - 1] && this.btnList[this.startIndex - 1].active) {

                this.exchangeLevel(this.startIndex - 1, endIndex - 1);
                EditorManager.editorData.curLevel = endIndex - 1;
                ListenerManager.dispatch(EventType.SELECTLEVEL)
            }
        }

        this.updateView();

        this.isMove = false;
        if (this.moveNode != null) {
            this.moveNode.destroy()
        }
        this.moveNode = null;

    }

    private itemMove(index: number) {
        if (this.moveNode != null) {
            let _moveIndex = this.moveNode["index"];
            this.moveNode["index"] = index;

            for (let i = 0; i < Math.abs(_moveIndex - index); i++) {
                let moveIndex = _moveIndex + (index < _moveIndex ? -1 : 1) * i;
                let moveNodeIndex = moveIndex + ((index < _moveIndex ? -1 : 1) * 1);
                for (let j = 0; j < this.btnList.length; j++) {
                    let node = this.btnList[j];
                    if (moveNodeIndex == node["index"] && this.LevelData[moveNodeIndex]) {
                        let y = (moveIndex * node.height + node.height / 2) * -1;
                        node["index"] = moveIndex;
                        this.isItemMove = true;
                        cc.tween(node)
                            .to(0.05, { y: y })
                            .call(function () {
                                this.isItemMove = false;
                            }.bind(this))
                            .start();
                        console.log(node.getComponentsInChildren(cc.Label)[0].string, index);
                        break;
                    }

                }
            }

        }
    }
    ////        点击事件

    public onTouchNode(target) {
        let index = target.target["index"];
        let data = this.LevelData;
        if (index == EditorManager.editorData.curLevel || index > data.length - 1) {
            this.updateView();
            return
        }

        EditorManager.editorData.curLevel = index;
        this.updateView();
        ListenerManager.dispatch(EventType.SELECTLEVEL)
    }

    public exchangeLevel(indexStar, indexEnd) {
        let data = this.LevelData;
        let dataA = data[indexStar];
        this.LevelData.splice(indexStar, 1);

        if (indexEnd > indexStar) {
            if (indexEnd > this.LevelData.length - 1) {
                this.LevelData.push(dataA);
            } else {
                this.LevelData.splice(indexEnd, 0, dataA);
            }
        } else {

            this.LevelData.splice(indexEnd, 0, dataA);
        }
    }

    public addLevel(_level = null) {
        let levelLength = this.LevelData.length

        if (levelLength >= this.MaxLevel) {
            UIHelp.showTip(_level != null ? "关卡数量不能超出上限，复制关卡失败" : "关卡数量不能超出上限，新建关卡失败");
            return;
        }

        let level = this.creatorLevel(_level);

        this.LevelData.push(level);
    }

    public onTouchAddNode() {
        if (this.state == 1) {
            return;
        }
        this.addLevel();
        EditorManager.editorData.curLevel = this.LevelData.length - 1;
        ListenerManager.dispatch(EventType.SELECTLEVEL);

        this.updateView();

        let height = this.center.height - this.scrollView.node.height
        if (height > 0) {
            this.scheduleOnce(() => {
                this.scrollView.scrollToBottom();
            }, 0.1);
            this.setScrollBar();
        }
    }

    public onTouchDeleteNode(target) {
        this.isDelete = !this.isDelete;
        this.updateView();
    }

    public onTouchDeleteLevel(target) {

        let index = target.target.parent["index"];
        SubUIHelp.showAffirmTip(0, "是否删除第" + (index + 1) + "关", function (type: number) {
            if (type == 1) {
                this.DeleteLevel(index);
            }
        }.bind(this))

    }

    private DeleteLevel(index: number) {
        this.LevelData.splice(index, 1);
        if (this.LevelData.length <= 1) {
            this.isDelete = false;
            EditorManager.editorData.curLevel = 0;
        }
        if (index == EditorManager.editorData.curLevel) {
            if (this.LevelData.length - 1 < index) {
                EditorManager.editorData.curLevel = index - 1;
            }
        } else {
            if (index < EditorManager.editorData.curLevel) {
                EditorManager.editorData.curLevel--;
            }
        }

        this.updateView();
        ListenerManager.dispatch(EventType.SELECTLEVEL);
    }

    private updateView() {

        this.setLevelList(this.LevelData, this.MaxLevel);
        this.setScrollBar();
    }

    private initOperation() {
        for (let i = 0; i < this.operationObj.length; i++) {
            let node = cc.instantiate(this.operationTemp);
            node.name = "label_" + i;
            node.active = true;
            node.x = 0;
            node.getChildByName("label").getComponent(cc.Label).string = this.operationObj[i];
            node.getChildByName("label").color = new cc.Color(125, 125, 125, 255);
            node.getChildByName("label").opacity = 0;
            node.getChildByName("label").opacity = 255;
            node.getChildByName("icon1").active = true;
            node.getChildByName("icon2").active = false;
            this.operation.addChild(node);

        }
    }

    private initLevelList(MaxLevel: number) {
        for (let i = 0; i < MaxLevel; i++) {
            let node = cc.instantiate(this.tempNode);
            this.center.addChild(node);
            node.x = 0;
            node.y = (i * node.height + node.height / 2) * -1;
            node["index"] = i;
            node["state"] = 0;
            this.btnList.push(node);
        }

        this.AddBtn = cc.instantiate(this.tempNode);
        this.AddBtn.x = 0;
        this.AddBtn.y = (MaxLevel * this.AddBtn.height + this.AddBtn.height / 2) * -1;
        this.AddBtn["state"] = 1;
        this.AddBtn["index"] = this.addBtnIndex;
        this.center.addChild(this.AddBtn);
    }

    private updateLevel() {
        for (let i = 0; i < this.btnList.length; i++) {
            let node = this.btnList[i];
            node.getChildByName("deleteState").active = this.state == 1;
            node.getChildByName("deleteState").getComponent(cc.Toggle).isChecked = this.deleteList.indexOf(this.LevelData[node["index"]]) != -1;
        }
    }
    /// 设置界面显示
    private setLevelList(levelList: Array<any>, MaxLevel: number) {
        for (let i = 0; i < this.btnList.length; i++) {
            let node = this.btnList[i];
            cc.Tween.stopAllByTarget(node);
            node.active = i < levelList.length;
            node.opacity = 255;
            node["index"] = i;
            node.y = (i * node.height + node.height / 2) * -1;
            node.getChildByName("deleteState").active = this.state == 1;
            node.getChildByName("deleteState").getComponent(cc.Toggle).isChecked = this.deleteList.indexOf(this.LevelData[i]) != -1;
            this.setBtn(node);
        }
        this.AddBtn.y = (levelList.length * this.AddBtn.height + this.AddBtn.height / 2) * -1;
        this.AddBtn.active = levelList.length < MaxLevel;
        this.setBtn(this.AddBtn);

        this.center.height = (levelList.length + (levelList.length < MaxLevel ? 1 : 0)) * this.AddBtn.height;
        this.setDeleteNode();
    }
    /// 每一个关卡啊按钮状态修改
    private setBtn(node: cc.Node) {
        if (!node.active) {
            return;
        }

        let defaultNode = node.getChildByName("default");
        defaultNode.active = node["state"] == 0;
        defaultNode.getChildByName("checked").active = EditorManager.editorData.curLevel == node["index"];
        defaultNode.getChildByName("levelText").getComponent(cc.Label).string = (node["index"] + 1);
        defaultNode.getChildByName("levelText").opacity = EditorManager.editorData.curLevel == node["index"] ? 255 : 255 / 2;
        node.getChildByName("add").active = node["state"] == 1;


        if (this.isDelete) {
            node.getComponent(cc.Button).interactable = false;
            if (node["index"] == this.addBtnIndex) {
                node.getChildByName("unChecked").color = cc.color(120, 120, 120, 200);
            }

        } else {
            node.getComponent(cc.Button).interactable = true;
            node.getChildByName("unChecked").color = cc.color(255, 255, 255, 255);
        }
    }
    // 底部关卡数，按钮显示操作
    private setDeleteNode() {
        this.deleteNode.getChildByName("numNode").getChildByName("num").getComponent(cc.Label).string = this.LevelData.length + "/" + this.MaxLevel;
        this.deleteNode.getChildByName("numNode").active = this.state == 0;
        this.deleteNode.getChildByName("state").active = this.state == 1;

    }

    private addBtnEvent(node: cc.Node, handler: string) {
        let clickEventHandler = new cc.Component.EventHandler();
        clickEventHandler.target = this.node; // 这个 node 节点是你的事件处理代码组件所属的节点
        clickEventHandler.component = Tools.getFixedClassName("levelList");// 这个是代码文件名
        clickEventHandler.handler = handler;

        let button = node.getComponent(cc.Button);
        button.enabled = true;
        button.clickEvents.push(clickEventHandler);
    }

    // update (dt) {}
}
