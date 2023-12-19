import { MainMsgType } from "../../../../scripts/Data/MainMsgType";
import { CosManager } from "../../../../scripts/Manager/CosManager";
import { ListenerManager } from "../../../../scripts/Manager/ListenerManager";
import { OpenFile } from "../Core/Utils/OpenFile";

const { ccclass, property } = cc._decorator;

@ccclass
export class UploadAudio_24_l1sc_d3_01 extends cc.Component {
	@property(cc.Label)
	private selfText: cc.Label = null;
	/** 取文件时候需要用到的 对应upLoadFileMap的key */

	@property(cc.Node)
	private playAudio: cc.Node = null;

	@property(cc.Node)
	private stopAllAudio: cc.Node = null;

	@property(cc.Node)
	private deleteAudio: cc.Node = null;

	@property(cc.Node)
	private upLoadAudio: cc.Node = null;

	@property(cc.Node)
	private icon: cc.Node = null;

	@property
	private fileKey: string = "";
	private _selfAudio: any = null;


	start() {
		console.log('name: ', this.node.name);
		ListenerManager.on(MainMsgType.REFRESH_EDITOR_DOWNLOAD_UI, this.refresh, this);
	}

	onCallBack() {
		OpenFile.openAudioFile(this.uploadFile.bind(this));
	}

	public setFileKey(key: string) {
		this.fileKey = key;
	}

	/** 试听 */
	public onPlayAudio() {
		this._selfAudio && cc.audioEngine.playEffect(this._selfAudio, false);
		this.upLoadAudio.active = false;
		this.deleteAudio.active = true;
		this.playAudio.active = false;
		this.stopAllAudio.active = true;
	}

	/** 刷新音效展示 */
	public refresh() {
		console.log('refresh name: ', this.node.name, '; file: ', this.fileKey);
		let file = CosManager.upLoadFileMap.get(this.fileKey);
		if (!file) {
			this.upLoadAudio.active = false;
			this.deleteAudio.active = false;
			this.playAudio.active = false;
			this.stopAllAudio.active = false;
			this.icon.active = false;
			this.selfText.string = "未上传";
			return;
		}
		if (file.fileAsset) {
			this._selfAudio = file.fileAsset;
			this.selfText && (this.selfText.string = file.fileName);
			this.upLoadAudio.active = false;
			this.deleteAudio.active = true;
			this.playAudio.active = true;
			this.stopAllAudio.active = false;
			this.icon.active = true;
		}
	}

	/**
	 * 播放音频
	 * @param strAudio DataUrl
	 */
	public uploadFile(file: File) {
		CosManager.addFileData(this.fileKey, file, null);
		let fileData = CosManager.upLoadFileMap.get(this.fileKey);
		CosManager.uploadFile(fileData, (asset: cc.AudioClip) => {
			this.selfText && (this.selfText.string = file.name);
			fileData.fileAsset = asset;
			this._selfAudio = asset;
			this.upLoadAudio.active = false;
			this.deleteAudio.active = true;
			this.playAudio.active = true;
			this.stopAllAudio.active = false;
			this.icon.active = true;
		});
	}

	public delAudio() {
		this.selfText.string = "未上传";
		this._selfAudio = null;
		CosManager.delFileData(this.fileKey);

		this.upLoadAudio.active = false;
		this.deleteAudio.active = false;
		this.playAudio.active = false;
		this.stopAllAudio.active = false;
		this.icon.active = false;
	}
	public stopAudio() {
		cc.audioEngine.stopAllEffects();
		this.upLoadAudio.active = false;
		this.deleteAudio.active = true;
		this.playAudio.active = true;
		this.stopAllAudio.active = false;
	}
}
