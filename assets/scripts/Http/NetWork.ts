import { MainConstValue } from '../Data/MainConstValue';
import { AliLogMsgType } from '../Data/SDKMsgType';
import { SubGameParams } from '../Manager/GameBundleManager';
import { UIManager } from '../Manager/UIManager';
import GameMsg from '../SDK/GameMsg';
import { PopupTipsType } from '../UI/Panel/PopupTips';
import { UIHelp } from '../Utils/UIHelp';
export class NetWorkClass {
    private static instance: NetWorkClass;

    //判断是否是线上   URL里不加参数则默认为测试环境
    public readonly isOnlineEnv = this.GetIsOnline() == 'online';
    public readonly BASE = this.isOnlineEnv ? 'https://courseware-online.saasp.vdyoo.com' : 'https://ceshi-courseware-online.saasp.vdyoo.com';
    public readonly COS_URL = this.isOnlineEnv ?
        'https://classroom-api-online.saasp.vdyoo.com/micro-class/storage/v1/tencent/sts'
        : 'https://test-class-api-online.saasp.vdyoo.com/micro-class/storage/v1/tencent/sts';
    public readonly COS_BASE_URL = this.isOnlineEnv ? 'https://micro-class.xuepeiyou.com' : 'https://micro-class-test.xuepeiyou.com';
    public readonly GET_QUESTION = this.BASE + '/get';
    public readonly GET_USER_PROGRESS = this.BASE + '/get/answer';
    public readonly GET_TITLE = this.BASE + '/get/title';
    public readonly ADD = this.BASE + '/add';
    public readonly MODIFY = this.BASE + '/modify';
    public readonly CLEAR = this.BASE + '/clear';

    /**静态资源的地址--config和上传的资源 */
    public staticResUrl = null;

    public empty: boolean = false; //清理脏数据的开关，在URL里面拼此参数 = true；

    //新课堂参数
    public isSubGame: boolean = false;// 是否分包模式
    /**游戏帧率 */
    public gameFps = 30;
    /**从url里边获取游戏名 */
    public gameName = null;
    /**用户id */
    public userId = null;
    /**直播讲id */
    public chapterId = null;
    /**游戏id */
    public gameId = null;
    /**分校 */
    public belongCityId = null;
    /** 年级 */
    public gradeId = null;
    /**题目信息   用于交互游戏自身查题目信息 */
    public coursewareId = null;
    /**交互游戏绑定id   绑定的时候用（监课平台）  学生端不传 */
    public titleId = null;
    /**是否是直播 */
    public bLive = null;
    /** 运行环境（线上/测试）*/
    public env = null;
    public app = null; //App名称
    /**硬件平台信息（pc/iPad/android/androidPad/web） */
    public platform = null;
    /**使用方(辅导端、学生端、未来黑板、配齐、教研云、……） */
    public channel = null;
    /**浏览器信息（内核及版本） */
    public browser = null;
    /**端的版本信息 */
    public appVersion = null;
    /**是否为教师（通过同步的get_role返回的是否为'teacher'） */
    public isTeacher = false;
    /**是否为同步（通过同步的get_is_sync返回是否为1/true） */
    public isSync = false;
    /**是否为离线模式 */
    public isOffline = 0;
    /**是否是主动发心跳的一方 */
    public isMaster = null;
    /**是否支持接着玩重新玩   */
    public isSupportKeepPlay = false;
    /**
     * mccVersion: '2' //分包、新的开始游戏规则
     *  */
    public mccVersion = null; //mcc版本
    /**是否被授权 以此判断开始游戏页面是否展示 */
    public isAuthorization = false;
    /** 是否有静态资源*/
    public hasStaticAssets = null;

    public theRequest = null;

    public cacheXhr: XMLHttpRequest = null;

    public static getInstance() {
        if (this.instance == null) {
            this.instance = new NetWorkClass();
        }
        return this.instance;
    }

    public setIsSync(isSync: boolean) {
        isSync = isSync == null ? false : isSync;
        NetWork.isSync = isSync;
    }

    public setIsPreload(isPreload: boolean) {
        isPreload = isPreload == null ? false : isPreload;
        UIManager.isGameShowing = !isPreload;
    }

    public setIsSupportKeepPlay(isSupportKeepPlay: boolean) {
        NetWork.isSupportKeepPlay = isSupportKeepPlay;
        NetWork.isMaster = NetWork.isTeacher;
        console.log(`isSupportKeepPlay: ${isSupportKeepPlay}`);
    }

