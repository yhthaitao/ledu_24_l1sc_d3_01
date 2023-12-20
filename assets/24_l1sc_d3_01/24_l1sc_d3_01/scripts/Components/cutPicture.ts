/*
 * @Author: --
 * @Date: 2023-06-16 10:41:39
 * @LastEditors: --
 * @LastEditTime: 2023-06-16 16:00:38
 * @FilePath: \23_l1sq_sh_d8_01\assets\game\scripts\UI\panel\cutPicture.ts
 * @Description: 
 * 
 * Copyright (c) 2023 by ${git_name_email}, All Rights Reserved. 
 */



const { ccclass, property } = cc._decorator;

@ccclass
export default class cutPicture_24_l1sc_d3_01 extends cc.Component {

    private camera: cc.Camera = null;

    @property(cc.Node)
    private screenshotArea: cc.Node = null;//截图区域

    onLoad() {
        this.camera = this.getComponent(cc.Camera);
        this.node.active = false;
    }
    public CapturePicture() {
        let data = this.captureTexture();
        let texture = new cc.Texture2D()
        texture.initWithData(data, cc.Texture2D.PixelFormat.RGBA8888, 2048, 1152);
        let newSpriteFrame = new cc.SpriteFrame(texture);
        newSpriteFrame.setFlipY(true);
        return newSpriteFrame;
    }
    private captureTexture() {
        this.node.active = true;
        let data = this.captureScreen(this.camera, this.screenshotArea);
        this.node.active = false;
        return data;
    }
    private captureScreen(camera: cc.Camera, prop?: cc.Node | cc.Rect) {
        let newTexture = new cc.RenderTexture();
        let oldTexture = camera.targetTexture;
        let rect: cc.Rect = cc.rect(0, 0, cc.visibleRect.width, cc.visibleRect.height);
        if (prop) {
            if (prop instanceof cc.Node) {
                rect = prop.getBoundingBoxToWorld();
            } else {
                rect = prop;
            }
        }
        rect.width = Math.ceil(rect.width);//特殊情况下数值是浮点类型的，转换成integer类型。这里width=2048;height=1152 直接写死数值也可以
        rect.height = Math.ceil(rect.height);
        newTexture.initWithSize(cc.visibleRect.width, cc.visibleRect.height, cc.game._renderContext.STENCIL_INDEX8);
        camera.targetTexture = newTexture;
        camera.render();
        camera.targetTexture = oldTexture;
        let buffer = new ArrayBuffer(rect.width * rect.height * 4);
        let data = new Uint8Array(buffer);
        newTexture.readPixels(data, rect.x, rect.y, rect.width, rect.height);
        return data;
    }
}
