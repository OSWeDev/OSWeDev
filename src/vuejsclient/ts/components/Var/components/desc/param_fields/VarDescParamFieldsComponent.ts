import { Component, Prop } from 'vue-property-decorator';
import HourRange from '../../../../../../../shared/modules/DataRender/vos/HourRange';
import NumRange from '../../../../../../../shared/modules/DataRender/vos/NumRange';
import TSRange from '../../../../../../../shared/modules/DataRender/vos/TSRange';
import MatroidController from '../../../../../../../shared/modules/Matroid/MatroidController';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../../../../../../../shared/modules/ModuleTableFieldVO';
import VarsController from '../../../../../../../shared/modules/Var/VarsController';
import VarDataBaseVO from '../../../../../../../shared/modules/Var/vos/VarDataBaseVO';
import VOsTypesManager from '../../../../../../../shared/modules/VO/manager/VOsTypesManager';
import VueComponentBase from '../../../../VueComponentBase';
import './VarDescParamFieldsComponent.scss';

@Component({
    template: require('./VarDescParamFieldsComponent.pug'),
})
export default class VarDescParamFieldsComponent extends VueComponentBase {

    @Prop()
    private var_param: VarDataBaseVO;

    private async copy_card_field_code(field: ModuleTableFieldVO) {
        await navigator.clipboard.writeText(this.get_card_field_code(field));
    }

    private get_card_field_code(field: ModuleTableFieldVO) {
        return '{' + VarsController.get_card_field_code(field.field_id) + '}';
    }

    get ts_range_type(): number {
        return TSRange.RANGE_TYPE;
    }

    get hour_range_type(): number {
        return HourRange.RANGE_TYPE;
    }

    get num_range_type(): number {
        return NumRange.RANGE_TYPE;
    }

    get param_table_name(): string {
        if (!this.var_param) {
            return null;
        }
        return VOsTypesManager.moduleTables_by_voType[this.var_param._type].name;
    }

    /**
     * All fields names except the ts_range field
     */
    get var_data_other_fields(): ModuleTableFieldVO[] {
        if (!this.var_param) {
            return null;
        }

        return MatroidController.getMatroidFields(this.var_param._type);
    }
}