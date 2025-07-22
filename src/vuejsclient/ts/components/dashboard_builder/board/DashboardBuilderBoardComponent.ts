import Component from 'vue-class-component';
import { GridItem, GridLayout } from "vue-grid-layout";
import { Inject, Prop } from 'vue-property-decorator';
import { filter } from '../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import SortByVO from '../../../../../shared/modules/ContextFilter/vos/SortByVO';
import ModuleDAO from '../../../../../shared/modules/DAO/ModuleDAO';
import DashboardVOManager from '../../../../../shared/modules/DashboardBuilder/manager/DashboardVOManager';
import DashboardGraphVORefVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardGraphVORefVO';
import DashboardPageVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardViewportPageWidgetVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardViewportPageWidgetVO';
import DashboardViewportVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardViewportVO';
import DashboardVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import DashboardWidgetVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import FieldFiltersVO from '../../../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO';
import NumSegment from '../../../../../shared/modules/DataRender/vos/NumSegment';
import ConsoleHandler from '../../../../../shared/tools/ConsoleHandler';
import ObjectHandler, { field_names, reflect } from '../../../../../shared/tools/ObjectHandler';
import RangeHandler from '../../../../../shared/tools/RangeHandler';
import { SafeWatch } from '../../../tools/annotations/SafeWatch';
import { SyncVOs } from '../../../tools/annotations/SyncVOs';
import InlineTranslatableText from '../../InlineTranslatableText/InlineTranslatableText';
import VueComponentBase from '../../VueComponentBase';
import DashboardCopyWidgetComponent from '../copy_widget/DashboardCopyWidgetComponent';
import { IDashboardGetters, IDashboardPageActionsMethods, IDashboardPageConsumer } from '../page/DashboardPageStore';
import './DashboardBuilderBoardComponent.scss';
import DashboardBuilderBoardItemComponent from './item/DashboardBuilderBoardItemComponent';

@Component({
    template: require('./DashboardBuilderBoardComponent.pug'),
    components: {
        Gridlayout: GridLayout,
        Griditem: GridItem,
        Dashboardbuilderboarditemcomponent: DashboardBuilderBoardItemComponent,
        Dashboardcopywidgetcomponent: DashboardCopyWidgetComponent,
        Inlinetranslatabletext: InlineTranslatableText,
    }
})
export default class DashboardBuilderBoardComponent extends VueComponentBase implements IDashboardPageConsumer {

    // public static GridLayout_TOTAL_HEIGHT: number = 720;
    // public static GridLayout_TOTAL_ROWS: number = 72;
    // public static GridLayout_ELT_HEIGHT: number = DashboardBuilderBoardComponent.GridLayout_TOTAL_HEIGHT / DashboardBuilderBoardComponent.GridLayout_TOTAL_ROWS;

    // public static GridLayout_TOTAL_WIDTH: number = 1280;
    // public static GridLayout_TOTAL_COLUMNS: number = 12;
    // public static GridLayout_ELT_WIDTH: number = DashboardBuilderBoardComponent.GridLayout_TOTAL_WIDTH / DashboardBuilderBoardComponent.GridLayout_TOTAL_COLUMNS;

    @Inject('storeNamespace') readonly storeNamespace!: string;

    @Prop({ default: true })
    public editable: boolean;

    @Prop({ default: true })
    public force_max_width: boolean;

    @SyncVOs(DashboardViewportPageWidgetVO.API_TYPE_ID, {
        debug: true,

        watch_fields: [
            reflect<DashboardBuilderBoardComponent>().get_dashboard_current_viewport,
            reflect<DashboardBuilderBoardComponent>().get_dashboard_page,
        ],
        filters_factory: (self) => {
            if (!self.get_dashboard_current_viewport) {
                return null;
            }

            if (!self.get_dashboard_page) {
                return null;
            }

            return [
                filter(DashboardViewportPageWidgetVO.API_TYPE_ID, field_names<DashboardViewportPageWidgetVO>().viewport_id).by_num_eq(self.get_dashboard_current_viewport.id),
                filter(DashboardViewportPageWidgetVO.API_TYPE_ID, field_names<DashboardViewportPageWidgetVO>().page_id).by_num_eq(self.get_dashboard_page.id),
            ];
        },
        sync_to_store_namespace: (self) => self.storeNamespace,
    })
    public dashboard_viewport_page_widgets: DashboardViewportPageWidgetVO[] = []; // All page widgets of the current viewport of the current page of the dashboard

