import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import FavoritesFiltersWidgetOptionsVO from '../../../../../../../shared/modules/DashboardBuilder/vos/FavoritesFiltersWidgetOptionsVO';
import ExportContextQueryToXLSXParamVO from '../../../../../../../shared/modules/DataExport/vos/apis/ExportContextQueryToXLSXParamVO';
import YearFilterWidgetOptionsVO from '../../../../../../../shared/modules/DashboardBuilder/vos/YearFilterWidgetOptionsVO';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import FavoritesFiltersVO from '../../../../../../../shared/modules/DashboardBuilder/vos/FavoritesFiltersVO';
import DashboardWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import DashboardPageVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import VOFieldRefVO from '../../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import DashboardVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import VOsTypesManager from '../../../../../../../shared/modules/VO/manager/VOsTypesManager';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import VueComponentBase from '../../../../VueComponentBase';
import { ModuleDashboardPageGetter } from '../../../page/DashboardPageStore';
import DashboardBuilderWidgetsController from '../../DashboardBuilderWidgetsController';
import FieldValueFilterWidgetOptions from '../../field_value_filter_widget/options/FieldValueFilterWidgetOptions';
import MonthFilterWidgetOptions from '../../month_filter_widget/options/MonthFilterWidgetOptions';
import ReloadFiltersWidgetController from '../../reload_filters_widget/RealoadFiltersWidgetController';
import FavoritesFiltersModalComponent from '../modal/FavoritesFiltersModalComponent';
import FieldValueFilterWidgetManager from '../../../../../../../shared/modules/DashboardBuilder/manager/FieldValueFilterWidgetManager';
import FavoritesFiltersVOManager from '../../../../../../../shared/modules/DashboardBuilder/manager/FavoritesFiltersVOManager';
import MonthFilterWidgetManager from '../../../../../../../shared/modules/DashboardBuilder/manager/MonthFilterWidgetManager';
import YearFilterWidgetManager from '../../../../../../../shared/modules/DashboardBuilder/manager/YearFilterWidgetManager';
import FieldFiltersVOManager from '../../../../../../../shared/modules/DashboardBuilder/manager/FieldFiltersVOManager';
import TableWidgetManager from '../../../../../../../shared/modules/DashboardBuilder/manager/TableWidgetManager';
import FieldFiltersVO from '../../../../../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO';
import './SaveFavoritesFiltersWidgetComponent.scss';

@Component({
    template: require('./SaveFavoritesFiltersWidgetComponent.pug'),
    components: {}
})
export default class SaveFavoritesFiltersWidgetComponent extends VueComponentBase {

    @ModuleDashboardPageGetter
    private get_Favoritesfiltersmodalcomponent: FavoritesFiltersModalComponent;

    @ModuleDashboardPageGetter
    private get_active_field_filters: FieldFiltersVO;

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    private dashboard_page: DashboardPageVO;

    @Prop({ default: null })
    private all_page_widget: DashboardPageWidgetVO[];

    @Prop({ default: null })
    private dashboard: DashboardVO;

    private start_update: boolean = false;

    /**
     * Handle Open Modal
     *
     * @return {Promise<void>}
     */
    private async handle_open_modal(): Promise<void> {

        const selectionnable_active_field_filters = await this.get_selectionnable_active_field_filters();
        const exportable_data = await this.get_exportable_xlsx_params();

        this.get_Favoritesfiltersmodalcomponent.open_modal_for_creation(
            {
                dashboard_page: this.dashboard_page,
                page_widget: this.page_widget,
                selectionnable_active_field_filters,
                exportable_data,
            },
            this.handle_save.bind(this)
        );
    }

    /**
     * Handle Save V1
     *  - Save active dashboard filters for the current user
     *
     * @param {Partial<FavoritesFiltersVO>} [props]
     * @returns {Promise<void>}
     */
    private async handle_save(props: Partial<FavoritesFiltersVO>): Promise<void> {
        if (!props) {
            return;
        }

        if (this.start_update) {
            return;
        }

        this.start_update = true;

        const favorites_filters = new FavoritesFiltersVO().from({
            page_id: this.dashboard_page.id,
            owner_id: this.data_user.id,
            ...props,
        });

        await this.save_favorites_filters(favorites_filters);

        this.start_update = false;
    }

