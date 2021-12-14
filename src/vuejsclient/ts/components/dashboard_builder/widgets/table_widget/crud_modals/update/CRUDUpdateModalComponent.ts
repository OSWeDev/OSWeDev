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

    private onclose_callback: () => Promise<void> = null;

    public open_modal(vo: IDistantVOBase, onclose_callback: () => Promise<void>) {
        this.vo = vo;
        this.onclose_callback = onclose_callback;
        $('#crud_update_modal').modal('show');
    }

    private close_modal() {
        $('#crud_update_modal').modal('hide');
        if (this.onclose_callback) {
            this.onclose_callback();
        }
    }
}