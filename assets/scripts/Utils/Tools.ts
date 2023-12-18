// Learn TypeScript:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/typescript.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html

import { NetWork } from "../Http/NetWork";

/**美术提供的位移动画参数 */
export class ArtMoveParam {
    /**时刻，ms */
    time: number = 0;
    /**位置 */
    pos: cc.Vec3 = cc.Vec3.ZERO;

    /**
     * @param t 时刻，ms
     * @param p 位置
     */
    constructor(t: number, p: cc.Vec3) {
        this.time = t;
        this.pos = p;
    }
}

export class Tools {
    /**
     * 播放spine动画
     * @param {*} sp_Skeleton 动画文件
     * @param {*} animName 动作名称
     * @param {*} loop 是否循环
     * @param {*} callback 播放完毕回调
     */
    public static playSpine(sp_Skeleton: sp.Skeleton, animName: string, loop: boolean, callback: Function = null) {
        // sp_Skeleton.premultipliedAlpha=false;//这样设置在cocos creator中才能有半透明效果

        // let spine = this.node.getComponent(sp.Skeleton);
        let track = sp_Skeleton.setAnimation(0, animName, loop);
        if (track) {
            // 注册动画的结束回调
            sp_Skeleton.setCompleteListener((trackEntry, loopCount) => {
                let name = trackEntry.animation ? trackEntry.animation.name : '';
                if (name === animName && callback) {
                    callback(); // 动画结束后执行自己的逻辑
                }
            });
        }
    }

    //参数获取
    public static getQueryVariable(variable: string) {
        var query = window.location.href;
        var vars = query.split('?');
        if (vars.length < 2) return false;
        var vars = vars[1].split('&');

        for (var i = 0; i < vars.length; i++) {
            var pair = vars[i].split('=');
            if (pair[0] == variable) {
                return pair[1];
            }
        }
        return false;
    }

    /**
     * 使节点直接运行美术提供的位移动画参数，
     * (节点当前位置对应美术参数列表最后一个参数位置，
     * 函数内部会做相对位置的处理)
     * @param node
     * @param params
     * @param endCbk
     */
    public static runArtMoveSequence(node: cc.Node, params: Array<ArtMoveParam>, endCbk: Function = null) {
        let nodeOriPos = node.position;
        //节点实际坐标与美术参数坐标的差
        let gapPos = nodeOriPos.sub(params[params.length - 1].pos);
        function transArtPosToNodePos(artPos: cc.Vec3) {
            return artPos.add(gapPos);
        }
        node.setPosition(transArtPosToNodePos(params[0].pos));

        if (params.length <= 1) {
            if (endCbk) endCbk();
            return;
        }

        let actArray: Array<cc.FiniteTimeAction> = [];
        for (let i = 1; i < params.length - 1; i++) {
            let duration = (params[i].time - params[i - 1].time) * 0.001;
            let p = transArtPosToNodePos(params[i].pos);
            actArray.push(cc.moveTo(duration, cc.v2(p.x, p.y)));
        }
        if (endCbk) {
            actArray.push(cc.callFunc(endCbk));
        }

        node.runAction(cc.sequence(actArray));
    }

    /**获取当前时间戳，毫秒 */
    public static getNowTimeMS() {
        return new Date().getTime();
    }

    /**获取当前时间戳，秒 */
    public static getNowTimeS() {
        return Math.floor(new Date().getTime() * 0.001);
    }

    /**
     * 格式化时间， eg: 100 ->  '01:40'
     * @param time 时长，秒
     */
    public static getFormatTime(time: number) {
        let min: any = Math.floor(time / 60);
        if (min < 10) {
            min = '0' + min;
        }
        let sec: any = time % 60;
        if (sec < 10) {
            sec = '0' + sec;
        }
        return min + ':' + sec;
    }

    public static removeDuplicate(str1: string, str2: string): string {
        const index = str1.lastIndexOf(str2);
        return index !== -1 ? str1.substring(0, index) : str1;
    }

    /**
     * 
     * @param url1 
     * @param url2 
     * @returns 替换url的域名为url2
     */
    public static replaceCosUrl(oldUrl: string, newDomain: string) {
        const oldDomain = oldUrl.replace(/^https?:\/\/([^/]+).*/, '$1'); // 从原始 URL 中提取域名
        const newUrl = oldUrl.replace(new RegExp(`^https?:\\/\\/${oldDomain}`, 'i'), `${newDomain}`);
        console.log(newUrl);
        return newUrl;
    }

    //生成随机字符串
    public static randomString(len = 14) {
        const baseStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefjhijklmnopqrstuvwxyz1234567890";
        let str = '';
        for (let i = 0; i < len; ++i) {
            str += baseStr.charAt(Math.floor(Math.random() * baseStr.length));
        }
        return str
    }

    public static deepCopy<T>(obj: T): T {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        if (Array.isArray(obj)) {
            return obj.map(Tools.deepCopy) as T;
        }
        const result = {} as T;
        for (const [key, value] of Object.entries(obj)) {
            result[key] = Tools.deepCopy(value);
        }
        return result;
    }

    public static deepCopyMap(originalMap: Map<any, any>) {
        const newMap = new Map();

        originalMap.forEach((value, key) => {
            // 深拷贝键和值
            const copiedKey = this.deepCopy(key);
            const copiedValue = value instanceof Map ? this.deepCopyMap(value) : this.deepCopy(value);

            // 将拷贝后的键值对添加到新的 Map 对象中
            newMap.set(copiedKey, copiedValue);
        });

        return newMap;
    }

    public static arraysEqual<T>(a: T[], b: T[]): boolean {
        if (a === b) return true;
        if (a == null || b == null) return false;
        if (a.length !== b.length) return false;

        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false;
        }

        return true;
    }

    //获取矫正后的类名
    public static getFixedClassName(className: string) {
        //如果是打包环境，给类名后面加上'_'+包名
        if (!CC_DEBUG) {
            className += '_' + NetWork.gameName;
        }
        return className;
    }

    /**
    * 绝对获取节点上的组件，如果不存在就添加一个
    * @param node 
    * @param type 
    */
    public static getComponentAbsolutely<T extends cc.Component>(node: cc.Node, type: { prototype: T }) {
        let comp = node.getComponent(type)
        if (!comp) {
            comp = node.addComponent(type as any)
        }
        return comp as T
    }
}
