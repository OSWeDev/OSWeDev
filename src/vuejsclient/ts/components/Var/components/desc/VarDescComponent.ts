import { Component, Prop } from 'vue-property-decorator';
import ModuleDAO from '../../../../../../shared/modules/DAO/ModuleDAO';
import ModuleFormatDatesNombres from '../../../../../../shared/modules/FormatDatesNombres/ModuleFormatDatesNombres';
import MatroidController from '../../../../../../shared/modules/Matroid/MatroidController';
import ModuleVar from '../../../../../../shared/modules/Var/ModuleVar';
import VarsController from '../../../../../../shared/modules/Var/VarsController';
import VarDataBaseVO from '../../../../../../shared/modules/Var/vos/VarDataBaseVO';
import VarDataValueResVO from '../../../../../../shared/modules/Var/vos/VarDataValueResVO';
import RangeHandler from '../../../../../../shared/tools/RangeHandler';
import VueComponentBase from '../../../VueComponentBase';
import { ModuleVarGetter } from '../../store/VarStore';
import VarsDatasExplorerFiltersComponent from '../explorer/filters/VarsDatasExplorerFiltersComponent';
import { ModuleVarsDatasExplorerVuexAction } from '../explorer/VarsDatasExplorerVuexStore';
import './VarDescComponent.scss';

@Component({
    template: require('./VarDescComponent.pug'),
    components: {
        Vardesccontrollercomponent: () => import(/* webpackChunkName: "VarDescControllerComponent" */ './controller/VarDescControllerComponent'),
        Vardescparamfieldscomponent: () => import(/* webpackChunkName: "VarDescParamFieldsComponent" */ './param_fields/VarDescParamFieldsComponent'),
        Vardescexplaincomponent: () => import(/* webpackChunkName: "VarDescExplainComponent" */ './explain/VarDescExplainComponent')
    }
})
export default class VarDescComponent extends VueComponentBase {

    @ModuleVarGetter
    public getVarDatas: { [paramIndex: string]: VarDataValueResVO };

    @Prop()
    private var_param: VarDataBaseVO;

    @Prop({ default: true })
    private show_deps: boolean;

    @Prop({ default: true })
    private show_imports: boolean;

    @Prop({ default: true })
    private show_last_update: boolean;


    get var_data_has_valid_value(): boolean {
        if (!this.var_param) {
            return false;
        }

        let var_data = this.getVarDatas[this.var_param.index];

        if ((!var_data) || (typeof var_data.value === 'undefined')) {
            return false;
        }

        return true;
    }

    get var_data_is_import(): boolean {
        if (!this.var_data_has_valid_value) {
            return false;
        }
        let var_data = this.getVarDatas[this.var_param.index];

        return var_data.value_type == VarDataBaseVO.VALUE_TYPE_IMPORT;
    }

    get var_id(): number {
        if (!this.var_param) {
            return null;
        }

        return this.var_param.var_id;
    }

    get var_description(): string {
        if (!this.var_param) {
            return null;
        }

        return this.t(VarsController.getInstance().get_translatable_description_code_by_var_id(this.var_param.var_id));
    }

    private async update_var_data() {
        if (this.var_param.value_type == VarDataBaseVO.VALUE_TYPE_IMPORT) {
            this.snotify.error(this.label('var.desc_mode.update_var_data.not_allowed_on_imports'));
            return;
        }
        await ModuleVar.getInstance().invalidate_cache_exact([this.var_param]);
        this.snotify.info(this.label('var.desc_mode.update_var_data'));
    }

    private async update_var_data_and_parents() {
        if (this.var_param.value_type == VarDataBaseVO.VALUE_TYPE_IMPORT) {
            this.snotify.error(this.label('var.desc_mode.update_var_data.not_allowed_on_imports'));
            return;
        }
        await ModuleVar.getInstance().invalidate_cache_intersection_and_parents([this.var_param]);
        this.snotify.info(this.label('var.desc_mode.update_var_data'));
    }

    private async filter_on_this_param() {

        if (!this.var_param) {
            return;
        }

        VarsDatasExplorerFiltersComponent.instance.fitered_vars_confs = [VarsController.getInstance().var_conf_by_id[this.var_param.var_id]];

        let matroid_fields = MatroidController.getInstance().getMatroidFields(this.var_param._type);
        for (let i in matroid_fields) {
            let matroid_field = matroid_fields[i];

            let field_value = this.var_param[matroid_field.field_id];
            if (VarsDatasExplorerFiltersComponent.instance.fields_filters_is_enum[matroid_field.field_id]) {

                let field_options = [];
                for (let j in VarsDatasExplorerFiltersComponent.instance.enum_initial_options[matroid_field.field_id]) {
                    let initial_option = VarsDatasExplorerFiltersComponent.instance.enum_initial_options[matroid_field.field_id][j];

                    if (RangeHandler.getInstance().elt_intersects_any_range(initial_option.id, field_value)) {
                        field_options.push(initial_option);
                    }
                }
                VarsDatasExplorerFiltersComponent.instance.fields_filters_list[matroid_field.field_id] = field_options;
            } else {
                VarsDatasExplorerFiltersComponent.instance.fields_filters_range[matroid_field.field_id] =
                    RangeHandler.getInstance().getMinSurroundingRange(field_value);
            }
        }
    }

    get var_data_last_update(): string {
        if (!this.var_data_has_valid_value) {
            return null;
        }

        let var_data = this.getVarDatas[this.var_param.index];

        return ModuleFormatDatesNombres.getInstance().formatMoment_to_YYYYMMDD_HHmmss(var_data.value_ts);
    }
}