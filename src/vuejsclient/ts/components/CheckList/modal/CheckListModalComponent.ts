import { Component, Prop } from 'vue-property-decorator';
import ICheckListItem from '../../../../../shared/modules/CheckList/interfaces/ICheckListItem';
import ICheckPoint from '../../../../../shared/modules/CheckList/interfaces/ICheckPoint';
import DatatableField from '../../../../../shared/modules/DAO/vos/datatable/DatatableField';
import VueComponentBase from '../../VueComponentBase';
import CheckListControllerBase from '../CheckListControllerBase';
import "./CheckListModalComponent.scss";

@Component({
    template: require('./CheckListModalComponent.pug')
})
export default class CheckListModalComponent extends VueComponentBase {

    @Prop({ default: null })
    private checklist_item: ICheckListItem;

    @Prop({ default: null })
    private checkpoint: ICheckPoint;

    @Prop({ default: null })
    private checklist_controller: CheckListControllerBase;

    private onchangevo(vo) {
        this.$emit('onchangevo', vo);
    }

    get editable_fields(): Array<DatatableField<any, any>> {

        if (!this.checkpoint) {
            return this.all_editable_fields;
        }

        if ((!this.checkpoint.item_field_ids) || (!this.checkpoint.item_field_ids.length)) {
            return [];
        }

        let res: Array<DatatableField<any, any>> = [];

        for (let i in this.all_editable_fields) {
            let editable_field = this.all_editable_fields[i];

            if (this.checkpoint.item_field_ids.indexOf(editable_field.module_table_field_id) >= 0) {
                res.push(editable_field);
            }
        }
        return res;
    }

    get all_editable_fields(): Array<DatatableField<any, any>> {
        return this.checklist_controller.get_ordered_editable_fields();
    }
}