    @SyncVOs(DashboardPageVO.API_TYPE_ID, {
        debug: true,

        watch_fields: [reflect<DashboardBuilderBoardComponent>().get_dashboard],
        filters_factory: (self) => {
            if (!self.get_dashboard) {
                return null;
            }

            return [filter(DashboardPageVO.API_TYPE_ID, field_names<DashboardPageVO>().dashboard_id).by_num_eq(self.get_dashboard.id)];
        },
        simple_sorts_by_on_api_type_id: [
            new SortByVO(DashboardPageVO.API_TYPE_ID, field_names<DashboardPageVO>().weight, true),
            new SortByVO(DashboardPageVO.API_TYPE_ID, field_names<DashboardPageVO>().id, true),
        ],
        sync_to_store_namespace: (self) => self.storeNamespace,
        // sync_to_store_property: reflect<DashboardBuilderBoardComponent>().dashboard_pages, // Nom iso, pas utile
    })
    public dashboard_pages: DashboardPageVO[] = [];

    @SyncVOs(DashboardPageWidgetVO.API_TYPE_ID, {
        debug: true,

        watch_fields: [reflect<DashboardBuilderBoardComponent>().get_dashboard_id],
        filters_factory: (self) => {
            if (!self.get_dashboard_id) {
                return null;
            }

            return [filter(DashboardPageWidgetVO.API_TYPE_ID, field_names<DashboardPageWidgetVO>().dashboard_id).by_num_eq(self.get_dashboard_id)];
        },
        sync_to_store_namespace: (self) => self.storeNamespace,
        // sync_to_store_property: reflect<DashboardBuilderBoardComponent>().page_widgets, // Nom iso, pas utile
    })
    public page_widgets: DashboardPageWidgetVO[] = []; // All the page_widgets of the dashboard, for all its pages

    @SyncVOs(DashboardGraphVORefVO.API_TYPE_ID, {
        debug: true,

        watch_fields: [reflect<DashboardBuilderBoardComponent>().get_dashboard_id],
        filters_factory: (self) => {
            if (!self.get_dashboard_id) {
                return null;
            }

            return [filter(DashboardGraphVORefVO.API_TYPE_ID, field_names<DashboardGraphVORefVO>().dashboard_id).by_num_eq(self.get_dashboard_id)];
        },
        sync_to_store_namespace: (self) => self.storeNamespace,
        // sync_to_store_property: reflect<DashboardBuilderComponent>().db_graph_vo_refs, // Nom iso, pas utile
    })
    public db_graph_vo_refs: DashboardGraphVORefVO[] = []; // The tables references of the current dashboard

    @SyncVOs(DashboardWidgetVO.API_TYPE_ID, {
        debug: true,

        sync_to_store_namespace: (self) => self.storeNamespace,
    })
    public all_widgets: DashboardWidgetVO[] = null;

    @SyncVOs(DashboardViewportVO.API_TYPE_ID, {
        debug: true,

        sync_to_store_namespace: (self) => self.storeNamespace,

        simple_sorts_by_on_api_type_id: [
            new SortByVO(DashboardViewportVO.API_TYPE_ID, field_names<DashboardViewportVO>().screen_min_width, false),
        ]
    })
    public viewports: DashboardViewportVO[] = null;


    // public elt_height: number = DashboardBuilderBoardComponent.GridLayout_ELT_HEIGHT;
    // public col_num: number = DashboardBuilderBoardComponent.GridLayout_TOTAL_COLUMNS;
    // public max_rows: number = DashboardBuilderBoardComponent.GridLayout_TOTAL_ROWS;

    public item_key: { [item_id: number]: number } = {};

    public widgets: DashboardPageWidgetVO[] = [];

    public layout: DashboardViewportPageWidgetVO[] = [];

    public is_filtres_deplie: boolean = false;

    public dragged = null;

