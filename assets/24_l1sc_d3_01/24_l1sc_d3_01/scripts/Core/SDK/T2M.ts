/**
 * v2.2
 * Author: jinhailiang
 * Email: jinhailiang@tal.com
 * update-1.0: 2020_04_05:构建
 * update-1.1: 2020_10_29:用数组管理reducer，便于多个组件之间进行事件传输；
 * update-1.2: 2020_12_08:添加心跳同步和动作验证；
 * update-2.0: 2021_03_19:代码重构：核心功能解藕-此版本专注于实现游戏异步事件的管理；
 *              1.结构优化-更改API，用户可以按使用单机游戏事件管理器的方式使用此模块。
 *              2.通过增加待运行的事件队列解决偶现的动作执行错序问题。
 *              3.去除心跳同步，心跳同步作为普通异步事件的特例留给用户自定义。
 *              4.去除网络导致的动作错序验证，上层网络导致的动作错序和丢失问题 1）留给心跳同步解决 2）需对上层网络协议重新选择或优化。
 *              5.新增网络堵塞时，抛弃非关键数据功能。
 * update-2.1: 2021_04_06:无论是否同步操作方都直接调用回调函数；
 * update-2.2: 2021_04_07:去除action上携带的时间戳及关键数据标记，接收端通过update依次执行队列中的action，避免使用settimeout出现事件队列阻塞的问题；
 *
 * detail: T2M(type to method)用来管理数据同步，派发action时执行相应的方法。借助此模块，用户可以用开发单机游戏的方式开发同步游戏；
 * 跟开发单机游戏的区别：
 * 1. 反应速度-单机游戏是即时反应，同步游戏需要等一段时间，这段时间包括本模块为降低发送频率所设计的50ms的缓存时间和网络传输消耗的时间。
 */

import { MainMsgType } from '../../../../../scripts/Data/MainMsgType';
import { NetWork } from '../../../../../scripts/Http/NetWork';
import { ListenerManager } from '../../../../../scripts/Manager/ListenerManager';
import { SyncData, SyncDataManager } from '../Manager/SyncDataManager';
import { UIHelp } from '../../../../../scripts/Utils/UIHelp';
import GameMsg from '../../../../../scripts/SDK/GameMsg';
import { ConstValue } from '../../Data/ConstValue';

export class Action {
    type: string = '';
    syncData: SyncData = JSON.parse(JSON.stringify(SyncDataManager.getSyncData()));
    data: any = null;
}

export class SendData {
    isHeartBreak: boolean = false;
    data: Action[] = [];
    constructor(isHeartBreak?: boolean, data?: Action[]) {
        this.isHeartBreak = isHeartBreak || false;
        this.data = data || [];
    }
}

export class T2MClass {
    private static _instance: T2MClass = null;
    private _map: Map<string, Function> = new Map();
    private _isSync: Boolean = false;
    private _isInit: Boolean = false;
    private _cacheList: Array<Action> = [];
    private _lastSendTime: number;
    private _lastUpdateTime: number;
    private _waitRunActionList: Array<Action> = [];
    private _sendTime: number = 0;
    private _lastEventTime: number = 0;
    public isRecover: boolean = false;
    private _heartCount: number = 0;
    private _heartInterval: number = 1000;
    private readonly _fastHeartCount = 4;
    public static getInstance() {
        if (this._instance == null) {
            this._instance = new T2MClass();
        }
        return this._instance;
    }

    /**
     * 初始化：gamemsg注册监听事件，初始化发送时间
     */
    public init() {
        this.setSync(NetWork.isSync);
        if (!this._isInit) {
            ListenerManager.on(MainMsgType.RECV_SYNC_DATA, this.actionSyncHandler, this);
            this._lastSendTime = Date.now();
            this.addSyncEventListener(MainMsgType.ON_HEART_BREAK, this.onHeartBreak.bind(this));
            ConstValue['CancelMcc2sDetection'] && GameMsg.request_cancel_2s_detection();
            this.setFastHeartBreakState();
            this._isInit = true;
            GameMsg.request_sync_init();
        }
    }

