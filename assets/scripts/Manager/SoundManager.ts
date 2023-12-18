import { MainConstValue } from '../Data/MainConstValue';
import { MainMsgType } from '../Data/MainMsgType';
import { NetWork } from '../Http/NetWork';
import GameMsg from '../SDK/GameMsg';
import { GameBundleManager, SubGameInitData } from './GameBundleManager';
import { ListenerManager } from './ListenerManager';
import { UIManager } from './UIManager';

/** 音乐的资源名称枚举 */
export enum MusicType {
    /** 背景音乐 */
    BGM_MUSIC = 'BGM_MUSIC',
    /** 题干语音 */
    TITLE_AUDIO = 'TITLE_AUDIO',
    /** 音效 */
    GAME_EFFECT = 'GAME_EFFECT',
    /** 语音 */
    GAME_AUDIO = 'GAME_AUDIO',
}

class SoundManagerClass {
    private static _instance: SoundManagerClass = null;
    private playing_sound: Object = new Object();
    // 缓存背景音乐名字
    private bgm: string | cc.AudioClip = null;
    private bgmIndex: number = -1;
    // 语音列表
    private _audioList: Map<string, number> = new Map();
    // 音效列表
    private _effectList: Map<string, number> = new Map();
    // 音效统一的引用计数
    private _referenceList: Map<string, number> = new Map();
    // 题干语音
    private _titleID: number = null;
    /** 存放音频资源的 Map */
    public _audioClipMap: Map<string, cc.AudioClip> = new Map();

    /** 存放主包音频资源的 Map */
    public _audioMainClipMap: Map<string, cc.AudioClip> = new Map();

    /** 管理定时器 切换游戏时候给停掉 */
    private _soundTimeOutArr: Array<number> = [];
    public MUSIC_BGM = 'bgm';
    public AUDIO_TITLE = 'audio_sound';

    start() {
        GameMsg.addClientEvent(MainMsgType.PLAYBGM, this.playBGM.bind(this));
        GameMsg.addClientEvent(MainMsgType.RESUMEBGM, this.resumeBGM.bind(this));
        GameMsg.addClientEvent(MainMsgType.STOPBGM, this.stopBGM.bind(this));
        GameMsg.addClientEvent(MainMsgType.PLAYAUDIOTITLE, this.playAudioTitle.bind(this));
        GameMsg.addClientEvent(MainMsgType.STOPAUDIOTITLE, this.stopAudioTitle.bind(this));
        GameMsg.addClientEvent(MainMsgType.STOPALLAUDIO, this.stopAllAudio.bind(this));
        GameMsg.addClientEvent(MainMsgType.STOPALLEFFECT, this.stopAllEffect.bind(this));
        GameMsg.addClientEvent(MainMsgType.STOPALL, this.stopAll.bind(this));
    }

    public static getInstance(): SoundManagerClass {
        if (null === this._instance) {
            this._instance = new SoundManagerClass();
        }
        return this._instance;
    }

    // 获取音频资源
    public getAudioClip(clipName: string, callBack?: Function): cc.AudioClip {
        if (!this._audioClipMap.has(clipName)) {
            cc.log(`未缓存的音频资源: ${clipName}`);
            return null;
        } else {
            return this._audioClipMap.get(clipName);
        }
    }

    // 预加载game的音效资源
    public async preLoadGameAudios(gameData: SubGameInitData = null) {
        gameData = gameData || GameBundleManager.curSubGame;
        return new Promise((resolve, reject) => {
            let path = MainConstValue.GAME_AUDIO_DIR;
            cc.assetManager.loadBundle(gameData.curUrl, (err: Error, bundle: cc.AssetManager.Bundle) => {
                if (err) {
                    reject(err);
                    cc.error(err);
                    return;
                }
                bundle.preloadDir(path, (error: Error) => {
                    if (error) {
                        reject(err)
                        cc.error(error);
                        return;
                    }
                    resolve(true);
                });
            });
        })
    }