    get activated_dashboard_viewport_page_widgets(): DashboardViewportPageWidgetVO[] {
        if (!this.dashboard_viewport_page_widgets || this.dashboard_viewport_page_widgets.length <= 0) {
            return [];
        }

        const res: DashboardViewportPageWidgetVO[] = [];

        for (const viewport_page_widget of this.dashboard_viewport_page_widgets) {
            if (viewport_page_widget.page_id != this.get_dashboard_page?.id) {
                continue; // On ne garde que les widgets de la page actuelle
            }

            if (!viewport_page_widget.activated) {
                continue; // On ne garde que les widgets activés
            }

            res.push(viewport_page_widget);
        }

        return res;
    }

    get grid_breakpoints(): { [breakpoint: string]: number } {

        if (!ObjectHandler.hasAtLeastOneAttribute(this.get_dashboard_valid_viewports)) {
            return null;
        }

        const breakpoints: { [breakpoint: string]: number } = {};
        for (const viewport of this.get_dashboard_valid_viewports) {
            breakpoints[viewport.name] = viewport.screen_min_width;
        }

        return breakpoints;
    }

    get grid_cols(): { [breakpoint: string]: number } {

        if (!ObjectHandler.hasAtLeastOneAttribute(this.get_dashboard_valid_viewports)) {
            return null;
        }

        const cols: { [breakpoint: string]: number } = {};
        for (const viewport of this.get_dashboard_valid_viewports) {
            cols[viewport.name] = viewport.nb_columns;
        }

        return cols;
    }

    get get_dashboard_valid_viewports(): DashboardViewportVO[] {
        return this.vuexGet(reflect<this>().get_dashboard_valid_viewports);
    }

    get get_page_widgets_by_id(): { [id: number]: DashboardPageWidgetVO } {
        return this.vuexGet(reflect<this>().get_page_widgets_by_id);
    }

    get get_dashboard_current_viewport(): DashboardViewportVO {
        return this.vuexGet(reflect<this>().get_dashboard_current_viewport);
    }

    get draggable(): boolean {
        return this.editable;
    }

    get resizable(): boolean {
        return this.editable;
    }

    get get_dashboard_id(): number {
        return this.vuexGet(reflect<this>().get_dashboard_id);
    }

    get get_page_history(): DashboardPageVO[] {
        return this.vuexGet(reflect<this>().get_page_history);
    }

    get get_widgets_invisibility(): { [w_id: number]: boolean } {
        return this.vuexGet(reflect<this>().get_widgets_invisibility);
    }

    get get_dashboard_navigation_history(): { current_dashboard_id: number, previous_dashboard_id: number } {
        return this.vuexGet(reflect<this>().get_dashboard_navigation_history);
    }

    get get_active_field_filters(): FieldFiltersVO {
        return this.vuexGet(reflect<this>().get_active_field_filters);
    }

    get get_selected_widget(): DashboardPageWidgetVO {
        return this.vuexGet(reflect<this>().get_selected_widget);
    }

    get get_dashboard_page(): DashboardPageVO {
        return this.vuexGet(reflect<this>().get_dashboard_page);
    }

    get get_dashboard(): DashboardVO {
        return this.vuexGet(reflect<this>().get_dashboard);
    }

    get style_gridlayout(): string {
        let res: string = '';

        if (this.force_max_width && this.get_dashboard_current_viewport) {

            // On récupère le viewport précédent (du plus grand au plus petit) pour avoir le min_width qu'on va mettre en max
            let previous_viewport: DashboardViewportVO = null;

            for (const i in this.viewports) {
                const viewport: DashboardViewportVO = this.viewports[i];

                if (viewport.id != this.get_dashboard_current_viewport.id) {
                    continue;
                }

                if (i == '0') {
                    break;
                }

                previous_viewport = this.viewports[(parseInt(i) - 1)];

                break;
            }

            if (previous_viewport) {
                res += 'max-width: ' + (previous_viewport.screen_min_width - 1) + 'px; border-left: 2px solid #ccc; border-right: 2px solid #ccc; border-radius: 8px; margin-left: auto; margin-right: auto;';
            }
        }

        return res;
    }

    get get_dashboard_pages(): DashboardPageVO[] {
        return this.vuexGet(reflect<this>().get_dashboard_pages);
    }

    get get_widgets_by_id(): { [id: number]: DashboardWidgetVO } {
        return this.vuexGet(reflect<this>().get_widgets_by_id);
    }

    // get nb_columns(): number {
    //     if (!this.get_dashboard_current_viewport) {
    //         return 0;
    //     }

