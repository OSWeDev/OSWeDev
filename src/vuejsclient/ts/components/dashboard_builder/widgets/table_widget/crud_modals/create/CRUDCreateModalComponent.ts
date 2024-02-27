import { Component } from 'vue-property-decorator';
import IDistantVOBase from '../../../../../../../../shared/modules/IDistantVOBase';
import CRUDCreateFormComponent from '../../../../../crud/component/create/CRUDCreateFormComponent';
import CRUDComponentManager from '../../../../../crud/CRUDComponentManager';
import VueComponentBase from '../../../../../VueComponentBase';
import "./CRUDCreateModalComponent.scss";

@Component({
    template: require('./CRUDCreateModalComponent.pug'),
    components: {
        Crudcreateformcomponent: CRUDCreateFormComponent
    },
})
export default class CRUDCreateModalComponent extends VueComponentBase {

    private api_type_id: string = null;
    private on_hidden_initialized: boolean = false;
    private vo_init: IDistantVOBase = null;
    private show_insert_or_update_target: boolean = true;

    private onclose_callback: () => Promise<void> = null;

    public async open_modal(
        api_type_id: string,
        onclose_callback: () => Promise<void>,
        vo_init: IDistantVOBase = null,
        show_insert_or_update_target: boolean = true,
    ) {
        this.api_type_id = api_type_id;
        this.show_insert_or_update_target = show_insert_or_update_target;

        const crud = CRUDComponentManager.getInstance().cruds_by_api_type_id[this.api_type_id];

        if (crud) {
            crud.createDatatable.refresh();
            await (this.$refs['Crudcreateformcomponent'] as CRUDCreateFormComponent).update_key(true);
        }

        if (crud && crud.callback_handle_modal_show_hide) {
            await crud.callback_handle_modal_show_hide(vo_init, 'create');
        }

        this.onclose_callback = onclose_callback;

        this.vo_init = vo_init;

        this.$nextTick(() => {
            $('#crud_create_modal_' + this.api_type_id).modal('show');

            if (!this.on_hidden_initialized) {
                this.on_hidden_initialized = true;
                $('#crud_create_modal_' + this.api_type_id).on("hidden.bs.modal", async () => {
                    if (this.onclose_callback) {
                        await this.onclose_callback();
                    }
                });
            }
        });
    }

    private async close_modal() {
        $('#crud_create_modal_' + this.api_type_id).modal('hide');
        const crud = CRUDComponentManager.getInstance().cruds_by_api_type_id[this.api_type_id];
        if (crud) {
            crud.createDatatable.refresh();
            await (this.$refs['Crudcreateformcomponent'] as CRUDCreateFormComponent).update_key(true);
        }
        if (crud && crud.callback_handle_modal_show_hide) {
            await crud.callback_handle_modal_show_hide(null, 'create');
        }

        if (this.onclose_callback) {
            await this.onclose_callback();
        }
    }
}