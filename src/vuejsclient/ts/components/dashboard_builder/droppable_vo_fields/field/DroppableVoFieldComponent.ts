import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import { VOsTypesManager } from '../../../../../../shared/modules/VO/manager/VOsTypesManager';
import VueComponentBase from '../../../VueComponentBase';
import './DroppableVoFieldComponent.scss';
import { ModuleDroppableVoFieldsAction, ModuleDroppableVoFieldsGetter } from '../DroppableVoFieldsStore';

@Component({
    template: require('./DroppableVoFieldComponent.pug'),
    components: {

    }
})
export default class DroppableVoFieldComponent extends VueComponentBase {

    @Prop()
    private api_type_id: string;

    @Prop()
    private field_id: string;

    @ModuleDroppableVoFieldsGetter
    private get_selected_fields: { [api_type_id: string]: { [field_id: string]: boolean } };

    @ModuleDroppableVoFieldsAction
    private switch_selected_field: (infos: { api_type_id: string, field_id: string }) => void;

    get is_selected(): boolean {
        if ((!this.api_type_id) || (!this.field_id)) {
            return false;
        }

        return this.get_selected_fields && this.get_selected_fields[this.api_type_id] && this.get_selected_fields[this.api_type_id][this.field_id];
    }

    get field_label(): string {
        if ((!this.api_type_id) || (!this.field_id)) {
            return null;
        }

        let field = VOsTypesManager.moduleTables_by_voType[this.api_type_id].get_field_by_id(this.field_id);
        return field ? this.t(field.field_label.code_text) : this.field_id;
    }

    private inverse_selection() {
        // this.switch_selected_field({ api_type_id: this.api_type_id, field_id: this.field_id });
    }

    private async drag(event) {
        event.dataTransfer.setData("api_type_id", this.api_type_id);
        event.dataTransfer.setData("field_id", this.field_id);
        event.dataTransfer.dropEffect = "copy";
    }
}