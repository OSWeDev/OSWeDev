import Component from 'vue-class-component';
import { GridItem, GridLayout } from "vue-grid-layout";
import { Inject, Prop, Vue, Watch } from 'vue-property-decorator';
import { filter } from '../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import { query } from '../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import SortByVO from '../../../../../shared/modules/ContextFilter/vos/SortByVO';
import ModuleDAO from '../../../../../shared/modules/DAO/ModuleDAO';
import IEditableDashboardPage from '../../../../../shared/modules/DashboardBuilder/interfaces/IEditableDashboardPage';
import DashboardVOManager from '../../../../../shared/modules/DashboardBuilder/manager/DashboardVOManager';
import DashboardGraphVORefVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardGraphVORefVO';
import DashboardPageVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardViewportPageWidgetVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardViewportPageWidgetVO';
import DashboardViewportVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardViewportVO';
import DashboardVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import DashboardWidgetVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import FieldFiltersVO from '../../../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO';
import ConsoleHandler from '../../../../../shared/tools/ConsoleHandler';
import { field_names, reflect } from '../../../../../shared/tools/ObjectHandler';
import { all_promises } from '../../../../../shared/tools/PromiseTools';
import RangeHandler from '../../../../../shared/tools/RangeHandler';
import ThrottleHelper from '../../../../../shared/tools/ThrottleHelper';
import { SyncVOs } from '../../../tools/annotations/SyncVOs';
import InlineTranslatableText from '../../InlineTranslatableText/InlineTranslatableText';
import VueComponentBase from '../../VueComponentBase';
import DashboardCopyWidgetComponent from '../copy_widget/DashboardCopyWidgetComponent';
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
export default class DashboardBuilderBoardComponent extends VueComponentBase {

    public static GridLayout_TOTAL_HEIGHT: number = 720;
    public static GridLayout_TOTAL_ROWS: number = 72;
    public static GridLayout_ELT_HEIGHT: number = DashboardBuilderBoardComponent.GridLayout_TOTAL_HEIGHT / DashboardBuilderBoardComponent.GridLayout_TOTAL_ROWS;

    public static GridLayout_TOTAL_WIDTH: number = 1280;
    public static GridLayout_TOTAL_COLUMNS: number = 128;
    public static GridLayout_ELT_WIDTH: number = DashboardBuilderBoardComponent.GridLayout_TOTAL_WIDTH / DashboardBuilderBoardComponent.GridLayout_TOTAL_COLUMNS;

    @Inject('storeNamespace') readonly storeNamespace!: string;

    @Prop({ default: true })
    public editable: boolean;

    @SyncVOs(DashboardViewportPageWidgetVO.API_TYPE_ID, {
        watch_fields: [
            reflect<DashboardBuilderBoardComponent>().dashboard_current_viewport,
            reflect<DashboardBuilderBoardComponent>().page_widgets,
        ],
        filters_factory: (self) => {
            if (!self.dashboard_current_viewport) {
                return null;
            }

            if (!self.page_widgets || !self.page_widgets.length) {
                return null;
            }

            return [
                filter(DashboardViewportPageWidgetVO.API_TYPE_ID, field_names<DashboardViewportPageWidgetVO>().viewport_id).by_num_eq(self.dashboard_current_viewport.id),
                filter(DashboardViewportPageWidgetVO.API_TYPE_ID, field_names<DashboardViewportPageWidgetVO>().page_widget_id).by_num_has(self.page_widgets.map((widget) => widget.id)),
            ];
        },
        sync_to_store_namespace: (self) => self.storeNamespace,
    })
    public dashboard_viewport_page_widgets: DashboardViewportPageWidgetVO[]; // All page widgets of the current viewport of the current page of the dashboard

    @SyncVOs(DashboardViewportVO.API_TYPE_ID, {
        sync_to_store_namespace: (self) => self.storeNamespace,
    })
    public viewports: DashboardViewportVO[] = [];

