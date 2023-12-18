import { CutDir, CutModel } from "../Manager/EditorManager";

/**
 * 需要同步的自定义数据
 * 游戏业务层同步数据在这里添加
 */
export class CustomSyncData {
    public curLevel: number = 0; // 当前关卡(第一关为0)
    // TODO 自定义
    public curStep: number = 0;
    public cutArray: { model: CutModel, dir: CutDir }[] = [];
    public arrDrag = [null, null, null, null, null, null, null, null];// 角标为drag数字后缀，内容为切割块名字
}
