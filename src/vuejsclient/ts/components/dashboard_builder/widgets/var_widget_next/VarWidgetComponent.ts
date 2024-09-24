import { debounce, last } from 'lodash';
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ContextFilterVO from '../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import DashboardWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import FieldFiltersVO from '../../../../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO';
import VOsTypesManager from '../../../../../../shared/modules/VO/manager/VOsTypesManager';
import ModuleVar from '../../../../../../shared/modules/Var/ModuleVar';
import VarsController from '../../../../../../shared/modules/Var/VarsController';
import VarDataBaseVO from '../../../../../../shared/modules/Var/vos/VarDataBaseVO';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import ObjectHandler from '../../../../../../shared/tools/ObjectHandler';
import InlineTranslatableText from '../../../InlineTranslatableText/InlineTranslatableText';
import { ModuleTranslatableTextGetter } from '../../../InlineTranslatableText/TranslatableTextStore';
import VueComponentBase from '../../../VueComponentBase';
import { ModuleDashboardPageGetter } from '../../page/DashboardPageStore';
import DashboardBuilderWidgetsController from '../DashboardBuilderWidgetsController';
import ValidationFiltersWidgetController from '../validation_filters_widget/ValidationFiltersWidgetController';
import './VarWidgetComponent.scss';
import VarWidgetOptions from './options/VarWidgetOptions';
import VarDataValueResVO from '../../../../../../shared/modules/Var/vos/VarDataValueResVO';
import VarsClientController from '../../../Var/VarsClientController';
import ThrottleHelper from '../../../../../../shared/tools/ThrottleHelper';
import VarUpdateCallback from '../../../../../../shared/modules/Var/vos/VarUpdateCallback';
import ConditionHandler, { ConditionStatement } from '../../../../../../shared/tools/ConditionHandler';

@Component({
    template: require('./VarWidgetComponent.pug'),
    components: {
        Inlinetranslatabletext: InlineTranslatableText
    }
})
export default class VarWidgetComponent extends VueComponentBase {

    @ModuleDashboardPageGetter
    private get_dashboard_api_type_ids: string[];