    // 加载game的音效资源
    public async loadGameAudios(loadSubGame: SubGameInitData = null, loadGameNotCurGame?: Function) {
        if(!loadSubGame) loadSubGame =  GameBundleManager.curSubGame;
        let path = MainConstValue.GAME_AUDIO_DIR;
        return new Promise((resolve, reject) => {
            cc.assetManager.loadBundle(loadSubGame.curUrl, (err: Error, bundle: cc.AssetManager.Bundle) => {
                if (err) {
                    cc.error(err);
                    return reject(err);
                }
                bundle.loadDir(path, cc.AudioClip, (error: Error, clips: cc.AudioClip[]) => {
                    if (error) {
                        cc.error(error);
                        return reject(error);
                    }
                    if(loadGameNotCurGame && loadGameNotCurGame()) return; 
                    clips.forEach((ele) => {
                        this._audioClipMap.set(ele.name, ele);
                        this._referenceList.set(ele.name, 0);
                    });
                    resolve(true);
                });
            });
        })
    }

    // 单独缓存某一个音频
    public loadSubGameAudioClipByName(clipName: string, callback: () => void) {
        let path = MainConstValue.GAME_AUDIO_DIR + clipName;
        let gameData = GameBundleManager.curSubGame;
        let bundle = cc.assetManager.getBundle(gameData.curUrl);
        if (bundle) {
            let audio = bundle.get(path, cc.AudioClip) as cc.AudioClip;
            if (audio) {
                this._audioClipMap.set(audio.name, audio);
                this._referenceList.set(audio.name, 0);
                callback && callback();
            }
        }
    }

    public async loadMainAudioClips() {
        return new Promise((resolve, reject) => {
            cc.resources.loadDir("audio", cc.AudioClip, (error, audioClips: cc.AudioClip[]) => {
                // 错误处理
                if (error) {
                    cc.error(error);
                    reject(false);
                    return;
                }
                // 获取完毕后装入 Map
                audioClips.forEach((ele) => {
                    cc.log('缓存完毕! ele.name == ' + ele.name);
                    this._audioClipMap.set(ele.name, ele);
                    this._audioMainClipMap.set(ele.name, ele);
                    this._referenceList.set(ele.name, 0);
                });
                // 执行回调返回进度
                resolve(true);
            });
        });
    }


    /**
     * 播放背景音乐
     * @param soundName 背景音乐文件名
     */
    public playBGM(soundName: string | cc.AudioClip) {
        if (!UIManager.isGameShowing) {
            cc.warn(`不要在GamePanel的onLoad和start里播放音频！`);
            return;
        }
        //isPlayBgm也可能是undefind undefind说明不需要控制 默认走true
        if (GameBundleManager.gameEditorData && GameBundleManager.gameEditorData.data.isPlayBgm === false || NetWork.channel == 'blackboard') {
            return;
        }
        if (!soundName) {
            soundName = this.MUSIC_BGM;
        }
        this.bgm = soundName;
        this.bgmIndex = -1;
        cc.audioEngine.stopMusic();
        if (typeof this.bgm === 'string') {
            let path = MainConstValue.GAME_AUDIO_DIR + soundName;
            let asset = GameBundleManager.getBundleRes(path, cc.AudioClip);
            let clip = asset as cc.AudioClip;
            this.bgmIndex = cc.audioEngine.playMusic(clip, true);
        } else {
            this.bgmIndex = cc.audioEngine.playMusic(this.bgm, true);
        }
    }

    public removeGameAudio() {
        this._audioClipMap.forEach((element, key, Map) => {
            if (!this._audioMainClipMap.has(key)) {
                cc.assetManager.releaseAsset(element);
                element.destroy();
                Map.delete(key);
            }
        });
    }

    //重新开始播放背景音乐
    public resumeBGM() {
        cc.audioEngine.stopMusic();
        let clip = null;
        if (typeof this.bgm === 'string') {
            clip = this.getAudioClip(this.bgm);
            if (clip == null) {
                this.loadSubGameAudioClipByName(
                    this.bgm,
                    function () {
                        this.resumeBGM();
                    }.bind(this),
                );
                return;
            }
        } else {
            clip = this.bgm;
        }
        if (clip == null) return;
        cc.audioEngine.playMusic(clip, true);
    }

