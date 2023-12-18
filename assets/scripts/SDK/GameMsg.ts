import { AliLogMsgType, ClientMsgType, IframeMsgType, SubGameEvent } from "../Data/SDKMsgType";
import { NetWork } from "../Http/NetWork";

export default class GameMsg {
    /************************************sdk接口**************************************/
    /**
    * 监听课堂端发出的事件
    * @param key 事件名字
    * @param callBack 响应函数
    */
    public static addClientEvent(event, callBack) {
        window['gameMsg'].on_client_event(event, callBack);
    }

    /**
    * 向课堂端发出的事件
    * @param key 事件名字
    * @param callBack 响应函数
    */
    private static sendClientEvent(data: any) {
        window['gameMsg'].send_to_client(data);
    }

    /** 向iframe发送事件 */
    private static sendIframeEvent(event: string, data: any = "") {
        if (NetWork.isSubGame && SubGameEvent.subEventList.indexOf(event) >= 0) {
            event = SubGameEvent.iframe_sub + event;
        }
        window['iframeMsg'].send_as_message({ type: event, data: data });
    }

    /** 监听iframe事件 */
    private static addIframeEvent(event: string, callBack: Function) {
        window['iframeMsg'].on_as_message(callBack, event);
    }

    public static reportAliLog(event: string, data: any = "") {
        window['aliLogMsg'].info(event, data);
    }

    /**
     * 上报灰度所需日志
     * @param classId 直播讲
     * @param stdGrade 年级
     * @param belongCity 分校
     * @param version 版本
     * @param gameId 游戏id
     */
    public static reportDarkTag(classId: string, stdGrade: string, belongCity: string, version: string, gameId: string) {
        GameMsg.reportAliLog(AliLogMsgType.DarkTagInfo, {
            classId: `DarkTagClassId-${classId}`,
            stdGrade: `DarkTagStdGrade-${stdGrade}`,
            belongCity: `DarkTagBelongCity-${belongCity}`,
            version: `DarkTagVersion-${version}`,
            gameId: `DarkTagGameId-${gameId}`
        });
    }

    /************************************对外接口**************************************/
    /**
     * 资源加载开始
     * @param type 课件类型
     * @param protocol_version 交互课件版本
     */
    public static resLoadStart() {
        GameMsg.sendClientEvent({
            type: ClientMsgType.res_load_start,
            data: { type: 'courseware_game', protocol_version: '1.1.8' }
        });
        GameMsg.sendIframeEvent(IframeMsgType.request_res_load_start);
        GameMsg.reportAliLog(AliLogMsgType.resLoadStart);
    }

    /**
     * 资源加载中
     * @param percent 加载百分比
     */
    public static resLoading(percent: number = 0) {
        GameMsg.sendClientEvent({
            type: ClientMsgType.res_load_process,
            data: percent
        });
        GameMsg.sendIframeEvent(IframeMsgType.res_load_process, percent);
    }

    /**
     * 资源加载完成
     */
    public static resLoadEnd() {
        GameMsg.sendClientEvent({
            type: ClientMsgType.res_load_complete
        });
        GameMsg.sendIframeEvent(IframeMsgType.request_res_load_end);
        GameMsg.reportAliLog(AliLogMsgType.resLoadEnd);
    }

    /**
     * 游戏开始
     */
    public static gameStart() {
        GameMsg.sendClientEvent({
            type: ClientMsgType.game_start
        });
        GameMsg.sendIframeEvent(IframeMsgType.game_start);
        GameMsg.reportAliLog(AliLogMsgType.game_start);
    }

    /**
     * 发送同步事件监听初始化完成
     * @param data
     */
    public static request_sync_init() {
        GameMsg.sendIframeEvent(IframeMsgType.request_sync_init);
        GameMsg.reportAliLog(AliLogMsgType.request_sync_init);
    }

    /**取消2秒检测 */
    public static request_cancel_2s_detection() {
        GameMsg.sendIframeEvent(IframeMsgType.request_cancel_2s_detection);
    }

    /*************************************分包*********************************/
    /**
     * 切换游戏
     * @param cb(data)  data:{name: string, urlList:string[], params:{}} 
     */
    public static recvSwitchGame(cb: Function) {
        GameMsg.addIframeEvent(IframeMsgType.recv_switch_game, cb);
    }

    /**
     * 预加载游戏
     * @param cb(data) data:{name: string, urlList:string[]} 
     */
    public static recvPreloadGame(cb: Function) {
        GameMsg.addIframeEvent(IframeMsgType.recv_preload_game, cb);
    }

