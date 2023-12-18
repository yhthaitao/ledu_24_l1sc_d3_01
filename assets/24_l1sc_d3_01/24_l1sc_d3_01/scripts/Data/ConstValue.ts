export class ConstValue {
    /** --------------------------游戏通用配置---------------------------------- */
    public static readonly SubGameVer = "1.0.0"; //子包的版本 每次打包自增
    public static readonly CoursewareKey = '24_l1sc_d3_01_4jdEJchDbJcGDT'; //每个课件唯一的key 工程名+14位随机字符串。（脚本创建工程时自动生成）
    public static readonly GameName = '原来如此_24l1sc'; //游戏名中文描述，用于数据上报  （脚本创建工程时输入）
    public static readonly Subject = 1; //学科（1理科 2语文 3英语）
    public static readonly CancelMcc2sDetection = false; //是否关闭mcc2秒检测，对于游戏全程同步频率过高的游戏，可以选择关闭

    /** --------------------------编辑器默认选项是否展示---------------------------------- */
    public static readonly Editor_CanShowStars = false;//是否展示星级评判开关
    public static readonly Editor_CanShowGuide = true;//是否展示引导开关
    public static readonly Editor_CanShowAutoPlayTitle = false;//是否展示自动播放标题音效开关
    public static readonly Editor_CanShowBgmToggle = true;//是否展示播放背景音乐选项

    /**--------------------------游戏业务逻辑通用配置------------------------------ */
    public static readonly NOT_SHOW_OVER_PANEL = false;//不展示结算
    public static readonly USE_COMMON_START_PANEL = true;//使用通用开始页
    //特殊的声音需求，如：背景音乐和音效分开控制 true为分开控制 false为统一控制  true的时候仅背景音乐绑定授权关系
    public static readonly USE_SPECIAL_SOUND = false;
    /** --------------------------游戏独有业务数据---------------------------------- */

}
