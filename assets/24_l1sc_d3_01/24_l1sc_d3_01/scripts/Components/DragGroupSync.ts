/**
 * v2.0
 * Author: jinhailiang
 * Email: jinhailiang@tal.com
 */

import { T2M } from "../Core/SDK/T2M";

const { ccclass, property } = cc._decorator;

@ccclass
export class DragGroupSync_24_l1sc_d3_01 extends cc.Component {
    @property(cc.Node)
    private rootNode: cc.Node = null;
    @property({ type: [cc.Component.EventHandler] })
    private touchStartEvents: cc.Component.EventHandler[] = [];
    @property({ type: [cc.Component.EventHandler] })
    private touchMovingEvents: cc.Component.EventHandler[] = [];
    @property({ type: [cc.Component.EventHandler] })
    private touchEndEvents: cc.Component.EventHandler[] = [];

    private tagId: string;
    private nodes: Array<cc.Node> = [];

    start() {
        this.node.children.forEach((node, index) => {
            this.nodes.push(node);
            node.zIndex = index;
            node.attr({ id: index, initParent: this.node, initPos: { x: node.x, y: node.y }, initSiblingIndex: index });
            node.on(cc.Node.EventType.TOUCH_START, this.touchStart, this);
            node.on(cc.Node.EventType.TOUCH_MOVE, this.touchMove, this);
            node.on(cc.Node.EventType.TOUCH_END, this.touchEnd, this);
            node.on(cc.Node.EventType.TOUCH_CANCEL, this.touchEnd, this);
        });

        this.tagId = this.node.name + this.node.parent.name + this.node.getSiblingIndex();
        this.addEventByT2M();
    }

    private touchStart(event: cc.Event.EventTouch) {
        let node = event.target;
        let pos = this.rootNode.convertToNodeSpaceAR(event.getLocation());
        let type = 'touchStart' + this.tagId + node.id;
        let data = { id: node.id, pos: { x: pos.x, y: pos.y } };
        T2M.dispatch(type, data);
    }

    private touchMove(event: cc.Event.EventTouch) {
        let node = event.target;
        let pos = this.rootNode.convertToNodeSpaceAR(event.getLocation());
        let type = 'touchMove' + this.tagId + node.id;
        let data = { id: node.id, pos: { x: pos.x, y: pos.y } };
        T2M.dispatch(type, data);
    }

    private touchEnd(event: cc.Event.EventTouch) {
        let node = event.target;
        let pos = this.rootNode.convertToNodeSpaceAR(event.getLocation());
        let type = 'touchEnd' + this.tagId + node.id;
        let data = { id: node.id, pos: { x: pos.x, y: pos.y } };
        T2M.dispatch(type, data);
    }

    private addEventByT2M() {
        this.node.children.forEach((node: any, index) => {
            //@ts-ignore
            T2M.addSyncEventListener('touchStart' + this.tagId + node.id, this.touchStartHandler.bind(this));
            //@ts-ignore
            T2M.addSyncEventListener('touchMove' + this.tagId + node.id, this.touchMoveHandler.bind(this));
            //@ts-ignore
            T2M.addSyncEventListener('touchEnd' + this.tagId + node.id, this.touchEndHandler.bind(this));
        });
    }

    private touchStartHandler(data) {
        //@ts-ignore
        let node = this.nodes.find((node) => node.id == data.id);
        node.parent = this.rootNode;
        node.setSiblingIndex(this.rootNode.childrenCount);
        node.position = cc.v3(data.pos.x, data.pos.y);
        for (let eventHandler of this.touchStartEvents) {
            eventHandler.emit([{ pos: data.pos, target: node }]);
        }
    }

    private touchMoveHandler(data) {
        //@ts-ignore
        let node = this.nodes.find((node) => node.id == data.id);
        node.position = cc.v3(data.pos.x, data.pos.y);
        for (let eventHandler of this.touchMovingEvents) {
            eventHandler.emit([{ pos: data.pos, target: node }]);
        }
    }

    private touchEndHandler(data) {
        //@ts-ignore
        let node = this.nodes.find((node) => node.id == data.id);
        node.position = cc.v3(data.pos.x, data.pos.y);
        for (let eventHandler of this.touchEndEvents) {
            eventHandler.emit([{ pos: data.pos, target: node }]);
        }
    }
}