    /**
     * 请求网络Post 0成功 1超时
     * @param url
     * @param openType
     * @param contentType
     * @param callback
     * @param params
     */
    public httpRequest(url: string, openType, contentType, callback = null, params = '') {
        //------------------离线模式-------------------------
        if (this.isOffline && url.substring(0, this.GET_QUESTION.length) == this.GET_QUESTION) {
            GameMsg.recv_json_data((data) => {
                console.log('recv_json_data:', data);
                if (callback && data.jsonData.errcode == 0) {
                    callback(false, data.jsonData);
                } else {
                    UIHelp.showErrorPanel(
                        data.jsonData.errmsg + ',请联系客服！',
                        '',
                        '',
                    );
                }
            });
            GameMsg.request_json_data({ coursewareId: this.coursewareId });
            return;
        }

        if (MainConstValue.IS_TEACHER) {
            if (!this.titleId) {
                //教师端没有titleId的情况
                UIHelp.showErrorPanel('URL参数错误,缺少titleId', '请联系技术人员！', '');
                return;
            }
        } else {
            //新课堂学生端  判断所有参数
            if (
                !MainConstValue.IS_TEACHER && !CC_DEBUG &&
                (!this.userId || !this.coursewareId || !this.env || !this.app || !this.channel || !this.browser)
            ) {
                GameMsg.URLError(this.theRequest);
                UIHelp.showErrorPanel('URL参数错误', '请联系客服！', '');
                return;
            }
        }

        var xhr = new XMLHttpRequest();
        xhr.open(openType, url);
        xhr.timeout = 10000;
        xhr.setRequestHeader('Content-Type', contentType);
        xhr.withCredentials = true;
        this.cacheXhr = xhr;
        //回调
        xhr.onreadystatechange = () => {
            cc.log(
                'httpRequest rsp status',
                xhr.status,
                '        xhr.readyState',
                xhr.readyState,
                '        xhr.responseText',
                xhr.responseText,
            );
            if (xhr.readyState == 4 && xhr.status >= 200 && xhr.status <= 400) {
                this.cacheXhr = null;
                let response = JSON.parse(xhr.responseText);
                if (callback && response.errcode == 0) {
                    callback(false, response);
                } else {
                    GameMsg.httpError(response.errmsg);
                    UIHelp.showErrorPanel(
                        response.errmsg,
                    );
                }
            }
        };

        //超时回调
        xhr.ontimeout = (event) => {
            GameMsg.httpTimeOut('网络不佳，请稍后重试');
            xhr.abort();
            this.cacheXhr = null;
            UIHelp.showErrorPanel(
                '网络不佳，请稍后重试'
            );
            console.log('httpRequest timeout');
            callback && callback(true, null);
        };

        //出错
        xhr.onerror = (error) => {
            this.cacheXhr = null;
            UIHelp.showErrorPanel(
                '网络出错，请稍后重试'
            );
            console.log('httpRequest error');
            callback && callback(true, null);
        };

        xhr.send(params);
    }


    /**
     * 获取静态资源根地址
     * @param callBack
     * @param callUrl
     */
    public getStaticResUrl(callBack: Function = null) {
        if (!NetWork.hasStaticAssets) {
            GameMsg.reportAliLog(AliLogMsgType.staticAssetsLoad, { msg: "没有离线资源地址"});
            NetWork.staticResUrl = null;
            callBack && callBack(null);
            return;
        }
        if (NetWork.staticResUrl && NetWork.staticResUrl != '') {
            callBack && callBack(NetWork.staticResUrl);
            return;
        }
        GameMsg.reportAliLog(AliLogMsgType.staticAssetsLoad, { msg: "开始获取离线资源地址"});
        GameMsg.recv_static_res_url((data: any) => {
            if (data && data.data && data.data != '') {
                NetWork.staticResUrl = data.data;
                GameMsg.reportAliLog(AliLogMsgType.staticAssetsLoad, { msg: "离线资源地址获取成功", staticResUrl: NetWork.staticResUrl });
                callBack && callBack(NetWork.staticResUrl);
            } else {
                GameMsg.reportAliLog(AliLogMsgType.staticAssetsLoad, { msg: "离线资源地址获取失败"});
                NetWork.staticResUrl = null;
                callBack && callBack(null);
            }
        });
        GameMsg.request_static_res_url();
    }

