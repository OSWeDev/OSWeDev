import { Component, Prop } from 'vue-property-decorator';
import HourRange from '../../../../../../../shared/modules/DataRender/vos/HourRange';
import NumRange from '../../../../../../../shared/modules/DataRender/vos/NumRange';
import TSRange from '../../../../../../../shared/modules/DataRender/vos/TSRange';
import MatroidController from '../../../../../../../shared/modules/Matroid/MatroidController';
import ModuleTableField from '../../../../../../../shared/modules/ModuleTableField';
import VarsController from '../../../../../../../shared/modules/Var/VarsController';
import VarDataBaseVO from '../../../../../../../shared/modules/Var/vos/VarDataBaseVO';
import VOsTypesManager from '../../../../../../../shared/modules/VOsTypesManager';
import VueComponentBase from '../../../../VueComponentBase';
import './VarDescParamFieldsComponent.scss';

@Component({
    template: require('./VarDescParamFieldsComponent.pug'),
})
export default class VarDescParamFieldsComponent extends VueComponentBase {

    @Prop()
    private var_param: VarDataBaseVO;

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
        return VOsTypesManager.getInstance().moduleTables_by_voType[this.var_param._type].name;
    }

    /**
     * All fields names except the ts_range field
     */
    get var_data_other_fields(): Array<ModuleTableField<any>> {
        if (!this.var_param) {
            return null;
        }

        return MatroidController.getInstance().getMatroidFields(this.var_param._type);
        // let res: Array<ModuleTableField<any>> = [];

        // let matroid_bases: Array<ModuleTableField<any>> = MatroidController.getInstance().getMatroidFields(this.var_param._type);
        // if (!matroid_bases) {
        //     return null;
        // }

        // for (let i in matroid_bases) {
        //     let matroid_base = matroid_bases[i];
        //     if (this.var_data_has_tsranges && (matroid_base.field_id == VarsController.getInstance().var_conf_by_id[this.var_param.var_id].ts_ranges_field_name)) {
        //         continue;
        //     }
        //     res.push(matroid_base);
        // }

        // return res;
    }

    /**
     * @deprecated
     */
    get var_data_has_tsranges(): boolean {
        return false;
        // if (!this.var_param) {
        //     return false;
        // }
        // return VarsController.getInstance().var_conf_by_id[this.var_param.var_id].ts_ranges_segment_type != null;
    }

    /**
     * @deprecated
     */
    get var_data_ts_ranges_field_id(): string {
        return null;
        // if (!this.var_data_has_tsranges) {
        //     return null;
        // }
        // return VarsController.getInstance().var_conf_by_id[this.var_param.var_id].ts_ranges_field_name;
    }

    /**
     * @deprecated
     */
    get var_data_ts_ranges(): TSRange[] {
        return null;
        // if (!this.var_data_has_tsranges) {
        //     return null;
        // }
        // return this.var_param[VarsController.getInstance().var_conf_by_id[this.var_param.var_id].ts_ranges_field_name];
    }
}