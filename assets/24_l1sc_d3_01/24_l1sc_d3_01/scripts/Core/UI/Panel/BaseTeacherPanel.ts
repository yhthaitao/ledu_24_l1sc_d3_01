import { NetWork } from '../../../../../../scripts/Http/NetWork';
import { ConstValue } from '../../../Data/ConstValue';
import BaseSubUI from '../../../../../../scripts/UI/BaseSubUI';
import { EditorManager } from '../../../Manager/EditorManager';
import { CosManager } from '../../../../../../scripts/Manager/CosManager';
import { UIHelp } from '../../../../../../scripts/Utils/UIHelp';
import { GameBundleManager } from '../../../../../../scripts/Manager/GameBundleManager';

const { ccclass, property } = cc._decorator;

@ccclass
export default class BaseTeacherPanel_24_l1sc_d3_01 extends BaseSubUI {
    public static className = 'BaseTeacherPanel_24_l1sc_d3_01';
    public static isCommonPanel = true;
    onLoad() {}

    start() {
        this.getNet();
        UIHelp.closeRecoverMask();
    }

    public setPanel() {}

    private getNet() {
        NetWork.httpRequest(
            NetWork.GET_TITLE + '?title_id=' + NetWork.titleId,
            'GET',
            'application/json;charset=utf-8',
            (err, response) => {
                console.log('消息返回' + response);
                if (!err) {
                    let res = response;
                    if (Array.isArray(res.data)) {
                        GameBundleManager.gameEditorData = {data: EditorManager.editorData};
                        CosManager.opPanel(EditorManager.editorData, ()=>{this.setPanel();})
                        return;
                    }
                    let content = JSON.parse(res.data.courseware_content);
                    NetWork.coursewareId = res.data.courseware_id;
                    if (NetWork.empty) {
                        //如果URL里面带了empty参数 并且为true  就立刻清除数据
                        this.ClearNet();
                    } else {
                        if (content != null) {
                            if (content.CoursewareKey != ConstValue.CoursewareKey) {
                                UIHelp.showErrorPanel(
                                    '该titleId已被使用, titleId=' + NetWork.titleId,
                                    '请联系技术老师解决！',
                                    '',
                                );
                                return;
                            }
                            GameBundleManager.gameEditorData = content;
                            // 如果编辑器数据修改 先注释掉此行
                            EditorManager.setData(content.data)
                            CosManager.opPanel(content.data, ()=>{this.setPanel();})
                        } else {
                            GameBundleManager.gameEditorData = {data: EditorManager.editorData};
                            CosManager.opPanel(EditorManager.editorData, ()=>{this.setPanel();})
                        }
                    }
                }
            },
            null,
        );
    }

    //删除课件数据  一般为脏数据清理
    ClearNet() {
        let jsonData = { courseware_id: NetWork.coursewareId };
        NetWork.httpRequest(
            NetWork.CLEAR,
            'POST',
            'application/json;charset=utf-8',
            (err, response) => {
                if (!err) {
                    UIHelp.showTip('答案删除成功');
                }
            },
            JSON.stringify(jsonData),
        );
    }
    // update (dt) {}
}
