import { cloneDeep, isEqual } from 'lodash';
import Component from 'vue-class-component';
import { Prop, Vue, Watch } from 'vue-property-decorator';
import ModuleAccessPolicy from '../../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ContextFilterHandler from '../../../../../../shared/modules/ContextFilter/ContextFilterHandler';
import ModuleContextFilter from '../../../../../../shared/modules/ContextFilter/ModuleContextFilter';
import ContextFilterVO from '../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import { query } from '../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import SortByVO from '../../../../../../shared/modules/ContextFilter/vos/SortByVO';
import ModuleDAO from '../../../../../../shared/modules/DAO/ModuleDAO';
import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import Dates from '../../../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import IDistantVOBase from '../../../../../../shared/modules/IDistantVOBase';
import ISupervisedItem from '../../../../../../shared/modules/Supervision/interfaces/ISupervisedItem';
import ISupervisedItemController from '../../../../../../shared/modules/Supervision/interfaces/ISupervisedItemController';
import SupervisionController from '../../../../../../shared/modules/Supervision/SupervisionController';
import VOsTypesManager from '../../../../../../shared/modules/VOsTypesManager';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import EnvHandler from '../../../../../../shared/tools/EnvHandler';
import PromisePipeline from '../../../../../../shared/tools/PromisePipeline/PromisePipeline';
import ThreadHandler from '../../../../../../shared/tools/ThreadHandler';
import ThrottleHelper from '../../../../../../shared/tools/ThrottleHelper';
import AjaxCacheClientController from '../../../../modules/AjaxCache/AjaxCacheClientController';
import { ModuleDAOAction, ModuleDAOGetter } from '../../../dao/store/DaoStore';
import InlineTranslatableText from '../../../InlineTranslatableText/InlineTranslatableText';
import { ModuleTranslatableTextGetter } from '../../../InlineTranslatableText/TranslatableTextStore';
import VueComponentBase from '../../../VueComponentBase';
import { ModuleDashboardPageAction, ModuleDashboardPageGetter } from '../../page/DashboardPageStore';
import TablePaginationComponent from '../table_widget/pagination/TablePaginationComponent';
import SupervisionWidgetOptions from './options/SupervisionWidgetOptions';
import './SupervisionWidgetComponent.scss';
import SupervisionWidgetController from './SupervisionWidgetController';
import SupervisionItemModalComponent from './supervision_item_modal/SupervisionItemModalComponent';
import { ContextFilterVOManager } from '../../../../../../shared/modules/ContextFilter/manager/ContextFilterVOManager';

@Component({
    template: require('./SupervisionWidgetComponent.pug'),
    components: {
        Inlinetranslatabletext: InlineTranslatableText,
        Tablepaginationcomponent: TablePaginationComponent,
    }
})
export default class SupervisionWidgetComponent extends VueComponentBase {

    @ModuleDAOGetter
    private getStoredDatas: { [API_TYPE_ID: string]: { [id: number]: IDistantVOBase } };

    @ModuleDAOAction
    private storeDatas: (infos: { API_TYPE_ID: string, vos: IDistantVOBase[] }) => void;

