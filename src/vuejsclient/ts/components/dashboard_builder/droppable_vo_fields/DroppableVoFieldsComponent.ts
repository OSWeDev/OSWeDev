import Component from 'vue-class-component';
import { Prop, Vue, Watch } from 'vue-property-decorator';
import DashboardVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import VOsTypesManager from '../../../../../shared/modules/VO/manager/VOsTypesManager';
import VueComponentBase from '../../VueComponentBase';
import { ModuleDashboardPageGetter } from '../page/DashboardPageStore';
import './DroppableVoFieldsComponent.scss';
import DroppableVoFieldsController from './DroppableVoFieldsController';
import { ModuleDroppableVoFieldsAction, ModuleDroppableVoFieldsGetter } from './DroppableVoFieldsStore';
import DroppableVoFieldComponent from './field/DroppableVoFieldComponent';

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

    @ModuleDashboardPageGetter
    private get_dashboard_api_type_ids: string[];

    private filter_value: string = null;
    private closed_api_type_id: { [api_type_id: string]: boolean } = {};

    @Prop()
    private dashboard: DashboardVO;

    @ModuleDroppableVoFieldsGetter
    private get_selected_fields: { [api_type_id: string]: { [field_id: string]: boolean } };

    private switch_open_closed(api_type_id: string) {
        Vue.set(this.closed_api_type_id, api_type_id, !this.closed_api_type_id[api_type_id]);
    }

    @Watch("get_filter_by_field_id_or_api_type_id", { immediate: true })
    private onchange_store_filter() {
        this.filter_value = this.get_filter_by_field_id_or_api_type_id;
    }

    private filter_by_field_id_or_api_type_id(event) {
        this.set_filter_by_field_id_or_api_type_id(event.srcElement.value);
    }

    get api_type_ids(): string[] {
        const res: string[] = [];

        for (const i in this.get_dashboard_api_type_ids) {
            const vo_type = this.get_dashboard_api_type_ids[i];

            if (DroppableVoFieldsController.getInstance().visible_fields_and_api_type_ids &&
                (typeof DroppableVoFieldsController.getInstance().visible_fields_and_api_type_ids[vo_type] === 'undefined')) {
                continue;
            }

            res.push(vo_type);
        }

        res.sort();

        return res;
    }

    get fields_ids_by_api_type_ids(): { [api_type_id: string]: string[] } {
        const res: { [api_type_id: string]: string[] } = {};

        for (const i in this.api_type_ids) {
            const vo_type = this.api_type_ids[i];
            res[vo_type] = [];

            if (DroppableVoFieldsController.getInstance().visible_fields_and_api_type_ids &&
                (typeof DroppableVoFieldsController.getInstance().visible_fields_and_api_type_ids[vo_type] === 'undefined')) {
                // console.log(vo_type + ":" + typeof DroppableVoFieldsController.getInstance().visible_fields_and_api_type_ids[vo_type]);
                continue;
            }

            const fields = ModuleTableController.module_tables_by_vo_type[vo_type].get_fields();
            res[vo_type].push('id');

            for (const j in fields) {
                const field = fields[j];

                if ((DroppableVoFieldsController.getInstance().visible_fields_and_api_type_ids &&
                    (typeof DroppableVoFieldsController.getInstance().visible_fields_and_api_type_ids[vo_type] === 'undefined')) ||
                    (DroppableVoFieldsController.getInstance().visible_fields_and_api_type_ids &&
                        DroppableVoFieldsController.getInstance().visible_fields_and_api_type_ids[vo_type] &&
                        (!DroppableVoFieldsController.getInstance().visible_fields_and_api_type_ids[vo_type][field.field_id]))) {
                    // console.log(vo_type + ":" + typeof DroppableVoFieldsController.getInstance().visible_fields_and_api_type_ids[vo_type]);
                    continue;
                }

                res[vo_type].push(field.field_id);
            }
        }

        return res;
    }

    get api_type_titles(): { [api_type_id: string]: string } {
        const res: { [api_type_id: string]: string } = {};

        for (const i in this.api_type_ids) {
            const vo_type = this.api_type_ids[i];
            res[vo_type] = this.t(ModuleTableController.module_tables_by_vo_type[vo_type].label.code_text);
        }

        return res;
    }

    get field_titles_by_api_type(): { [api_type_id: string]: { [field_id: string]: string } } {
        const res: { [api_type_id: string]: { [field_id: string]: string } } = {};

        for (const vo_type in this.fields_ids_by_api_type_ids) {
            const fields = this.fields_ids_by_api_type_ids[vo_type];

            res[vo_type] = {};

            for (const i in fields) {
                const field_id = fields[i];

                const field = ModuleTableController.module_tables_by_vo_type[vo_type].get_field_by_id(field_id);
                res[vo_type][field_id] = field ? this.t(field.field_label.code_text) : field_id;
            }
        }

        return res;
    }

    get has_selected_field(): { [api_type_id: string]: boolean } {
        const res: { [api_type_id: string]: boolean } = {};

        for (const i in this.api_type_ids) {
            const vo_type = this.api_type_ids[i];
            const fields = ModuleTableController.module_tables_by_vo_type[vo_type].get_fields();

            res[vo_type] = false;
            for (const j in fields) {
                const field = fields[j];

                res[vo_type] = res[vo_type] || (this.get_selected_fields && this.get_selected_fields[vo_type] && this.get_selected_fields[vo_type][field.field_id]);
                if (res[vo_type]) {
                    break;
                }
            }

            res[vo_type] = res[vo_type] || (this.get_selected_fields && this.get_selected_fields[vo_type] && this.get_selected_fields[vo_type]['id']);
        }

        return res;
    }
}