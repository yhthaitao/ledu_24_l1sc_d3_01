/**
 * v1.0
 * Author: jinhailiang
 * Email: jinhailiang@tal.com
 */

import { T2M } from "../Core/SDK/T2M";

const { ccclass, property } = cc._decorator;

@ccclass
export class DragSync_24_l1sc_d3_01 extends cc.Component {
    @property(cc.Node)
    private rootNode: cc.Node = null;
    @property({ type: [cc.Component.EventHandler] })
    private touchStartEvents: cc.Component.EventHandler[] = [];
    @property({ type: [cc.Component.EventHandler] })
    private touchMovingEvents: cc.Component.EventHandler[] = [];
    @property({ type: [cc.Component.EventHandler] })
    private touchEndEvents: cc.Component.EventHandler[] = [];

    private tagId: string;

    onLoad() {
        this.rootNode = cc.find('Canvas/GamePanel');
        let index = this.node.getSiblingIndex();
        this.node.attr({
            id: index,
            initParent: this.node.parent,
            initPos: { x: this.node.x, y: this.node.y },
            initSiblingIndex: index,
        });
        this.node.on(cc.Node.EventType.TOUCH_START, this.touchStart, this);
        this.node.on(cc.Node.EventType.TOUCH_MOVE, this.touchMove, this);
        this.node.on(cc.Node.EventType.TOUCH_END, this.touchEnd, this);
        this.node.on(cc.Node.EventType.TOUCH_CANCEL, this.touchEnd, this);
        this.tagId = this.node.name + this.node.parent.name + this.node.getSiblingIndex();
        this.addEventByT2M();
    }

    public addTouchEvent(target: cc.Node, component: string, handlers: string[]) {
        this.touchStartEvents.push(new DragSync_24_l1sc_d3_01.EventHandler());
        this.touchStartEvents[0].target = target;
        this.touchStartEvents[0].component = component;
        this.touchStartEvents[0].handler = handlers[0];

        this.touchMovingEvents.push(new DragSync_24_l1sc_d3_01.EventHandler());
        this.touchMovingEvents[0].target = target;
        this.touchMovingEvents[0].component = component;
        this.touchMovingEvents[0].handler = handlers[1];

        this.touchEndEvents.push(new DragSync_24_l1sc_d3_01.EventHandler());
        this.touchEndEvents[0].target = target;
        this.touchEndEvents[0].component = component;
        this.touchEndEvents[0].handler = handlers[2];
    }

    private touchStart(event: cc.Event.EventTouch) {
        let pos = this.rootNode.convertToNodeSpaceAR(event.getLocation());
        let type = 'touchStart' + this.tagId;
        let data = { pos: { x: pos.x, y: pos.y } };
        T2M.dispatch(type, data);
    }

    private touchMove(event: cc.Event.EventTouch) {
        let pos = this.rootNode.convertToNodeSpaceAR(event.getLocation());
        let type = 'touchMove' + this.tagId;
        let data = { pos: { x: pos.x, y: pos.y } };
        T2M.dispatch(type, data, true);
    }

    private touchEnd(event: cc.Event.EventTouch) {
        let pos = this.rootNode.convertToNodeSpaceAR(event.getLocation());
        let type = 'touchEnd' + this.tagId;
        let data = { pos: { x: pos.x, y: pos.y } };
        T2M.dispatch(type, data);
    }

    private addEventByT2M() {
        T2M.addSyncEventListener('touchStart' + this.tagId, this.touchStartHandler.bind(this));
        T2M.addSyncEventListener('touchMove' + this.tagId, this.touchMoveHandler.bind(this));
        T2M.addSyncEventListener('touchEnd' + this.tagId, this.touchEndHandler.bind(this));
        console.log('addEventByT2M', this.tagId);
    }

    private touchStartHandler(data) {
        this.node.parent = this.rootNode;
        this.node.position = cc.v3(data.pos.x, data.pos.y);
        for (let eventHandler of this.touchStartEvents) {
            eventHandler.emit([{ pos: data.pos, target: this.node }]);
        }
    }

    private touchMoveHandler(data) {
        this.node.position = cc.v3(data.pos.x, data.pos.y);
        for (let eventHandler of this.touchMovingEvents) {
            eventHandler.emit([{ pos: data.pos, target: this.node }]);
        }
    }

    private touchEndHandler(data) {
        this.node.position = cc.v3(data.pos.x, data.pos.y);
        for (let eventHandler of this.touchEndEvents) {
            eventHandler.emit([{ pos: data.pos, target: this.node }]);
        }
    }
}
