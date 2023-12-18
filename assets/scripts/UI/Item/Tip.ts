const { ccclass, property } = cc._decorator;

@ccclass
export class Tip extends cc.Component {
    @property(cc.Node)
    private neiRongNode: cc.Node = null;

    @property(cc.Label)
    private tipLabel: cc.Label = null;
    private ready: boolean = true;

    public playTip(message: string) {
        this.neiRongNode.active = true;
        this.node.stopAllActions();
        this.ready = false;
        this.tipLabel.string = message;
        this.reset();

        cc.tween(this.node)
            .delay(1)
            .to(0.5, { y: 128, opacity: 0 })
            .call(() => {
                this.ready = true;
            })
            .start();
    }

    public isReady(): boolean {
        return this.ready;
    }

    public reset() {
        this.node.setPosition(0, 0);
        this.node.opacity = 255;
    }
}
