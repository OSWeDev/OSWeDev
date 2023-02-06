import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ContextFilterHandler from '../../../../../../shared/modules/ContextFilter/ContextFilterHandler';
import ContextFilterVO from '../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import VOFieldRefVO from '../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import NumRange from '../../../../../../shared/modules/DataRender/vos/NumRange';
import NumSegment from '../../../../../../shared/modules/DataRender/vos/NumSegment';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import RangeHandler from '../../../../../../shared/tools/RangeHandler';
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
    private categorys_by_name: { [name: string]: SupervisedCategoryVO } = {};

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
        if (this.selected_api_type_id && this.available_api_type_ids && this.available_api_type_ids.indexOf(this.selected_api_type_id) == -1) {
            this.selected_api_type_id = null;
        }
    }

    @Watch("get_active_field_filters", { immediate: true })
    private async onchange_get_active_field_filters() {
        await this.onchange_supervision_api_type_ids();
    }

    @Watch("supervision_api_type_ids")
    private async onchange_supervision_api_type_ids() {
        let available_api_type_ids: string[] = this.supervision_api_type_ids;

        if (!available_api_type_ids || !available_api_type_ids.length) {
            this.available_api_type_ids = available_api_type_ids;
            return;
        }

        let limit = EnvHandler.MAX_POOL / 2;
        let promise_pipeline = new PromisePipeline(limit);

        if (this.get_active_field_filters && this.get_active_field_filters[SupervisedCategoryVO.API_TYPE_ID]) {
            for (let field_id in this.get_active_field_filters[SupervisedCategoryVO.API_TYPE_ID]) {
                if (!this.get_active_field_filters[SupervisedCategoryVO.API_TYPE_ID][field_id]) {
                    continue;
                }

                available_api_type_ids = [];

                let category: SupervisedCategoryVO = this.categorys_by_name[this.get_active_field_filters[SupervisedCategoryVO.API_TYPE_ID][field_id].param_text];

                if (!category) {
                    continue;
                }

                for (let i in this.supervision_api_type_ids) {
                    let api_type_id: string = this.supervision_api_type_ids[i];

                    let registered_api_type: ISupervisedItemController<any> = SupervisionController.getInstance().registered_controllers[api_type_id];

                    if (!registered_api_type || !registered_api_type.is_actif()) {
                        continue;
                    }

                    // Récupération des sondes
                    await promise_pipeline.push(async () => {

                        if (!await ModuleAccessPolicy.getInstance().testAccess(ModuleDAO.getInstance().getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_READ, api_type_id))) {
                            return;
                        }

                        // pour éviter de récuperer le cache
                        AjaxCacheClientController.getInstance().invalidateCachesFromApiTypesInvolved([api_type_id]);
                        let items_count: number = await query(api_type_id)
                            .using(this.dashboard.api_type_ids)
                            .select_count();

                        if (items_count > 0) {
                            available_api_type_ids.push(api_type_id);
                        }
                    });
                }
            }

            await promise_pipeline.end();
        }

        this.available_api_type_ids = available_api_type_ids;
    }

    private async mounted() {
        this.categorys_by_name = ObjectHandler.getInstance().mapByStringFieldFromArray(
            await query(SupervisedCategoryVO.API_TYPE_ID).select_vos<SupervisedCategoryVO>(),
            'name'
        );
    }

    private select_api_type_id(api_type_id: string) {
        this.selected_api_type_id = api_type_id;
    }

    get title_name_code_text() {
        if (!this.widget_options) {
            return null;
        }

        return this.widget_options.get_title_name_code_text(this.page_widget.id);
    }

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