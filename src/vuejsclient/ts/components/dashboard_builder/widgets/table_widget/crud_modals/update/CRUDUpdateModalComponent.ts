import { Component, Prop } from 'vue-property-decorator';
import IDistantVOBase from '../../../../../../../../shared/modules/IDistantVOBase';
import CRUDUpdateFormComponent from '../../../../../crud/component/update/CRUDUpdateFormComponent';
import VueComponentBase from '../../../../../VueComponentBase';
import "./CRUDUpdateModalComponent.scss";

@Component({
    template: require('./CRUDUpdateModalComponent.pug'),
    components: {
        Crudupdateformcomponent: CRUDUpdateFormComponent
    },
})
export default class CRUDUpdateModalComponent extends VueComponentBase {

    private vo: IDistantVOBase = null;

    public open_modal(vo: IDistantVOBase) {
        this.vo = vo;
        $('#crud_update_modal').modal('show');
    }

    private close_modal() {
        $('#crud_update_modal').modal('hide');
    }
}