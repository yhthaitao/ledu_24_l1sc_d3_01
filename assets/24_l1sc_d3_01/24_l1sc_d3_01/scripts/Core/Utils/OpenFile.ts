import { UIHelp } from "../../../../../scripts/Utils/UIHelp";

/*
 * @Description: 打开本地图片
 * index.html 内添加img标签
 * <input id="OpenImageFile" type="file" capture="camera" accept="image/*" style="visibility: hidden">
 * @FilePath: \demo\assets\Script\OpenImageFile.ts
 */
enum INPUTFILEID {
	IMAGE = "OpenImageFile",
	AUDIO = "OpenAudioFile"
}

class OpenFileClass {
	private static instance: OpenFileClass;

	static getInstance(): OpenFileClass {
		if (this.instance == null) {
			this.instance = new OpenFileClass();
		}
		return this.instance;
	}
	/**
	 * 能否重复上传
	 * @returns
	 */
	private resetFile(name: INPUTFILEID) {
		let element = document.getElementById(name);
		if (element == null) {
			console.error('上传失败！！！');
			return;
		}
		if (element.outerHTML) element.outerHTML = element.outerHTML;

		// @ts-ignore
		if (element.value) element.value = null;
	}

	/**
	 * 打开文件操作
	 */
	public openImageFile(cb: Function) {
		let input_imageFile = document.getElementById('OpenImageFile');
		if (input_imageFile == null) return;
		input_imageFile.onchange = (event) => {
			// @ts-ignore
			let files = event.target.files;
			if (files && files.length > 0) {
				let file = files[0]
				this.checkImageSize(file, cb);
			}
			else {
				UIHelp.showTip('文件上传失败2！！！');
			}
		};
		input_imageFile.click();
	}

	/**检测图片尺寸是否合理 */
	public checkImageSize(file: File, cb: Function) {
		let upType = file.type;
		if (upType != 'image/jpg' && upType != 'image/jpeg' && upType != 'image/png') {
			UIHelp.showTip('只允许上传png图片！！！');
			this.resetFile(INPUTFILEID.IMAGE);
			return;
		}
		if (file.size > 512 * 1024) {
			UIHelp.showTip('文件过大，请重新选择！！！');
			this.resetFile(INPUTFILEID.IMAGE);
			return;
		}
		let img = new Image();
		img.onload = () => {
			let width = img.naturalWidth;
			let height = img.naturalHeight;
			if (width > 1920 || height > 1080) {
				UIHelp.showTip('文件尺寸不合规,宽度最大1920,高度最大1080');
				this.resetFile(INPUTFILEID.IMAGE);
			} else {
				cb && cb(file);
				this.resetFile(INPUTFILEID.IMAGE);
			}
			console.log("图像尺寸：宽度 " + width + " 像素，高度 " + height + " 像素");
			img = null;
		};
		img.onerror = () => {
			UIHelp.showTip('文件读取失败，请重新上传');
			this.resetFile(INPUTFILEID.IMAGE);
		};
		img.src = URL.createObjectURL(file);
	}

	/**
	 * 打开文件操作
	 */
	public openAudioFile(cb: Function) {
		let input_audioFile = document.getElementById('OpenAudioFile');
		if (input_audioFile == null) return;
		// 添加需要处理的代码
		input_audioFile.onchange = (event) => {
			// @ts-ignore
			let files = event.target.files;
			if (files && files.length > 0) {
				let file = files[0];
				let upType = file.type;
				if (upType != 'audio/mpeg') {
					UIHelp.showTip('只允许上传mp3文件！！！');
					this.resetFile(INPUTFILEID.AUDIO);
					return;
				}
				if (file.size > 512 * 1024) {
					UIHelp.showTip('文件过大，请重新选择！！！');
					this.resetFile(INPUTFILEID.AUDIO);
					return;
				}
				cb && cb(file);
				this.resetFile(INPUTFILEID.AUDIO);
			}
			else {
				UIHelp.showTip('文件上传失败2！！！');
			}
		};
		input_audioFile.click();
	}
}
export const OpenFile = OpenFileClass.getInstance();
