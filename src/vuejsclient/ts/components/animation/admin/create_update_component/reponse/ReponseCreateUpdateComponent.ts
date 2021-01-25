import { Component, Prop, Watch } from 'vue-property-decorator';
import AnimationController from '../../../../../../../shared/modules/Animation/AnimationController';
import AnimationReponseVO from '../../../../../../../shared/modules/Animation/fields/reponse/vos/AnimationReponseVO';
import AnimationQRVO from '../../../../../../../shared/modules/Animation/vos/AnimationQRVO';
import DatatableField from '../../../../../../../shared/modules/DAO/vos/datatable/DatatableField';
import SimpleDatatableField from '../../../../../../../shared/modules/DAO/vos/datatable/SimpleDatatableField';
import ITableFieldTypeCreateUpdateComponent from '../../../../../../../shared/modules/TableFieldTypes/interfaces/ITableFieldTypeCreateUpdateComponent';
import VueComponentBase from '../../../../VueComponentBase';

@Component({
    template: require('./ReponseCreateUpdateComponent.pug'),
    components: {}
})
export default class ReponseCreateUpdateComponent extends VueComponentBase implements ITableFieldTypeCreateUpdateComponent {

    @Prop()
    public vo: AnimationQRVO;

    @Prop()
    public field: SimpleDatatableField<any, any>;

    @Prop()
    public required: boolean;

    @Prop()
    public disabled: boolean;

    private field_values: AnimationReponseVO[] = [];

    @Watch('vo', { immediate: true })
    private init_field_values() {
        if (this.vo[this.field.module_table_field_id]) {
            this.field_values = AnimationController.getInstance().getReponses(this.vo);
        } else {
            this.field_values = null;
        }

        if (this.field_values == null) {
            this.field_values = [];
        }

        if (this.field_values.length == 0) {
            let res: AnimationReponseVO = new AnimationReponseVO();
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
        let res: AnimationReponseVO = new AnimationReponseVO();
        res.id = this.next_id;
        this.field_values.push(res);
    }

    private remove(index: number): void {
        this.field_values.splice(index, 1);
    }

    get fields(): Array<DatatableField<any, any>> {
        return AnimationReponseVO.fields();
    }

    get next_id(): number {
        if (!this.field_values.length) {
            return 1;
        }

        return (Math.max(...this.field_values.map((f) => f.id)) + 1);
    }
}