    @SyncVOs(DashboardViewportVO.API_TYPE_ID, {
        watch_fields: [reflect<DashboardBuilderBoardComponent>().get_dashboard_id],
        filters_factory: (self) => {
            if (!self.get_dashboard_id) {
                return null;
            }

            return [filter(DashboardVO.API_TYPE_ID, field_names<DashboardVO>().id).by_num_eq(self.get_dashboard_id)];
        },
        sync_to_store_namespace: (self) => self.storeNamespace,
    })
    public dashboard_valid_viewports: DashboardViewportVO[]; // Valid viewports of the current dashboard

    @SyncVOs(DashboardPageVO.API_TYPE_ID, {
        watch_fields: [reflect<DashboardBuilderBoardComponent>().get_dashboard],
        filters_factory: (self) => {
            if (!self.get_dashboard) {
                return null;
            }

            return [filter(DashboardPageVO.API_TYPE_ID, field_names<DashboardPageVO>().dashboard_id).by_num_eq(self.get_dashboard.id)];
        },
        simple_sorts_by_on_api_type_id: [new SortByVO(DashboardPageVO.API_TYPE_ID, field_names<DashboardPageVO>().weight, true)],
        sync_to_store_namespace: (self) => self.storeNamespace,
        // sync_to_store_property: reflect<DashboardBuilderBoardComponent>().dashboard_pages, // Nom iso, pas utile
    })
    public dashboard_pages: DashboardPageVO[] = [];

    @SyncVOs(DashboardPageWidgetVO.API_TYPE_ID, {
        watch_fields: [reflect<DashboardBuilderBoardComponent>().dashboard_pages],
        filters_factory: (self) => {
            if (!self.dashboard_pages || !self.dashboard_pages.length) {
                return null;
            }

            return [filter(DashboardPageWidgetVO.API_TYPE_ID, field_names<DashboardPageWidgetVO>().page_id).by_num_has(self.dashboard_pages.map((page) => page.id))];
        },
        sync_to_store_namespace: (self) => self.storeNamespace,
        // sync_to_store_property: reflect<DashboardBuilderBoardComponent>().page_widgets, // Nom iso, pas utile
    })
    public page_widgets: DashboardPageWidgetVO[] = []; // All the page_widgets of the dashboard, for all its pages

    @SyncVOs(DashboardPageWidgetVO.API_TYPE_ID, {
        watch_fields: [reflect<DashboardBuilderBoardComponent>().page],
        filters_factory: (self) => {
            if (!self.page) {
                return null;
            }

            return [filter(DashboardPageWidgetVO.API_TYPE_ID, field_names<DashboardPageWidgetVO>().page_id).by_num_eq(self.page.id)];
        },
        sync_to_store_namespace: (self) => self.storeNamespace,
        // sync_to_store_property: reflect<DashboardBuilderBoardComponent>().page_widgets, // Nom iso, pas utile
    })
    public selected_page_page_widgets: DashboardPageWidgetVO[] = []; // The widgets of the current page, used in the board component

    @SyncVOs(DashboardGraphVORefVO.API_TYPE_ID, {
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
        sync_to_store_namespace: (self) => self.storeNamespace,
    })
    public all_widgets: DashboardWidgetVO[] = null;

    public elt_height: number = DashboardBuilderBoardComponent.GridLayout_ELT_HEIGHT;
    public col_num: number = DashboardBuilderBoardComponent.GridLayout_TOTAL_COLUMNS;
    public max_rows: number = DashboardBuilderBoardComponent.GridLayout_TOTAL_ROWS;

    public item_key: { [item_id: number]: number } = {};

    public widgets: DashboardPageWidgetVO[] = [];

    public editable_dashboard_page: IEditableDashboardPage = null;

    public is_filtres_deplie: boolean = false;

    public dragged = null;

    public throttled_rebuild_page_layout = ThrottleHelper.declare_throttle_without_args(
        'DashboardBuilderBoardComponent.throttled_rebuild_page_layout',
        this.rebuild_page_layout.bind(this), 200);