    /**
     * 主包资源加载结束
     * @param data
     */
    public static requestMainResLoadEnd() {
        GameMsg.sendIframeEvent(IframeMsgType.request_main_res_load_end);
        GameMsg.reportAliLog(AliLogMsgType.request_main_res_load_end);
    }

    /**
     * 加载错误 主包错误1 子包错误2 远端资源错误3
     * @param data:{type:1}
     */
    public static requestLoadErr(data: any) {
        GameMsg.sendIframeEvent(IframeMsgType.request_load_err, data);
        GameMsg.reportAliLog(AliLogMsgType.request_load_err, data);
    }

    public static pauseGame(cb: Function) {
        GameMsg.addIframeEvent(IframeMsgType.recv_pause_game, cb);
    }

    /*************************************数据上报*********************************/

    /**
     * 游戏操作过程数据上报
     * @param answer_data 操作过程数据/全量数据
     */
    public static answerSyncSend(answer_data: any) {
        GameMsg.sendClientEvent({
            type: ClientMsgType.answer_sync_send,
            data: { answer_data: answer_data }
        })
        GameMsg.sendIframeEvent(IframeMsgType.answer_sync_send, { answer_data: answer_data });
        GameMsg.reportAliLog(AliLogMsgType.gameLevelReport, answer_data);
    }

    /**
     * 游戏完成时用于数据上报的全量数据
     * @param data 游戏全量数据
     */
    public static gameOver(data: any) {
        GameMsg.sendClientEvent({ type: ClientMsgType.game_over, data: data });
        GameMsg.sendIframeEvent(IframeMsgType.game_over, data);
        GameMsg.reportAliLog(AliLogMsgType.gameOverReport, data);
    }

    /**
     * 上报统计数据
     */
    public static gameStatisticData(data: any) {
        const sendData = { type: 'courseware_game_answer', data: data };
        GameMsg.sendClientEvent({ type: ClientMsgType.game_statistic_data, data: sendData });
        GameMsg.sendIframeEvent(IframeMsgType.game_statistic_data, sendData);
    }

    /**
     * 游戏结束，收到stop消息后发送
     */
    public static finished() {
        GameMsg.sendClientEvent({ type: ClientMsgType.finished });
    }

    /**
     * 同步发送
     * @param 同步数据
     */
    public static send_sync_data(msg: any) {
        GameMsg.sendIframeEvent(IframeMsgType.send_sync_data, msg);
    }

    /**
     * 同步接收
     * @param cb 回调
     */
    public static recv_sync_data(cb: Function) {
        GameMsg.addIframeEvent(IframeMsgType.recv_sync_data, cb);
    }

    // 离线模式监听json消息
    public static recv_json_data(cb: Function) {
        GameMsg.addIframeEvent(IframeMsgType.recv_json_data, cb);
    }

    // 离线模式请求json数据
    public static request_json_data(data: any) {
        GameMsg.sendIframeEvent(IframeMsgType.request_json_data, data);
    }

    // 获取静态资源地址
    public static recv_static_res_url(cb: Function) {
        GameMsg.addIframeEvent(IframeMsgType.recv_static_res_url, cb);
    }

    // 离线模式请求json数据
    public static request_static_res_url(data: any = '') {
        GameMsg.sendIframeEvent(IframeMsgType.request_static_res_url, data);
    }

    // 正常日志
    public static info(msg, ...data) {
        window['aliLogMsg'].info(msg, ...data);
    }
    // 警告日志
    public static warn(msg, ...data) {
        window['aliLogMsg'].warn(msg, ...data);
    }
    // 报错日志
    public static error(msg, ...data) {
        window['aliLogMsg'].error(msg, ...data);
    }
    /**
     * URL参数不全报错
     * @param data url参数
     */
    public static URLError(data) {
        window['aliLogMsg'].URLError(data);
    }
    // 网络请求超时
    public static httpTimeOut(msg) {
        window['aliLogMsg'].httpTimeOut(msg);
    }
    // 网络请求错误
    public static httpError(msg) {
        window['aliLogMsg'].httpError(msg);
    }
    // coursewareKey不同
    public static differntKey(msg) {
        window['aliLogMsg'].differntKey(msg);
    }
    // 游戏收到结束游戏上报
    public static gameStop() {
        GameMsg.reportAliLog(AliLogMsgType.gameStop);
    }

    /**
     * 监听端上停止游戏接口
     */
    public static addGameStopEvent(cb: Function) {
        GameMsg.addClientEvent(ClientMsgType.STOP, cb)
    }
    /*************************************接着玩、重新玩*********************************/

