import Component from "vue-class-component";
import VueComponentBase from "../../../VueComponentBase";
import ITableFieldTypeCreateUpdateComponent from "../../../../../../shared/modules/TableFieldTypes/interfaces/ITableFieldTypeCreateUpdateComponent";
import { Prop, Watch } from "vue-property-decorator";
import SimpleDatatableFieldVO from "../../../../../../shared/modules/DAO/vos/datatable/SimpleDatatableFieldVO";
import SuiviCompetencesItemVO from "../../../../../../shared/modules/SuiviCompetences/vos/SuiviCompetencesItemVO";
import SuiviCompetencesIndicateurVO from "../../../../../../shared/modules/SuiviCompetences/fields/indicateur/vos/SuiviCompetencesIndicateurVO";
import SuiviCompetencesIndicateurTableFieldTypeController from "../../../../../../shared/modules/SuiviCompetences/fields/indicateur/SuiviCompetencesIndicateurTableFieldTypeController";
import DatatableField from "../../../../../../shared/modules/DAO/vos/datatable/DatatableField";

@Component({
    template: require('./SuiviCompetencesIndicateurCreateUpdateComponent.pug'),
})
export default class SuiviCompetencesIndicateurCreateUpdateComponent extends VueComponentBase implements ITableFieldTypeCreateUpdateComponent {

    @Prop()
    public vo: SuiviCompetencesItemVO;

    @Prop()
    public field: SimpleDatatableFieldVO<any, any>;

    @Prop()
    public required: boolean;

    @Prop()
    public disabled: boolean;

    private field_values: SuiviCompetencesIndicateurVO[] = [];

    @Watch('vo', { immediate: true })
    private init_field_values() {
        if (this.vo[this.field.module_table_field_id]) {
            this.field_values = SuiviCompetencesIndicateurTableFieldTypeController.getInstance().get_value(this.vo);
        } else {
            this.field_values = null;
        }

        if (this.field_values == null) {
            this.field_values = [];
        }

        if (this.field_values.length == 0) {
            this.field_values.push(new SuiviCompetencesIndicateurVO());
        }
    }

    @Watch('field_values', { deep: true })
    private on_edit() {
        this.$emit('input', JSON.stringify(this.field_values));
    }

    private add(): void {
        this.field_values.push(new SuiviCompetencesIndicateurVO());
    }

    private remove(index: number): void {
        this.field_values.splice(index, 1);
    }

    get fields(): Array<DatatableField<any, any>> {
        return SuiviCompetencesIndicateurVO.fields();
    }
}