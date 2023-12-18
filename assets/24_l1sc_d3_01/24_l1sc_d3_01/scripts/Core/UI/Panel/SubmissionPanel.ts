import { NetWork } from '../../../../../../scripts/Http/NetWork';
import { UIHelp } from '../../../../../../scripts/Utils/UIHelp';
import { BaseUI } from '../../../../../../scripts/UI/BaseUI';
import { SubUIHelp } from '../../Utils/SubUIHelp';
import { ConstValue } from '../../../Data/ConstValue';
import { EditorManager } from '../../../Manager/EditorManager';
import { MainConstValue } from '../../../../../../scripts/Data/MainConstValue';
import BaseSubUI from '../../../../../../scripts/UI/BaseSubUI';
import { CosManager } from '../../../../../../scripts/Manager/CosManager';

const { ccclass, property } = cc._decorator;

@ccclass
export default class SubmissionPanel_24_l1sc_d3_01 extends BaseSubUI {
    public static className = 'SubmissionPanel_24_l1sc_d3_01';
    public static isCommonPanel = true;
    start() { }

    onQueDingBtnClick(event) {
        this.DetectionNet();
    }

    onQuXiaoBtnClick(event) {
        SubUIHelp.closeSubmissionPanel();
    }

    //提交或者修改答案
    DetectionNet() {
        if (!NetWork.titleId) {
            UIHelp.showErrorPanel('titleId为空, titleId=' + NetWork.titleId, '请联系技术老师解决！', '');
            return;
        }
        if (CosManager.upLoadFileMap.size > 0) {
            EditorManager.setUpLoadFilesData(CosManager.getFilesData());
            this.saveNet();
        } else {
            this.saveNet();
        }
    }

    saveNet() {
        let data = NetWork.checkJsonLength(EditorManager.getData(), ConstValue.CoursewareKey, () => {
            SubUIHelp.closeSubmissionPanel();
        });
        data = JSON.stringify({
            CoursewareKey: ConstValue.CoursewareKey,
            data: EditorManager.getData()
        });
        NetWork.httpRequest(
            NetWork.GET_TITLE + '?title_id=' + NetWork.titleId,
            'GET',
            'application/json;charset=utf-8',
            (err, response) => {
                if (!err) {
                    if (response.data.courseware_content == null || response.data.courseware_content == '') {
                        this.AddNet(data);
                    } else {
                        NetWork.coursewareId = response.data.courseware_id;
                        let res = JSON.parse(response.data.courseware_content);
                        if (!NetWork.empty) {
                            if (res.CoursewareKey == ConstValue.CoursewareKey) {
                                this.ModifyNet(data);
                            } else {
                                UIHelp.showErrorPanel(
                                    '该titleId已被使用, titleId=' + NetWork.titleId,
                                    '请联系技术老师解决！',
                                    '',
                                );
                            }
                        }
                    }
                }
            },
            null,
        );
    }

    //添加答案信息
    AddNet(gameDataJson) {
        let data = {
            title_id: NetWork.titleId,
            courseware_content: gameDataJson,
            is_result: 1,
            is_lavel: 1,
            lavel_num: EditorManager.getLevelCount(),
        };
        NetWork.httpRequest(
            NetWork.ADD,
            'POST',
            'application/json;charset=utf-8',
            (err, response) => {
                if (!err) {
                    UIHelp.showTip('答案提交成功');
                    SubUIHelp.closeSubmissionPanel();
                }
            },
            JSON.stringify(data),
        );
    }

    //修改课件
    ModifyNet(gameDataJson) {
        let jsonData = {
            courseware_id: NetWork.coursewareId,
            courseware_content: gameDataJson,
            is_result: 1,
            is_lavel: 1,
            lavel_num: EditorManager.getLevelCount(),
        };
        NetWork.httpRequest(
            NetWork.MODIFY,
            'POST',
            'application/json;charset=utf-8',
            (err, response) => {
                if (!err) {
                    UIHelp.showTip('答案修改成功');
                    SubUIHelp.closeSubmissionPanel();
                }
            },
            JSON.stringify(jsonData),
        );
    }
}