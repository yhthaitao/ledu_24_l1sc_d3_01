/**
 * 同步数据
 */

import { CustomSyncData } from '../../Data/CustomSyncData';
import { FrameSyncData } from '../Data/FrameSyncData';
import { ReportManager } from './ReportManager';

/**
 * 需要同步的数据
 * 自定义数据不要在这里实现，请在 CustomSyncData 中实现
 */
export class SyncData {
    public reportData: any = null; // 上报数据
    public customSyncData: CustomSyncData = new CustomSyncData(); // 自定义同步数据
    public frameSyncData: FrameSyncData = new FrameSyncData(); // 框架中的同步数据
}
class SyncDataManagerClass {
    private static _instance: SyncDataManagerClass = null;

    public static getInstance(): SyncDataManagerClass {
        if (null === this._instance) {
            this._instance = new SyncDataManagerClass();
        }
        return this._instance;
    }

    /** 同步数据 */
    private _syncData: SyncData = new SyncData();
    public set syncData(data: SyncData) {
        this.setSyncData(data);
    }
    public get syncData() {
        return this.getSyncData();
    }

    public initSyncData() {
        this._syncData = new SyncData();
    }

    public getSyncData(): SyncData {
        this._syncData.reportData = ReportManager.getSyncData();
        return this._syncData;
    }

    public setSyncData(data: SyncData) {
        this._syncData = data;
        ReportManager.setSyncData(data.reportData);
    }

    /**
     * 重玩
     */
    public replay() {
        const actionId = this._syncData.frameSyncData.actionId;
        const replayCount = this._syncData.frameSyncData.hasReplayCount + 1;
        const isGameStart = this._syncData.frameSyncData.isGameStart;
        const isClickedStartBtn = this._syncData.frameSyncData.isClickedStartBtn;
        this.initSyncData();
        this._syncData.frameSyncData.actionId = actionId;
        this._syncData.frameSyncData.hasReplayCount = replayCount;
        this._syncData.frameSyncData.isGameStart = isGameStart;
        this._syncData.frameSyncData.isClickedStartBtn = isClickedStartBtn;
    }
}

export const SyncDataManager = SyncDataManagerClass.getInstance();