    /**
     * Save Favorites Filters
     *
     * @param {FavoritesFiltersVO} favorites_filters
     * @return {Promise<void>}
     */
    private async save_favorites_filters(favorites_filters: FavoritesFiltersVO): Promise<void> {
        let self = this;

        self.snotify.async(self.label('dashboard_viewer.save_favorites_filters.start'), () =>
            new Promise(async (resolve, reject) => {
                const success = await FavoritesFiltersVOManager.save_favorites_filters(
                    favorites_filters
                );

                if (success) {
                    await self.reload_all_visible_active_filters();
                    resolve({
                        body: self.label('dashboard_viewer.save_favorites_filters.ok'),
                        config: {
                            timeout: 10000,
                            showProgressBar: true,
                            closeOnClick: false,
                            pauseOnHover: true,
                        },
                    });
                } else {
                    reject({
                        body: self.label('dashboard_viewer.save_favorites_filters.failed'),
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
    }

    /**
     * Reload All Visible Active Filters
     *  - Reload all active filters for all visible widgets
     *  - Once the favorites_filters have been saved for the current user,
     *    we need to load it from the DB (to be displayed in the list of favorites_filters)
     *
     * @return {void}
     */
    private async reload_all_visible_active_filters(): Promise<void> {
        for (const db_id in ReloadFiltersWidgetController.getInstance().reloaders) {
            const db_reloaders = ReloadFiltersWidgetController.getInstance().reloaders[db_id];

            for (const p_id in db_reloaders) {
                const p_reloaders = db_reloaders[p_id];

                for (const w_id in p_reloaders) {
                    const reload = p_reloaders[w_id];

                    await reload();
                }
            }
        }
    }

    /**
     * Get Exportable XLSX Params
     *
     * @param {boolean} [limit_to_page]
     */
    private async get_exportable_xlsx_params(limit_to_page: boolean = true): Promise<{ [title_name_code: string]: ExportContextQueryToXLSXParamVO }> {

        const exportable_xlsx_params = await TableWidgetManager.create_exportable_valuetables_xlsx_params(
            this.dashboard,
            this.dashboard_page,
            this.get_active_field_filters,
        );

        return exportable_xlsx_params;
    }

    /**
     * Get Selectionnable Active Field Filters
     *
     * @return {{ [api_type_id: string]: { [field_id: string]: ContextFilterVO }}
     */
    private async get_selectionnable_active_field_filters(): Promise<FieldFiltersVO> {
        const dashboard_page_id = this.dashboard_page.id;

        const field_value_filters_widgets_options = await FieldValueFilterWidgetManager.get_field_value_filters_widgets_options_metadata(dashboard_page_id);
        const month_filters_widgets_options = await MonthFilterWidgetManager.get_month_filters_widgets_options_metadata(dashboard_page_id);
        const year_filters_widgets_options = await YearFilterWidgetManager.get_year_filters_widgets_options_metadata(dashboard_page_id);

        const widgets_options: any[] = [];

        for (const name in field_value_filters_widgets_options) {
            const widget_options = field_value_filters_widgets_options[name].widget_options;
            widgets_options.push(widget_options);
        }

        for (const name in month_filters_widgets_options) {
            const widget_options = month_filters_widgets_options[name].widget_options;
            widgets_options.push(widget_options);
        }

        for (const name in year_filters_widgets_options) {
            const widget_options = year_filters_widgets_options[name].widget_options;
            widgets_options.push(widget_options);
        }

        // Get field_filters from active_field_filters by filtering with visible widgets
        const field_filters = FieldFiltersVOManager.filter_visible_field_filters(
            widgets_options,
            this.get_active_field_filters,
        );

        return field_filters;
    }

    /**
     * Get Vo Field Ref By Widget Options
     *
     * @param {FieldValueFilterWidgetOptions} widget_options
     * @returns {VOFieldRefVO}
     */
    private get_vo_field_ref_by_widget_options(
        widget_options: FieldValueFilterWidgetOptions | MonthFilterWidgetOptions | YearFilterWidgetOptionsVO
    ): VOFieldRefVO {

        if (!widget_options?.vo_field_ref) {
            return null;
        }

        return new VOFieldRefVO().from(widget_options.vo_field_ref);
    }

    /**
     * Get Widgets By Id
     *
     * @return { [id: number]: DashboardWidgetVO }
     */
    get widgets_by_id(): { [id: number]: DashboardWidgetVO } {
        return VOsTypesManager.vosArray_to_vosByIds(DashboardBuilderWidgetsController.getInstance().sorted_widgets);
    }

    /**
     * Get widget_options
     *
     * @return {FavoritesFiltersWidgetOptionsVO}
     */
    get widget_options(): FavoritesFiltersWidgetOptionsVO {

        if (!this.page_widget) {
            return null;
        }

        let options: FavoritesFiltersWidgetOptionsVO = null;

        try {
            if (!!this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as FavoritesFiltersWidgetOptionsVO;
                options = options ? new FavoritesFiltersWidgetOptionsVO().from(options) : null;
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }

        return options;
    }

    /**
     * Get All Page Widget By Id
     * @return {{ [id: number]: DashboardPageWidgetVO }}
     */
    get all_page_widgets_by_id(): { [id: number]: DashboardPageWidgetVO } {
        return VOsTypesManager.vosArray_to_vosByIds(this.all_page_widget);
    }
}