    public onReturnToTeacherPanel() {
        this._isSync = false;
    }

    /**
     * 设置是否派发同步事件
     * @param isSync  为true时发送同步事件，否则发送单机事件
     */
    public setSync(isSync: boolean) {
        this._isSync = isSync;
    }

    /**
     * 为事件类型注册监听器
     * @param type  监听的事件类型
     * @param listener  监听器回调函数
     */
    public addSyncEventListener(type: string, listener: Function) {
        this._map.set(type, listener);
    }

    /**
     * 移除事件监听
     * @param type  事件类型
     */
    public removeSyncEventListener(type: string) {
        if (this._map.has(type)) {
            this._map.delete(type);
        }
    }

    /**
     * 派发事件，接收端接收到事件后会触发对应的回调函数
     * @param type  事件类型
     * @param data  发送的数据
     * @param addCache  是否放入缓存。当设置为true时，会将派发的事件放入一个缓存队列中，等一段时间后统一发送；当设置为false时，会立即派发。拖拽事件建议设置为true。
     */
    public dispatch(type: string, data: any, addCache: boolean = true) {
        let syncAction = new Action();
        syncAction.type = type;
        syncAction.data = data;
        if (this._isSync) {
            if (MainMsgType.ON_HEART_BREAK === type) {
                let sendData = new SendData(true, [syncAction]);
                GameMsg.send_sync_data(sendData);
            } else {
                // 非心跳事件不发全量数据
                syncAction.syncData = null;
                if (addCache) {
                    this._cacheList.push(syncAction);
                } else {
                    let sendData = new SendData(false, [syncAction]);
                    GameMsg.send_sync_data(sendData);
                }
            }
            this._sendTime = Date.now();
        } else {
            if (this._map.has(type)) {
                if (MainMsgType.ON_HEART_BREAK !== type) {
                    this._map.get(type)(data);
                }
            } else {
                console.log(`Listener type is null! type = ${type}`);
            }
        }
    }

    /**
     * 监听心跳
     * @param data
     */
    private onHeartBreak(data: SyncData) {
        let inRecovery = false;
        if (SyncDataManager.syncData.frameSyncData.actionId !== data.frameSyncData.actionId) {
            ListenerManager.dispatch(MainMsgType.ON_RECOVERY_DATA, data);
            inRecovery = true;
        }

        if (!this.isRecover) {
            this.isRecover = true;
            UIHelp.closeRecoverMask();

            // -999为接着玩预留字段，取消接着玩时不发送 ON_FIRST_BREAK 事件
            if (-999 !== data.frameSyncData.actionId) {
                ListenerManager.dispatch(MainMsgType.ON_FIRST_BREAK, { inRecovery: inRecovery });
            }

            // 检测心跳数据量，过大给提醒
            const dataStr = JSON.stringify(data);
            console.log('SyncData length: ', dataStr.length);
            if (dataStr.length > 1024 * 5) {
                console.warn('心跳数据量过大！ dataStr.length: ', dataStr.length);
            }
        }
    }

    /**
     * 1.发送端通过心跳发送缓存事件，每隔一段时间(50ms)发送一次缓存队列；
     * 2.接受端执行待执行缓存队列中的action；
     * 3.使用时需要在组件的update周期函数中调用此函数；
     */
    public update() {
        if (!this._isInit) return;
        this.sendSyncEvent();
        this.sendHeartBreak();
        this.runActions();
    }

    /**
     * 发送事件
     */
    private sendSyncEvent() {
        if (Date.now() - this._lastSendTime >= 50) {
            if (this._cacheList.length > 0) {
                let sendData = new SendData(false, this._cacheList);
                GameMsg.send_sync_data(sendData);
                this._cacheList = [];
                this._sendTime = Date.now();
            }
            this._lastSendTime = Date.now();
        }
    }

