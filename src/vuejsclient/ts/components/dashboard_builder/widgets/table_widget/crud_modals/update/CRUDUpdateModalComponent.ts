import { Component, Prop } from 'vue-property-decorator';
import IDistantVOBase from '../../../../../../../../shared/modules/IDistantVOBase';
import CRUDUpdateFormComponent from '../../../../../crud/component/update/CRUDUpdateFormComponent';
import CRUDComponentManager from '../../../../../crud/CRUDComponentManager';
import VueComponentBase from '../../../../../VueComponentBase';
import "./CRUDUpdateModalComponent.scss";

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

    private onclose_callback: () => Promise<void> = null;

    public async open_modal(
        vo: IDistantVOBase,
        onclose_callback: () => Promise<void>,
        show_insert_or_update_target: boolean = true,
    ) {
        let crud = CRUDComponentManager.getInstance().cruds_by_api_type_id[vo._type];
        this.api_type_id = vo._type;

        this.show_insert_or_update_target = show_insert_or_update_target;

        if (crud) {
            crud.updateDatatable.refresh();
            (this.$refs['Crudupdateformcomponent'] as CRUDUpdateFormComponent).update_key();
        }

        if (crud && crud.callback_handle_modal_show_hide) {
            await crud.callback_handle_modal_show_hide(vo, 'update');
        }

        this.vo = vo;
        this.onclose_callback = onclose_callback;

        this.$nextTick(() => {
            $('#crud_update_modal_' + this.api_type_id).modal('show');

            if (!this.on_hidden_initialized) {
                this.on_hidden_initialized = true;
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

        let crud = CRUDComponentManager.getInstance().cruds_by_api_type_id[this.vo ? this.vo._type : null];
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
}