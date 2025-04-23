import { Component } from 'vue-property-decorator';
import IDistantVOBase from '../../../../../../../../shared/modules/IDistantVOBase';
import CRUDUpdateFormComponent from '../../../../../crud/component/update/CRUDUpdateFormComponent';
import CRUDComponentManager from '../../../../../crud/CRUDComponentManager';
import VueComponentBase from '../../../../../VueComponentBase';
import "./CRUDUpdateModalComponent.scss";
import CRUDFormServices from '../../../../../crud/component/CRUDFormServices';

@Component({
    template: require('./CRUDUpdateModalComponent.pug'),
    components: {
        Crudupdateformcomponent: CRUDUpdateFormComponent
    },
})
export default class CRUDUpdateModalComponent extends VueComponentBase {

    private api_type_id: string = null;
    private vo: IDistantVOBase = null;

    private on_hidden_initialized: boolean = false;
    private show_insert_or_update_target: boolean = false;
    private show_delete_button: boolean = false;

    private onclose_callback: () => Promise<void> = null;
    private vo_update_callback: (vo: IDistantVOBase) => Promise<void> = null;

    private callback_handle_modal_show_hide: (vo: IDistantVOBase, modal_type: string) => Promise<void> = null;

    public async open_modal(
        vo: IDistantVOBase,
        storeDatas: (infos: { API_TYPE_ID: string, vos: IDistantVOBase[] }) => void,
        onclose_callback: () => Promise<void>,
        show_insert_or_update_target: boolean = true,
        show_delete_button: boolean = false,
        vo_update_callback: (vo_cb: IDistantVOBase) => Promise<void> = null,
    ) {
        const crud = CRUDComponentManager.getInstance().cruds_by_api_type_id[vo._type];
        this.api_type_id = vo._type;
        const self = this;

        this.show_insert_or_update_target = show_insert_or_update_target;
        this.show_delete_button = show_delete_button;

        if (crud) {
            crud.updateDatatable.refresh();
            (this.$refs['Crudupdateformcomponent'] as CRUDUpdateFormComponent).update_key();
        }

        if (crud && crud.callback_handle_modal_show_hide) {
            await CRUDFormServices.load_datas(
                crud,
                storeDatas,
            );
            await crud.callback_handle_modal_show_hide(vo, 'update');
        }

        this.vo = vo;
        this.onclose_callback = onclose_callback;
        this.vo_update_callback = vo_update_callback;

        this.$nextTick(() => {
            $('#crud_update_modal_' + this.api_type_id).modal('show');

            if (!this.on_hidden_initialized) {
                this.on_hidden_initialized = true;
                $('#crud_update_modal_' + this.api_type_id).on("hide.bs.modal", function (e) {
                    if (!(self.$refs['Crudupdateformcomponent'] as CRUDUpdateFormComponent).vo_is_equal_for_prevent()) {
                        e.preventDefault();
                        e.stopImmediatePropagation();
                        (self.$refs['Crudupdateformcomponent'] as CRUDUpdateFormComponent).cancel();
                        return false;
                    }
                });
                $('#crud_update_modal_' + this.api_type_id).on("hidden.bs.modal", async () => {
                    if (this.onclose_callback) {
                        await this.onclose_callback();
                    }
                });
            }
        });
    }

    private async close_modal() {
        $('#crud_update_modal_' + this.api_type_id).modal('hide');

        const crud = CRUDComponentManager.getInstance().cruds_by_api_type_id[this.vo ? this.vo._type : null];
        if (crud) {
            crud.updateDatatable.refresh();
            (this.$refs['Crudupdateformcomponent'] as CRUDUpdateFormComponent).update_key();
        }
        if (crud && crud.callback_handle_modal_show_hide) {
            await crud.callback_handle_modal_show_hide(this.vo, 'update');
        }

        if (this.onclose_callback) {
            await this.onclose_callback();
        }
    }

    private async vo_update(vo: IDistantVOBase) {
        if (this.vo_update_callback) {
            await this.vo_update_callback(vo);
        }
    }
}