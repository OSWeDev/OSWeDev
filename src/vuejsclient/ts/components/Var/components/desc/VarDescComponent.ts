import { Component, Prop, Watch } from 'vue-property-decorator';
import Dates from '../../../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ModuleFormatDatesNombres from '../../../../../../shared/modules/FormatDatesNombres/ModuleFormatDatesNombres';
import MatroidController from '../../../../../../shared/modules/Matroid/MatroidController';
import ModuleVar from '../../../../../../shared/modules/Var/ModuleVar';
import VarsController from '../../../../../../shared/modules/Var/VarsController';
import VarDataBaseVO from '../../../../../../shared/modules/Var/vos/VarDataBaseVO';
import VarDataValueResVO from '../../../../../../shared/modules/Var/vos/VarDataValueResVO';
import VarUpdateCallback from '../../../../../../shared/modules/Var/vos/VarUpdateCallback';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import RangeHandler from '../../../../../../shared/tools/RangeHandler';
import ThrottleHelper from '../../../../../../shared/tools/ThrottleHelper';
import InlineTranslatableText from '../../../InlineTranslatableText/InlineTranslatableText';
import VueComponentBase from '../../../VueComponentBase';
import VarsClientController from '../../VarsClientController';
import VarsDatasExplorerFiltersComponent from '../explorer/filters/VarsDatasExplorerFiltersComponent';
import './VarDescComponent.scss';

@Component({
    template: require('./VarDescComponent.pug'),
    components: {
        Vardesccontrollercomponent: () => import('./controller/VarDescControllerComponent'),
        Vardescparamfieldscomponent: () => import('./param_fields/VarDescParamFieldsComponent'),
        Vardescexplaincomponent: () => import('./explain/VarDescExplainComponent'),
        Inlinetranslatabletext: InlineTranslatableText,
    }
})
export default class VarDescComponent extends VueComponentBase {

    @Prop()
    private var_param: VarDataBaseVO;

    @Prop({ default: true })
    private show_deps: boolean;

    @Prop({ default: true })
    private show_imports: boolean;

    @Prop({ default: true })
    private show_last_update: boolean;

    private var_data: VarDataValueResVO = null;
    private throttled_var_data_updater = ThrottleHelper.getInstance().declare_throttle_without_args(this.var_data_updater.bind(this), 500, { leading: false, trailing: true });

    private varUpdateCallbacks: { [cb_uid: number]: VarUpdateCallback } = {
        [VarsClientController.get_CB_UID()]: VarUpdateCallback.newCallbackEvery(this.throttled_var_data_updater.bind(this), VarUpdateCallback.VALUE_TYPE_VALID)
    };

    private var_data_updater() {
        if (!this.var_param) {
            this.var_data = null;
            return;
        }
        this.var_data = VarsClientController.cached_var_datas[this.var_param.index];
    }

    get var_data_has_valid_value(): boolean {
        if (!this.var_param) {
            return false;
        }

        let var_data = this.var_data;

        if ((!var_data) || (typeof var_data.value === 'undefined')) {
            return false;
        }

        return true;
    }

    get var_data_is_import(): boolean {
        if (!this.var_data_has_valid_value) {
            return false;
        }
        let var_data = this.var_data;

        return var_data.value_type == VarDataBaseVO.VALUE_TYPE_IMPORT;
    }

    get var_data_value_is_denied() {
        if (!this.var_data) {
            return false;
        }

        return this.var_data.value_type == VarDataBaseVO.VALUE_TYPE_DENIED;
    }

    get var_id(): number {
        if (!this.var_param) {
            return null;
        }

        return this.var_param.var_id;
    }

    get var_description_code(): string {
        if (!this.var_param) {
            return null;
        }

        return VarsController.getInstance().get_translatable_description_code_by_var_id(this.var_param.var_id);
    }

    get var_description(): string {
        if (!this.var_description_code) {
            return null;
        }

        return this.t(this.var_description_code);
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

        VarsDatasExplorerFiltersComponent.instance.fitered_vars_confs = [VarsController.var_conf_by_id[this.var_param.var_id]];

        let matroid_fields = MatroidController.getInstance().getMatroidFields(this.var_param._type);
        for (let i in matroid_fields) {
            let matroid_field = matroid_fields[i];

            let field_value = this.var_param[matroid_field.field_id];
            if (VarsDatasExplorerFiltersComponent.instance.fields_filters_is_enum[matroid_field.field_id]) {

                let field_options = [];
                for (let j in VarsDatasExplorerFiltersComponent.instance.enum_initial_options[matroid_field.field_id]) {
                    let initial_option = VarsDatasExplorerFiltersComponent.instance.enum_initial_options[matroid_field.field_id][j];

                    if (RangeHandler.elt_intersects_any_range(initial_option.id, field_value)) {
                        field_options.push(initial_option);
                    }
                }
                VarsDatasExplorerFiltersComponent.instance.fields_filters_list[matroid_field.field_id] = field_options;
            } else {
                VarsDatasExplorerFiltersComponent.instance.fields_filters_range[matroid_field.field_id] =
                    RangeHandler.getMinSurroundingRange(field_value);
            }
        }
    }

    get var_data_last_update(): string {
        if (!this.var_data_has_valid_value) {
            return null;
        }

        let var_data = this.var_data;

        return Dates.format(var_data.value_ts, ModuleFormatDatesNombres.FORMAT_YYYYMMDD_HHmmss);
    }

    @Watch('var_param', { immediate: true })
    private log_index() {
        if (!this.var_param) {
            return;
        }
        ConsoleHandler.log('Index du paramètre de var sélectionné : ' + this.var_param.index);
    }
}