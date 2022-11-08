import { debounce } from 'lodash';
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ContextFilterVO from '../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import ModuleVar from '../../../../../../shared/modules/Var/ModuleVar';
import VarsController from '../../../../../../shared/modules/Var/VarsController';
import VarDataBaseVO from '../../../../../../shared/modules/Var/vos/VarDataBaseVO';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import ObjectHandler from '../../../../../../shared/tools/ObjectHandler';
import ThrottleHelper from '../../../../../../shared/tools/ThrottleHelper';
import InlineTranslatableText from '../../../InlineTranslatableText/InlineTranslatableText';
import { ModuleTranslatableTextGetter } from '../../../InlineTranslatableText/TranslatableTextStore';
import VueComponentBase from '../../../VueComponentBase';
import { ModuleDashboardPageGetter } from '../../page/DashboardPageStore';
import VarWidgetOptions from './options/VarWidgetOptions';
import './VarWidgetComponent.scss';

@Component({
    template: require('./VarWidgetComponent.pug'),
    components: {
        Inlinetranslatabletext: InlineTranslatableText
    }
})
export default class VarWidgetComponent extends VueComponentBase {

    @ModuleDashboardPageGetter
    private get_discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } };

    @ModuleDashboardPageGetter
    private get_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } };

    @ModuleTranslatableTextGetter
    private get_flat_locale_translations: { [code_text: string]: string };

    @ModuleDashboardPageGetter
    private get_custom_filters: string[];

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    private dashboard: DashboardVO;

    @Prop({ default: null })
    private dashboard_page: DashboardPageVO;

    private throttled_update_visible_options = debounce(this.update_visible_options.bind(this), 500);

    private var_param: VarDataBaseVO = null;
    private last_calculation_cpt: number = 0;

    get var_id(): number {
        if (!this.widget_options) {
            return null;
        }

        return this.widget_options.var_id;
    }

    @Watch('get_active_field_filters', { deep: true })
    private async onchange_active_field_filters() {
        await this.throttled_update_visible_options();
    }

    get var_custom_filters(): { [var_param_field_name: string]: string } {
        if (!this.widget_options) {
            return null;
        }

        return ObjectHandler.getInstance().hasAtLeastOneAttribute(this.widget_options.filter_custom_field_filters) ? this.widget_options.filter_custom_field_filters : null;
    }

    @Watch('get_custom_filters', { deep: true })
    private async onchange_get_custom_filters() {
        if (!this.var_custom_filters) {
            return;
        }

        await this.throttled_update_visible_options();
    }

    private async update_visible_options() {

        let launch_cpt: number = (this.last_calculation_cpt + 1);

        this.last_calculation_cpt = launch_cpt;

        if (!this.var_id) {
            return this.var_param = null;
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
        let custom_filters: { [var_param_field_name: string]: ContextFilterVO } = {};

        for (let var_param_field_name in this.var_custom_filters) {
            let custom_filter_name = this.var_custom_filters[var_param_field_name];

            if (!custom_filter_name) {
                continue;
            }

            let custom_filter = this.get_active_field_filters[ContextFilterVO.CUSTOM_FILTERS_TYPE] ? this.get_active_field_filters[ContextFilterVO.CUSTOM_FILTERS_TYPE][custom_filter_name] : null;

            if (!custom_filter) {
                continue;
            }

            custom_filters[var_param_field_name] = custom_filter;
        }

        /**
         * Pour les dates il faut réfléchir....
         */
        this.var_param = await ModuleVar.getInstance().getVarParamFromContextFilters(
            VarsController.getInstance().var_conf_by_id[this.var_id].name,
            this.get_active_field_filters,
            custom_filters,
            this.dashboard.api_type_ids,
            this.get_discarded_field_paths);

        // Si je ne suis pas sur la dernière demande, je me casse
        if (this.last_calculation_cpt != launch_cpt) {
            return;
        }

        // let query = new ContextQueryVO();
        // query.base_api_type_id = this.vo_field_ref.api_type_id;
        // query.fields = [new ContextQueryFieldVO(this.vo_field_ref.api_type_id, this.vo_field_ref.field_id, 'label')];
        // query.filters = ContextFilterHandler.getInstance().get_filters_from_active_field_filters(
        //     ContextFilterHandler.getInstance().clean_context_filters_for_request(this.get_active_field_filters));
        // query.limit = this.widget_options.max_visible_options;
        // query.offset = 0;
        // query.active_api_type_ids = this.dashboard.api_type_ids;
        // let tmp = await ModuleContextFilter.getInstance().select_filter_visible_options(
        //     this.vo_field_ref.api_type_id,
        //     this.vo_field_ref.field_id,
        //     ContextFilterHandler.getInstance().clean_context_filters_for_request(this.get_active_field_filters),
        //     this.actual_query,
        //     this.widget_options.max_visible_options,
        //     0);

        // if (!tmp) {
        //     this.filter_visible_options = [];
        // } else {
        //     this.filter_visible_options = tmp;
        // }
    }

    @Watch('widget_options', { immediate: true })
    private async onchange_widget_options() {

        await this.throttled_update_visible_options();
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
            if (!!this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as VarWidgetOptions;
                options = options ? new VarWidgetOptions(
                    options.var_id,
                    options.filter_type,
                    options.filter_custom_field_filters,
                    options.filter_additional_params) : null;
            }
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
        }

        return options;
    }

    get var_filter(): string {
        if (!this.widget_options) {
            return null;
        }

        return this.widget_options.filter_type ? this.const_filters[this.widget_options.filter_type].read : undefined;
    }

    get var_filter_additional_params(): string {
        if (!this.widget_options) {
            return null;
        }

        return this.widget_options.filter_additional_params ? JSON.parse(this.widget_options.filter_additional_params) : undefined;
    }
}