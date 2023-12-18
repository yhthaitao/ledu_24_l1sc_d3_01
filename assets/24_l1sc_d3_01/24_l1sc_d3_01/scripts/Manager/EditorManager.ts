/**编辑器数据类 */
export const CellW = 88;
export const CellH = 88;
export const SpaceX = 3;
export const SpaceY = 3;

/** 游戏模式： */
export enum GameModel {
    square = 0,
    cycle = 1,
}

/**
 * 编辑器数据，根据游戏自定义内部数据
 */
class EditorData {
    // 是否开启再玩一次
    public isReplay: boolean = true;
    // 是否自动播放题干语音
    public isPlayTitle: boolean = true;
    // 是否播放新手引导
    public isPlayGuide: boolean = true;
    // 是否播放背景音乐
    public isPlayBgm: boolean = true;
    // 可重玩次数
    public replayCount: number = 1;
    // 关卡总数
    public levelCount: number = 1;
    // 总步数
    public stepCount: number = 0;
    // 课件等级 0：幼小  1：小低  2：小高
    public coursewareLevel: number = 0;

    /** 上传文件的数据  */
    public upLoadFilesData: Object = null;

    // TODO 自定义数据
    public GameData: GameData[] = [];
    public MaxLevel = 10;
    public curStep: number = 0;
    public curLevel:number = 0;
}

export class GameData {
    public auto_play_title: boolean = false;
    public titleAudio = "";
    public title = "";
    public gameModel = GameModel.square;
    public squareObj = {
        isSign: false,
        row: 10,// 1-10
        col: 10,// 1-10
        isScore: false,
        score: 5,// 1-100
        cellChars: [],
    };
    public cycleObj = {
        cutNum: 4,// 2-10
        isScore: false,
        score: 5,// 1-10
    };
}

class EditorManagerClass {
    private static _instance: EditorManagerClass;

    static getInstance() {
        if (this._instance == null) {
            this._instance = new EditorManagerClass();
        }
        return this._instance;
    }

    /** 编辑器数据 */
    public editorData: EditorData = new EditorData();

    constructor() { }

    /**
     * 是否支持题目编辑
     */
    public isSupportEdit(): boolean {
        let keys = Object.getOwnPropertyNames(this.editorData);

        return keys.length > 9;
    }

    /**
     * 获取关卡总数
     */
    public getLevelCount() {
        return this.editorData.levelCount;
    }

    /**
     * 设置关卡总数
     */
    public setLevelCount(num: number) {
        this.editorData.levelCount = num;
    }

    public setUpLoadFilesData(data: any) {
        this.editorData.upLoadFilesData = data;
    }

    /**
     * 获取总步数
     */
    public getStepCount() {
        return this.editorData.stepCount || this.getLevelCount();
    }

    /**
     * 设置总步数
     */
    public setStepCount(num: number) {
        this.editorData.stepCount = num;
    }

    /**
     * 获取课件等级
     * 需要各个游戏根据实际情况设置正确的数值
     * 课件等级 0：幼小  1：小低  2：小高
     */
    public getCoursewareLevel() {
        return this.editorData.coursewareLevel;
    }

    /**
     * 获取编辑器数据
     */
    public getData(): EditorData {
        return this.editorData;
    }

    /**
     * 根据网络请求结果设置编辑器数据
     * @param {EditorData} data
     */
    public setData(data: EditorData) {
        this.editorData = data;
    }
}

export const EditorManager = EditorManagerClass.getInstance();
