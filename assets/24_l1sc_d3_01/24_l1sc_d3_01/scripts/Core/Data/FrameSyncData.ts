/**
 * 框架中需要同步的数据
 * 对应 SyncDataManager.syncData.frameSyncData
 * @class FrameSyncData
 */
export class FrameSyncData {
    public actionId: number = 0; // 操作指令id
    public isDispose: boolean = true; // 是否处理全量数据
    public hasReplayCount: number = 0; // 已重玩的次数
    public isGameOver: boolean = false; // 游戏是否结束
    public isGameStart: boolean = true;/**是否游戏开始前 */
    public isClickedStartBtn: boolean = false;/**是否点击过开始按钮 */
}
