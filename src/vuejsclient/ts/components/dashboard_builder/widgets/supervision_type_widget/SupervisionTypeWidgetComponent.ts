import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import SupervisionTypeWidgetManager from '../../../../../../shared/modules/DashboardBuilder/manager/SupervisionTypeWidgetManager';
import SupervisionTypeWidgetOptionsVO from '../../../../../../shared/modules/DashboardBuilder/vos/SupervisionTypeWidgetOptionsVO';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import SupervisedCategoryVO from '../../../../../../shared/modules/Supervision/vos/SupervisedCategoryVO';
import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import FieldFiltersVO from '../../../../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO';
import DashboardVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import { ModuleTranslatableTextGetter } from '../../../InlineTranslatableText/TranslatableTextStore';
import { ModuleDashboardPageAction, ModuleDashboardPageGetter } from '../../page/DashboardPageStore';
import VueComponentBase from '../../../VueComponentBase';
import './SupervisionTypeWidgetComponent.scss';
import SupervisedProbeVO from '../../../../../../shared/modules/Supervision/vos/SupervisedProbeVO';
import SupervisionController from '../../../../../../shared/modules/Supervision/SupervisionController';
import { query } from '../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ObjectHandler, { field_names } from '../../../../../../shared/tools/ObjectHandler';
import ContextFilterVO, { filter } from '../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import ISupervisedItem from '../../../../../../shared/modules/Supervision/interfaces/ISupervisedItem';
import ThrottleHelper from '../../../../../../shared/tools/ThrottleHelper';
import ThreadHandler from '../../../../../../shared/tools/ThreadHandler';
import AjaxCacheClientController from '../../../../modules/AjaxCache/AjaxCacheClientController';
import SupervisedProbeGroupVO from '../../../../../../shared/modules/Supervision/vos/SupervisedProbeGroupVO';

@Component({
    template: require('./SupervisionTypeWidgetComponent.pug'),
    components: {},
})
export default class SupervisionTypeWidgetComponent extends VueComponentBase {

    @ModuleTranslatableTextGetter
    private get_flat_locale_translations: { [code_text: string]: string };

    @ModuleDashboardPageGetter
    private get_active_field_filters: FieldFiltersVO;

    @ModuleDashboardPageGetter
    private get_active_api_type_ids: string[];

    @ModuleDashboardPageGetter
    private get_query_api_type_ids: string[];

    @ModuleDashboardPageAction
    private set_active_field_filter: (param: { vo_type: string, field_id: string, active_field_filter: ContextFilterVO }) => void;

    @ModuleDashboardPageAction
    private remove_active_field_filter: (params: { vo_type: string, field_id: string }) => void;

    @ModuleDashboardPageAction
    private set_active_api_type_ids: (active_api_type_ids: string[]) => void;

    @ModuleDashboardPageAction
    private set_page_widget: (page_widget: DashboardPageWidgetVO) => void;

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    private dashboard: DashboardVO;

    @Prop({ default: null })
    private dashboard_page: DashboardPageVO;

    private selected_state: number = null;
    private selected_api_type_id: string = null;

    private available_api_type_ids: string[] = [];
    private available_api_type_ids_by_cat_ids: { [cat_id: string]: string[] } = {};

    private categories_ordered: SupervisedCategoryVO[] = [];
    private probes_by_sup_api_type_ids: { [sup_api_type_id: string]: SupervisedProbeVO } = {};
    private groups: SupervisedProbeGroupVO[] = [];

    private opacityApitypeState: { [sup_api_type_id_state: string]: boolean } = {};

    private count_by_sup_api_type_ids: { [sup_api_type_id: string]: { [state: number]: number } } = {};
    private count_by_sup_by_cat: { [cat_id: number]: { [state: number]: number } } = {};

    private loaded_once: boolean = false;
    private is_busy: boolean = false;

    // Dictionnaire pour mémoriser l’état ouvert/fermé de chaque cat
    private isPanelOpenCat: { [catId: number]: boolean } = {};

    private all_states: number[] = [
        SupervisionController.STATE_ERROR,
        SupervisionController.STATE_ERROR_READ,
        SupervisionController.STATE_WARN,
        SupervisionController.STATE_WARN_READ,
        SupervisionController.STATE_OK,
        SupervisionController.STATE_PAUSED,
        // SupervisionController.STATE_UNKOWN
    ];

    private selectedApitypeState: string = null;

    private throttled_load_counter = ThrottleHelper.declare_throttle_without_args(
        'SupervisionTypeWidgetComponent.throttled_load_counter',
        this.load_counter.bind(this),
        50,
        false
    );