    @ModuleDashboardPageAction
    private set_query_api_type_ids: (query_api_type_ids: string[]) => void;
    @ModuleDashboardPageGetter
    private get_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } };
    @ModuleDashboardPageGetter
    private get_Supervisionitemmodal: SupervisionItemModalComponent;
    @ModuleDashboardPageGetter
    private get_active_api_type_ids: string[];

    @ModuleTranslatableTextGetter
    private get_flat_locale_translations: { [code_text: string]: string };

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    private dashboard: DashboardVO;

    @Prop({ default: null })
    private dashboard_page: DashboardPageVO;

    private throttled_update_visible_options = ThrottleHelper.getInstance().declare_throttle_without_args(this.update_visible_options.bind(this), 100, { leading: false, trailing: true });

    private pagination_count: number = 0;
    private pagination_offset: number = 0;
    private loaded_once: boolean = false;
    private is_busy: boolean = false;

    private items: ISupervisedItem[] = [];
    private selected_items: { [identifier: string]: boolean } = {};
    private items_by_identifier: { [identifier: string]: ISupervisedItem } = {};

    private last_calculation_cpt: number = 0;
    private old_widget_options: SupervisionWidgetOptions = null;

    @Watch('widget_options', { immediate: true })
    private onchange_widget_options() {
        if (!!this.old_widget_options) {
            if (isEqual(this.widget_options, this.old_widget_options)) {
                return;
            }
        }

        this.old_widget_options = cloneDeep(this.widget_options);
        this.set_query_api_type_ids(this.widget_options.supervision_api_type_ids);

        this.selected_items = {};

        this.throttled_update_visible_options();
    }

    @Watch('get_active_field_filters', { deep: true })
    @Watch('get_active_api_type_ids')
    private onchange_active_field_filters() {
        this.is_busy = true;

        this.selected_items = {};

        this.throttled_update_visible_options();
    }

    private async mounted() {
        this.stopLoading();

        if (this.widget_options && this.widget_options.auto_refresh) {
            await this.start_auto_refresh();
        }

        await this.update_visible_options();
    }

    private async start_auto_refresh() {
        if (!this.widget_options.auto_refresh || !this.widget_options.auto_refresh_seconds) {
            return;
        }

        while (true) {
            if (!this.widget_options.auto_refresh) {
                return;
            }

            await ThreadHandler.sleep((this.widget_options.auto_refresh_seconds * 1000));

            await this.throttled_update_visible_options();
        }
    }

    private async change_offset(new_offset: number) {
        if (new_offset != this.pagination_offset) {
            this.pagination_offset = new_offset;

            this.selected_items = {};

            await this.throttled_update_visible_options();
        }
    }

    private async update_visible_options() {

        let rows: ISupervisedItem[] = [];
        let pagination_count: number = 0;

        let launch_cpt: number = (this.last_calculation_cpt + 1);

        this.last_calculation_cpt = launch_cpt;

        this.is_busy = true;

        if (!this.widget_options) {
            this.pagination_count = pagination_count;
            this.loaded_once = true;
            this.is_busy = false;
            this.items = rows;
            return;
        }

        if (!(this.widget_options?.supervision_api_type_ids?.length > 0)) {
            this.pagination_count = pagination_count;
            this.loaded_once = true;
            this.is_busy = false;
            this.items = rows;
            return;
        }

        const limit = EnvHandler.MAX_POOL / 2;
        const promise_pipeline = new PromisePipeline(limit);

        const custom_active_field_filters_by_api_type_id: { [api_type_id: string]: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } } } = {};
        let context_filters_for_request: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } } = this.get_active_field_filters;
        if (context_filters_for_request[ContextFilterVO.CUSTOM_FILTERS_TYPE]) {
            delete context_filters_for_request[ContextFilterVO.CUSTOM_FILTERS_TYPE];
        }

        let available_api_type_ids: string[] = [];

        if (this.get_active_api_type_ids?.length > 0) {
            // Setted Api type ids (default or setted from filters)
            available_api_type_ids = this.get_active_api_type_ids;
        } else {
            // Default (from widget) Api type ids
            available_api_type_ids = this.widget_options.supervision_api_type_ids;
        }

        for (let api_type_id in context_filters_for_request) {

            for (let i in available_api_type_ids) {
                let api_type_id_sup: string = available_api_type_ids[i];

                if (!custom_active_field_filters_by_api_type_id[api_type_id_sup]) {
                    custom_active_field_filters_by_api_type_id[api_type_id_sup] = {};
                }

                if (!this.widget_options.supervision_api_type_ids?.includes(api_type_id)) {
                    custom_active_field_filters_by_api_type_id[api_type_id_sup][api_type_id] = context_filters_for_request[api_type_id];
                    continue;
                }

                custom_active_field_filters_by_api_type_id[api_type_id_sup][api_type_id_sup] = cloneDeep(context_filters_for_request[api_type_id]);

                for (let field_id in custom_active_field_filters_by_api_type_id[api_type_id_sup][api_type_id_sup]) {
                    if (!custom_active_field_filters_by_api_type_id[api_type_id_sup][api_type_id_sup][field_id]) {
                        continue;
                    }

                    custom_active_field_filters_by_api_type_id[api_type_id_sup][api_type_id_sup][field_id].vo_type = api_type_id_sup;
                }
            }
        }

        /**
         * On est dans un contexte très spécifique : les supervisions
         * Chaque type de supervision est forcément lié à la table des types de supervision
         * donc on ne peut avoir aucune dépendance entre les types de supervision puisque cela signifierait un cycle
         * du coup on peut ignorer totalement les filtres des autres types de supervision lors de la requete pour un type donné
         * et on le fait pour éviter d'avoir des left join (parcours des api_type dans la génération des requetes) sur tous
         * les types de supervision, alors qu'on fait une requete par type et qu'on aggrège les résultats par la suite.
         */

        for (const key_i in available_api_type_ids) {
            const api_type_id: string = available_api_type_ids[key_i];

            let registered_api_type: ISupervisedItemController<any> = SupervisionController.getInstance().registered_controllers[api_type_id];

            if (!registered_api_type?.is_actif()) {
                continue;
            }

            const field_filters = this.filter_context_filter_by_supervision_type(
                Object.assign({}, custom_active_field_filters_by_api_type_id[api_type_id]),
                api_type_id
            );

            const filters: ContextFilterVO[] = ContextFilterHandler.getInstance().get_filters_from_active_field_filters(
                field_filters,
            );

            // Récupération des sondes
            await promise_pipeline.push(async () => {

                if (!await ModuleAccessPolicy.getInstance().testAccess(ModuleDAO.getInstance().getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_READ, api_type_id))) {
                    return;
                }

                // Avoid load from cache
                AjaxCacheClientController.getInstance().invalidateCachesFromApiTypesInvolved([api_type_id]);

                let rows_s: ISupervisedItem[] = await query(api_type_id)
                    .set_limit((this.pagination_offset ? this.pagination_offset : this.limit))
                    .using(this.dashboard.api_type_ids)
                    .add_filters(filters)
                    .set_sort(new SortByVO(api_type_id, 'name', true))
                    .select_vos<ISupervisedItem>();

                for (const key_j in rows_s) {

                    let row = rows_s[key_j];

                    // Si j'ai une fonction de filtre, je l'utilise
                    if (
                        SupervisionWidgetController.getInstance().is_item_accepted &&
                        SupervisionWidgetController.getInstance().is_item_accepted[this.dashboard.id] &&
                        !SupervisionWidgetController.getInstance().is_item_accepted[this.dashboard.id](row)
                    ) {
                        continue;
                    }

                    rows.push(row);
                    // new_supervised_items_by_names[item.name] = item;
                    // new_supervised_items_by_cat_id[item.category_id] = item;

                    // if (first_build) {
                    //     if (!api_type_ids_by_category_ids[item.category_id]) {
                    //         api_type_ids_by_category_ids[item.category_id] = [];
                    //     }

                    //     if (!already_add_api_type_ids_by_category_ids[item.category_id]) {
                    //         already_add_api_type_ids_by_category_ids[item.category_id] = {};
                    //     }

                    //     if (!already_add_api_type_ids_by_category_ids[item.category_id][item._type]) {
                    //         already_add_api_type_ids_by_category_ids[item.category_id][item._type] = true;
                    //         api_type_ids_by_category_ids[item.category_id].push(item._type);
                    //         api_type_ids.push(api_type_id);
                    //     }
                    // }
                }
            });

            await promise_pipeline.push(async () => {

                if (!await ModuleAccessPolicy.getInstance().testAccess(ModuleDAO.getInstance().getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_READ, api_type_id))) {
                    return;
                }

                // pour éviter de récuperer le cache
                let items_c: number = await query(api_type_id)
                    .using(this.dashboard.api_type_ids)
                    .add_filters(filters)
                    .select_count();

                if (items_c) {
                    pagination_count += items_c;
                }
            });
        }

        await promise_pipeline.end();

        // Si je ne suis pas sur la dernière demande, je me casse
        if (this.last_calculation_cpt != launch_cpt) {
            return;
        }

        rows.sort((a, b) => {
            return a.name.localeCompare(b.name);
        });

        this.loaded_once = true;
        this.is_busy = false;
        this.items = rows.splice(this.pagination_offset, this.limit);
        this.pagination_count = pagination_count;

        let items_by_identifier: { [identifier: string]: ISupervisedItem } = {};

        for (let i in this.items) {
            const item = this.items[i];

            items_by_identifier[this.get_identifier(item)] = item;
        }

        this.items_by_identifier = items_by_identifier;
    }

    private filter_context_filter_by_supervision_type(
        context_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } },
        supervision_type: string
    ): { [api_type_id: string]: { [field_id: string]: ContextFilterVO } } {

        let available_api_type_ids: string[] = [];

        if (this.get_active_api_type_ids?.length > 0) {
            // Setted Api type ids (default or setted from filters)
            available_api_type_ids = this.get_active_api_type_ids;
        } else {
            // Default (from widget) Api type ids
            available_api_type_ids = this.widget_options.supervision_api_type_ids;
        }

        for (let i in available_api_type_ids) {
            let api_type_id = available_api_type_ids[i];

            if (api_type_id != supervision_type) {
                delete context_filters[api_type_id];
            }

            // On supprime aussi de l'arbre tous les filtres qui ne sont pas du bon type de supervision
            let field_filters = context_filters[api_type_id];
            for (let field_id in field_filters) {

                if (!field_filters[field_id]) {
                    continue;
                }

                field_filters[field_id] = ContextFilterVOManager.filter_context_filter_tree_by_vo_type(field_filters[field_id], supervision_type, available_api_type_ids);
            }
        }

        return context_filters;
    }

    private async refresh() {
        AjaxCacheClientController.getInstance().invalidateUsingURLRegexp(new RegExp('.*' + ModuleContextFilter.APINAME_select_vos));
        AjaxCacheClientController.getInstance().invalidateUsingURLRegexp(new RegExp('.*' + ModuleContextFilter.APINAME_select_count));
        await this.throttled_update_visible_options();
    }

    private openModal(item: ISupervisedItem) {
        this.get_Supervisionitemmodal.openmodal(item);
    }

    private get_date(item: ISupervisedItem): string {
        let field = VOsTypesManager.moduleTables_by_voType[item._type].getFieldFromId('last_update');
        return field ? Dates.format_segment(item.last_update, field.segmentation_type, field.format_localized_time) : null;
    }

    private select_unselect_all(value: boolean) {
        for (let i in this.items) {
            let item = this.items[i];

            let identifier: string = this.get_identifier(item);

            Vue.set(this.selected_items, identifier, value);
        }
    }

    private async mark_as_unread() {
        let tosave: ISupervisedItem[] = [];

        for (let identifier in this.selected_items) {
            if (!this.selected_items[identifier]) {
                continue;
            }

            let item: ISupervisedItem = this.items_by_identifier[identifier];

            if (!item) {
                continue;
            }

            switch (item.state) {
                case SupervisionController.STATE_ERROR_READ:
                    item.state = SupervisionController.STATE_ERROR;
                    tosave.push(item);
                    break;
                case SupervisionController.STATE_WARN_READ:
                    item.state = SupervisionController.STATE_WARN;
                    tosave.push(item);
                    break;
            }
        }

        if (tosave.length) {
            await ModuleDAO.getInstance().insertOrUpdateVOs(tosave);
            await this.refresh();
        }
    }

    private async mark_as_read() {
        let tosave: ISupervisedItem[] = [];

        for (let identifier in this.selected_items) {
            if (!this.selected_items[identifier]) {
                continue;
            }

            let item: ISupervisedItem = this.items_by_identifier[identifier];

            if (!item) {
                continue;
            }

            switch (item.state) {
                case SupervisionController.STATE_ERROR:
                    item.state = SupervisionController.STATE_ERROR_READ;
                    tosave.push(item);
                    break;
                case SupervisionController.STATE_WARN:
                    item.state = SupervisionController.STATE_WARN_READ;
                    tosave.push(item);
                    break;
            }
        }

        if (tosave.length) {
            await ModuleDAO.getInstance().insertOrUpdateVOs(tosave);
            await this.refresh();
        }
    }

    private get_identifier(item: ISupervisedItem): string {
        return item._type + '_' + item.id;
    }

    get refresh_button(): boolean {
        return this.widget_options && this.widget_options.refresh_button;
    }

    get show_bulk_edit(): boolean {
        return this.widget_options && this.widget_options.show_bulk_edit;
    }

    get limit(): number {
        if (!this.widget_options) {
            return 100;
        }

        return this.widget_options.limit;
    }

    get widget_options(): SupervisionWidgetOptions {
        if (!this.page_widget) {
            return null;
        }

        let options: SupervisionWidgetOptions = null;
        try {
            if (!!this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as SupervisionWidgetOptions;
                options = options ? new SupervisionWidgetOptions(
                    options.limit,
                    options.supervision_api_type_ids,
                    options.refresh_button,
                    options.auto_refresh,
                    options.auto_refresh_seconds,
                    options.show_bulk_edit,
                ) : null;
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }

        return options;
    }

    get title_name_code_text() {
        if (!this.widget_options) {
            return null;
        }
        return this.widget_options.get_title_name_code_text(this.page_widget.id);
    }

    get checklist_header_title(): string {
        if ((!this.widget_options) || (!this.page_widget)) {
            return null;
        }

        return this.get_flat_locale_translations[this.widget_options.get_title_name_code_text(this.page_widget.id)];
    }
}