import { Component, Prop } from 'vue-property-decorator';
import ICheckListItem from '../../../../../shared/modules/CheckList/interfaces/ICheckListItem';
import ICheckPoint from '../../../../../shared/modules/CheckList/interfaces/ICheckPoint';
import ModuleCheckListBase from '../../../../../shared/modules/CheckList/ModuleCheckListBase';
import ModuleTableField from '../../../../../shared/modules/ModuleTableField';
import VOsTypesManager from '../../../../../shared/modules/VOsTypesManager';
import VueComponentBase from '../../VueComponentBase';
import CheckListControllerBase from '../CheckListControllerBase';
import './CheckListItemComponent.scss';
import SimpleDatatableField from '../../../../../shared/modules/DAO/vos/datatable/SimpleDatatableField';

@Component({
    template: require('./CheckListItemComponent.pug'),
    components: {
    }
})
export default class CheckListItemComponent extends VueComponentBase {

    @Prop({ default: null })
    public checklistitemcheckpoints: { [checkpoint_id: number]: boolean };

    @Prop()
    private global_route_path: string;

    @Prop({ default: null })
    private checklist_item: ICheckListItem;

    @Prop({ default: null })
    private ordered_checkpoints: ICheckPoint[];

    private openmodal(step_id: number = null) {
        if (!this.checklist_item) {
            return;
        }

        this.$router.push(step_id ?
            this.global_route_path + '/' + this.checklist_item.checklist_id + '/' + this.checklist_item.id + '/' + step_id :
            this.global_route_path + '/' + this.checklist_item.checklist_id + '/' + this.checklist_item.id);
    }

    get checkpoint_descriptions(): { [step_id: number]: string } {

        if (!this.checklist_item) {
            return null;
        }

        let res: { [step_id: number]: string } = {};
        let moduletable = VOsTypesManager.getInstance().moduleTables_by_voType[this.checklist_item._type];

        for (let i in this.ordered_checkpoints) {
            let checkpoint = this.ordered_checkpoints[i];

            let checkpoint_description = '<p><strong><u>' + checkpoint.name + ' [' + checkpoint.shortname + ']' + '</u></strong></p>';

            if (checkpoint.item_field_ids && checkpoint.item_field_ids.length) {

                checkpoint_description += '<ul>';
                for (let j in checkpoint.item_field_ids) {
                    let item_field_id = checkpoint.item_field_ids[j];

                    let field: ModuleTableField<any> = moduletable.getFieldFromId(item_field_id);

                    checkpoint_description += '<li>' + this.t(field.field_label.code_text) + ' : <strong>' +
                        SimpleDatatableField.defaultDataToReadIHM(this.checklist_item[item_field_id], field, this.checklist_item) + '</strong></li>';
                }
                checkpoint_description += '</ul>';
            }

            res[checkpoint.id] = checkpoint_description;
        }

        return res;
    }


    get item_description(): string {

        if (!this.checklist_item) {
            return null;
        }

        let moduletable = VOsTypesManager.getInstance().moduleTables_by_voType[this.checklist_item._type];

        let checkpoint_description: string = '<ul>';
        for (let j in moduletable.get_fields()) {
            let field: ModuleTableField<any> = moduletable.get_fields()[j];

            checkpoint_description += '<li>' + this.t(field.field_label.code_text) + ' : <strong>' +
                SimpleDatatableField.defaultDataToReadIHM(this.checklist_item[field.field_id], field, this.checklist_item) + '</strong></li>';
        }
        checkpoint_description += '</ul>';

        return checkpoint_description;
    }
}