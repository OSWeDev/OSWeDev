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
import IVarDirectiveParams from '../../../Var/directives/var-directive/IVarDirectiveParams';
import VarDataBaseVO from '../../../../../../shared/modules/Var/vos/VarDataBaseVO';
import SupervisionProbeStateDataRangesVO from "../../../../../../shared/modules/Supervision/vars/vos/SupervisionProbeStateDataRangesVO";
import SupervisionController from '../../../../../../shared/modules/Supervision/SupervisionController';
import SupervisionVarsNamesHolder from "../../../../../../shared/modules/Supervision/vars/SupervisionVarsNamesHolder";
import NumSegment from '../../../../../../shared/modules/DataRender/vos/NumSegment';
import RangeHandler from '../../../../../../shared/tools/RangeHandler';
import { query } from '../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ObjectHandler, { field_names } from '../../../../../../shared/tools/ObjectHandler';

@Component({
    template: require('./SupervisionTypeWidgetComponent.pug'),
    components: {},
})
export default class SupervisionTypeWidgetComponent extends VueComponentBase {

    @ModuleTranslatableTextGetter
    private get_flat_locale_translations: { [code_text: string]: string };

    @ModuleDashboardPageGetter
    private get_active_field_filters: FieldFiltersVO;

    @ModuleDashboardPageAction
    private set_active_field_filters: FieldFiltersVO;

    @ModuleDashboardPageAction
    private set_active_api_type_ids: (active_api_type_ids: string[]) => void;

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
    // private categories_by_name: { [name: string]: SupervisedCategoryVO } = {};
    private categories_ordered: SupervisedCategoryVO[] = [];
    // private categories_by_id: { [id: number]: SupervisedCategoryVO } = {};
    private probes_by_sup_api_type_ids: { [sup_api_type_id: string]: SupervisedProbeVO } = {};

    private probe_param_by_sup_api_type_id: { [sup_api_type_id: string]: { [state: number]: SupervisionProbeStateDataRangesVO } } = {};
    private probe_param_by_cat: { [cat_id: string]: { [state: number]: SupervisionProbeStateDataRangesVO } } = {};

    private all_states: number[] = [
        SupervisionController.STATE_ERROR,
        SupervisionController.STATE_ERROR_READ,
        SupervisionController.STATE_WARN,
        SupervisionController.STATE_WARN_READ,
        SupervisionController.STATE_OK,
        SupervisionController.STATE_PAUSED,
        // SupervisionController.STATE_UNKOWN
    ];
    private state_error = SupervisionController.STATE_ERROR;
    private state_error_read = SupervisionController.STATE_ERROR_READ;
    private state_warn = SupervisionController.STATE_WARN;
    private state_warn_read = SupervisionController.STATE_WARN_READ;
    private state_ok = SupervisionController.STATE_OK;
    private state_paused = SupervisionController.STATE_PAUSED;
    private state_unkown = SupervisionController.STATE_UNKOWN;

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