    // 重新开始播放背景音乐
    public stopBGM() {
        this.bgm = '';
        this.bgmIndex = -1;
        cc.audioEngine.stopMusic();
    }

    // 设置背景音音量
    public setMusicVolume(volume: number, tweenDur = 0) {
        if (this.bgmIndex != -1) {
            volume = cc.misc.clamp01(volume);
            if (tweenDur == 0) {
                cc.audioEngine.setVolume(this.bgmIndex, volume);
            } else {
                let obj = { v: cc.audioEngine.getVolume(this.bgmIndex) };
                cc.tween(obj)
                    .to(
                        tweenDur,
                        { v: volume },
                        {
                            progress: (start, end, current, ratio) => {
                                let v = start + (end - start) * ratio;
                                cc.audioEngine.setVolume(this.bgmIndex, v);
                            },
                        },
                    )
                    .start();
            }
        }
    }

    /**
     * 播放题干语音
     *
     * @param {string} clipName 语音clip文件
     * @param {boolean} bLoop 是否循环
     * @param {boolean} [bInterupt=true] 是否打断其他语音,默认true
     * @param {boolean} [bMutex=false] 是否互斥（指音效和语音）,默认false
     * @param {Function} [endCb=null] 播放结束回调
     * @param {cc.Component} [comp=null] 有传入comp则回调使用组件的scheduleOnce，不依赖cc.audioEngine.setFinishCallback
     * @memberof SoundManagerClass
     */
    public playAudioTitle(
        clipName: string | cc.AudioClip,
        bLoop: boolean = false,
        bInterupt: boolean = true,
        bMutex: boolean = false,
        endCb: Function = null,
        comp: cc.Component = null
    ) {
        // if (clipName == '') {
        //     clipName = this.AUDIO_TITLE;
        // }
        this.playAudio(clipName, bLoop, bInterupt, bMutex, endCb, true, comp);
    }

    // ting zhi
    public stopAudioTitle() {
        this._audioList.forEach((value, key) => {
            // cc.log("this._audioList value == "+value)
            // cc.log("this._audioList key == "+key)
            if (null != this._titleID && this._titleID === value) {
                this._audioList.delete(key);
                cc.audioEngine.stopEffect(value);
                this._referenceList.set(key, 0);
            }
        });
        this._titleID = null;
        // 题干语音播放完回调
        ListenerManager.dispatch(MainMsgType.COMPLETE_TRUMPET);
    }

    private cleanSoundTimeOut() {
        this._soundTimeOutArr.forEach((ele) => {
            clearTimeout(ele);
        });
        this._soundTimeOutArr = [];
    }

    /**
     * 播放语音
     *
     * @param {string} clipName 语音clip文件
     * @param {boolean} bLoop 是否循环
     * @param {boolean} [bInterupt=true] 是否打断其他语音,默认true
     * @param {boolean} [bMutex=false] 是否互斥（指音效和语音）,默认false
     * @param {Function} [onFinished=null] 播放结束回调
     * @param {boolean} [isTitleAudio=false] 是否是题干语音
     * @param {cc.Component} [comp=null] 有传入comp则回调使用组件的scheduleOnce，不依赖cc.audioEngine.setFinishCallback
     * @memberof SoundManagerClass
     */