    //     return this.get_dashboard_current_viewport.nb_columns;
    // }

    @SafeWatch(reflect<DashboardBuilderBoardComponent>().get_dashboard, { immediate: true })
    public async on_change_dashboard() {
        this.set_page_widgets_components_by_pwid({});
        this.check_current_viewport_vs_viewports_and_selected_dashboard();

        // We should load the shared_filters with the current dashboard
        await DashboardVOManager.load_shared_filters_with_dashboard(
            this.get_dashboard,
            this.get_dashboard_navigation_history,
            this.get_active_field_filters,
            this.set_active_field_filters
        );
    }

    @SafeWatch(reflect<DashboardBuilderBoardComponent>().dashboard_pages)
    public async onchange_pages(): Promise<void> {
        // On check si la page actuelle est ok, sinon on prend la première disponible
        if (!(this.dashboard_pages?.length > 0)) {
            // on vide l'historique aussi
            this.set_page_history([]);
            this.set_dashboard_page(null);
            return;
        }

        if (!ObjectHandler.contains_vo(this.dashboard_pages, this.get_dashboard_page)) {
            // on vide l'historique aussi
            this.set_page_history([]);
            this.set_dashboard_page(this.dashboard_pages[0]);
        }
    }


    @SafeWatch(reflect<DashboardBuilderBoardComponent>().get_dashboard_page, { immediate: true })
    public async onchange_dbdashboard() {
        this.is_filtres_deplie = this.get_dashboard_page?.collapse_filters;
    }

    @SafeWatch(reflect<DashboardBuilderBoardComponent>().get_dashboard_valid_viewports)
    public async on_change_viewports(): Promise<void> {
        // Si on charge des viewports, et qu'on en a pas sélectionné pour le moment, on sélectionne le plus adapté par défaut parmis les viewports valides
        this.check_current_viewport_vs_viewports_and_selected_dashboard();
    }

    public async check_current_viewport_vs_viewports_and_selected_dashboard(): Promise<void> {
        /**
         * Si ya pas de dashboard sélectionné, osef le viewport actuellement sélectionné
         */
        if (!this.get_dashboard) {
            return;
        }

        /**
         * Si on avait un viewport sélectionné, on le garde si il est valide, sinon on le vide
         */
        let next_selected_viewport: DashboardViewportVO = this.get_dashboard_current_viewport;

        if (next_selected_viewport) {
            if (!RangeHandler.elt_intersects_any_range(next_selected_viewport.id, this.get_dashboard.activated_viewport_id_ranges)) {
                next_selected_viewport = null; // On vide le viewport sélectionné s'il n'est pas valide
            }
        }

        /**
         * Si on a pas de viewport sélectionné, on en cherche un valide et le plus approprié
         */
        if (!next_selected_viewport) {
            if (this.get_dashboard_valid_viewports && this.get_dashboard_valid_viewports.length > 0) {
                // Si on a pas de viewport selectionné (cas du viewer), on prend le plus grand possible selon la taille de l'écran
                const screen_width = window.innerWidth;
                next_selected_viewport = this.get_dashboard_valid_viewports.find((v) => v.is_default == true);

                for (const i in this.get_dashboard_valid_viewports) {
                    const viewport = this.get_dashboard_valid_viewports[i];

                    if (viewport.screen_min_width <= screen_width &&
                        (viewport.screen_min_width > next_selected_viewport.screen_min_width || next_selected_viewport.screen_min_width > screen_width)) {
                        next_selected_viewport = viewport;
                    }

                }
            }
        }

        if (next_selected_viewport != this.get_dashboard_current_viewport) {
            this.set_dashboard_current_viewport(next_selected_viewport);
        }
    }

    // Accès dynamiques Vuex
    public vuexGet<K extends keyof IDashboardGetters>(getter: K): IDashboardGetters[K] {
        return this.$store.getters[`${this.storeNamespace}/${String(getter)}`];
    }

    public vuexAct<K extends keyof IDashboardPageActionsMethods>(
        action: K,
        ...args: Parameters<IDashboardPageActionsMethods[K]>
    ) {
        this.$store.dispatch(`${this.storeNamespace}/${String(action)}`, ...args);
    }

