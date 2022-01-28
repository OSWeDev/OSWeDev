import { Component, Prop } from 'vue-property-decorator';
import IDistantVOBase from '../../../../../../../../shared/modules/IDistantVOBase';
import CRUDCreateFormComponent from '../../../../../crud/component/create/CRUDCreateFormComponent';
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

    private onclose_callback: () => Promise<void> = null;

    public open_modal(api_type_id: string, onclose_callback: () => Promise<void>) {
        this.api_type_id = api_type_id;
        this.onclose_callback = onclose_callback;
        $('#crud_create_modal').modal('show');

        if (!this.on_hidden_initialized) {
            this.on_hidden_initialized = true;
            $("#crud_create_modal").on("hidden.bs.modal", () => {
                if (this.onclose_callback) {
                    this.onclose_callback();
                }
            });
        }
    }

    private close_modal() {
        $('#crud_create_modal').modal('hide');
        if (this.onclose_callback) {
            this.onclose_callback();
        }
    }
}