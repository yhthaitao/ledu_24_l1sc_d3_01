/**
 * 需要同步的自定义数据
 * 游戏业务层同步数据在这里添加
 */
export class CustomSyncData {
    public curLevel: number = 0; // 当前关卡(第一关为0)
    // TODO 自定义
    public brushId: number = 0;
    public colorCell: number[] = [];
    public playTitle = true;
    public playGuide = true;
    public isHint = false;
    public time = 10;
}