    get get_selected_page_page_widgets(): DashboardPageWidgetVO[] {
        return this.vuexGet<DashboardPageWidgetVO[]>(reflect<this>().get_selected_page_page_widgets);
    }

    get get_dashboard_current_viewport(): DashboardViewportVO {
        return this.vuexGet<DashboardViewportVO>(reflect<this>().get_dashboard_current_viewport);
    }

    get draggable(): boolean {
        return this.editable;
    }

    get resizable(): boolean {
        return this.editable;
    }

    get get_dashboard_id(): number {
        return this.vuexGet<number>(reflect<this>().get_dashboard_id);
    }

    get has_navigation_history(): boolean {
        return this.get_page_history && (this.get_page_history.length > 0);
    }

    get get_page_history(): DashboardPageVO[] {
        return this.vuexGet<DashboardPageVO[]>(reflect<this>().get_page_history);
    }

    get get_widgets_invisibility(): { [w_id: number]: boolean } {
        return this.vuexGet<{ [w_id: number]: boolean }>(reflect<this>().get_widgets_invisibility);
    }

    get get_dashboard_navigation_history(): { current_dashboard_id: number, previous_dashboard_id: number } {
        return this.vuexGet<{ current_dashboard_id: number, previous_dashboard_id: number }>(reflect<this>().get_dashboard_navigation_history);
    }

    get get_active_field_filters(): FieldFiltersVO {
        return this.vuexGet<FieldFiltersVO>(reflect<this>().get_active_field_filters);
    }

    get get_selected_widget(): DashboardPageWidgetVO {
        return this.vuexGet<DashboardPageWidgetVO>(reflect<this>().get_selected_widget);
    }

    get get_dashboard_page(): DashboardPageVO {
        return this.vuexGet<DashboardPageVO>(reflect<this>().get_dashboard_page);
    }

    get get_dashboard(): DashboardVO {
        return this.vuexGet<DashboardVO>(reflect<this>().get_dashboard);
    }

    get get_dashboard_pages(): DashboardPageVO[] {
        return this.vuexGet<DashboardPageVO[]>(reflect<this>().get_dashboard_pages);
    }

    get get_widgets_by_id(): { [id: number]: DashboardWidgetVO } {
        return this.vuexGet<{ [id: number]: DashboardWidgetVO }>(reflect<this>().get_widgets_by_id);
    }

    @Watch(reflect<DashboardBuilderBoardComponent>().get_dashboard)
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

    @Watch(reflect<DashboardBuilderBoardComponent>().dashboard_pages)
    public async onchange_pages(): Promise<void> {
        // On check si la page actuelle est ok, sinon on prend la première disponible
        // on vide l'historique aussi
        this.set_page_history([]);

        if (!(this.dashboard_pages?.length > 0)) {
            this.setdas = null;
            return;
        }

        if (this.dashboard_pages.indexOf(this.page) < 0) {
            this.page = this.dashboard_pages[0];
        }
    }


    @Watch(reflect<DashboardBuilderBoardComponent>().get_dashboard_page, { immediate: true })
    public async onchange_dbdashboard() {
        if (!this.get_dashboard_page) {
            this.editable_dashboard_page = null;
            return;
        }

        if ((!this.editable_dashboard_page) || (this.editable_dashboard_page.id != this.get_dashboard_page.id)) {

            this.throttled_rebuild_page_layout();
        }
    }

    @Watch(reflect<DashboardBuilderBoardComponent>().get_widgets_invisibility, { deep: true })
    public async onchange_get_widgets_invisibility() {

        this.throttled_rebuild_page_layout();
    }

