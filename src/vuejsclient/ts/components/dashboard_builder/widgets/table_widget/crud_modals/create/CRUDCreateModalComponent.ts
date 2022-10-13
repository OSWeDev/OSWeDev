import { Component, Prop } from 'vue-property-decorator';
import CRUD from '../../../../../../../../shared/modules/DAO/vos/CRUD';
import CRUDHandler from '../../../../../../../../shared/tools/CRUDHandler';
import CRUDCreateFormComponent from '../../../../../crud/component/create/CRUDCreateFormComponent';
import CRUDComponentManager from '../../../../../crud/CRUDComponentManager';
import VueComponentBase from '../../../../../VueComponentBase';
import "./CRUDCreateModalComponent.scss";
//copy_widget
import DashboardPageVO from '../../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';


@Component({
    template: require('./CRUDCreateModalComponent.pug'),
    components: {
        Crudcreateformcomponent: CRUDCreateFormComponent
    },
})
export default class CRUDCreateModalComponent extends VueComponentBase {

    private api_type_id: string = null;

    //Copy widget
    private copy_widget: boolean = null;
    private page_widget: DashboardPageWidgetVO = null;
    private pages: DashboardPageVO[];
    private page_id: number = null;

    private on_hidden_initialized: boolean = false;

    private onclose_callback: () => Promise<void> = null;

    public async open_modal(api_type_id: string, onclose_callback: () => Promise<void>) {
        this.copy_widget = null;

        let crud = CRUDComponentManager.getInstance().cruds_by_api_type_id[this.api_type_id];
        if (crud) {
            crud.createDatatable.refresh();
            (this.$refs['Crudcreateformcomponent'] as CRUDCreateFormComponent).update_key();
        }

        if (crud && crud.callback_handle_modal_show_hide) {
            await crud.callback_handle_modal_show_hide(null, 'create');
        }

        this.api_type_id = api_type_id;
        this.onclose_callback = onclose_callback;
        $('#crud_create_modal').modal('show');

        if (!this.on_hidden_initialized) {
            this.on_hidden_initialized = true;
            $("#crud_create_modal").on("hidden.bs.modal", async () => {
                if (this.onclose_callback) {
                    await this.onclose_callback();
                }
            });
        }
    }




    public async open_copy_modal(page_widget: DashboardPageWidgetVO, pages: DashboardPageVO[], onclose_callback: () => Promise<void>) {

        this.copy_widget = true; //On active l'affichage html à correspondant une copy de widget .
        this.pages = pages;
        this.page_id = page_widget.page_id;
        this.page_widget = page_widget;
        this.onclose_callback = onclose_callback;
        $('#crud_create_modal').modal('show');

        if (!this.on_hidden_initialized) {
            this.on_hidden_initialized = true;
            $("#crud_create_modal").on("hidden.bs.modal", async () => {
                if (this.onclose_callback) {
                    await this.onclose_callback();
                }
            });
        }
    }



    private async close_modal() {
        $('#crud_create_modal').modal('hide');
        let crud = CRUDComponentManager.getInstance().cruds_by_api_type_id[this.api_type_id];
        if (crud) {
            crud.createDatatable.refresh();
            (this.$refs['Crudcreateformcomponent'] as CRUDCreateFormComponent).update_key();
        }
        if (crud && crud.callback_handle_modal_show_hide) {
            await crud.callback_handle_modal_show_hide(null, 'create');
        }

        if (this.onclose_callback) {
            await this.onclose_callback();
        }
    }

    private async delete_widget() {
        //Supprime le widget qui sera déplaçé.
        this.$emit('delete_widget', this.page_widget);


    }

    private async reload_widgets() {
        //On recharge les widgets
        this.$emit('reload_widgets');

    }

}