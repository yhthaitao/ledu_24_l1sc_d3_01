import { MainConstValue } from '../Data/MainConstValue';
import { ListenerManager } from '../Manager/ListenerManager';
import BindNode from './BindNode';

export interface OpenUIData {
    resPath: string;
    className: string;
    bundlePath?: string;
    bundleName?: string
    /** 主包页面关闭不销毁 */
    isMainPanel?: boolean;
}

const { ccclass, property } = cc._decorator;
@ccclass
export abstract class BaseUI extends BindNode {
    public static className = 'BaseUI';
    protected mData: any;
    public openUIData: OpenUIData = null;
    public get data(): any {
        return this.mData;
    }

    public set data(value: any) {
        this.mData = value;
    }
    protected mTag: any;
    public get tag(): any {
        return this.mTag;
    }
    public set tag(value: any) {
        this.mTag = value;
    }

    public static get resPath(): string {
        cc.log(this.className);
        return MainConstValue.PREFAB_PANEL_DIR + this.className;
    }

    onDestroy(): void {
        ListenerManager.removeAll(this);
    }

    onShow() {
        cc.log('BaseUI onShow');
    }
}
