import { MainConstValue } from "../../../../scripts/Data/MainConstValue";
import { MainMsgType } from "../../../../scripts/Data/MainMsgType";
import { ListenerManager } from "../../../../scripts/Manager/ListenerManager";
import { CosManager } from "../../../../scripts/Manager/CosManager";
import { OpenFile } from "../Core/Utils/OpenFile";



const { ccclass, property } = cc._decorator;

@ccclass
export class UploadImg_24_l1sc_d3_01 extends cc.Component {
	@property(cc.Sprite)
	public selfImg: cc.Sprite = null;
	/** 取文件时候需要用到的 对应upLoadFileMap的key */
	@property
	private fileKey: string = "";

	start() {
		ListenerManager.on(MainMsgType.REFRESH_EDITOR_DOWNLOAD_UI, this.refresh, this);
	}

	public refresh() {
		let file = CosManager.upLoadFileMap.get(this.fileKey);
		if (!file) return;
		if (file.fileAsset) {
			this.selfImg.spriteFrame = new cc.SpriteFrame(file.fileAsset as cc.Texture2D);
		}
	}

	public setFileKey(key: string) {
		this.fileKey = key;
	}

	onCallBack() {
		OpenFile.openImageFile(this.uploadFile.bind(this));
	}

	/**
	 * 设置图片
	 * @param strImg
	 */
	public uploadFile(file: File) {
		CosManager.addFileData(this.fileKey, file, null);
		let fileData = CosManager.upLoadFileMap.get(this.fileKey);
		/** 上传成功再展示*/
		CosManager.uploadFile(fileData, (texture2D: cc.Texture2D) => {
			let spriteFrame = new cc.SpriteFrame(texture2D);
			fileData.fileAsset = spriteFrame;
			this.selfImg.spriteFrame = spriteFrame;
		});
	}

	public delImg() {
		CosManager.delFileData(this.fileKey);
		this.selfImg.spriteFrame = null;
	}
}
