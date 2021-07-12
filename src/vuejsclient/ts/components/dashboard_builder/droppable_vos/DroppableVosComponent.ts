import Component from 'vue-class-component';
import { Watch } from 'vue-property-decorator';
import VOsTypesManager from '../../../../../shared/modules/VOsTypesManager';
import VueComponentBase from '../../VueComponentBase';
import DroppableVoFieldsController from '../droppable_vo_fields/DroppableVoFieldsController';
import './DroppableVosComponent.scss';
import { ModuleDroppableVosAction, ModuleDroppableVosGetter } from './DroppableVosStore';

@Component({
    template: require('./DroppableVosComponent.pug'),
    components: {}
})
export default class DroppableVosComponent extends VueComponentBase {

    @ModuleDroppableVosGetter
    private get_filter_by_api_type_id: string;

    @ModuleDroppableVosAction
    private set_filter_by_api_type_id: (filter_by_api_type_id: string) => void;

    private filter_value: string = null;

    @ModuleDroppableVosGetter
    private get_selected_vos: { [api_type_id: string]: boolean };

    @Watch("get_filter_by_api_type_id", { immediate: true })
    private onchange_store_filter() {
        this.filter_value = this.get_filter_by_api_type_id;
    }

    private filter_by_api_type_id(event) {
        this.set_filter_by_api_type_id(event.srcElement.value);
    }

    get api_type_ids(): string[] {
        let res: string[] = [];

        for (let vo_type in VOsTypesManager.getInstance().moduleTables_by_voType) {

            if (DroppableVoFieldsController.getInstance().visible_fields_and_api_type_ids &&
                (typeof DroppableVoFieldsController.getInstance().visible_fields_and_api_type_ids[vo_type] === 'undefined')) {
                continue;
            }

            res.push(vo_type);
        }

        res.sort();

        return res;
    }

    get api_type_titles(): { [api_type_id: string]: string } {
        let res: { [api_type_id: string]: string } = {};

        for (let i in this.api_type_ids) {
            let vo_type = this.api_type_ids[i];
            res[vo_type] = this.t(VOsTypesManager.getInstance().moduleTables_by_voType[vo_type].label.code_text);
        }

        return res;
    }

    private async drag(event, api_type_id) {
        event.dataTransfer.setData("api_type_id", api_type_id);
        event.dataTransfer.dropEffect = "copy";
    }
}