    @Watch(reflect<DashboardBuilderBoardComponent>().viewports)
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
            if (!RangeHandler.elt_intersects_any_range(next_selected_viewport.id, this.dashboard.activated_viewport_id_ranges)) {
                next_selected_viewport = null; // On vide le viewport sélectionné s'il n'est pas valide
            }
        }

        /**
         * Si on a pas de viewport sélectionné, on en cherche un valide et le plus approprié
         */
        if (!next_selected_viewport) {
            if (this.viewports && this.viewports.length > 0) {
                // Si on a pas de viewport selectionné (cas du viewer), on prend le plus grand possible selon la taille de l'écran
                const screen_width = window.innerWidth;
                this.viewports = await query(DashboardViewportVO.API_TYPE_ID).select_vos<DashboardViewportVO>();
                next_selected_viewport = this.viewports.find((v) => v.is_default == true);

                for (const i in this.viewports) {
                    const viewport = this.viewports[i];

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
    public vuexGet<T>(getter: string): T {
        return (this.$store.getters as any)[`${this.storeNamespace}/${getter}`];
    }
    public vuexAct<A>(action: string, payload?: A) {
        return this.$store.dispatch(`${this.storeNamespace}/${action}`, payload);
    }

    public set_dashboard_page(page: DashboardPageVO) {
        return this.vuexAct(reflect<this>().set_dashboard_page, page);
    }

    public set_page_widget(page_widget: DashboardPageWidgetVO) {
        return this.vuexAct(reflect<this>().set_page_widget, page_widget);
    }

    public set_selected_widget(page_widget: DashboardPageWidgetVO) {
        return this.vuexAct(reflect<this>().set_selected_widget, page_widget);
    }

    public delete_page_widget(page_widget: DashboardPageWidgetVO) {
        return this.vuexAct(reflect<this>().delete_page_widget, page_widget);
    }

    public set_Dashboardcopywidgetcomponent(Dashboardcopywidgetcomponent: DashboardCopyWidgetComponent) {
        return this.vuexAct(reflect<this>().set_Dashboardcopywidgetcomponent, Dashboardcopywidgetcomponent);
    }

    public set_active_field_filters(param: FieldFiltersVO) {
        return this.vuexAct(reflect<this>().set_active_field_filters, param);
    }

    public clear_active_field_filters() {
        return this.vuexAct(reflect<this>().clear_active_field_filters);
    }

    public set_page_widgets_components_by_pwid(page_widgets_components_by_pwid: { [pwid: number]: VueComponentBase }): void {
        this.vuexAct(reflect<this>().set_page_widgets_components_by_pwid, page_widgets_components_by_pwid);
    }

    public async update_layout_widget(widget: DashboardPageWidgetVO) {
        if ((!this.editable_dashboard_page?.layout)) {
            await this.rebuild_page_layout();
            return;
        }

        const i = this.editable_dashboard_page.layout.findIndex((w) => w['id'] == widget.id);
        if (i < 0) {
            await this.rebuild_page_layout();
            return;
        }

        const has_diff_json_options: boolean = (this.editable_dashboard_page.layout[i]['json_options'] != widget.json_options) ? true : false;

        this.editable_dashboard_page.layout[i] = widget;

        // On va forcer le rechargement que si on modifie réellement les options
        if (has_diff_json_options) {
            let res_key: number = -1;

            if (this.item_key[widget.id] != null) {
                res_key = this.item_key[widget.id];
            }

            res_key++;

            Vue.set(this.item_key, widget.id, res_key);
        }
    }

    public mounted() {
        this.set_Dashboardcopywidgetcomponent(this.$refs['Dashboardcopywidgetcomponent'] as DashboardCopyWidgetComponent);
    }

    public async rebuild_page_layout() {

        await all_promises([
            this.load_widgets()
        ]);

        /**
         * Si on a une sélection qui correpond au widget qu'on est en train de recharger, on modifie aussi le lien
         */
        if (this.get_selected_widget && this.get_selected_widget.id) {
            const page_widget = this.widgets.find(
                (w) => w.id == this.get_selected_widget.id
            );

            this.set_page_widget(page_widget);
            this.set_selected_widget(page_widget);
        }

        this.is_filtres_deplie = this.get_dashboard_page?.collapse_filters;

        this.editable_dashboard_page = Object.assign({
            layout: this.widgets
        }, this.get_dashboard_page);
    }

    public async load_widgets() {
        let widgets = this.get_selected_page_page_widgets;

        widgets = widgets ? widgets.filter((w) =>
            !this.get_widgets_invisibility[w.id]
        ) : null;

        if (widgets?.length) {
            widgets.sort((a, b) => {
                let a_weight: number = parseFloat(a.y.toString() + "." + a.x.toString());
                let b_weight: number = parseFloat(b.y.toString() + "." + b.x.toString());

                return a_weight - b_weight;
            });
        }

        this.widgets = widgets;
    }




    public async resizedEvent(i, newH, newW, newHPx, newWPx) {
        if (!this.widgets) {
            return;
        }
        const widget = this.widgets.find((w) => w.i == i);

        if (!widget) {
            ConsoleHandler.error("resizedEvent:on ne retrouve pas le widget");
            return;
        }

        widget.h = newH;
        widget.w = newW;
        await ModuleDAO.instance.insertOrUpdateVO(widget);
        this.set_page_widget(widget);
    }


    public async movedEvent(i, newX, newY) {
        /*
       S'active lorsque le widget est lâché, event donne alors la nouvelle position du widget.
       C'est une fenêtre de tir pour obtenir la position d'un widget si celui-ci sort du tableau !
       */


        if (!this.widgets) {
            return;
        }
        const widget = this.widgets.find((w) => w.i == i);

        if (!widget) {
            ConsoleHandler.error("movedEvent:on ne retrouve pas le widget");
            return;
        }


        widget.x = newX;
        widget.y = newY;
        await ModuleDAO.instance.insertOrUpdateVO(widget);
        this.set_page_widget(widget);
    }

    public async delete_widget(page_widget: DashboardPageWidgetVO) {
        const self = this;

        // On demande confirmation avant toute chose.
        // si on valide, on lance la suppression
        self.snotify.confirm(self.label('DashboardBuilderBoardComponent.delete_widget.body'), self.label('DashboardBuilderBoardComponent.delete_widget.title'), {
            timeout: 10000,
            showProgressBar: true,
            closeOnClick: false,
            pauseOnHover: true,
            buttons: [
                {
                    text: self.t('YES'),
                    action: async (toast) => {
                        self.$snotify.remove(toast.id);
                        self.snotify.async(
                            self.label('DashboardBuilderBoardComponent.delete_widget.start'),
                            () => new Promise(async (resolve, reject) => {

                                try {

                                    await ModuleDAO.instance.deleteVOs([page_widget]);
                                    let i = 0;
                                    for (; i < self.widgets.length; i++) {
                                        const w = self.widgets[i];

                                        if (w.i == page_widget.i) {
                                            break;
                                        }
                                    }
                                    self.widgets.splice(i, 1);
                                    self.delete_page_widget(page_widget);
                                    self.set_selected_widget(null);

                                    self.$emit('removed_widget_from_page', page_widget);

                                    // On reload les widgets
                                    await self.throttled_rebuild_page_layout();

                                    resolve({
                                        body: self.label('DashboardBuilderBoardComponent.delete_widget.ok'),
                                        config: {
                                            timeout: 10000,
                                            showProgressBar: true,
                                            closeOnClick: false,
                                            pauseOnHover: true,
                                        },
                                    });
                                } catch (error) {
                                    reject({
                                        body: error,
                                        config: {
                                            timeout: 10000,
                                            showProgressBar: true,
                                            closeOnClick: false,
                                            pauseOnHover: true,
                                        },
                                    });
                                }
                            })
                        );
                    },
                    bold: false
                },
                {
                    text: self.t('NO'),
                    action: (toast) => {
                        self.$snotify.remove(toast.id);
                    }
                }
            ]
        });
    }

    public select_page(page) {
        this.$emit('select_page', page);
    }

    public async reload_widgets() {
        const self = this;

        // On reload les widgets
        await self.throttled_rebuild_page_layout();
        self.set_selected_widget(null);
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
}