        // TODO:
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
                    options.show_counter
                ) : null;
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }

        return options;
    }


    @Watch('selected_api_type_id')
    private onchange_selected_api_type_id() {

        if (!this.selected_api_type_id) {
            this.set_active_api_type_ids([]);
            return;
        }

        this.set_active_api_type_ids([this.selected_api_type_id]);
    }

    @Watch('selected_state')
    private onchange_selected_state() {

        console.log('onchange_selected_state' + this.selected_state);
        // if (!this.selected_state || !this.selected_api_type_id) {
        //     this.set_active_field_filters([]);
        //     return;
        // }

        // // export default class FieldFiltersVO {
        // //     [api_type_id: string]: { [field_id: string]: ContextFilterVO }
        // // }
        // // get_active_field_filters
        // // set_active_field_filters
        // // selected_state
        // this.set_active_api_type_ids([this.selected_api_type_id]);
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
     *  - Initialize the tmp_active_filter_options with default widget options
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

        const data = await SupervisionTypeWidgetManager.find_available_supervision_type_ids(
            this.dashboard,
            this.widget_options,
            this.get_active_field_filters,
            {
                categories_by_name: (!!this.categories_ordered?.length
                    ? ObjectHandler.map_array_by_object_field_value(this.categories_ordered, field_names<SupervisedCategoryVO>().name)
                    : null)
            }
        );

        const new_available_api_type_ids_by_cat_ids: { [cat_id: string]: string[] } = {};
        const probe_param_by_sup_api_type_id: { [sup_api_type_id: string]: { [state: number]: SupervisionProbeStateDataRangesVO } } = {};
        const probe_ids_by_cat: { [cat_id: string]: number[] } = {};

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

                if (!this.show_counter) {
                    continue;
                }

                if (!probe_ids_by_cat[probe.category_id]) {
                    probe_ids_by_cat[probe.category_id] = [];
                }
                probe_ids_by_cat[probe.category_id].push(probe.id);

                if (!probe_param_by_sup_api_type_id[sup_api_type_id]) {
                    probe_param_by_sup_api_type_id[sup_api_type_id] = {};
                }

                for (const si in this.all_states) {
                    probe_param_by_sup_api_type_id[sup_api_type_id][si] = SupervisionProbeStateDataRangesVO.createNew<SupervisionProbeStateDataRangesVO>(
                        SupervisionVarsNamesHolder.VarNbSupervisedItemByProbeStateController_VAR_NAME,
                        false,
                        [RangeHandler.create_single_elt_NumRange(probe.id, NumSegment.TYPE_INT)],
                        [RangeHandler.create_single_elt_NumRange(parseInt(si), NumSegment.TYPE_INT)]
                    );
                }
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


        const probe_param_by_cat: { [cat_id: string]: { [state: number]: SupervisionProbeStateDataRangesVO } } = {};
        if (!!this.show_counter) {
            for (const pi in probe_ids_by_cat) {
                probe_param_by_cat[pi] = {};
                for (const si in this.all_states) {
                    probe_param_by_cat[pi][si] = SupervisionProbeStateDataRangesVO.createNew<SupervisionProbeStateDataRangesVO>(
                        SupervisionVarsNamesHolder.VarNbSupervisedItemByProbeStateController_VAR_NAME,
                        false,
                        RangeHandler.create_multiple_NumRange_from_ids(probe_ids_by_cat[pi], NumSegment.TYPE_INT),
                        [RangeHandler.create_single_elt_NumRange(parseInt(si), NumSegment.TYPE_INT)]
                    );
                }
            }
        }

        this.probe_param_by_sup_api_type_id = probe_param_by_sup_api_type_id;
        this.probe_param_by_cat = probe_param_by_cat;

        this.available_api_type_ids = data.items;
        this.available_api_type_ids_by_cat_ids = new_available_api_type_ids_by_cat_ids;
    }

    private async mounted() {
        await this.load_all_supervised_categories();
        await this.load_all_supervised_probes();
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
    }

    /**
     * Load all supervised probes
     * @returns {Promise<void>}
     */
    private async load_all_supervised_probes(): Promise<void> {
        this.probes_by_sup_api_type_ids = await SupervisionTypeWidgetManager.find_all_supervised_probes_by_sup_api_type_ids();
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


    private get_var_param_directive(state: number, api_type_id: string, cat_id: number): IVarDirectiveParams {

        const var_param: SupervisionProbeStateDataRangesVO = !!api_type_id
            ? this.probe_param_by_sup_api_type_id[api_type_id]?.[state]
            : this.probe_param_by_cat[cat_id]?.[state];

        if (!var_param) {
            return null;
        }

        // on set la class button_opacity_1
        // si state 0 | 1 | 2 | 3 et valeur != 0
        // si state 4 | 5 jamais

        // on set la couleur selon le state
        const res: IVarDirectiveParams = {
            var_param: var_param,
            on_every_update: (varData: VarDataBaseVO, el, binding, vnode) => {
                const value: number = (!!varData) ? (varData as VarDataBaseVO).value : 0;

                if (value > 0) {
                    if (state == 0 || state == 1 || state == 2 || state == 3) {
                        el.className += ' opacity_1';
                    }

                    if (value > 500) {
                        // do something
                        // on pourrait changer le nbr pour ">500"
                    }
                } else {
                    this.removeClassName('opacity_1', el);
                }
            },
            already_register: true,
        };

        return res;
    }

    private handle_select_api_type_id_and_state(api_type_id: string, state: number) {
        console.log('handle_select_api_type_id_and_state' + state);

        if (this.selected_api_type_id === api_type_id) {
            this.selected_api_type_id = null;
        } else {
            this.selected_api_type_id = api_type_id;
        }

        if (this.selected_state === state) {
            this.selected_state = null;
        } else {
            this.selected_state = state;
        }
    }
}