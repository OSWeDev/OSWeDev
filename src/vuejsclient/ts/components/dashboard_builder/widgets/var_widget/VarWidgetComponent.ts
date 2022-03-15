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
    private get_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } };

    @ModuleTranslatableTextGetter
    private get_flat_locale_translations: { [code_text: string]: string };

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    private dashboard: DashboardVO;

    @Prop({ default: null })
    private dashboard_page: DashboardPageVO;

    private throttled_update_visible_options = debounce(this.update_visible_options.bind(this), 500);

    private var_param: VarDataBaseVO = null;

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

    private async update_visible_options() {

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

        this.widget_options.title_name_code_text

        /**
         * Pour les dates il faut réfléchir....
         */
        this.var_param = await ModuleVar.getInstance().getVarParamFromContextFilters(
            VarsController.getInstance().var_conf_by_id[this.var_id].name,
            this.get_active_field_filters,
            custom_filters,
            this.dashboard.api_type_ids);

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
        return this.widget_options.title_name_code_text;
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
                    options.page_widget_id,
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