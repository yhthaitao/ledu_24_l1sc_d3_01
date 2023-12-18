import { GameLoadErrType } from "./MainConstValue";


/** mcc交互消息 */
export class IframeMsgType {
    public static readonly request_main_res_load_end = 'request_main_res_load_end';
    public static readonly request_load_err = 'request_load_err';

    public static readonly request_game_err = 'request_game_err';

    public static readonly request_engine_load_start = 'request_engine_load_start';
    public static readonly request_engine_load_end = 'request_engine_load_end';
    /** 取消mcc2秒检测 */
    public static readonly request_cancel_2s_detection = 'request_cancel_2s_detection';

    public static readonly recv_switch_game = 'recv_switch_game';
    public static readonly recv_preload_game = 'recv_preload_game';
    public static readonly recv_pause_game = 'recv_pause_game';
    public static readonly recv_sync_data = 'recv_sync_data';
    public static readonly recv_json_data = 'recv_json_data';
    public static readonly recv_sync_3s_data = 'recv_sync_3s_data';
    public static readonly recv_keep_playing = 'recv_keep_playing';
    public static readonly recv_cancel_keep_playing = 'recv_cancel_keep_playing';
    public static readonly recv_restart = 'recv_restart';
    public static readonly recv_is_master = 'recv_is_master';
    public static readonly recv_show_gamePanel = 'recv_show_gamePanel';
    public static readonly recv_hide_gamePanel = 'recv_hide_gamePanel';
    public static readonly answer_sync_send = 'answer_sync_send';
    public static readonly game_statistic_data = 'game_statistic_data';
    /** 游戏获取授权 */
    public static readonly recv_open_authorization = 'recv_open_authorization';
    /** 游戏取消授权 */
    public static readonly recv_cancel_authorization = 'recv_cancel_authorization';
    /**接收静态资源url */
    public static readonly recv_static_res_url = 'recv_static_res_url';



    /** 游戏消息 判断是子游戏时候会拼接'sub_' */
    public static readonly res_load_process = 'res_load_process';
    public static readonly game_start = 'game_start';
    public static readonly game_over = 'game_over';
    public static readonly request_res_load_start = 'request_res_load_start';
    public static readonly request_res_load_end = 'request_res_load_end';
    public static readonly request_sync_init = 'request_sync_init';
    public static readonly send_sync_data = 'send_sync_data';
    public static readonly request_json_data = 'request_json_data';
    public static readonly send_sync_3s_data = 'send_sync_3s_data';
    public static readonly request_keep_playing = 'request_keep_playing';
    public static readonly request_restart_over = 'request_restart_over';//重新玩回调用
    public static readonly request_event_ready = 'request_event_ready';
    public static readonly request_level_info = 'request_level_info';
    /** 请求静态资源url */
    public static readonly request_static_res_url = 'request_static_res_url';
}

export class SubGameEvent {
    public static readonly iframe_sub = 'sub_';
    /** 子游戏消息 判断是子游戏时候会拼接'sub_' */
    public static readonly subEventList = [
        IframeMsgType.request_res_load_start,
        IframeMsgType.res_load_process,
        IframeMsgType.request_res_load_end,
        IframeMsgType.game_start,
        IframeMsgType.request_sync_init,
        IframeMsgType.send_sync_data,
        IframeMsgType.request_json_data,
        IframeMsgType.request_static_res_url,
        IframeMsgType.send_sync_3s_data,
        IframeMsgType.request_keep_playing,
        IframeMsgType.request_restart_over,
        IframeMsgType.request_event_ready,
        IframeMsgType.request_level_info,
        IframeMsgType.answer_sync_send,
        IframeMsgType.game_over,
    ];
}

/** 客户端交互消息 */
export class ClientMsgType {
    public static readonly res_load_start = 'res_load_start';
    public static readonly res_load_complete = 'res_load_complete';
    public static readonly finished = 'finished';
    public static readonly STOP = 'stop';
    public static readonly res_load_process = 'res_load_process';
    public static readonly game_start = 'game_start';
    public static readonly answer_sync_send = 'answer_sync_send';
    public static readonly game_over = 'game_over';
    public static readonly game_statistic_data = 'game_statistic_data';
}

/**阿里上报消息 */
export class AliLogMsgType {
    public static readonly resLoadStart = 'resLoadStart';
    public static readonly resLoadEnd = 'resLoadEnd';
    public static readonly game_start = 'game_start';
    public static readonly request_sync_init = 'request_sync_init';

    public static readonly gameLevelReport = 'gameLevelReport';
    public static readonly gameOverReport = 'gameOverReport';
    public static readonly gameStop = 'gameStop';

    /**分包埋点 */
    public static readonly recv_switch_game = 'recv_switch_game';
    public static readonly recv_preload_game = 'recv_preload_game';
    public static readonly request_main_res_load_end = 'request_main_res_load_end';
    public static readonly request_load_err = 'request_load_err';

    /**加载的游戏不是当前游戏 */
    public static readonly loadGameNotCurGame = 'loadGameNotCurGame';
    /** 加载失败 */
    public static readonly loadBundleFail = 'loadBundleFail';
    /** 预加载和加载的是同一个bundle */
    public static readonly preLoadIsSameLoadBunde = 'preLoadIsSameLoadBunde';
    /** 预加载完成 */
    public static readonly preLoadBundleFinish = 'preLoadBundleFinish';
    /** 预加载失败 */
    public static readonly preLoadBundleFail = 'preLoadBundleFail';
    /**上报游戏isMaster变更 */
    public static readonly reportGameIsMasterChange = 'reportGameIsMasterChange';
    /**上报游戏授权变更 */
    public static readonly reportGameAuthChange = 'reportGameAuthChange';

    /** 上报游戏灰度相关信息 */
    public static readonly DarkTagInfo = 'DarkTagInfo';

    /**上报自定义信息 */
    public static readonly reportCustomInfo = 'reportCustomInfo';

    /**离线资源下载埋点 */
    public static readonly staticAssetsLoad = 'staticAssetsLoad';

    /**切页暂停引擎 */
    public static readonly pauseGame = 'pauseGame';
}