    /**
     * 发送3S心跳
     * @param data
     */
    public static send_sync_3s_data(data: any) {
        GameMsg.sendIframeEvent(IframeMsgType.send_sync_3s_data, data);
    }

    /**
     * 监听3S心跳
     * @param cb
     */
    public static recv_sync_3s_data(cb: Function) {
        GameMsg.addIframeEvent(IframeMsgType.recv_sync_3s_data, cb);
    }

    /**
     * 监听接着玩
     * @param cb
     */
    public static recv_keep_playing(cb: Function) {
        GameMsg.addIframeEvent(IframeMsgType.recv_keep_playing, cb);
    }

    /**
     * 接着玩回调
     * @param data  3s心跳数据
     */
    public static request_keep_playing(data: any) {
        GameMsg.sendIframeEvent(IframeMsgType.request_keep_playing, data);
    }

    /**
     * 监听取消接着玩
     * @param cb
     */
    public static recv_cancel_keep_playing(cb: Function) {
        GameMsg.addIframeEvent(IframeMsgType.recv_cancel_keep_playing, cb);
    }

    /**
     * 监听重新玩
     * @param cb
     */
    public static recv_restart(cb: Function) {
        GameMsg.addIframeEvent(IframeMsgType.recv_restart, cb);
    }

    /**
     * 发送重新玩成功回调
     * @param data
     */
    public static request_restart_over() {
        GameMsg.sendIframeEvent(IframeMsgType.request_restart_over);
    }

    /** 
     * 发送准备就绪 mcc会发送给游戏recv_is_master
     * @param data
     */
    public static request_event_ready() {
        GameMsg.sendIframeEvent(IframeMsgType.request_event_ready,);
    }

    /**
     * 监听是否为主动发送心跳的一端
     * @param cb 回调
     */
    public static recv_is_master(cb: Function) {
        GameMsg.addIframeEvent(IframeMsgType.recv_is_master, cb);
    }

    /**
     * 发送关卡信息
     * @param data
     */
    public static request_level_info(data: any) {
        GameMsg.sendIframeEvent(IframeMsgType.request_level_info, data);
    }


    /*************************************预加载*********************************/
    /**
     * 监听窗口打开
     * @param cb
     */
    public static recv_show_gamePanel(cb: Function) {
        GameMsg.addIframeEvent(IframeMsgType.recv_show_gamePanel, cb);
    }

    /**
     * 监听窗口关闭
     * @param cb
     */
    public static recv_hide_gamePanel(cb: Function) {
        GameMsg.addIframeEvent(IframeMsgType.recv_hide_gamePanel, cb);
    }

    /**打开授权 */
    public static recv_open_authorization(cb: Function) {
        GameMsg.addIframeEvent(IframeMsgType.recv_open_authorization, cb);
    }

    /** 取消授权 */
    public static recv_cancel_authorization(cb: Function) {
        GameMsg.addIframeEvent(IframeMsgType.recv_cancel_authorization, cb);
    }

    /**
     * 发送引擎加载开始
     * @param data
     */
    public static request_engine_load_start(data: any) {
        GameMsg.sendIframeEvent(IframeMsgType.request_engine_load_start, data);
    }

    /**
     * 发送引擎加载结束
     * @param data
     */
    public static request_engine_load_end(data: any) {
        GameMsg.sendIframeEvent(IframeMsgType.request_engine_load_end, data);
    }

    /*************************************文件上传*********************************/
    /**
     * 
     * @param key 唯一性 在腾讯云里边的路径
     * @param body 文件本身
     */
    public static getFileObject(key: string, body: any) {
        return window['cosMsg'].getFileObject(key, body);
    }

    /** 批量上传文件 */
    public static uploadFiles(files: any, callbacl: Function) {
        window['cosMsg'].uploadFiles(files, callbacl);
    }

    /** 设置Cos需要的数据，区分生产环境和线上环境 */
    public static setCosData(data: any) {
        window['cosMsg'].setCosData(data);
    }

    /** 删除文件 */
    public static deleteObject(key: string, callBack?: Function) {
        window['cosMsg'].deleteObject(key, callBack);
    }

    /** 批量删除文件 
     * keys:[{Key: '中文/中文.txt'},{Key: '中文/中文.zip'}]
     * 
    */
    public static deleteMultipleObject(keys: Array<any>, callBack: Function) {
        window['cosMsg'].deleteMultipleObject(keys, callBack);
    }
    /**********************************************************************************/
}
