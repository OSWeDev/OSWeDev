import { Component, Prop, Watch } from 'vue-property-decorator';
import AnimationController from '../../../../../../../shared/modules/Animation/AnimationController';
import AnimationMessageModuleVO from '../../../../../../../shared/modules/Animation/fields/message_module/vos/AnimationMessageModuleVO';
import AnimationModuleVO from '../../../../../../../shared/modules/Animation/vos/AnimationModuleVO';
import DatatableField from '../../../../../../../shared/modules/DAO/vos/datatable/DatatableField';
import SimpleDatatableFieldVO from '../../../../../../../shared/modules/DAO/vos/datatable/SimpleDatatableFieldVO';
import ITableFieldTypeCreateUpdateComponent from '../../../../../../../shared/modules/TableFieldTypes/interfaces/ITableFieldTypeCreateUpdateComponent';
import VueComponentBase from '../../../../VueComponentBase';

@Component({
    template: require('./MessageModuleCreateUpdateComponent.pug'),
    components: {}
})
export default class MessageModuleCreateUpdateComponent extends VueComponentBase implements ITableFieldTypeCreateUpdateComponent {

    @Prop()
    public vo: AnimationModuleVO;

    @Prop()
    public field: SimpleDatatableFieldVO<any, any>;

    @Prop()
    public required: boolean;

    @Prop()
    public disabled: boolean;

    private field_values: AnimationMessageModuleVO[] = [];

    @Watch('vo', { immediate: true })
    private init_field_values() {
        if (this.vo[this.field.module_table_field_id]) {
            this.field_values = AnimationController.getInstance().getMessagesModule(this.vo);
        } else {
            this.field_values = null;
        }

        if (this.field_values == null) {
            this.field_values = [];
        }

        if (this.field_values.length == 0) {
            let res: AnimationMessageModuleVO = new AnimationMessageModuleVO();
            res.id = this.next_id;
            this.field_values.push(res);
        }
    }

    @Watch('field_values', { deep: true })
    private on_edit() {
        this.$emit('input', JSON.stringify(this.field_values));
    }

    private async created() { }

    private add(): void {
        let res: AnimationMessageModuleVO = new AnimationMessageModuleVO();
        res.id = this.next_id;
        this.field_values.push(res);
    }

    private remove(index: number): void {
        this.field_values.splice(index, 1);
    }

    get fields(): Array<DatatableField<any, any>> {
        return AnimationMessageModuleVO.fields();
    }

    get next_id(): number {
        if (!this.field_values.length) {
            return 1;
        }

        return (Math.max(...this.field_values.map((f) => f.id)) + 1);
    }
}