    public playAudio(
        clipName: string | cc.AudioClip,
        bLoop: boolean,
        bInterupt: boolean = true,
        bMutex: boolean = false,
        onFinished: Function = null,
        isTitleAudio: boolean = false,
        comp: cc.Component = null
    ) {
        if (!UIManager.isGameShowing) {
            cc.warn(`不要在GamePanel的onLoad和start里播放音频！`);
            return;
        }

        if (!clipName) return;
        bInterupt && this.stopAllAudio();
        bMutex && this.stopAllEffect();
        let clip: cc.AudioClip = null;
        if (typeof clipName === 'string') {
            clip = this.getAudioClip(clipName);
            if (clip == null) {
                this.loadSubGameAudioClipByName(
                    clipName,
                    function () {
                        clip = this._audioClipMap.get(clipName);
                        this.playAudio(clip, bLoop, bInterupt, bMutex, onFinished, isTitleAudio);
                    }.bind(this),
                );
                return;
            }
        } else {
            clip = clipName;
            this._audioClipMap.set(clip.name, clip);
        }
        let id = cc.audioEngine.playEffect(clip, bLoop);
        // 赋值titleId
        if (isTitleAudio) {
            this._titleID = id;
            cc.log('this._titleID == ' + this._titleID);
        }
        this._audioList.set(clip.name, id);
        //播放引用计数加1
        let referenceCount = this._referenceList.get(clip.name) || 0;
        this._referenceList.set(clip.name, ++referenceCount);

        let callBack = () => {
            //引用计数为0删除资源
            let referenceCount = this._referenceList.get(clip.name);
            if (--referenceCount <= 0) {
                this.stopSoundByName(clip.name);
            }
            this._referenceList.set(clip.name, referenceCount < 0 ? 0 : referenceCount);
            onFinished && onFinished();
        }
        if (comp) {
            comp.scheduleOnce(() => {
                callBack();
            }, clip.duration)
        } else {
            cc.audioEngine.setFinishCallback(id, () => {
                /** 不加延时的话，在回调里接着播放声音会导致下一条声音收不到回调 */
                let timeOut = setTimeout(() => {
                    this._soundTimeOutArr.splice(this._soundTimeOutArr.indexOf(timeOut), 1);
                    callBack();
                }, 100);
                this._soundTimeOutArr.push(timeOut);
            });
        }
    }
    /**
     * 播放音效
     *
     * @param {string} clipName 音效clip文件
     * @param {boolean} bLoop 是否循环
     * @param {boolean} [bInterupt=true] 是否打断其他音效,默认true
     * @param {boolean} [bMutex=false] 是否互斥（指音效和语音）,默认false
     * @param {Function} [onFinished=null] 播放结束回调
     * @param {cc.Component} [comp=null] 有传入comp则回调使用组件的scheduleOnce，不依赖cc.audioEngine.setFinishCallback
     * @memberof SoundManagerClass
     */

    public playEffect(
        clipName: string | cc.AudioClip,
        bLoop: boolean,
        bInterupt: boolean = true,
        bMutex: boolean = false,
        onFinished: Function = null,
        comp: cc.Component = null
    ) {
        if (!UIManager.isGameShowing) {
            cc.warn(`不要在GamePanel的onLoad和start里播放音频！`);
            return;
        }

        if (!clipName) return;

        bInterupt && this.stopAllEffect();
        bMutex && this.stopAllAudio();

        let clip = null;

        if (typeof clipName === 'string') {
            clip = this.getAudioClip(clipName);
            if (clip == null) {
                this.loadSubGameAudioClipByName(
                    clipName,
                    function () {
                        clip = this._audioClipMap.get(clipName);
                        this.playEffect(clip, bLoop, bInterupt, bMutex, onFinished);
                    }.bind(this),
                );
                return;
            }
        } else {
            clip = clipName;
            this._audioClipMap.set(clip.name, clip);
        }

        let id = cc.audioEngine.playEffect(clip, bLoop);
        this._effectList.set(clip.name, id);
        //播放引用计数加1
        let referenceCount = this._referenceList.get(clip.name) || 0;
        this._referenceList.set(clip.name, ++referenceCount);

        let callBack = () => {
            //引用计数为0删除资源
            let referenceCount = this._referenceList.get(clip.name);
            if (--referenceCount <= 0) {
                this.stopSoundByName(clip.name);
            }
            this._referenceList.set(clip.name, referenceCount < 0 ? 0 : referenceCount);
            onFinished && onFinished();
        }

        if (comp) {
            comp.scheduleOnce(() => {
                callBack();
            }, clip.duration)
        } else {
            cc.audioEngine.setFinishCallback(id, () => {
                let timeOut = setTimeout(() => {
                    this._soundTimeOutArr.splice(this._soundTimeOutArr.indexOf(timeOut), 1);
                    callBack();
                }, 100);
                this._soundTimeOutArr.push(timeOut);
            });
        }
    }

