/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ModuleDAOServer from '../../../server/modules/DAO/ModuleDAOServer';
import UserVO from '../../../shared/modules/AccessPolicy/vos/UserVO';
import ContextFilterVO from '../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ContextFieldFiltersVO from '../../../shared/modules/DashboardBuilder/vos/ContextFieldFiltersVO';
import DashboardPageWidgetVO from '../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardWidgetVO from '../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import FavoritesFiltersExportParamsVO from '../../../shared/modules/DashboardBuilder/vos/FavoritesFiltersExportParamsVO';
import FavoritesFiltersVO from '../../../shared/modules/DashboardBuilder/vos/FavoritesFiltersVO';
import FieldFiltersVO from '../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO';
import ExportContextQueryToXLSXQueryVO from '../../../shared/modules/DataExport/vos/ExportContextQueryToXLSXQueryVO';
import VOsTypesManager from '../../../shared/modules/VO/manager/VOsTypesManager';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ObjectHandler, { field_names } from '../../../shared/tools/ObjectHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20250724MigrateContextFiltersAddWidgetID implements IGeneratorWorker {


    private static instance: Patch20250724MigrateContextFiltersAddWidgetID = null;
    private constructor() { }

    get uid(): string {
        return 'Patch20250724MigrateContextFiltersAddWidgetID';
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20250724MigrateContextFiltersAddWidgetID {
        if (!Patch20250724MigrateContextFiltersAddWidgetID.instance) {
            Patch20250724MigrateContextFiltersAddWidgetID.instance = new Patch20250724MigrateContextFiltersAddWidgetID();
        }
        return Patch20250724MigrateContextFiltersAddWidgetID.instance;
    }

    public async work(db: IDatabase<any>) {
        /**
         * On doit modifier tous les context_filters en base de données, et ajouter le niveau widget_id
         * FavoritesFiltersVO > field_filters: FieldFiltersVO
         * FavoritesFiltersVO > export_params: FavoritesFiltersExportParamsVO > exportable_data: ExportContextQueryToXLSXParamVO > active_field_filters: FieldFiltersVO
         * FavoritesFiltersVO > export_params: FavoritesFiltersExportParamsVO > exportable_data: ExportContextQueryToXLSXParamVO > custom_filters: FieldFiltersVO
         *
         * ExportContextQueryToXLSXQueryVO > active_field_filters: FieldFiltersVO
         * ExportContextQueryToXLSXQueryVO > custom_filters: FieldFiltersVO
         *
         * FavoritesFiltersExportParamsVO > exportable_data: ExportContextQueryToXLSXParamVO > active_field_filters: FieldFiltersVO
         * FavoritesFiltersExportParamsVO > exportable_data: ExportContextQueryToXLSXParamVO > custom_filters: FieldFiltersVO
         */

        const favorites_filters: FavoritesFiltersVO[] = await query(FavoritesFiltersVO.API_TYPE_ID)
            .exec_as_server()
            .select_vos<FavoritesFiltersVO>();
        const all_widgets_by_id: { [widget_id: number]: DashboardWidgetVO } = await VOsTypesManager.vosArray_to_vosByIds(
            await query(DashboardWidgetVO.API_TYPE_ID)
                .exec_as_server()
                .select_vos<DashboardWidgetVO>(),
        );

        for (const favorites_filter of favorites_filters) {

            const this_dashboard_page_widgets: DashboardPageWidgetVO[] = await query(DashboardPageWidgetVO.API_TYPE_ID)
                .filter_by_num_eq(field_names<DashboardPageWidgetVO>().dashboard_id, favorites_filter.dashboard_id)
                .select_vos<DashboardPageWidgetVO>();

            // FavoritesFiltersVO > field_filters: FieldFiltersVO
            favorites_filter.field_filters = await this.migrate_context_filters(
                favorites_filter.field_filters as any as ContextFieldFiltersVO,
                this_dashboard_page_widgets,
                all_widgets_by_id,
            );

            favorites_filter.export_params = await this.migrate_export_params(
                favorites_filter.export_params,
                this_dashboard_page_widgets,
                all_widgets_by_id,
            );

            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(favorites_filter);
        }


        // FavoritesFiltersExportParamsVO > exportable_data: ExportContextQueryToXLSXParamVO > active_field_filters: FieldFiltersVO
        // FavoritesFiltersExportParamsVO > exportable_data: ExportContextQueryToXLSXParamVO > custom_filters: FieldFiltersVO
        // A priori totalement inutilisé

        // ExportContextQueryToXLSXQueryVO > active_field_filters: FieldFiltersVO
        // ExportContextQueryToXLSXQueryVO > custom_filters: FieldFiltersVO
        // On peut pas migrer ça on a pas de dashboard_id, donc on truncate la table
        await ModuleDAOServer.instance.truncate(ExportContextQueryToXLSXQueryVO.API_TYPE_ID);
    }

    public async migrate_export_params(
        export_params: FavoritesFiltersExportParamsVO,
        this_dashboard_page_widgets: DashboardPageWidgetVO[],
        all_widgets_by_id: { [widget_id: number]: DashboardWidgetVO },
    ): Promise<FavoritesFiltersExportParamsVO> {

        // On doit migrer FavoritesFiltersExportParamsVO > exportable_data: ExportContextQueryToXLSXParamVO > active_field_filters: FieldFiltersVO
        // et FavoritesFiltersExportParamsVO > exportable_data: ExportContextQueryToXLSXParamVO > custom_filters: FieldFiltersVO

        if (!export_params || !export_params.exportable_data) {
            return export_params;
        }

        for (const key in export_params.exportable_data) {
            const exportable_data = export_params.exportable_data[key];

            // On doit migrer active_field_filters et custom_filters
            exportable_data.active_field_filters = await this.migrate_context_filters(
                exportable_data.active_field_filters as any as ContextFieldFiltersVO,
                this_dashboard_page_widgets,
                all_widgets_by_id,
            );
            exportable_data.custom_filters = await this.migrate_context_filters(
                exportable_data.custom_filters as any as ContextFieldFiltersVO,
                this_dashboard_page_widgets,
                all_widgets_by_id,
            );
        }
    }

    public async migrate_context_filters(
        old_context_filters: ContextFieldFiltersVO,
        this_dashboard_page_widgets: DashboardPageWidgetVO[],
        all_widgets_by_id: { [widget_id: number]: DashboardWidgetVO },
    ) {
        const new_field_filters: FieldFiltersVO = {};

        // On doit identifier les widgets de filtre et les regrouper par field_name/vo_type + widget_id
        const filters_by_vo_field_ref: { [api_type_id: string]: { [field_id: string]: number[] } } = this.get_filters_by_context_filter(
            this_dashboard_page_widgets,
            all_widgets_by_id,
        );

        for (const api_type_id in old_context_filters) {
            const old_context_filters_api_type_id = old_context_filters[api_type_id];

            new_field_filters[api_type_id] = {};

            for (const field_id in old_context_filters_api_type_id) {
                const old_context_filter: ContextFilterVO = old_context_filters_api_type_id[field_id];

                new_field_filters[api_type_id][field_id] = {};

                /**
                 * On doit impacter ce context filter sur un widget_id. on le choisi par ceux du dashboard qui sont liés à ce api_type_id et field_id
                 * et si yen a plusieurs types, on les affecte tous...
                 */

                const widgets = (filters_by_vo_field_ref[api_type_id] ? filters_by_vo_field_ref[api_type_id][field_id] || [] : []);
                for (const widget_id of widgets) {

                    new_field_filters[api_type_id][field_id][widget_id] = new ContextFilterVO().from(old_context_filter);
                }
            }
        }

        return new_field_filters;
    }

    private get_filters_by_context_filter(
        this_dashboard_page_widgets: DashboardPageWidgetVO[],
        all_widgets_by_id: { [widget_id: number]: DashboardWidgetVO },
    ): { [api_type_id: string]: { [field_id: string]: number[] } } {

        const filters_by_vo_field_ref: { [api_type_id: string]: { [field_id: string]: number[] } } = {};

        for (const page_widget of this_dashboard_page_widgets) {

            const widget = all_widgets_by_id[page_widget.widget_id];
            if (!widget.is_filter) {
                continue; // pas un widget de filtre
            }

            const options = (page_widget && page_widget.json_options) ? ObjectHandler.try_get_json(page_widget.json_options) : null;

            switch (widget.name) {

                case 'currentuserfilter':

                    if (!filters_by_vo_field_ref[UserVO.API_TYPE_ID]) {
                        filters_by_vo_field_ref[UserVO.API_TYPE_ID] = {};
                    }
                    if (!filters_by_vo_field_ref[UserVO.API_TYPE_ID][field_names<UserVO>().id]) {
                        filters_by_vo_field_ref[UserVO.API_TYPE_ID][field_names<UserVO>().id] = [];
                    }
                    filters_by_vo_field_ref[UserVO.API_TYPE_ID][field_names<UserVO>().id].push(page_widget.widget_id);
                    break;

                case 'fieldvaluefilter':

                    if (!filters_by_vo_field_ref[options.vo_field_ref.api_type_id]) {
                        filters_by_vo_field_ref[options.vo_field_ref.api_type_id] = {};
                    }
                    if (!filters_by_vo_field_ref[options.vo_field_ref.api_type_id][options.vo_field_ref.field_id]) {
                        filters_by_vo_field_ref[options.vo_field_ref.api_type_id][options.vo_field_ref.field_id] = [];
                    }
                    filters_by_vo_field_ref[options.vo_field_ref.api_type_id][options.vo_field_ref.field_id].push(page_widget.widget_id);
                    break;

                case 'validationfilters':
                    break;

                case 'resetfilters':
                    break;

                case 'dowfilter':
                case 'monthfilter':
                case 'yearfilter':
                case 'advanceddatefilter':

                    const field_id = options.vo_field_ref ? options.vo_field_ref.field_id : ContextFilterVO.CUSTOM_FILTERS_TYPE;
                    const api_type_id = options.vo_field_ref ? options.vo_field_ref.api_type_id : ContextFilterVO.CUSTOM_FILTERS_TYPE;

                    if (!filters_by_vo_field_ref[api_type_id]) {
                        filters_by_vo_field_ref[api_type_id] = {};
                    }
                    if (!filters_by_vo_field_ref[api_type_id][field_id]) {
                        filters_by_vo_field_ref[api_type_id][field_id] = [];
                    }
                    filters_by_vo_field_ref[api_type_id][field_id].push(page_widget.widget_id);
                    break;

                default:
                    ConsoleHandler.error(`Widget ${widget.name} is not supported for migration in Patch20250724MigrateContextFiltersAddWidgetID`);
                    continue; // pas un widget de filtre qu'on supporte
            }
        }

        return filters_by_vo_field_ref;
    }

}
