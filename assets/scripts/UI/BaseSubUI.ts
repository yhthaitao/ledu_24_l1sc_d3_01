import { MainConstValue } from '../Data/MainConstValue';
import { NetWork } from '../Http/NetWork';
import { Tools } from '../Utils/Tools';
import { BaseUI, OpenUIData } from './BaseUI';

const { ccclass, property } = cc._decorator;

@ccclass
export default class BaseSubUI extends BaseUI {
    public static isSubPanel: boolean = true;
    public static get resPath(): string {
        let prefabName = Tools.removeDuplicate(this.className, "_" + NetWork.gameName);
        if (this["isCommonPanel"]) {
            cc.log(this.className);
            return MainConstValue.GAME_CORE_PREFAB_PANEL_DIR + prefabName;
        } else {
            cc.log(this.className);
            return MainConstValue.GAME_PREFAB_PANEL_DIR + prefabName;
        }
    }
}
