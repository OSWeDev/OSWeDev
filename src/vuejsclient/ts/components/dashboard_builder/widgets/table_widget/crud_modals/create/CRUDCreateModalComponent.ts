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

    @Prop()
    private api_type_id: string;

    public open_modal() {
        $('#crud_create_modal').modal('show');
    }

    private close_modal() {
        $('#crud_create_modal').modal('hide');
    }
}