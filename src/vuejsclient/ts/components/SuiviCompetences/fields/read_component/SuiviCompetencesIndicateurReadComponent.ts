import Component from "vue-class-component";
import VueComponentBase from "../../../VueComponentBase";
import ITableFieldTypeReadComponent from "../../../../../../shared/modules/TableFieldTypes/interfaces/ITableFieldTypeReadComponent";
import SuiviCompetencesItemVO from "../../../../../../shared/modules/SuiviCompetences/vos/SuiviCompetencesItemVO";
import { Prop, Watch } from "vue-property-decorator";
import SuiviCompetencesIndicateurVO from "../../../../../../shared/modules/SuiviCompetences/fields/indicateur/vos/SuiviCompetencesIndicateurVO";
import DatatableField from "../../../../../../shared/modules/DAO/vos/datatable/DatatableField";
import DatatableComponentField from "../../../datatable/component/fields/DatatableComponentField";

@Component({
    template: require('./SuiviCompetencesIndicateurReadComponent.pug'),
    components: {
        Datatablecomponentfield: DatatableComponentField
    }
})
export default class SuiviCompetencesIndicateurReadComponent extends VueComponentBase implements ITableFieldTypeReadComponent {

    @Prop()
    public row: SuiviCompetencesItemVO;

    @Prop()
    public value: any;

    private field_values: SuiviCompetencesIndicateurVO[] = [];

    @Watch('value', { immediate: true })
    @Watch('row', { immediate: true })
    private async reload_field_values() {
        this.field_values = (this.value) ? JSON.parse(this.value) : null;
    }

    get fields(): Array<DatatableField<any, any>> {
        return SuiviCompetencesIndicateurVO.fields();
    }
}