    get title_name_code_text() {
        if (!this.widget_options) {
            return null;
        }

        return this.widget_options.get_title_name_code_text(this.page_widget.id);
    }

    /**
     * Supervision Api Type Ids
     * - Used to filter the supervision items (sondes) from each datatable
     * @returns {string[]}
     */
    get supervision_api_type_ids(): string[] {

        if (!this.widget_options) {
            return null;
        }

        return this.widget_options.supervision_api_type_ids;
    }

    /**
     * if true, the supervision items (sondes) will be ordered by categories
     * @returns {string[]}
     */
    get order_by_categories(): boolean {

        if (!this.widget_options) {
            return null;
        }

        return this.widget_options.order_by_categories;
    }

    /**
     *  if true, the supervision items (sondes) will display a counter
     * @returns {string[]}
     */
    get show_counter(): boolean {

        if (!this.widget_options) {
            return null;
        }

        return this.widget_options.show_counter;
    }

    get widget_options() {
        if (!this.page_widget) {
            return null;
        }

        let options: SupervisionTypeWidgetOptionsVO = null;
        try {
            if (this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as SupervisionTypeWidgetOptionsVO;
                options = options ? new SupervisionTypeWidgetOptionsVO(
                    options.supervision_api_type_ids,
                    options.order_by_categories,
                    options.show_counter,
                    options.refresh_button,
                    options.auto_refresh,
                    options.auto_refresh_seconds
                ) : null;
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }

        return options;
    }

    get refresh_button(): boolean {
        return this.widget_options && this.widget_options.refresh_button;
    }

    @Watch('selected_api_type_id')
    private onchange_selected_api_type_id() {

        if (!this.selected_api_type_id) {
            this.set_active_api_type_ids([]);
            return;
        }

        if (this.selected_state !== null) {
            if (!!this.available_api_type_ids?.length && (this.selected_state !== null)) {
                for (const i in this.available_api_type_ids) {
                    if (this.available_api_type_ids[i] == this.selected_api_type_id) {
                        continue;
                    }

                    this.remove_active_field_filter({
                        field_id: field_names<ISupervisedItem>().state,
                        vo_type: this.available_api_type_ids[i],
                    });
                }
            }
            this.set_active_field_filter({
                field_id: field_names<ISupervisedItem>().state,
                vo_type: this.selected_api_type_id,
                active_field_filter: filter(this.selected_api_type_id, field_names<ISupervisedItem>().state).by_num_eq(this.selected_state)
            });
        }
        this.set_active_api_type_ids([this.selected_api_type_id]);
    }

    @Watch('selected_state')
    private onchange_selected_state() {

        console.log('onchange_selected_state ' + this.selected_state);

        if (this.selected_state === null) {
            if (!!this.available_api_type_ids?.length) {
                for (const i in this.available_api_type_ids) {
                    this.remove_active_field_filter({
                        field_id: field_names<ISupervisedItem>().state,
                        vo_type: this.available_api_type_ids[i],
                    });
                }
            }
            return;
        }

        if (!!this.available_api_type_ids?.length && (this.selected_api_type_id !== null)) {
            for (const i in this.available_api_type_ids) {
                if (this.available_api_type_ids[i] == this.selected_api_type_id) {
                    continue;
                }

                this.remove_active_field_filter({
                    field_id: field_names<ISupervisedItem>().state,
                    vo_type: this.available_api_type_ids[i],
                });
            }
        }

        this.set_active_field_filter({
            field_id: field_names<ISupervisedItem>().state,
            vo_type: this.selected_api_type_id,
            active_field_filter: filter(this.selected_api_type_id, field_names<ISupervisedItem>().state).by_num_eq(this.selected_state)
        });
    }

    @Watch("available_api_type_ids")
    private async onchange_available_api_type_ids() {
        if (this.selected_api_type_id && this.available_api_type_ids?.indexOf(this.selected_api_type_id) == -1) {
            this.selected_api_type_id = null;
            this.available_api_type_ids_by_cat_ids = {};
        }
    }

    /**
     * Watch on active_field_filters
     *  - Shall happen first on component init or each time active_field_filters changes
     *
     * @returns {Promise<void>}
     */
    @Watch("get_active_field_filters", { immediate: true, deep: true })
    private async onchange_get_active_field_filters(): Promise<void> {
        await this.onchange_supervision_api_type_ids();
    }

    /**
     * Watch on supervision_api_type_ids
     * - Shall happen first on component init or each time supervision_api_type_ids changes
     * - Initialize the available_api_type_ids with the loaded supervision_api_type_ids
     */
    @Watch("supervision_api_type_ids")
    private async onchange_supervision_api_type_ids() {
        const has_supervision_group_selection_filters = (!!this.get_active_field_filters && !!this.get_active_field_filters[SupervisedProbeGroupVO.API_TYPE_ID]);

        if (!this.categories_ordered?.length) {
            await this.load_all_supervised_categories();
        }

        await this.load_all_supervised_probes();

        if (has_supervision_group_selection_filters && !this.groups?.length) {
            await this.load_all_supervised_probe_groups();
        }

        const data = await SupervisionTypeWidgetManager.find_available_supervision_type_ids(
            this.dashboard,
            this.widget_options,
            this.get_active_field_filters,
            {
                categories_by_name: (!!this.categories_ordered?.length
                    ? ObjectHandler.map_array_by_object_field_value(this.categories_ordered, field_names<SupervisedCategoryVO>().name)
                    : null),
                groups: this.groups
            }
        );

        const new_available_api_type_ids_by_cat_ids: { [cat_id: string]: string[] } = {};

        if ((this.order_by_categories || this.show_counter) && !!this.probes_by_sup_api_type_ids) {
            for (const i in data.items) {
                const sup_api_type_id = data.items[i];
                const probe: SupervisedProbeVO = this.probes_by_sup_api_type_ids[sup_api_type_id];

                if (!probe) {
                    continue;
                }

                if (!new_available_api_type_ids_by_cat_ids[probe.category_id]) {
                    new_available_api_type_ids_by_cat_ids[probe.category_id] = [];
                }
                new_available_api_type_ids_by_cat_ids[probe.category_id].push(sup_api_type_id);
            }
            // on range les api_type_ids par nom
            for (const cat_id in new_available_api_type_ids_by_cat_ids) {
                new_available_api_type_ids_by_cat_ids[cat_id] = new_available_api_type_ids_by_cat_ids[cat_id].sort((a: string, b: string) => {
                    const probe_a = this.probes_by_sup_api_type_ids[a];
                    const probe_b = this.probes_by_sup_api_type_ids[b];
                    if (probe_a.weight < probe_b.weight) { return -1; }
                    if (probe_a.weight > probe_b.weight) { return 1; }
                    return 0;
                });
            }
        }

        this.available_api_type_ids = data.items;
        this.available_api_type_ids_by_cat_ids = new_available_api_type_ids_by_cat_ids;

        if (!!this.show_counter && !this.loaded_once) {
            // Si on doit afficher le compteur, on fait les requêtes nécessaires
            console.debug('onchange_supervision_api_type_ids load_counter');
            this.throttled_load_counter();
        }
    }

    private async mounted() {
        const has_supervision_category_filters = (!!this.get_active_field_filters && !!this.get_active_field_filters[SupervisedCategoryVO.API_TYPE_ID]);
        const has_supervision_group_selection_filters = (!!this.get_active_field_filters && !!this.get_active_field_filters[SupervisedProbeGroupVO.API_TYPE_ID]);

        if (has_supervision_category_filters) {
            await this.load_all_supervised_categories();
        }
        await this.load_all_supervised_probes();
        if (has_supervision_group_selection_filters) {
            await this.load_all_supervised_probe_groups();
        }

        if (this.widget_options && this.widget_options.auto_refresh) {
            await this.start_auto_refresh();
        }

    }

    /**
     * Load all supervised categories
     * @returns {Promise<void>}
     */
    private async load_all_supervised_categories(): Promise<void> {
        const sup_categories: SupervisedCategoryVO[] = await query(SupervisedCategoryVO.API_TYPE_ID)
            .select_vos<SupervisedCategoryVO>();

        // this.categories_by_id = VOsTypesManager.vosArray_to_vosByIds(sup_categories);

        this.categories_ordered = !!sup_categories.length
            ? sup_categories.sort((a: SupervisedCategoryVO, b: SupervisedCategoryVO) => {
                if (a.weight < b.weight) { return -1; }
                if (a.weight > b.weight) { return 1; }
                return 0;
            })
            : [];

        // if (!!this.categories_ordered[0]) {
        //     this.$set(this.isPanelOpenCat, this.categories_ordered[0].id, true);
        // }
    }

    /**
     * Load all supervised probes
     * @returns {Promise<void>}
     */
    private async load_all_supervised_probes(): Promise<void> {
        this.probes_by_sup_api_type_ids = await SupervisionTypeWidgetManager.find_all_supervised_probes_by_sup_api_type_ids();
    }

    /**
     * Load all supervised probes
     * @returns {Promise<void>}
     */
    private async load_all_supervised_probe_groups(): Promise<void> {
        this.groups = await query(SupervisedProbeGroupVO.API_TYPE_ID).select_vos<SupervisedProbeGroupVO>();
    }

    private handle_select_api_type_id(api_type_id: string) {
        if (this.selected_api_type_id === api_type_id) {
            this.selected_api_type_id = null;
        } else {
            this.selected_api_type_id = api_type_id;
        }
    }

    private is_all_selected(): boolean {
        return !this.selected_api_type_id;
    }

    private handle_select_api_type_id_and_state(state: number, api_type_id: string) {
        console.log('handle_select_api_type_id_and_state ' + state + ' ' + api_type_id);

        // si l'api_type_id est déjà sélectionné et que l'état est le même, on déselectionne
        if (this.selected_api_type_id === api_type_id && this.selected_state === state) {
            this.selected_api_type_id = null;
            this.selected_state = null;
            this.selectedApitypeState = null;
        } else {
            // sinon on ajoute à la selection
            this.selectedApitypeState = api_type_id + '_' + state;
            this.selected_api_type_id = api_type_id;
            this.selected_state = state;
        }
    }

    // Bascule l’état d’un panneau
    private togglePanelCat(catId: number) {
        // On inverse la valeur actuelle
        this.$set(this.isPanelOpenCat, catId, !this.isPanelOpenCat[catId]);
    }

    /**
     * charge les counter par api_type_id et par état
     * @returns {Promise<void>}
     */
    private async load_counter(): Promise<void> {
        // cf load_filter_visible_options_count
        if (!this.show_counter) {
            this.loaded_once = false;
            this.count_by_sup_api_type_ids = {};
            this.count_by_sup_by_cat = {};
            return;
        }

        AjaxCacheClientController.getInstance().invalidateCachesFromApiTypesInvolved(this.available_api_type_ids);

        // this.available_api_type_ids
        // cf FieldValueFilterEnumWidgetManager.find_enum_data_filters_count_from_widget_options
        this.count_by_sup_api_type_ids = await SupervisionTypeWidgetManager.find_count_by_api_type_id_state(
            this.dashboard,
            this.widget_options,
            this.get_active_field_filters,
            this.get_active_api_type_ids,
            {
                active_api_type_ids: this.available_api_type_ids,
                all_states: this.all_states,
            }
        );

        const count_by_sup_by_cat: { [cat_id: number]: { [state: number]: number } } = {};

        for (const sup_api_type_id in this.count_by_sup_api_type_ids) {
            const probe: SupervisedProbeVO = this.probes_by_sup_api_type_ids[sup_api_type_id];

            if (!!probe.category_id && !count_by_sup_by_cat[probe.category_id]) {
                count_by_sup_by_cat[probe.category_id] = {};
            }

            for (const si in this.count_by_sup_api_type_ids[sup_api_type_id]) {
                const value: number = this.count_by_sup_api_type_ids[sup_api_type_id][si];
                const state: number = parseInt(si);

                if (!!probe.category_id && !count_by_sup_by_cat[probe.category_id][si]) {
                    count_by_sup_by_cat[probe.category_id][si] = 0;
                }
                count_by_sup_by_cat[probe.category_id][si] += value || 0;

                // on set la class button_opacity_1
                // si state 0 | 1 | 2 | 3 et valeur != 0
                // si state 4 | 5 jamais
                // gestion class opacity_1 sur les sondes
                if (value > 0) {
                    if (state == 0 || state == 1 || state == 2 || state == 3) {
                        this.opacityApitypeState[sup_api_type_id + '_' + state] = true;
                    }
                } else {
                    this.opacityApitypeState[sup_api_type_id + '_' + state] = false;
                }

                // gestion class opacity_1 sur les categories
                if (count_by_sup_by_cat[probe.category_id][si] > 0) {
                    if (state == 0 || state == 1 || state == 2 || state == 3) {
                        this.opacityApitypeState[probe.category_id + '_' + state] = true;
                    }
                } else {
                    this.opacityApitypeState[probe.category_id + '_' + state] = false;
                }
            }
        }

        this.count_by_sup_by_cat = count_by_sup_by_cat;
        this.loaded_once = true;
        this.is_busy = false;
    }

    private async start_auto_refresh() {
        if (!this.widget_options.auto_refresh || !this.widget_options.auto_refresh_seconds) {
            return;
        }

        while (true) {
            if (!this.widget_options.auto_refresh) {
                return;
            }

            await ThreadHandler.sleep((this.widget_options.auto_refresh_seconds * 1000), 'SupervisionTypeWidgetComponent.start_auto_refresh');

            this.throttled_load_counter();
        }
    }

    private async refresh() {
        this.throttled_load_counter();
    }
}