    public setFastHeartBreakState() {
        this._sendTime = 0;
        this._heartCount = 0;
        this._heartInterval = 1000;
    }

    /**
     * 发送心跳包
     */
    private sendHeartBreak() {
        if (Date.now() - this._sendTime > this._heartInterval && (NetWork.isSupportKeepPlay || NetWork.isMaster)) {
            // const syncData = SyncDataManager.getSyncData();
            this.dispatch(MainMsgType.ON_HEART_BREAK, null, false);
            this._sendTime = Date.now();
            ++this._heartCount;
            if (this._fastHeartCount === this._heartCount) {
                this._heartInterval = 3000;
            }
            cc.log('sendHeartBreak');
        }
    }

    /**
     * 接受端接收到数据时的回调
     */
    private actionSyncHandler(data: any) {
        let actions = data.data.data;

        // 重新玩或接着玩时，如果播放器拿不到心跳数据，会发一个内容为null的心跳
        if (!actions) {
            let tmpAction = new Action();
            tmpAction.type = MainMsgType.ON_HEART_BREAK;
            actions = [tmpAction];
            data.data.data = actions;
            this.onHeartBreakHandler(data);
            return;
        }

        if (1 === actions.length && MainMsgType.ON_HEART_BREAK === actions[0].type) {
            if (!NetWork.isMaster) {
                this.onHeartBreakHandler(data);
            }
            return;
        }

        // 接着玩兼容旧端 学生端接收到第一次心跳后才处理同步事件
        if (NetWork.isSupportKeepPlay || NetWork.isMaster || this.isRecover) {
            if (this._waitRunActionList.length == 0) {
                this._waitRunActionList = [...actions];
            } else {
                this._waitRunActionList = [...this._waitRunActionList, ...actions];
            }
            this._lastEventTime = Date.now();
        }
    }

    /**
     *
     * @param data 接收心跳数据
     */
    private onHeartBreakHandler(data: any) {
        let actions = data.data.data;
        // 收到操作事件2S内不处理心跳（防止旧的心跳数据覆盖当前状态）
        if (Date.now() - this._lastEventTime > 2000) {
            if (this._waitRunActionList.length == 0) {
                this._waitRunActionList = [...actions];
            } else {
                this._waitRunActionList = [...this._waitRunActionList, ...actions];
            }
        }
    }

    /**
     * 依次运行缓存中的action
     */
    private runActions() {
        let waitRunActionsNum = this._waitRunActionList.length;
        if (waitRunActionsNum > 0) {
            let updateTime = Date.now() - this._lastUpdateTime;
            let minEnterTimePerAction = 7;
            let maxNeedRunActionNum = Math.floor(updateTime / minEnterTimePerAction);
            let runNum = Math.min(waitRunActionsNum, maxNeedRunActionNum);
            let action = this._waitRunActionList[0];
            if (MainMsgType.ON_HEART_BREAK !== action.type) {
                for (let i = 0; i < runNum; i++) {
                    let action: Action = this._waitRunActionList.shift();
                    if (this._map.has(action.type)) {
                        this._map.get(action.type)(action.data);
                    }
                    ++SyncDataManager.syncData.frameSyncData.actionId;
                }
            } else {
                this._waitRunActionList.shift();
                this._map.get(action.type)(action.syncData);
            }
        }
        this._lastUpdateTime = Date.now();
    }

    public reset() {
        this._map.clear();
        this._isSync = false;
        this._isInit = false;
        this._cacheList = [];
        this._lastSendTime = null;
        this._lastUpdateTime = null;
        this._waitRunActionList = [];
        this._sendTime = 0;
        this._lastEventTime = 0;
        this.isRecover = false;
        this._heartCount = 0;
        this._heartInterval = 1000;
    }
}

export const T2M = T2MClass.getInstance();