    /**
     * 获取url参数
     */
    public setNetWorkData() {
        if (!this.theRequest) {
            this.theRequest = new Object();
        }
        let url = location.search; //获取url中"?"符后的字串
        if (url.indexOf('?') != -1) {
            var str = url.substring(1);
            var strs = str.split('&');
            for (var i = 0; i < strs.length; i++) {
                this.theRequest[strs[i].split('=')[0]] = decodeURIComponent(strs[i].split('=')[1]);
            }
        }
        //新课堂url必需参数
        this.isSubGame = this.theRequest['isSubGame'] == "1" ? true : false;
        this.gameFps = parseInt(this.theRequest['gameFps'] || 30);
        if (MainConstValue.SUPPORT_FPS.indexOf(this.gameFps) < 0) {
            this.gameFps = 30;
        }
        this.userId = this.theRequest['userId'];
        this.chapterId = this.theRequest['chapterId'];
        this.gameId = this.theRequest['gameId'];
        this.belongCityId = this.theRequest['belongCityId'];
        this.gradeId = this.theRequest['gradeId'];
        this.coursewareId = this.theRequest['coursewareId'];
        this.titleId = this.theRequest['titleId'];
        this.hasStaticAssets = this.theRequest['hasStaticAssets'] == "1" ? true : false;
        this.bLive = this.theRequest['bLive'];
        this.env = this.theRequest['env'];
        this.app = this.theRequest['app'];
        this.platform = this.theRequest['platform'];
        this.channel = this.theRequest['channel'];
        this.browser = this.theRequest['browser'];
        this.appVersion = this.theRequest['appVersion'];
        this.empty = this.theRequest['empty'];
        this.isOffline = parseInt(this.theRequest['isOffline']); //离线模式
        this.isTeacher = this.theRequest['role'] == 'teacher';
        this.mccVersion = parseInt(this.theRequest['mccVersion'] || 1);
        let s = this.theRequest['isSync'];
        this.isSync = '1' == s || 'true' == s;

        s = this.theRequest['supportKeepAndRestart'];
        this.isSupportKeepPlay = '1' == s || 'true' == s;

        s = this.theRequest['isPreload'];
        let isPreload = '1' == s || 'true' == s;
        UIManager.isGameShowing = !isPreload;

        return this.theRequest;
    }

    /**切换子包刷新数据 */
    public refreshNetWorkData(params: SubGameParams) {
        this.setCoursewareId(params.coursewareId);
        this.isSync = params.isSync;
        this.gameId = params.gameId || this.gameId;
        this.setIsSupportKeepPlay(params.supportKeepAndRestart);
    }

    public setCoursewareId(coursewareId: string) {
        this.coursewareId = coursewareId;
    }

    public GetIsOnline() {
        this.setNetWorkData();
        let isOnline = 'test';
        if (this.env) {
            isOnline = this.env;
        }
        return isOnline;
    }


    //判断mcc版本是否大于2
    public isMCCVersion2() {
        return this.mccVersion && this.mccVersion >= 2;
    }

    public async checkRemoteFileExists(url: string, callBack:Function = null) {
        return new Promise((resolve, reject) => {
            const xhr = cc.loader.getXMLHttpRequest();
            xhr.timeout = 3000;
            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    const statusList = [0, 200, 204, 206];
                    // 状态码为 200 或 206 表示资源存在
                    if (statusList.indexOf(xhr.status) >= 0) {
                        callBack && callBack(true);
                        return resolve(true);
                    } else {
                        callBack && callBack(false, xhr.status);
                        return reject();
                    }
                }
            };
            xhr.open('HEAD', url, true);
            xhr.send();
            xhr.onerror = () => {
                callBack && callBack(false);
                return reject();
            }
            xhr.ontimeout = () => {
                callBack && callBack(false);
                return reject();
            }
        })
    }

    /**
     * 检测配置文件大小，过大不允许保存
     * 服务端最大65535字节
     * @param editorData 
     * @param coursewareKey 
     * @param callBack 
     * @returns 
     */
    public checkJsonLength(editorData: any, coursewareKey: string, callBack: Function = null) {
        let jsonString = JSON.stringify({
            CoursewareKey: coursewareKey,
            data: editorData
        });
        const byteCount = new TextEncoder().encode(jsonString).length;
        if (byteCount > 65535) {
            UIHelp.showPopupTips(PopupTipsType.OnlyConfirm, "数据量过大，请删除几个关卡再提交", () => {
                callBack && callBack();
            });
            return null;
        } else {
            return jsonString;
        }
    }
}

export const NetWork = NetWorkClass.getInstance();
