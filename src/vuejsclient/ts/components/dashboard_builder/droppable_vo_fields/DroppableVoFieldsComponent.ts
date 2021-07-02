import Component from 'vue-class-component';
import { Watch } from 'vue-property-decorator';
import VOsTypesManager from '../../../../../shared/modules/VOsTypesManager';
import VueComponentBase from '../../VueComponentBase';
import DroppableVoFieldComponent from './DroppableVoFieldComponent';
import './DroppableVoFieldsComponent.scss';
import { ModuleDroppableVoFieldsAction, ModuleDroppableVoFieldsGetter } from './DroppableVoFieldsStore';

@Component({
    template: require('./DroppableVoFieldsComponent.pug'),
    components: {
        Droppablevofieldcomponent: DroppableVoFieldComponent
    }
})
export default class DroppableVoFieldsComponent extends VueComponentBase {

    @ModuleDroppableVoFieldsGetter
    private get_filter_by_field_id_or_api_type_id: string;

    @ModuleDroppableVoFieldsAction
    private set_filter_by_field_id_or_api_type_id: (filter_by_field_id_or_api_type_id: string) => void;

    private filter_value: string = null;
    private opened_api_type_id: { [api_type_id: string]: boolean } = {};

    @ModuleDroppableVoFieldsGetter
    private get_selected_fields: { [api_type_id: string]: { [field_id: string]: boolean } };

    @Watch("get_filter_by_field_id_or_api_type_id", { immediate: true })
    private onchange_store_filter() {
        this.filter_value = this.get_filter_by_field_id_or_api_type_id;
    }

    private filter_by_field_id_or_api_type_id(event) {
        this.set_filter_by_field_id_or_api_type_id(event.srcElement.value);
    }

    get api_type_ids(): string[] {
        let res: string[] = [];

        for (let vo_type in VOsTypesManager.getInstance().moduleTables_by_voType) {
            res.push(vo_type);
        }

        res.sort();

        return res;
    }

    get fields_ids_by_api_type_ids(): { [api_type_id: string]: string[] } {
        let res: { [api_type_id: string]: string[] } = {};

        for (let vo_type in VOsTypesManager.getInstance().moduleTables_by_voType) {
            res[vo_type] = [];

            let fields = VOsTypesManager.getInstance().moduleTables_by_voType[vo_type].get_fields();

            for (let i in fields) {
                let field = fields[i];

                res[vo_type].push(field.field_id);
            }
        }

        return res;
    }

    get api_type_titles(): { [api_type_id: string]: string } {
        let res: { [api_type_id: string]: string } = {};

        for (let vo_type in VOsTypesManager.getInstance().moduleTables_by_voType) {
            res[vo_type] = this.t(VOsTypesManager.getInstance().moduleTables_by_voType[vo_type].label.code_text);
        }

        return res;
    }

    get has_selected_field(): { [api_type_id: string]: boolean } {
        let res: { [api_type_id: string]: boolean } = {};

        for (let vo_type in VOsTypesManager.getInstance().moduleTables_by_voType) {
            let fields = VOsTypesManager.getInstance().moduleTables_by_voType[vo_type].get_fields();

            res[vo_type] = false;
            for (let i in fields) {
                let field = fields[i];

                res[vo_type] = res[vo_type] || (this.get_selected_fields && this.get_selected_fields[vo_type] && this.get_selected_fields[vo_type][field.field_id]);
                if (res[vo_type]) {
                    break;
                }
            }
        }

        return res;
    }
}