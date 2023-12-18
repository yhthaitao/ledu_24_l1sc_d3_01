// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import { UIHelp } from "../../scripts/Utils/UIHelp";


const { ccclass, property } = cc._decorator;

@ccclass
export default class setFps extends cc.Component {
    @property(cc.Label)
    public fpsLabel: cc.Label = null;
    @property(cc.EditBox)
    public editBox: cc.EditBox = null;

    //目前累计多少秒
    private updateInterval: number = 0;

    //帧数计数器
    private frameCount: number = 0;
    //累计时间
    private deltaTime: number = 0;

    start() {
        this.editBox.string = cc.game.getFrameRate().toString();
        this.scheduleOnce(() => {
            this.node.active = true;
            this.node.zIndex = 9999;
        }, 1);
        this.schedule(()=>{
            this.updateFPSLabel();
        }, 1)
    }

    protected update(dt: number): void {
        this.updateInterval += dt;
        // 增加帧数计数器
        this.frameCount++;
        this.deltaTime += dt;
    }

    // 更新帧率显示
    updateFPSLabel() {
        // 计算帧率
        const fps = Math.round(this.frameCount / this.deltaTime * 100) / 100;
        // 更新帧率显示文本
        this.fpsLabel.string = `${fps}`;
        // 重置计数器
        this.frameCount = 0;
        this.deltaTime = 0;
    }

    setFps() {
        let fps = parseInt(this.editBox.string);
        if (fps != 15 && fps != 30 && fps != 60) {
            UIHelp.showTip("请输入15、30、60");
            return;
        }
        cc.game.setFrameRate(fps);
    }

    // update (dt) {}
}