    // 设置音效大小
    public setEffectVolume(volume: number) {
        volume = cc.misc.clamp01(volume);
        this._audioList.forEach((value, key) => {
            cc.audioEngine.setVolume(value, volume);
        });
    }

    // 停止语音
    public stopAllAudio() {
        this._audioList.forEach((value, key) => {
            if (null != this._titleID && this._titleID === value) {
                // 题干语音播放完回调
                ListenerManager.dispatch(MainMsgType.COMPLETE_TRUMPET);
            }
            this._referenceList.set(key, 0);
            cc.audioEngine.stopEffect(value);
        });
        this._audioList = new Map();
        this._titleID = null;
    }

    // 停止音效
    public stopAllEffect() {
        this._effectList.forEach((value, key) => {
            this._referenceList.set(key, 0);
            cc.audioEngine.stopEffect(value);
        });
        this._effectList = new Map();
    }

    // 停止播放指定的音频通过名字
    public stopSoundByName(clipName: string | cc.AudioClip) {
        let name = '';
        if (typeof clipName === 'string') {
            name = clipName;
        }else{
            name = clipName.name;
        }
        this._referenceList.set(name, 0);
        let id = this._audioList.get(name);
        if (id != null && id != -1) {
            cc.audioEngine.stop(id);
            this._audioList.delete(name);
        }
        id = this._effectList.get(name);
        if (id != null && id != -1) {
            cc.audioEngine.stop(id);
            this._effectList.delete(name);
        }
    }

    // 停止正在播放的所有音频
    public stopAll() {
        this.stopAllAudio();
        this.stopAllEffect();
        cc.audioEngine.stopAll();
        this.cleanSoundTimeOut();
    }

    // 某个音效是否正在播放
    public isPlaying(clipName: string | cc.AudioClip): boolean {
        let name = '';
        if (typeof clipName === 'string') {
            name = clipName;
        }else{
            name = clipName.name;
        }
        let id = this._audioList.get(name);
        if (id != null && id != -1) {
            return true;
        }
        id = this._effectList.get(name);
        if (id != null && id != -1) {
            return true;
        }
        return false;
    }

    //静音
    public mute(onlyMuteMusic = false) {
        if (CC_DEBUG) return;
        /** 个别游戏不禁用音效声音，只禁用背景音 */
        if (!onlyMuteMusic) {
            cc.audioEngine.setEffectsVolume(0);
        }
        cc.audioEngine.setMusicVolume(0);
    }

    //取消静音
    public unmute() {
        cc.audioEngine.setEffectsVolume(1);
        cc.audioEngine.setMusicVolume(1);
    }

    public playingResidue(clipName: string): number {
        let id = this.getSoundId(clipName);
        if(id){
            return cc.audioEngine.getDuration(id)-cc.audioEngine.getCurrentTime(id)
        }
        return 0;
    }

    public getSoundId(clipName: string){
        let id = this.getAudioId(clipName);
        if (id == null || id == -1) {
            id = this.getEffectId(clipName);
        }
        return id;
    }

    public getAudioId(clipName: string){
        return this._audioList.get(clipName);
    }

    public getEffectId(clipsName: string){
        return this._effectList.get(clipsName);
    }

    /** 使用scheduleOnce播放声音回调 */
    public playFinishCallback(audio: string | cc.AudioClip, comp: cc.Component, callBack: Function) {
        let clip: cc.AudioClip = null;
        if (typeof audio === 'string') {
            clip = this.getAudioClip(audio);
        } else {
            clip = audio;
        }
        comp.scheduleOnce(() => {
            callBack && callBack();
        }, clip.duration);
    }
}

export const SoundManager = SoundManagerClass.getInstance();
