import { cloneDeep } from 'lodash';
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import ContextFilterVO from '../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import FavoritesFiltersVO from '../../../../../../shared/modules/DashboardBuilder/vos/FavoritesFiltersVO';
import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import DashboardWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import VOFieldRefVO from '../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import YearFilterWidgetOptionsVO from '../../../../../../shared/modules/DashboardBuilder/vos/YearFilterWidgetOptionsVO';
import ExportContextQueryToXLSXParamVO from '../../../../../../shared/modules/DataExport/vos/apis/ExportContextQueryToXLSXParamVO';
import VOsTypesManager from '../../../../../../shared/modules/VO/manager/VOsTypesManager';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import VueComponentBase from '../../../VueComponentBase';
import { ModuleDashboardPageGetter } from '../../page/DashboardPageStore';
import DashboardBuilderWidgetsController from '../DashboardBuilderWidgetsController';
import FieldValueFilterWidgetOptions from '../field_value_filter_widget/options/FieldValueFilterWidgetOptions';
import MonthFilterWidgetOptions from '../month_filter_widget/options/MonthFilterWidgetOptions';
import ReloadFiltersWidgetController from '../reload_filters_widget/RealoadFiltersWidgetController';
import SaveFavoritesFiltersModalComponent from './modal/SaveFavoritesFiltersModalComponent';
import SaveFavoritesFiltersWidgetOptions from './options/SaveFavoritesFiltersWidgetOptions';
import FieldValueFilterWidgetManager from '../../../../../../shared/modules/DashboardBuilder/manager/FieldValueFilterWidgetManager';
import FavoritesFiltersVOManager from '../../../../../../shared/modules/DashboardBuilder/manager/FavoritesFiltersVOManager';
import MonthFilterWidgetManager from '../../../../../../shared/modules/DashboardBuilder/manager/MonthFilterWidgetManager';
import YearFilterWidgetManager from '../../../../../../shared/modules/DashboardBuilder/manager/YearFilterWidgetManagerts';
import TableWidgetManager from '../../../../../../shared/modules/DashboardBuilder/manager/TableWidgetManager';
import FieldFilterManager from '../../../../../../shared/modules/DashboardBuilder/manager/FieldFilterManager';
import './SaveFavoritesFiltersWidgetComponent.scss';

@Component({
    template: require('./SaveFavoritesFiltersWidgetComponent.pug'),
    components: {}
})
export default class SaveFavoritesFiltersWidgetComponent extends VueComponentBase {

    @ModuleDashboardPageGetter
    private get_Savefavoritesfiltersmodalcomponent: SaveFavoritesFiltersModalComponent;

    @ModuleDashboardPageGetter
    private get_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } };

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

        const selectionnable_active_field_filters = this.get_selectionnable_active_field_filters();
        const exportable_data = await this.get_exportable_xlsx_params();

        this.get_Savefavoritesfiltersmodalcomponent.open_modal_for_creation(
            {
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
    private get_selectionnable_active_field_filters(): { [api_type_id: string]: { [field_id: string]: ContextFilterVO } } {

        const field_value_filters_widgets_options = FieldValueFilterWidgetManager.get_field_value_filters_widgets_options();
        const month_filters_widgets_options = MonthFilterWidgetManager.get_month_filters_widgets_options();
        const year_filters_widgets_options = YearFilterWidgetManager.get_year_filters_widgets_options();

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

        const field_filters = FieldFilterManager.filter_visible_field_filters(
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
     * @return {SaveFavoritesFiltersWidgetOptions}
     */
    get widget_options(): SaveFavoritesFiltersWidgetOptions {

        if (!this.page_widget) {
            return null;
        }

        let options: SaveFavoritesFiltersWidgetOptions = null;

        try {
            if (!!this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as SaveFavoritesFiltersWidgetOptions;
                options = options ? new SaveFavoritesFiltersWidgetOptions().from(options) : null;
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
    get all_page_widget_by_id(): { [id: number]: DashboardPageWidgetVO } {
        return VOsTypesManager.vosArray_to_vosByIds(this.all_page_widget);
    }
}