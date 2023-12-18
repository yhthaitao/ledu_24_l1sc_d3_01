export class MainConstValue {
    public static readonly MainGameVer = "1.3.24"; //主包的版本  主包每次打包自增
    public static readonly IS_EDITIONS = false; //是否为发布版本，用于数据上报 及 log输出控制
    public static readonly IS_TEACHER = true; //是否为教师端版本
    public static GAME_NAME = "24_l1sc_d3_01";
    public static readonly AUDIO_DIR = 'audios/';
    public static readonly PREFAB_PANEL_DIR = 'prefab/panel/';
    public static readonly GAME_AUDIO_DIR = 'res/audios/';
    public static readonly GAME_PREFAB_PANEL_DIR = "res/prefab/ui/panel/";
    public static readonly GAME_CORE_PREFAB_PANEL_DIR = "res/core/prefab/panel/";

    /**支持的帧率 */
    public static readonly SUPPORT_FPS = [15, 30, 60];
}

export enum PackageType {
    Main,
    Sub
}

export enum GameLoadErrType {
    MainGameLoadErr = 1,
    SubGameLoadErr,
    SeverAssetsLoadErr,
    OtherErr
}

/**
 * 分组管理
 * 碰撞规则 default-default  group1-group2 其他情况不产生碰撞
 */
export class NodeGroupType {
    public static readonly default = 'default';
    public static readonly group1 = 'group1';
    public static readonly group2 = 'group2';
}