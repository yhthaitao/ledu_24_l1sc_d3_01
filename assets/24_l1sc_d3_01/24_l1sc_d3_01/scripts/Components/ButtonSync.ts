/**
 * v2.0
 * Author: jinhailiang
 * Email: jinhailiang@tal.com
 */

import { T2M } from "../Core/SDK/T2M";

const { ccclass, property } = cc._decorator;

@ccclass
export class ButtonSync_24_l1sc_d3_01 extends cc.Component {
    @property({ type: [cc.Component.EventHandler] })
    private touchStartEvents: cc.Component.EventHandler[] = [];
    @property({ type: [cc.Component.EventHandler] })
    private touchEndEvents: cc.Component.EventHandler[] = [];

    private tagId: string;

    onLoad() {
        this.node.on(cc.Node.EventType.TOUCH_START, this.touchStart, this);
        this.node.on(cc.Node.EventType.TOUCH_END, this.touchEnd, this);
        this.node.on(cc.Node.EventType.TOUCH_CANCEL, this.touchEnd, this);
        this.tagId = this.node.name + this.node.parent.name + this.node.getSiblingIndex();
        this.addEventByT2M();
    }

    public addTouchEvent(target: cc.Node, component: string, handlers: string[]) {
        this.touchStartEvents.push(new ButtonSync_24_l1sc_d3_01.EventHandler());
        this.touchStartEvents[0].target = target;
        this.touchStartEvents[0].component = component;
        this.touchStartEvents[0].handler = handlers[0];

        this.touchEndEvents.push(new ButtonSync_24_l1sc_d3_01.EventHandler());
        this.touchEndEvents[0].target = target;
        this.touchEndEvents[0].component = component;
        this.touchEndEvents[0].handler = handlers[1];
    }

    private touchStart(event: cc.Event.EventTouch) {
        let type = 'touchStart' + this.tagId;
        T2M.dispatch(type, null);
    }

    private touchEnd(event: cc.Event.EventTouch) {
        let type = 'touchEnd' + this.tagId;
        T2M.dispatch(type, null);
    }

    private addEventByT2M() {
        T2M.addSyncEventListener('touchStart' + this.tagId, this.touchStartHandler.bind(this));
        T2M.addSyncEventListener('touchEnd' + this.tagId, this.touchEndHandler.bind(this));
    }

    private touchStartHandler(data) {
        this.node.scale = 1.2;
        for (let eventHandler of this.touchStartEvents) {
            eventHandler.emit([{ target: this.node }]);
        }
    }

    private touchEndHandler(data) {
        this.node.scale = 1;
        for (let eventHandler of this.touchEndEvents) {
            eventHandler.emit([{ target: this.node }]);
        }
    }
}
