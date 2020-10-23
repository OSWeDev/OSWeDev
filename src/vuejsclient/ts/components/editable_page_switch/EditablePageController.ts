import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import VueAppBase from '../../../VueAppBase';
import EditablePageEditInfo from './EditablePageEditInfo';

let debounce = require('lodash/debounce');

export default class EditablePageController {
    public static getInstance(): EditablePageController {
        if (!EditablePageController.instance) {
            EditablePageController.instance = new EditablePageController();
        }
        return EditablePageController.instance;
    }

    private static instance: EditablePageController;

    public debounce_timer: number = 5000;

    private semaphore_saving: boolean = false;

    private edit_infos_waiting_for_save: EditablePageEditInfo[] = [];
    private edit_infos_waiting_for_next_save: EditablePageEditInfo[] = [];

    private debounced_save_edit_infos = debounce(this.save_edit_infos, this.debounce_timer);

    public pushEditInfoToSave(edit_info: EditablePageEditInfo) {

        if (this.semaphore_saving) {
            this.pushEditInfo(edit_info, this.edit_infos_waiting_for_next_save);
            return;
        }

        this.pushEditInfo(edit_info, this.edit_infos_waiting_for_save);

        this.debounced_save_edit_infos();
    }

    private pushEditInfo(edit_info: EditablePageEditInfo, list: EditablePageEditInfo[]) {

        if ((!edit_info.vo) || (!edit_info.vo._type)) {
            return;
        }
        if ((!!edit_info.field) && (!edit_info.vo.id)) {
            ConsoleHandler.getInstance().error('On ne peut pas éditer le field d\'un vo qui n\'est pas en base');
            return;
        }

        for (let i in list) {
            let e = list[i];

            if ((edit_info.UID == e.UID) || ((!!edit_info.vo.id) && (e.vo.id == edit_info.vo.id) && (e.vo._type == edit_info.vo._type))) {

                if ((!edit_info.field) && (!e.field)) {
                    e.vo = edit_info.vo;
                    return;
                }

                if (!edit_info.field) {
                    continue;
                }

                if (!e.field) {
                    continue;
                }

                if (e.field.module_table_field_id == edit_info.field.module_table_field_id) {
                    e.field_value = edit_info.field_value;
                    return;
                }
            }
        }
        list.push(edit_info);
    }

    private async save_edit_infos() {

        this.semaphore_saving = true;

        VueAppBase.getInstance().vueInstance.snotify.info(VueAppBase.getInstance().vueInstance.label('EditablePageController.save.start'));

        let has_errors: boolean = false;
        for (let i in this.edit_infos_waiting_for_save) {
            let edit_info: EditablePageEditInfo = this.edit_infos_waiting_for_save[i];

            let edit_info_result: boolean = true;

            if (!!edit_info.field) {

                let tmp = edit_info.vo ? edit_info.vo[edit_info.field.module_table_field_id] : null;
                try {

                    // VarsController.getInstance().stageUpdateVoUpdate(edit_info.vo, null);

                    edit_info.vo[edit_info.field.module_table_field_id] = edit_info.field_value;

                    let res: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(edit_info.vo);

                    if ((!!res) && (!!res.id)) {
                        edit_info.vo.id = parseInt(res.id.toString());
                        // VarsController.getInstance().stageUpdateVoUpdate(null, edit_info.vo);
                    }
                } catch (error) {
                    ConsoleHandler.getInstance().error(error);
                    edit_info_result = false;

                    if (!!edit_info.vo) {
                        edit_info.vo[edit_info.field.module_table_field_id] = tmp;
                    }
                }
            } else {

                try {
                    let res: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(edit_info.vo);

                    if ((!!res) && (!!res.id)) {
                        edit_info.vo.id = parseInt(res.id.toString());
                        // VarsController.getInstance().stageUpdateVoUpdate(null, edit_info.vo);
                    }
                } catch (error) {
                    ConsoleHandler.getInstance().error(error);
                    edit_info_result = false;
                }
            }

            if (!edit_info_result) {
                has_errors = true;
            }

            if (!!edit_info.callback) {
                await edit_info.callback(edit_info, edit_info_result);
            }
        }

        if (has_errors) {
            // ATTENTION, on affiche pas bien ce qui est enregistré ou pas, il faut améliorer le principe
            VueAppBase.getInstance().vueInstance.snotify.error(VueAppBase.getInstance().vueInstance.label('EditablePageController.save.error'));
        } else {
            VueAppBase.getInstance().vueInstance.snotify.success(VueAppBase.getInstance().vueInstance.label('EditablePageController.save.success'));
        }

        this.edit_infos_waiting_for_save = this.edit_infos_waiting_for_next_save;
        this.edit_infos_waiting_for_next_save = [];

        this.semaphore_saving = false;

        if ((!!this.edit_infos_waiting_for_save) && (this.edit_infos_waiting_for_save.length)) {
            this.debounced_save_edit_infos();
        }
    }
}