    @ModuleDashboardPageGetter
    private get_discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } };

    @ModuleDashboardPageGetter
    private get_active_field_filters: FieldFiltersVO;

    @ModuleTranslatableTextGetter
    private get_flat_locale_translations: { [code_text: string]: string };

    @ModuleDashboardPageGetter
    private get_custom_filters: string[];

    @Prop({ default: null })
    private all_page_widget: DashboardPageWidgetVO[];

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    private dashboard: DashboardVO;

    @Prop({ default: null })
    private dashboard_page: DashboardPageVO;

    private throttled_var_datas_updater = ThrottleHelper.declare_throttle_without_args(this.var_datas_updater.bind(this), 100, { leading: false, trailing: true });
    private throttled_update_visible_options = debounce(this.update_visible_options.bind(this), 500);
    private var_params: VarDataBaseVO[] = [];

    private var_param_no_value_or_param_is_invalid: boolean = false;

    private var_param_principal: VarDataBaseVO = null;
    private var_param_principal_filter: string = null;
    private var_param_principal_filter_additional_params: string = null;
    private var_param_principal_label: string = null;
    private var_param_principal_show_label: boolean = false;
    private var_param_principal_is_condition_target: boolean = false;

    private var_param_a_date_label: string = null;
    private var_param_a_date: VarDataBaseVO = null;
    private var_param_a_date_filter: string = null;
    private var_param_a_date_filter_additional_params: string;
    private var_param_a_date_show_label: boolean = false;
    private var_param_a_date_is_condition_target: boolean = false;

    private var_param_complementaire_label: string = null;
    private var_param_complementaire: VarDataBaseVO = null;
    private var_param_complementaire_filter: string = null;
    private var_param_complementaire_filter_additional_params: string = null;
    private var_param_complementaire_show_label: boolean
    private var_param_complementaire_is_condition_target: boolean = false;

    private var_param_complementaire_supp_label: string = null;
    private var_param_complementaire_supp: VarDataBaseVO = null;
    private var_param_complementaire_supp_filter: string = null;
    private var_param_complementaire_supp_filter_additional_params: string = null;
    private var_param_complementaire_supp_show_label: boolean = false;
    private var_param_complementaire_supp_is_condition_target: boolean = false;

    private var_param_condition: VarDataBaseVO = null;
    private var_condition_datas: { [id: number]: VarDataValueResVO } = null;
    private var_params_condition: VarDataBaseVO[] = [];
    private var_condition_icon: string = null;
    private icons_by_value_and_conditions: Array<{
        value: string,
        condition: ConditionStatement,
        icon: string,
    }> = null;
    private danger_level: number = -1;

    @Watch('get_active_field_filters', { deep: true })
    private async onchange_active_field_filters() {
        await this.throttled_update_visible_options();
    }

    private var_datas_updater() {
        if ((!this.var_params_condition) || (!this.var_params_condition.length)) {
            this.var_condition_datas = null;
            return;
        }

        const res: { [id: number]: VarDataValueResVO } = {};

        for (const i in this.var_params_condition) {
            const var_param = this.var_params_condition[i];
            if (var_param.index == null) {
                res[var_param.id] = new VarDataValueResVO().set_value(0);
            } else {
                res[var_param.id] = VarsClientController.cached_var_datas[var_param.index];
            }
        }
        if (this.var_condition_datas != res) {
            this.var_condition_datas = res;
        }
    }

    @Watch('var_condition_datas')
    @Watch('icons_by_value_and_conditions', { deep: true })
    private async onchange_var_condition_datas() {
        if (!this.var_condition_datas) {
            return;
        }
        let res = [];

        for (let i in this.var_condition_datas) {
            if (!this.var_condition_datas[i]) {
                return;
            }
            let value = this.var_condition_datas[i].value;
            for (let j = 0; j < this.icons_by_value_and_conditions.length; j++) {
                if (this.icons_by_value_and_conditions[j].condition && this.icons_by_value_and_conditions[j].value) {
                    let condition = this.icons_by_value_and_conditions[j].condition;
                    let condition_value = JSON.parse(this.icons_by_value_and_conditions[j].value);
                    if (ConditionHandler.dynamic_statement(value, condition as ConditionStatement, condition_value)) {
                        res.push(this.icons_by_value_and_conditions[j].icon);
                    }
                }
            }
        }

        if (res.length >= 0) {
            this.var_condition_icon = res[0];
        }
    }

    @Watch('var_condition_icon')
    private async onchange_var_condition_icon() {
        if (!this.var_condition_icon) {
            return;
        }
        if (this.var_condition_icon.includes('sun')) {
            this.danger_level = 0;
        } else if (this.var_condition_icon.includes('cloud') && !this.var_condition_icon.includes('rain')) {
            this.danger_level = 1;
        } else if (this.var_condition_icon.includes('rain')) {
            this.danger_level = 2;
        }
    }

    @Watch('var_params_condition', { immediate: true })
    private onChangeVarParam(new_var_param: VarDataBaseVO[], old_var_param: VarDataBaseVO[]) {
        let new_is_empty = false;
        let old_is_empty = false
        if (new_var_param.length > 0 && old_var_param.length > 0) {
            for (let i in new_var_param) {
                if (!new_var_param[i]) {
                    new_is_empty = true;
                    break;
                }
            }
            for (let i in old_var_param) {
                if (!old_var_param[i]) {
                    old_is_empty = true;
                    break;
                }
            }
            if (!old_is_empty && !new_is_empty) {
                // On doit vérifier qu'ils sont bien différents
                if (VarsController.isSameParamArray(new_var_param, old_var_param)) {
                    return;
                }
            }
        }

        if (!old_is_empty) {
            console.log('unregister')
            VarsClientController.getInstance().unRegisterParams(old_var_param, this.varUpdateCallbacks);
        }

        if (!new_is_empty) {
            console.log('register')
            VarsClientController.getInstance().registerParams(new_var_param, this.varUpdateCallbacks);
        }

    }

    private varUpdateCallbacks: { [cb_uid: number]: VarUpdateCallback } = {
        [VarsClientController.get_CB_UID()]: VarUpdateCallback.newCallbackEvery(this.throttled_var_datas_updater.bind(this), VarUpdateCallback.VALUE_TYPE_VALID)
    };


    private async update_visible_options(force: boolean = false) {
        if (!this.widget_options || !this.widget_options.vars) {
            return;
        }
        if (!this.var_params) {
            this.var_params = [];
        }

        if (this.widget_options.var_condition_id) {
            if (this.var_custom_filters) {
                if (this.widget_options.icons_by_value_and_conditions) {
                    this.icons_by_value_and_conditions = this.widget_options.icons_by_value_and_conditions;
                }

                /**
                 * On crée le custom_filters
                 */
                const custom_filters: { [var_param_field_name: string]: ContextFilterVO } = VarWidgetComponent.get_var_custom_filters(this.var_custom_filters[4], this.get_active_field_filters);

                this.var_param_condition = await ModuleVar.getInstance().getVarParamFromContextFilters(
                    VarsController.var_conf_by_id[this.widget_options.var_condition_id].name,
                    this.get_active_field_filters,
                    custom_filters,
                    this.get_dashboard_api_type_ids,
                    this.get_discarded_field_paths);
                this.var_params_condition = [this.var_param_condition];
            }
        }

        for (let i = 0; i < this.widget_options.vars.length; i++) {
            let var_id = this.widget_options.vars[i].var_id;
            if (!(var_id)) {
                this.var_params[i] = null;
            } else {
                if (this.var_custom_filters) {
                    /**
                     * On crée le custom_filters
                     */
                    const custom_filters: { [var_param_field_name: string]: ContextFilterVO } = VarWidgetComponent.get_var_custom_filters(this.var_custom_filters[i], this.get_active_field_filters);

                    /**
                     * Pour les dates il faut réfléchir....
                     */
                    this.var_params[i] = await ModuleVar.getInstance().getVarParamFromContextFilters(
                        VarsController.var_conf_by_id[var_id].name,
                        this.get_active_field_filters,
                        custom_filters,
                        this.get_dashboard_api_type_ids,
                        this.get_discarded_field_paths);

                }
            }
            switch (i) {
                case 0:
                    this.var_param_principal = this.var_params[i] ? this.var_params[i] : null;
                    this.var_param_principal_filter = this.get_var_filter(this.widget_options.vars[i].id) ? this.get_var_filter(this.widget_options.vars[i].id) : null;
                    this.var_param_principal_filter_additional_params = this.get_var_filter_additional_param(this.widget_options.vars[i].id) ? this.get_var_filter_additional_param(this.widget_options.vars[i].id) : null;
                    this.var_param_principal_label = this.multi_var_name_code_text[i] ? this.multi_var_name_code_text[i] : "null";
                    this.var_param_principal_show_label = this.widget_options.vars[i].display_label;
                    this.var_param_principal_is_condition_target = this.widget_options.vars[i].is_condition_target;
                    break;
                case 1:
                    this.var_param_a_date_show_label = this.widget_options.vars[i].display_label;
                    this.var_param_a_date_label = this.multi_var_name_code_text[i] ? this.multi_var_name_code_text[i] : "null";
                    this.var_param_a_date = this.var_params[i] ? this.var_params[i] : null;
                    this.var_param_a_date_filter = this.get_var_filter(this.widget_options.vars[i].id) ? this.get_var_filter(this.widget_options.vars[i].id) : null;
                    this.var_param_a_date_filter_additional_params = this.get_var_filter_additional_param(this.widget_options.vars[i].id) ? this.get_var_filter_additional_param(this.widget_options.vars[i].id) : null;
                    this.var_param_a_date_is_condition_target = this.widget_options.vars[i].is_condition_target;
                    break;
                case 2:
                    this.var_param_complementaire_show_label = this.widget_options.vars[i].display_label;
                    this.var_param_complementaire_label = this.multi_var_name_code_text[i] ? this.multi_var_name_code_text[i] : "null";
                    this.var_param_complementaire = this.var_params[i] ? this.var_params[i] : null;
                    this.var_param_complementaire_filter = this.get_var_filter(this.widget_options.vars[i].id) ? this.get_var_filter(this.widget_options.vars[i].id) : null;
                    this.var_param_complementaire_filter_additional_params = this.get_var_filter_additional_param(this.widget_options.vars[i].id) ? this.get_var_filter_additional_param(this.widget_options.vars[i].id) : null;
                    this.var_param_complementaire_is_condition_target = this.widget_options.vars[i].is_condition_target;
                    break;
                case 3:
                    this.var_param_complementaire_supp_show_label = this.widget_options.vars[i].display_label;
                    this.var_param_complementaire_supp_label = this.multi_var_name_code_text[i] ? this.multi_var_name_code_text[i] : "null";
                    this.var_param_complementaire_supp = this.var_params[i] ? this.var_params[i] : null;
                    this.var_param_complementaire_supp_filter = this.get_var_filter(this.widget_options.vars[i].id) ? this.get_var_filter(this.widget_options.vars[i].id) : null;
                    this.var_param_complementaire_supp_filter_additional_params = this.get_var_filter_additional_param(this.widget_options.vars[i].id) ? this.get_var_filter_additional_param(this.widget_options.vars[i].id) : null;
                    this.var_param_complementaire_supp_is_condition_target = this.widget_options.vars[i].is_condition_target;
                    break;
            }
        }

    }

    get max_date() {
        let arr_max_ts = [];
        for (let vars of [this.var_param_principal, this.var_param_a_date, this.var_param_complementaire, this.var_param_complementaire_supp]) {
            if (vars && vars['_ts_ranges']) {
                for (let range of vars['_ts_ranges']) {
                    arr_max_ts.push(parseInt(range.max.toString() + "000"));
                }
            }
        }
        let date = new Date(Math.max(...arr_max_ts))
        const formatter = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        if (isNaN(date.getTime())) {
            return null;
        }
        const formattedDate = formatter.format(date);
        return formattedDate;
    }

    get subtitle() {
        if (!this.widget_options.subtitle) {
            return null;
        }
        if (this.var_param_a_date || this.var_param_complementaire || this.var_param_complementaire_supp || this.var_param_principal) {
            if (this.widget_options.subtitle.includes('#date_max#')) {
                return this.widget_options.subtitle.replaceAll('#date_max#', this.max_date);
            }
        }
        return this.widget_options.subtitle;
    }

    private async var_param_directive_function(): Promise<number> {
        if (this.var_param_complementaire && this.var_param_a_date) {
            let datas = await VarsClientController.getInstance().registerParamsAndWait([this.var_param_a_date, this.var_param_complementaire]);

            let realise: number =
                (datas && datas[this.var_param_a_date.index] && datas[this.var_param_a_date.index].value) ? datas[this.var_param_a_date.index].value : 0;

            let objectif: number =
                (datas && datas[this.var_param_complementaire.index] && datas[this.var_param_complementaire.index].value) ? datas[this.var_param_complementaire.index].value : 0;

            let ecart: number = realise - objectif;

            if (ecart < 0) {
                ecart -= ecart;
            }

            if (ecart > 30) {
                return 2;
            }

            return null;
        } else {
            return null;
        }
    }

    get widgets_by_id(): { [id: number]: DashboardWidgetVO } {
        return VOsTypesManager.vosArray_to_vosByIds(DashboardBuilderWidgetsController.getInstance().sorted_widgets);
    }

    private async mounted() {
        await ValidationFiltersWidgetController.getInstance().register_updater(
            this.dashboard_page.dashboard_id,
            this.dashboard_page.id,
            this.page_widget.id,
            this.throttled_update_visible_options.bind(this),
        );
    }

    @Watch('widget_options', { immediate: true })
    private async onchange_widget_options() {
        await this.throttled_update_visible_options();
    }

    private get_var_filter(id: number): string {
        if (!this.widget_options || !this.widget_options.vars) {
            return null;
        }

        for (let i = 0; i < this.widget_options.vars.length; i++) {
            if (this.widget_options.vars[i].id == id) {
                let var_id = this.widget_options.vars[i].var_id;
                if (var_id) {
                    if (this.widget_options.vars[i].filter_type && this.widget_options.vars[i].filter_type != 'none') {
                        return this.const_filters[this.widget_options.vars[i].filter_type].read;
                    }
                }
            }
        }
        return null;
    }

    private get_var_filter_additional_param(id: number): string {
        const res = [];
        if (!this.widget_options || !this.widget_options.vars) {
            return null;
        }

        for (let i = 0; i < this.widget_options.vars.length; i++) {
            let var_id = this.widget_options.vars[i].var_id;
            let current_id = this.widget_options.vars[i].id;
            if (current_id == id && var_id) {
                return this.widget_options.vars[i].filter_additional_params ? ObjectHandler.try_get_json(this.widget_options.vars[i].filter_additional_params) : undefined;
            }
        }
        return null;
    }

    public static get_var_custom_filters(
        var_custom_filters: { [var_param_field_name: string]: string },
        get_active_field_filters: FieldFiltersVO
    ): { [var_param_field_name: string]: ContextFilterVO } {

        /**
         * On crée le custom_filters
         */
        const custom_filters: { [var_param_field_name: string]: ContextFilterVO } = {};

        for (const var_param_field_name in var_custom_filters) {
            const custom_filter_name = var_custom_filters[var_param_field_name];

            if (!custom_filter_name) {
                continue;
            }

            const custom_filter = get_active_field_filters[ContextFilterVO.CUSTOM_FILTERS_TYPE] ? get_active_field_filters[ContextFilterVO.CUSTOM_FILTERS_TYPE][custom_filter_name] : null;

            if (!custom_filter) {
                continue;
            }

            custom_filters[var_param_field_name] = custom_filter;
        }

        return custom_filters;
    }

    get multi_var_name_code_text() {
        const res = [];

        if (!this.widget_options || !this.widget_options.vars) {
            return null;
        }

        for (let i = 0; i < this.widget_options.vars.length; i++) {
            let var_id = this.widget_options.vars[i].var_id;
            if (var_id) {
                res.push(this.widget_options.get_var_name_code_text(this.page_widget.id, var_id));
            }
        }

        return res;
    }

    get title_name_code_text(): string {
        if (!this.page_widget) {
            return null;
        }

        return this.widget_options.get_title_name_code_text(this.page_widget.id);
    }

    get widget_options() {
        if (!this.page_widget) {
            return null;
        }

        let options: VarWidgetOptions = null;
        try {
            if (this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as VarWidgetOptions;
                options = options ? new VarWidgetOptions(
                    options.var_condition_id,
                    options.icons_by_value_and_conditions,
                    options.vars,
                    options.filter_custom_field_filters,
                    options.bg_color,
                    options.fg_color_text,
                    options.style,
                    options.icon_text,
                    options.icon_size,
                    options.subtitle) : null;
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }

        return options;
    }


    get widget_style() {
        let bg_color: string = this.widget_options ? this.widget_options.bg_color : "inherit";
        if (this.widget_options.style == "weather") {
            return this.widget_options ? {
                background: bg_color,
                color: 'inherit',
                'border-radius': '25px',
            } : {}
        }
        return this.widget_options ? {
            background: bg_color,
            color: 'inherit',
        } : {}
    }


    get var_custom_filters(): { [var_param_field_name: string]: string }[] {
        if (!this.widget_options) {
            return null;
        }
        return ObjectHandler.hasAtLeastOneAttribute(this.widget_options.filter_custom_field_filters) ? this.widget_options.filter_custom_field_filters : null;
    }
}