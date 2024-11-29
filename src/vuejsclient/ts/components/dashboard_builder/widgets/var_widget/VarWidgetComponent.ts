import { debounce } from 'lodash';
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

    private throttled_update_visible_options = debounce(this.update_visible_options.bind(this), 500);
    private throttle_do_update_visible_options = debounce(this.do_update_visible_options.bind(this), 500);

    private var_param: VarDataBaseVO = null;
    private last_calculation_cpt: number = 0;

    private var_param_no_value_or_param_is_invalid: boolean = false;

    get var_filter(): string {
        if (!this.widget_options) {
            return null;
        }

        return (this.widget_options.filter_type && this.const_filters[this.widget_options.filter_type]) ? this.const_filters[this.widget_options.filter_type].read : undefined;
    }

    get var_filter_additional_params(): string {
        if (!this.widget_options) {
            return null;
        }

        return this.widget_options.filter_additional_params ? ObjectHandler.try_get_json(this.widget_options.filter_additional_params) : undefined;
    }

    get var_id(): number {
        if (!this.widget_options) {
            return null;
        }

        return this.widget_options.var_id;
    }

    get var_custom_filters(): { [var_param_field_name: string]: string } {
        if (!this.widget_options) {
            return null;
        }

        return ObjectHandler.hasAtLeastOneAttribute(this.widget_options.filter_custom_field_filters) ? this.widget_options.filter_custom_field_filters : null;
    }

    get widgets_by_id(): { [id: number]: DashboardWidgetVO } {
        return VOsTypesManager.vosArray_to_vosByIds(DashboardBuilderWidgetsController.getInstance().sorted_widgets);
    }

    get title_name_code_text() {
        if (!this.widget_options) {
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
                    options.var_id,
                    options.filter_type,
                    options.filter_custom_field_filters,
                    options.filter_additional_params,
                    options.bg_color,
                    options.fg_color_value,
                    options.fg_color_text) : null;
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }
        return options;
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


    @Watch('get_active_field_filters', { deep: true })
    private async onchange_active_field_filters() {
        await this.throttled_update_visible_options();
    }






    @Watch('widget_options', { immediate: true })
    private async onchange_widget_options() {
        await this.throttled_update_visible_options();
    }

    private async update_visible_options(force: boolean = false) {

        // Si j'ai mon bouton de validation des filtres qui est actif, j'attends que ce soit lui qui m'appelle
        if ((!force) && this.has_widget_validation_filtres()) {
            return;
        }


        await this.throttle_do_update_visible_options();
    }

    private has_widget_validation_filtres(): boolean {

        if (!this.all_page_widget) {
            return false;
        }

        for (const i in this.all_page_widget) {
            const widget: DashboardWidgetVO = this.widgets_by_id[this.all_page_widget[i].widget_id];

            if (!widget) {
                continue;
            }

            if (widget.is_validation_filters) {
                return true;
            }
        }

        return false;
    }

    private async mounted() {
        await ValidationFiltersWidgetController.getInstance().register_updater(
            this.dashboard_page.dashboard_id,
            this.dashboard_page.id,
            this.page_widget.id,
            this.throttle_do_update_visible_options.bind(this),
        );
    }

    private async do_update_visible_options() {

        const launch_cpt: number = (this.last_calculation_cpt + 1);

        this.last_calculation_cpt = launch_cpt;

        if (!this.var_id) {
            this.var_param = null;
            this.var_param_no_value_or_param_is_invalid = false;
            return;
        }

        /**
         * Reconstruire le param depuis les filtrages actuels.
         *  TODO FIXME : Comment on peut passer cette phase côté serveur pour pas avoir besoin de requêter la base ?
         *  et peut-être comment on peut ne pas avoir besoin de requêter du tout et faire marcher les vars directement avec le
         *  context de filtrage et le moins d'impacts possible ? Au final c'est les datasources et la transformation des params quand on change
         *  de dep qui utilisent, ou modifient, le contexte de filtrage. A creuser.
         */

        /**
         * On crée le custom_filters
         */
        const custom_filters: { [var_param_field_name: string]: ContextFilterVO } = VarWidgetComponent.get_var_custom_filters(this.var_custom_filters, this.get_active_field_filters);

        /**
         * Pour les dates il faut réfléchir....
         */
        this.var_param = await ModuleVar.getInstance().getVarParamFromContextFilters(
            VarsController.var_conf_by_id[this.var_id].name,
            this.get_active_field_filters,
            custom_filters,
            this.get_dashboard_api_type_ids,
            this.get_discarded_field_paths);

        // Si je ne suis pas sur la dernière demande, je me casse
        if (this.last_calculation_cpt != launch_cpt) {
            return;
        }

        if (!this.var_param) {
            this.var_param_no_value_or_param_is_invalid = true;
        } else {
            this.var_param_no_value_or_param_is_invalid = false;
        }


        // let query = new ContextQueryVO();
        // query.base_api_type_id = this.vo_field_ref.api_type_id;
        // query.fields = [new ContextQueryFieldVO(this.vo_field_ref.api_type_id, this.vo_field_ref.field_id, 'label')];
        // query.filters = ContextFilterVOManager.get_context_filters_from_active_field_filters(
        //     FieldFiltersVOManager.clean_field_filters_for_request(this.get_active_field_filters));
        // query.limit = this.widget_options.max_visible_options;
        // query.offset = 0;
        // query.active_api_type_ids = this.get_dashboard_api_type_ids;
        // let tmp = await ModuleContextFilter.instance.select_filter_visible_options(
        //     this.vo_field_ref.api_type_id,
        //     this.vo_field_ref.field_id,
        //     FieldFiltersVOManager.clean_field_filters_for_request(this.get_active_field_filters),
        //     this.actual_query,
        //     this.widget_options.max_visible_options,
        //     0);

        // if (!tmp) {
        //     this.filter_visible_options = [];
        // } else {
        //     this.filter_visible_options = tmp;
        // }
    }
}