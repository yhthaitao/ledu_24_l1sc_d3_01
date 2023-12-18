import { MainConstValue } from '../Data/MainConstValue';
import { BaseUI, OpenUIData } from './BaseUI';

const { ccclass, property } = cc._decorator;

@ccclass
export default class BaseMainUI extends BaseUI {
    public static isMainPanel: boolean = true;
    public static get resPath(): string {
        cc.log(this.className);
        return MainConstValue.PREFAB_PANEL_DIR + this.className;
    }
}
