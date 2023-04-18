import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ContextFilterVO from '../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import { ModuleTranslatableTextGetter } from '../../../InlineTranslatableText/TranslatableTextStore';
import VueComponentBase from '../../../VueComponentBase';
import { ModuleDashboardPageAction, ModuleDashboardPageGetter } from '../../page/DashboardPageStore';
import './SupervisionTypeWidgetComponent.scss';
import SupervisionTypeWidgetOptions from './options/SupervisionTypeWidgetOptions';
import SupervisedCategoryVO from '../../../../../../shared/modules/Supervision/vos/SupervisedCategoryVO';
import { query } from '../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ObjectHandler from '../../../../../../shared/tools/ObjectHandler';
import ISupervisedItemController from '../../../../../../shared/modules/Supervision/interfaces/ISupervisedItemController';
import SupervisionController from '../../../../../../shared/modules/Supervision/SupervisionController';
import EnvHandler from '../../../../../../shared/tools/EnvHandler';
import PromisePipeline from '../../../../../../shared/tools/PromisePipeline/PromisePipeline';
import ModuleAccessPolicy from '../../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ModuleDAO from '../../../../../../shared/modules/DAO/ModuleDAO';
import AjaxCacheClientController from '../../../../modules/AjaxCache/AjaxCacheClientController';
import ThrottleHelper from '../../../../../../shared/tools/ThrottleHelper';

@Component({
    template: require('./SupervisionTypeWidgetComponent.pug'),
    components: {}
})
export default class SupervisionTypeWidgetComponent extends VueComponentBase {

    @ModuleTranslatableTextGetter
    private get_flat_locale_translations: { [code_text: string]: string };

    @ModuleDashboardPageGetter
    private get_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } };

    @ModuleDashboardPageAction
    private set_active_api_type_ids: (active_api_type_ids: string[]) => void;

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    private dashboard: DashboardVO;

    @Prop({ default: null })
    private dashboard_page: DashboardPageVO;

    private selected_api_type_id: string = null;
    private available_api_type_ids: string[] = [];
    private categories_by_name: { [name: string]: SupervisedCategoryVO } = {};


    @Watch('selected_api_type_id')
    private onchange_selected_api_type_id() {

        if (!this.selected_api_type_id) {
            this.set_active_api_type_ids(null);
            return;
        }

        this.set_active_api_type_ids([this.selected_api_type_id]);
    }

    @Watch("available_api_type_ids")
    private async onchange_available_api_type_ids() {
        if (this.selected_api_type_id && this.available_api_type_ids?.indexOf(this.selected_api_type_id) == -1) {
            this.selected_api_type_id = null;
        }
    }

    /**
     * Watch on active_field_filters
     *  - Shall happen first on component init or each time active_field_filters changes
     *  - Initialize the tmp_filter_active_options with default widget options
     *
     * @returns {Promise<void>}
     */
    @Watch("get_active_field_filters", { immediate: true, deep: true })
    private async onchange_get_active_field_filters(): Promise<void> {
        await this.onchange_supervision_api_type_ids();
    }

    @Watch("supervision_api_type_ids")
    private async onchange_supervision_api_type_ids() {
        let available_api_type_ids: string[] = [];

        let limit = EnvHandler.MAX_POOL / 2;
        let promise_pipeline = new PromisePipeline(limit);

        const supervision_category_active_field_filters = this.get_active_field_filters && this.get_active_field_filters[SupervisedCategoryVO.API_TYPE_ID];

        let category_selections: SupervisedCategoryVO[] = null;

        // If there is no filter, we show all default (widget_options) ones
        if (!supervision_category_active_field_filters && !(this.supervision_api_type_ids?.length > 0)) {
            this.available_api_type_ids = this.supervision_api_type_ids;
            return;
        }

        // Shall load all supervision_api_type_ids by default
        // Show supervision_api_type_ids that match the supervision_category_active_field_filters
        for (let field_id in supervision_category_active_field_filters) {
            let filter = supervision_category_active_field_filters[field_id];

            if (!filter) {
                continue;
            }

            // Get each category from the textarray
            category_selections = filter.param_textarray?.map((category_name: string) => {
                return this.categories_by_name[category_name];
            });
        }

        // Load each supervision_api_type_ids count by selected category
        // - We must check if the controller is actif
        for (let key in this.supervision_api_type_ids) {
            let api_type_id: string = this.supervision_api_type_ids[key];

            let registered_api_type: ISupervisedItemController<any> = SupervisionController.getInstance().registered_controllers[api_type_id];

            if (!registered_api_type?.is_actif()) {
                continue;
            }

            // Load each supervision_api_type_ids count by selected category
            await promise_pipeline.push(async () => {

                if (!await ModuleAccessPolicy.getInstance().testAccess(ModuleDAO.getInstance().getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_READ, api_type_id))) {
                    return;
                }

                // Avoid load from cache
                AjaxCacheClientController.getInstance().invalidateCachesFromApiTypesInvolved([api_type_id]);

                let qb = query(api_type_id)
                    .using(this.dashboard.api_type_ids);

                if (category_selections?.length > 0) {
                    qb = qb.filter_by_num_eq('category_id', category_selections.map((cat) => cat.id));
                }

                let items_count: number = await qb.select_count();

                if (items_count > 0) {
                    available_api_type_ids.push(api_type_id);
                }
            });
        }

        await promise_pipeline.end();

        this.available_api_type_ids = available_api_type_ids;
    }

    private async mounted() {
        this.categories_by_name = ObjectHandler.getInstance().mapByStringFieldFromArray(
            await query(SupervisedCategoryVO.API_TYPE_ID).select_vos<SupervisedCategoryVO>(),
            'name'
        );
    }

    private select_api_type_id(api_type_id: string) {

        if (this.selected_api_type_id === api_type_id) {
            this.selected_api_type_id = null;
        } else {
            this.selected_api_type_id = api_type_id;
        }
    }

    get title_name_code_text() {
        if (!this.widget_options) {
            return null;
        }

        return this.widget_options.get_title_name_code_text(this.page_widget.id);
    }

    /**
     * Supervision Api Type Ids
     * - Used to filter the supervision items (sondes) from each datatable
     *
     * @returns {string[]}
     */
    get supervision_api_type_ids(): string[] {

        if (!this.widget_options) {
            return null;
        }

        return this.widget_options.supervision_api_type_ids;
    }

    get widget_options() {
        if (!this.page_widget) {
            return null;
        }

        let options: SupervisionTypeWidgetOptions = null;
        try {
            if (!!this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as SupervisionTypeWidgetOptions;
                options = options ? new SupervisionTypeWidgetOptions(
                    options.supervision_api_type_ids
                ) : null;
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }

        return options;
    }
}