    public set_dashboard_current_viewport(viewport: DashboardViewportVO) {
        return this.vuexAct(reflect<this>().set_dashboard_current_viewport, viewport);
    }

    public set_dashboard_page(page: DashboardPageVO) {
        return this.vuexAct(reflect<this>().set_dashboard_page, page);
    }

    public set_selected_widget(page_widget: DashboardPageWidgetVO) {
        return this.vuexAct(reflect<this>().set_selected_widget, page_widget);
    }

    public set_Dashboardcopywidgetcomponent(Dashboardcopywidgetcomponent: DashboardCopyWidgetComponent) {
        return this.vuexAct(reflect<this>().set_Dashboardcopywidgetcomponent, Dashboardcopywidgetcomponent);
    }

    public set_active_field_filters(param: FieldFiltersVO) {
        return this.vuexAct(reflect<this>().set_active_field_filters, param);
    }

    public clear_active_field_filters() {
        return this.vuexAct(reflect<this>().clear_active_field_filters, null);
    }

    public set_page_widgets_components_by_pwid(page_widgets_components_by_pwid: { [pwid: number]: VueComponentBase }): void {
        this.vuexAct(reflect<this>().set_page_widgets_components_by_pwid, page_widgets_components_by_pwid);
    }

    public mounted() {
        this.set_Dashboardcopywidgetcomponent(this.$refs['Dashboardcopywidgetcomponent'] as DashboardCopyWidgetComponent);
    }

    public async resized_event(i, newH, newW, newHPx, newWPx) {
        if (!this.dashboard_viewport_page_widgets) {
            return;
        }
        const widget = this.dashboard_viewport_page_widgets.find((w) => w.i == i);
        // const widget = this.dashboard_viewport_page_widgets.find((w) => w.id == i);

        if (!widget) {
            ConsoleHandler.error("resizedEvent:on ne retrouve pas le widget");
            return;
        }

        widget.h = newH;
        widget.w = newW;
        await ModuleDAO.instance.insertOrUpdateVO(widget);
    }


    public async moved_event(i, newX, newY) {
        /*
       S'active lorsque le widget est lâché, event donne alors la nouvelle position du widget.
       C'est une fenêtre de tir pour obtenir la position d'un widget si celui-ci sort du tableau !
       */


        if (!this.dashboard_viewport_page_widgets) {
            return;
        }
        const widget = this.dashboard_viewport_page_widgets.find((w) => w.i == i);
        // const widget = this.dashboard_viewport_page_widgets.find((w) => w.id == i);

        if (!widget) {
            ConsoleHandler.error("movedEvent:on ne retrouve pas le widget");
            return;
        }


        widget.x = newX;
        widget.y = newY;
        await ModuleDAO.instance.insertOrUpdateVO(widget);
    }

    public isHide(item: DashboardPageWidgetVO): boolean {
        if (!item || !item.json_options) {
            return false;
        }

        try {
            const json_options: any = JSON.parse(item.json_options);

            if (json_options && json_options.hide_filter) {
                return true;
            }
        } catch {
            return false;
        }

        return false;
    }

    public change_is_filtres_deplie() {
        this.is_filtres_deplie = !this.is_filtres_deplie;
        // on ajoute la classe filtre_deplie au body si le bloc des filtres est déplié
        if (this.is_filtres_deplie === true) {

            $("body").addClass('filtre_deplie');
        } else {

            $("body").removeClass('filtre_deplie');
        }
    }

    public set_page_history(page_history: DashboardPageVO[]): void {
        this.vuexAct(reflect<this>().set_page_history, page_history);
    }

    public breakpoint_changed_event(breakpoint: string): void {

        // Si on est en édition ou en force_max_width on doit pas réagir à cet event
        if (this.editable || this.force_max_width) {
            return;
        }

        // On change le viewport courant en fonction du breakpoint
        if (!this.get_dashboard_valid_viewports || this.get_dashboard_valid_viewports.length <= 0) {
            return;
        }

        const viewport = this.get_dashboard_valid_viewports.find((v) => v.name == breakpoint);

        if (!viewport) {
            ConsoleHandler.error(`Aucun viewport trouvé pour le breakpoint ${breakpoint}`);
            return;
        }

        if (viewport.id != this.get_dashboard_current_viewport?.id) {
            this.set_dashboard_current_viewport(viewport);
        }
    }
}