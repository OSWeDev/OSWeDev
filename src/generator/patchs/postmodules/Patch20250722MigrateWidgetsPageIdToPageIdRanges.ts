/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ModuleDAOServer from '../../../server/modules/DAO/ModuleDAOServer';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import DashboardPageVO from '../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardViewportPageWidgetVO from '../../../shared/modules/DashboardBuilder/vos/DashboardViewportPageWidgetVO';
import DashboardWidgetVO from '../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import TableColumnDescVO from '../../../shared/modules/DashboardBuilder/vos/TableColumnDescVO';
import ExportContextQueryToXLSXQueryVO from '../../../shared/modules/DataExport/vos/ExportContextQueryToXLSXQueryVO';
import VOsTypesManager from '../../../shared/modules/VO/manager/VOsTypesManager';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import LocaleManager from '../../../shared/tools/LocaleManager';
import ObjectHandler, { field_names } from '../../../shared/tools/ObjectHandler';
import { all_promises } from '../../../shared/tools/PromiseTools';
import RangeHandler from '../../../shared/tools/RangeHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20250722MigrateWidgetsPageIdToPageIdRanges implements IGeneratorWorker {


    private static instance: Patch20250722MigrateWidgetsPageIdToPageIdRanges = null;
    private constructor() { }

    get uid(): string {
        return 'Patch20250722MigrateWidgetsPageIdToPageIdRanges';
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20250722MigrateWidgetsPageIdToPageIdRanges {
        if (!Patch20250722MigrateWidgetsPageIdToPageIdRanges.instance) {
            Patch20250722MigrateWidgetsPageIdToPageIdRanges.instance = new Patch20250722MigrateWidgetsPageIdToPageIdRanges();
        }
        return Patch20250722MigrateWidgetsPageIdToPageIdRanges.instance;
    }

    public async work(db: IDatabase<any>) {
        /**
         * On doit lister tous les DashboardPageWidgetVO
         *  - 1 on passe le page_id en page_id_ranges
         *  - 2 on doit lancer un merge, au sein du db, entre les widgets de filtre qui ont la même ref de field_name/vo_type
         *      - 2.1 on garde le page_widget dont la page a le plus petit poids
         *      - 2.2 on stocke les ids de page_widget qu'on s'apprête à supprimer dans un tableau
         *      - 2.3 on change toutes les refs vers ces ids de page_widget pour les remplacer par le page_widget qu'on garde
         *          - 2.3.1 DashboardViewportPageWidgetVO.page_widget_id
         *          - 2.3.2 TableColumnDescVO.column_dynamic_page_widget_id
         *          - 2.3.3 TableColumnDescVO.do_not_user_filter_active_ids
         *          - 2.3.4 TableColumnDescVO.hide_if_any_filter_active
         *          - 2.3.5 TableColumnDescVO.show_if_any_filter_active
         *          - // C'est pas un VO en fait, et pas dans des options. osef : 2.3.6 WidgetOptionsMetadataVO.page_widget_id
         *          - 2.3.7 YearFilterWidgetOptionsVO.relative_to_other_filter_id
         *          - 2.3.8 AdvancedDateFilterWidgetOptions.relative_to_other_filter_id
         *          - 2.3.9 FieldValueFilterWidgetOptionsVO.relative_to_other_filter_id
         *          - 2.3.10 MonthFilterWidgetOptionsVO.relative_to_other_filter_id
         *          - 2.3.11 VarChartOptionsVO.selected_filter_id
         *
         * VarChartScalesOptionsVO.page_widget_id
         *      - 2.4 on supprime les page_widget qu'on a fusionné
         */

        let all_page_widgets: DashboardPageWidgetVO[] = await query(DashboardPageWidgetVO.API_TYPE_ID)
            .exec_as_server()
            .select_vos<DashboardPageWidgetVO>();

        const all_pages: DashboardPageVO[] = await query(DashboardPageVO.API_TYPE_ID)
            .exec_as_server()
            .select_vos<DashboardPageVO>();

        const all_widgets: DashboardWidgetVO[] = await query(DashboardWidgetVO.API_TYPE_ID)
            .exec_as_server()
            .select_vos<DashboardWidgetVO>();

        const all_widgets_by_id: { [widget_id: number]: DashboardWidgetVO } = VOsTypesManager.vosArray_to_vosByIds(all_widgets);

        const all_pages_by_id: { [page_id: number]: DashboardPageVO } = VOsTypesManager.vosArray_to_vosByIds(all_pages);

        for (const page of all_pages) {
            all_pages_by_id[page.id] = page;
        }

        let all_page_widgets_by_dashboard_id: { [dashboard_id: number]: DashboardPageWidgetVO[] } = {};

        for (const page_widget of all_page_widgets) {
            const widget_s_page = all_pages_by_id[page_widget.page_id];

            if (!all_page_widgets_by_dashboard_id[widget_s_page.dashboard_id]) {
                all_page_widgets_by_dashboard_id[widget_s_page.dashboard_id] = [];
            }
            all_page_widgets_by_dashboard_id[widget_s_page.dashboard_id].push(page_widget);
        }

        // On peut commencer par migrer en dashboard_id
        for (const page_widget of all_page_widgets) {
            if (!!page_widget.dashboard_id) {
                continue; // already migrated
            }

            page_widget.dashboard_id = all_pages_by_id[page_widget.page_id].dashboard_id;
        }

        // On met à jour
        await ModuleDAOServer.instance.insertOrUpdateVOs_as_server(all_page_widgets);

        // De manière générale, on doit mettre à jour tous les DashboardViewportPageWidgetVO pour reprendre le page_id actuelle du DashboardPageWidgetVO
        const promises = [];
        for (const page_widget of all_page_widgets) {

            promises.push(query(DashboardViewportPageWidgetVO.API_TYPE_ID)
                .filter_by_num_x_ranges(field_names<DashboardViewportPageWidgetVO>().page_widget_id, RangeHandler.get_ids_ranges_from_vos([page_widget]))
                .filter_is_null_or_empty(field_names<DashboardViewportPageWidgetVO>().page_id)
                .exec_as_server()
                .update_vos<DashboardViewportPageWidgetVO>({
                    page_id: page_widget.page_id, // eslint-disable-line @stylistic/indent
                })); // eslint-disable-line @stylistic/indent
        }

        await all_promises(promises);

        // Maintenant on passe à la fusion des widgets de filtre
        // On le fait db par db

        const exports_by_id: { [id: number]: ExportContextQueryToXLSXQueryVO } = VOsTypesManager.vosArray_to_vosByIds(
            await query(ExportContextQueryToXLSXQueryVO.API_TYPE_ID)
                .exec_as_server()
                .select_vos<ExportContextQueryToXLSXQueryVO>());


        for (const dashboard_id in all_page_widgets_by_dashboard_id) {
            ConsoleHandler.log(`Checking duplicates for dashboard ${dashboard_id}...`);

            await this.check_duplicates(
                all_page_widgets,
                all_page_widgets_by_dashboard_id[dashboard_id],
                all_pages_by_id,
                all_widgets_by_id,
                exports_by_id,
            );
        }

        // On a peut-être supprimé des widgets, on doit donc mettre à jour la liste
        all_page_widgets = await query(DashboardPageWidgetVO.API_TYPE_ID)
            .exec_as_server()
            .select_vos<DashboardPageWidgetVO>();
        all_page_widgets_by_dashboard_id = {};
        for (const page_widget of all_page_widgets) {
            const widget_s_page = all_pages_by_id[page_widget.page_id];

            if (!all_page_widgets_by_dashboard_id[widget_s_page.dashboard_id]) {
                all_page_widgets_by_dashboard_id[widget_s_page.dashboard_id] = [];
            }
            all_page_widgets_by_dashboard_id[widget_s_page.dashboard_id].push(page_widget);
        }

        for (const dashboard_id in all_page_widgets_by_dashboard_id) {
            ConsoleHandler.log(`Merging page widgets for dashboard ${dashboard_id}...`);
            await this.merge_page_widgets(
                all_page_widgets,
                all_page_widgets_by_dashboard_id[dashboard_id],
                all_pages_by_id,
                all_widgets_by_id,
                exports_by_id,
            );
        }
    }

    private async check_duplicates(
        all_page_widgets: DashboardPageWidgetVO[],
        this_dashboard_page_widgets: DashboardPageWidgetVO[],
        all_pages_by_id: { [page_id: number]: DashboardPageVO },
        all_widgets_by_id: { [widget_id: number]: DashboardWidgetVO },
        exports_by_id: { [id: number]: ExportContextQueryToXLSXQueryVO },
    ) {

        // On doit dans un premier temps vérifier qu'il n'y a pas de doublons de widget_id sur une même page du db. sinon on supprime le page_widget le plus bas dans la page
        // Pour ce faire, on regroupe les widgets par page_id / widget_id / vo_field_ref
        // On doit identifier les widgets de filtre et les regrouper par field_name/vo_type + widget_id
        const filters_by_vo_field_ref: { [widget_id: number]: { [vo_field_ref: string]: DashboardPageWidgetVO[] } } = this.get_filters_by_vo_field_ref(
            this_dashboard_page_widgets,
            all_widgets_by_id,
        );

        // On doit vérifier les doublons
        for (const widget_id in filters_by_vo_field_ref) {
            const filters_by_vo_field_ref_for_widget: { [vo_field_ref: string]: DashboardPageWidgetVO[] } = filters_by_vo_field_ref[widget_id];

            // On doit maintenant vérifier les doublons de widgets de filtre pour ce widget_id
            for (const vo_field_ref in filters_by_vo_field_ref_for_widget) {
                const page_widgets: DashboardPageWidgetVO[] = filters_by_vo_field_ref_for_widget[vo_field_ref];

                // on doit les grouper par page_id
                const page_widgets_by_page_id: { [page_id: number]: DashboardPageWidgetVO[] } = {};

                for (const page_widget of page_widgets) {
                    if (!page_widgets_by_page_id[page_widget.page_id]) {
                        page_widgets_by_page_id[page_widget.page_id] = [];
                    }
                    page_widgets_by_page_id[page_widget.page_id].push(page_widget);
                }

                // On doit maintenant vérifier les doublons de widgets de filtre pour ce widget_id et cette vo_field_ref
                for (const page_id in page_widgets_by_page_id) {
                    const page_widgets_for_page: DashboardPageWidgetVO[] = page_widgets_by_page_id[page_id];

                    if (page_widgets_for_page.length <= 1) {
                        continue; // pas besoin de fusionner
                    }

                    // On garde le page widget ayant le plus petit y
                    let page_widget_to_keep: DashboardPageWidgetVO = page_widgets_for_page[0];
                    for (const page_widget of page_widgets_for_page) {
                        if (page_widget.y < page_widget_to_keep.y) {
                            page_widget_to_keep = page_widget;
                        }
                    }

                    // On supprime les autres widgets
                    const page_widgets_to_delete: DashboardPageWidgetVO[] = [];
                    for (const page_widget of page_widgets_for_page) {
                        if (page_widget.id !== page_widget_to_keep.id) {
                            page_widgets_to_delete.push(page_widget);
                        }
                    }

                    // On supprime les références vers ces widgets
                    await this.delete_references_to_page_widgets(
                        all_page_widgets,
                        all_widgets_by_id,
                        all_pages_by_id,
                        all_widgets_by_id,
                        page_widgets_to_delete,
                        page_widget_to_keep,
                        exports_by_id,
                    );

                    // On supprime les widgets qu'on a fusionné
                    await ModuleDAOServer.instance.deleteVOs_as_server(page_widgets_to_delete);
                }
            }
        }

    }

    private async merge_page_widgets(
        all_page_widgets: DashboardPageWidgetVO[],
        this_dashboard_page_widgets: DashboardPageWidgetVO[],
        all_pages_by_id: { [page_id: number]: DashboardPageVO },
        all_widgets_by_id: { [widget_id: number]: DashboardWidgetVO },
        exports_by_id: { [id: number]: ExportContextQueryToXLSXQueryVO },
    ) {

        // On doit identifier les widgets de filtre et les regrouper par field_name/vo_type + widget_id
        const filters_by_vo_field_ref: { [widget_id: number]: { [vo_field_ref: string]: DashboardPageWidgetVO[] } } = this.get_filters_by_vo_field_ref(
            this_dashboard_page_widgets,
            all_widgets_by_id,
        );

        // On doit maintenant fusionner les widgets de filtre
        // On s'intéresse à chaque groupe de widgets de filtre
        for (const widget_id in filters_by_vo_field_ref) {
            const filters_by_vo_field_ref_for_widget: { [vo_field_ref: string]: DashboardPageWidgetVO[] } = filters_by_vo_field_ref[widget_id];

            // On doit maintenant fusionner les widgets de filtre pour ce widget_id
            for (const vo_field_ref in filters_by_vo_field_ref_for_widget) {
                const page_widgets: DashboardPageWidgetVO[] = filters_by_vo_field_ref_for_widget[vo_field_ref];

                if (page_widgets.length <= 1) {
                    continue; // pas besoin de fusionner
                }

                // On garde le widget avec la page ayant le plus petit poids
                let page_widget_to_keep: DashboardPageWidgetVO = page_widgets[0];
                for (const page_widget of page_widgets) {
                    const page = all_pages_by_id[page_widget.page_id];
                    if (page.weight < all_pages_by_id[page_widget_to_keep.page_id].weight) {
                        page_widget_to_keep = page_widget;
                    }
                }

                // On supprime les autres widgets
                const page_widgets_to_delete: DashboardPageWidgetVO[] = [];
                for (const page_widget of page_widgets) {
                    if (page_widget.id !== page_widget_to_keep.id) {
                        page_widgets_to_delete.push(page_widget);
                    }
                }

                // On met à jour les références vers ces widgets
                await this.update_references_to_page_widgets(
                    all_page_widgets,
                    all_widgets_by_id,
                    all_pages_by_id,
                    all_widgets_by_id,
                    page_widget_to_keep,
                    page_widgets_to_delete,
                    exports_by_id,
                );

                // On supprime les widgets qu'on a fusionné
                await ModuleDAOServer.instance.deleteVOs_as_server(page_widgets_to_delete);
            }
        }
    }

    private get_filters_by_vo_field_ref(
        this_dashboard_page_widgets: DashboardPageWidgetVO[],
        all_widgets_by_id: { [widget_id: number]: DashboardWidgetVO },
    ): { [widget_id: number]: { [vo_field_ref: string]: DashboardPageWidgetVO[] } } {

        // On doit identifier les widgets de filtre et les regrouper par field_name/vo_type + widget_id
        const filters_by_vo_field_ref: { [widget_id: number]: { [vo_field_ref: string]: DashboardPageWidgetVO[] } } = {};

        for (const page_widget of this_dashboard_page_widgets) {

            const widget = all_widgets_by_id[page_widget.widget_id];
            if (!widget.is_filter) {
                continue; // pas un widget de filtre
            }

            const options = (page_widget && page_widget.json_options) ? ObjectHandler.try_get_json(page_widget.json_options) : null;

            switch (widget.name) {

                case 'currentuserfilter':
                    // pas de vo_field_ref mais on doit merger
                    if (!filters_by_vo_field_ref[widget.id]) {
                        filters_by_vo_field_ref[widget.id] = {};
                    }
                    if (!filters_by_vo_field_ref[widget.id]['currentuserfilter']) {
                        filters_by_vo_field_ref[widget.id]['currentuserfilter'] = [];
                    }

                    filters_by_vo_field_ref[widget.id]['currentuserfilter'].push(page_widget);
                    break;

                case 'fieldvaluefilter':
                    // FieldValueFilterWidgetOptionsVO.vo_field_ref + FieldValueFilterWidgetOptionsVO.vo_field_ref_lvl2
                    if (!options || !options.vo_field_ref) {
                        ConsoleHandler.error(`Widget ${widget.name} has no vo_field_ref, cannot merge`);
                        continue; // pas de vo_field_ref, on ne peut pas merger
                    }

                    if (!filters_by_vo_field_ref[widget.id]) {
                        filters_by_vo_field_ref[widget.id] = {};
                    }

                    const vo_field_ref =
                        (options.vo_field_ref.api_type_id + '/' + options.vo_field_ref.field_id) +
                        (options.vo_field_ref_lvl2 ? (' >> ' + options.vo_field_ref_lvl2.api_type_id + '/' + options.vo_field_ref_lvl2.field_id) : '');

                    if (!filters_by_vo_field_ref[widget.id][vo_field_ref]) {
                        filters_by_vo_field_ref[widget.id][vo_field_ref] = [];
                    }

                    filters_by_vo_field_ref[widget.id][vo_field_ref].push(page_widget);
                    break;

                case 'validationfilters':
                    // pas de vo_field_ref mais on doit merger
                    if (!filters_by_vo_field_ref[widget.id]) {
                        filters_by_vo_field_ref[widget.id] = {};
                    }
                    if (!filters_by_vo_field_ref[widget.id]['validationfilters']) {
                        filters_by_vo_field_ref[widget.id]['validationfilters'] = [];
                    }

                    filters_by_vo_field_ref[widget.id]['validationfilters'].push(page_widget);
                    break;

                case 'resetfilters':
                    // pas de vo_field_ref mais on doit merger
                    if (!filters_by_vo_field_ref[widget.id]) {
                        filters_by_vo_field_ref[widget.id] = {};
                    }
                    if (!filters_by_vo_field_ref[widget.id]['resetfilters']) {
                        filters_by_vo_field_ref[widget.id]['resetfilters'] = [];
                    }

                    filters_by_vo_field_ref[widget.id]['resetfilters'].push(page_widget);
                    break;

                case 'dowfilter':
                    // DOWFilterWidgetOptions.vo_field_ref

                    if (!options || !options.vo_field_ref) {
                        ConsoleHandler.error(`Widget ${widget.name} has no vo_field_ref, cannot merge`);
                        continue; // pas de vo_field_ref, on ne peut pas merger => pourquoi pas sur le custom ? => par ce que dow pour le coup ya pas.
                    }

                    if (!filters_by_vo_field_ref[widget.id]) {
                        filters_by_vo_field_ref[widget.id] = {};
                    }

                    const dow_field_ref = options.vo_field_ref.api_type_id + '/' + options.vo_field_ref.field_id;
                    if (!filters_by_vo_field_ref[widget.id][dow_field_ref]) {
                        filters_by_vo_field_ref[widget.id][dow_field_ref] = [];
                    }

                    filters_by_vo_field_ref[widget.id][dow_field_ref].push(page_widget);
                    break;

                case 'monthfilter':
                    // MonthFilterWidgetOptionsVO.vo_field_ref

                    if (!options || !options.vo_field_ref) {
                        // ConsoleHandler.error(`Widget ${widget.name} has no vo_field_ref, cannot merge`);
                        // continue; // pas de vo_field_ref, on ne peut pas merger => pourquoi pas sur le custom ? => par ce que dow pour le coup ya pas.

                        if (!options.custom_filter_name) {
                            ConsoleHandler.error(`Widget ${widget.name} has no vo_field_ref and no custom_filter_name, cannot merge`);
                            continue; // pas de vo_field_ref, on ne peut pas merger
                        }

                        if (!filters_by_vo_field_ref[widget.id]) {
                            filters_by_vo_field_ref[widget.id] = {};
                        }

                        if (!filters_by_vo_field_ref[widget.id][options.custom_filter_name]) {
                            filters_by_vo_field_ref[widget.id][options.custom_filter_name] = [];
                        }

                        filters_by_vo_field_ref[widget.id][options.custom_filter_name].push(page_widget);
                        continue;
                    }

                    if (!filters_by_vo_field_ref[widget.id]) {
                        filters_by_vo_field_ref[widget.id] = {};
                    }

                    const month_field_ref = options.vo_field_ref.api_type_id + '/' + options.vo_field_ref.field_id;
                    if (!filters_by_vo_field_ref[widget.id][month_field_ref]) {
                        filters_by_vo_field_ref[widget.id][month_field_ref] = [];
                    }

                    filters_by_vo_field_ref[widget.id][month_field_ref].push(page_widget);
                    break;
                case 'yearfilter':
                    // YearFilterWidgetOptionsVO.vo_field_ref

                    if (!options || !options.vo_field_ref) {
                        // ConsoleHandler.error(`Widget ${widget.name} has no vo_field_ref, cannot merge`);
                        // continue; // pas de vo_field_ref, on ne peut pas merger => pourquoi pas sur le custom

                        if (!options.custom_filter_name) {
                            ConsoleHandler.error(`Widget ${widget.name} has no vo_field_ref and no custom_filter_name, cannot merge`);
                            continue; // pas de vo_field_ref, on ne peut pas merger
                        }

                        if (!filters_by_vo_field_ref[widget.id]) {
                            filters_by_vo_field_ref[widget.id] = {};
                        }

                        if (!filters_by_vo_field_ref[widget.id][options.custom_filter_name]) {
                            filters_by_vo_field_ref[widget.id][options.custom_filter_name] = [];
                        }

                        filters_by_vo_field_ref[widget.id][options.custom_filter_name].push(page_widget);
                        continue;
                    }

                    if (!filters_by_vo_field_ref[widget.id]) {
                        filters_by_vo_field_ref[widget.id] = {};
                    }

                    const year_field_ref = options.vo_field_ref.api_type_id + '/' + options.vo_field_ref.field_id;
                    if (!filters_by_vo_field_ref[widget.id][year_field_ref]) {
                        filters_by_vo_field_ref[widget.id][year_field_ref] = [];
                    }

                    filters_by_vo_field_ref[widget.id][year_field_ref].push(page_widget);
                    break;
                case 'advanceddatefilter':
                    // AdvancedDateFilterWidgetOptions.vo_field_ref

                    if (!options || !options.vo_field_ref) {
                        // ConsoleHandler.error(`Widget ${widget.name} has no vo_field_ref, cannot merge`);
                        // continue; // pas de vo_field_ref, on ne peut pas merger => pourquoi pas sur le custom

                        if (!options.custom_filter_name) {
                            ConsoleHandler.error(`Widget ${widget.name} has no vo_field_ref and no custom_filter_name, cannot merge`);
                            continue; // pas de vo_field_ref, on ne peut pas merger
                        }

                        if (!filters_by_vo_field_ref[widget.id]) {
                            filters_by_vo_field_ref[widget.id] = {};
                        }

                        if (!filters_by_vo_field_ref[widget.id][options.custom_filter_name]) {
                            filters_by_vo_field_ref[widget.id][options.custom_filter_name] = [];
                        }

                        filters_by_vo_field_ref[widget.id][options.custom_filter_name].push(page_widget);
                        continue;
                    }

                    if (!filters_by_vo_field_ref[widget.id]) {
                        filters_by_vo_field_ref[widget.id] = {};
                    }

                    const advanced_date_field_ref = options.vo_field_ref.api_type_id + '/' + options.vo_field_ref.field_id;
                    if (!filters_by_vo_field_ref[widget.id][advanced_date_field_ref]) {
                        filters_by_vo_field_ref[widget.id][advanced_date_field_ref] = [];
                    }

                    filters_by_vo_field_ref[widget.id][advanced_date_field_ref].push(page_widget);
                    break;
                default:
                    ConsoleHandler.warn(`Widget ${widget.name} is not supported for migration in Patch20250722MigrateWidgetsPageIdToPageIdRanges. Using just the widget_name`);
                    // pas de vo_field_ref mais on doit merger
                    if (!filters_by_vo_field_ref[widget.id]) {
                        filters_by_vo_field_ref[widget.id] = {};
                    }
                    if (!filters_by_vo_field_ref[widget.id][widget.name]) {
                        filters_by_vo_field_ref[widget.id][widget.name] = [];
                    }

                    filters_by_vo_field_ref[widget.id][widget.name].push(page_widget);
                    continue; // pas un widget de filtre qu'on supporte
            }
        }

        return filters_by_vo_field_ref;
    }

    private async update_references_to_page_widgets(
        all_page_widgets: DashboardPageWidgetVO[],
        all_widgets_by_id: { [widget_id: number]: DashboardWidgetVO },
        all_pages_by_id: { [page_id: number]: DashboardPageVO },
        all_widgets_by_id_for_update: { [widget_id: number]: DashboardWidgetVO },
        page_widget_to_keep: DashboardPageWidgetVO,
        page_widgets_to_delete: DashboardPageWidgetVO[],
        exports_by_id: { [id: number]: ExportContextQueryToXLSXQueryVO },
    ) {

        /**
         * On informe du merge qu'on s'apprête à faire
         */

        ConsoleHandler.log(`Merging ${page_widgets_to_delete.length} page widgets into ${page_widget_to_keep.id} (${page_widget_to_keep.widget_name})`);

        // On doit maintenant mettre à jour les références vers ces widgets
        for (const page_widget of page_widgets_to_delete) {
            ConsoleHandler.log(` - ${page_widget.id} (${LocaleManager.t(all_pages_by_id[page_widget.page_id].titre_page)})`);
        }
        ConsoleHandler.log(`Keeping ${page_widget_to_keep.id} (${LocaleManager.t(all_pages_by_id[page_widget_to_keep.page_id].titre_page)})`);

        /**
         * On met à jour les références vers le page_widget_to_keep
         */
        // DashboardViewportPageWidgetVO.page_widget_id
        await query(DashboardViewportPageWidgetVO.API_TYPE_ID)
            .filter_by_num_x_ranges(field_names<DashboardViewportPageWidgetVO>().page_widget_id, RangeHandler.get_ids_ranges_from_vos(page_widgets_to_delete))
            .exec_as_server()
            .update_vos<DashboardViewportPageWidgetVO>({
                page_widget_id: page_widget_to_keep.id, // eslint-disable-line @stylistic/indent
            }); // eslint-disable-line @stylistic/indent

        // TableColumnDescVO.column_dynamic_page_widget_id
        // TableColumnDescVO.do_not_user_filter_active_ids
        // TableColumnDescVO.hide_if_any_filter_active
        // TableColumnDescVO.show_if_any_filter_active

        // là on doit modifier en base si ça existe mais surtout dans les params de widgets pour le moment qui ne sont pas encore des vos mais des jsons...
        // 1 . On met à jour les vos
        await query(TableColumnDescVO.API_TYPE_ID)
            .filter_by_num_x_ranges(field_names<TableColumnDescVO>().column_dynamic_page_widget_id, RangeHandler.get_ids_ranges_from_vos(page_widgets_to_delete))
            .exec_as_server()
            .update_vos<TableColumnDescVO>({
                column_dynamic_page_widget_id: page_widget_to_keep.id, // eslint-disable-line @stylistic/indent
            }); // eslint-disable-line @stylistic/indent

        await query(TableColumnDescVO.API_TYPE_ID)
            .filter_by_num_x_ranges(field_names<TableColumnDescVO>().do_not_user_filter_active_ids, RangeHandler.get_ids_ranges_from_vos(page_widgets_to_delete))
            .exec_as_server()
            .update_vos<TableColumnDescVO>({
                do_not_user_filter_active_ids: [page_widget_to_keep.id], // eslint-disable-line @stylistic/indent
            }); // eslint-disable-line @stylistic/indent

        await query(TableColumnDescVO.API_TYPE_ID)
            .filter_by_num_x_ranges(field_names<TableColumnDescVO>().hide_if_any_filter_active, RangeHandler.get_ids_ranges_from_vos(page_widgets_to_delete))
            .exec_as_server()
            .update_vos<TableColumnDescVO>({
                hide_if_any_filter_active: [page_widget_to_keep.id], // eslint-disable-line @stylistic/indent
            }); // eslint-disable-line @stylistic/indent

        await query(TableColumnDescVO.API_TYPE_ID)
            .filter_by_num_x_ranges(field_names<TableColumnDescVO>().show_if_any_filter_active, RangeHandler.get_ids_ranges_from_vos(page_widgets_to_delete))
            .exec_as_server()
            .update_vos<TableColumnDescVO>({
                show_if_any_filter_active: [page_widget_to_keep.id], // eslint-disable-line @stylistic/indent
            }); // eslint-disable-line @stylistic/indent


        // 2 . On met à jour les jsons des widgets
        for (const page_widget of all_page_widgets) {
            if (page_widget.json_options) {
                const options = ObjectHandler.try_get_json(page_widget.json_options);

                // TableWidgetOptionsVO.columns ?: TableColumnDescVO[];
                if (options && options.columns && Array.isArray(options.columns) && options.columns.length > 0) {
                    const new_columns = this.migrate_table_column_descs(
                        options.columns,
                        page_widget_to_keep,
                        page_widgets_to_delete,
                    );

                    if (JSON.stringify(new_columns) !== JSON.stringify(options.columns)) {
                        options.columns = new_columns;
                        page_widget.json_options = JSON.stringify(options);
                        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(page_widget);
                    }

                    // TableColumnDescVO.children: TableColumnDescVO[] :)
                    // ExportContextQueryToXLSXQueryVO.columns: TableColumnDescVO[];
                }
            }
        }

        // On doit chercher tous les TableColumnDescVO dans les TableWidgetOptionsVO
        // 1 . les vos TableWidgetOptionsVO => c'est pas un VO en réalité pour le moment => on ne peut pas le faire

        // On doit chercher tous les TableColumnDescVO dans les ExportContextQueryToXLSXQueryVO
        for (const i in exports_by_id) {
            const export_query: ExportContextQueryToXLSXQueryVO = exports_by_id[i];

            if (export_query.columns && Array.isArray(export_query.columns) && export_query.columns.length > 0) {

                const new_columns = this.migrate_table_column_descs(
                    export_query.columns,
                    page_widget_to_keep,
                    page_widgets_to_delete,
                );

                if (JSON.stringify(new_columns) !== JSON.stringify(export_query.columns)) {
                    export_query.columns = new_columns;
                    await ModuleDAOServer.instance.insertOrUpdateVO_as_server(export_query);
                    exports_by_id[i] = export_query; // on met à jour le tableau pour les prochaines itérations
                }
            }
        }


        // YearFilterWidgetOptionsVO.relative_to_other_filter_id
        // AdvancedDateFilterWidgetOptions.relative_to_other_filter_id
        // FieldValueFilterWidgetOptionsVO.relative_to_other_filter_id
        // MonthFilterWidgetOptionsVO.relative_to_other_filter_id
        // VarChartOptionsVO.selected_filter_id

        // là on doit modifier en base si ça existe mais surtout dans les params de widgets pour le moment qui ne sont pas encore des vos mais des jsons...

        // 1 . On met à jour les vos => YearFilterWidgetOptionsVO.relative_to_other_filter_id : C'est pas un VO en réalité pour le moment => on ne peut pas le faire
        // 1 . On met à jour les vos => AdvancedDateFilterWidgetOptions.relative_to_other_filter_id : C'est pas un VO en réalité pour le moment => on ne peut pas le faire
        // 1 . On met à jour les vos => FieldValueFilterWidgetOptionsVO.relative_to_other_filter_id : C'est pas un VO en réalité pour le moment => on ne peut pas le faire
        // 1 . On met à jour les vos => MonthFilterWidgetOptionsVO.relative_to_other_filter_id : C'est pas un VO en réalité pour le moment => on ne peut pas le faire
        // 1 . On met à jour les vos => VarChartOptionsVO.selected_filter_id : C'est pas un VO en réalité pour le moment => on ne peut pas le faire
        // await query(YearFilterWidgetOptionsVO.API_TYPE_ID)
        //     .filter_by_num_x_ranges(field_names<YearFilterWidgetOptionsVO>().relative_to_other_filter_id, RangeHandler.get_ids_ranges_from_vos(page_widgets_to_delete))
        //     .exec_as_server()
        //     .update_vos<YearFilterWidgetOptionsVO>({
        //         relative_to_other_filter_id: page_widget_to_keep.id, // eslint-disable-line @stylistic/indent
        //     }); // eslint-disable-line @stylistic/indent

        // 2 . On met à jour les jsons des widgets : relative_to_other_filter_id
        for (const page_widget of all_page_widgets) {
            if (page_widget.json_options) {
                const options = ObjectHandler.try_get_json(page_widget.json_options);
                if (options && options.relative_to_other_filter_id) {
                    if (RangeHandler.elt_intersects_any_range(options.relative_to_other_filter_id, RangeHandler.get_ids_ranges_from_vos(page_widgets_to_delete))) {
                        options.relative_to_other_filter_id = page_widget_to_keep.id;
                        page_widget.json_options = JSON.stringify(options);
                        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(page_widget);
                    }
                }
            }
        }


        // 2 . On met à jour les jsons des widgets : selected_filter_id
        for (const page_widget of all_page_widgets) {
            if (page_widget.json_options) {
                const options = ObjectHandler.try_get_json(page_widget.json_options);
                if (options && options.selected_filter_id) {
                    if (RangeHandler.elt_intersects_any_range(options.selected_filter_id, RangeHandler.get_ids_ranges_from_vos(page_widgets_to_delete))) {
                        options.selected_filter_id = page_widget_to_keep.id;
                        page_widget.json_options = JSON.stringify(options);
                        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(page_widget);
                    }
                }
            }
        }
    }

    private migrate_table_column_descs(
        columns: TableColumnDescVO[],
        page_widget_to_keep: DashboardPageWidgetVO,
        page_widgets_to_delete: DashboardPageWidgetVO[],
    ) {
        for (const column of columns) {
            if (column.column_dynamic_page_widget_id && RangeHandler.elt_intersects_any_range(column.column_dynamic_page_widget_id, RangeHandler.get_ids_ranges_from_vos(page_widgets_to_delete))) {
                column.column_dynamic_page_widget_id = page_widget_to_keep.id;
            }

            if (column.do_not_user_filter_active_ids && Array.isArray(column.do_not_user_filter_active_ids)) {

                // Si on intersecte, on doit cut par les page_widgets_to_delete et ajouter le page_widget_to_keep
                const new_ids: number[] = [];
                let intersects = false;
                let found = false;
                for (const id of column.do_not_user_filter_active_ids) {
                    if (!RangeHandler.elt_intersects_any_range(id, RangeHandler.get_ids_ranges_from_vos(page_widgets_to_delete))) {
                        new_ids.push(id);
                    } else {
                        intersects = true;
                    }

                    if (id === page_widget_to_keep.id) {
                        found = true;
                    }
                }

                if (intersects && !found) {
                    new_ids.push(page_widget_to_keep.id);
                }

                column.do_not_user_filter_active_ids = new_ids;
            }

            if (column.hide_if_any_filter_active && Array.isArray(column.hide_if_any_filter_active)) {

                // Si on intersecte, on doit cut par les page_widgets_to_delete et ajouter le page_widget_to_keep
                const new_ids: number[] = [];
                let intersects = false;
                let found = false;
                for (const id of column.hide_if_any_filter_active) {
                    if (!RangeHandler.elt_intersects_any_range(id, RangeHandler.get_ids_ranges_from_vos(page_widgets_to_delete))) {
                        new_ids.push(id);
                    } else {
                        intersects = true;
                    }

                    if (id === page_widget_to_keep.id) {
                        found = true;
                    }
                }

                if (intersects && !found) {
                    new_ids.push(page_widget_to_keep.id);
                }

                column.hide_if_any_filter_active = new_ids;
            }

            if (column.show_if_any_filter_active && Array.isArray(column.show_if_any_filter_active)) {

                // Si on intersecte, on doit cut par les page_widgets_to_delete et ajouter le page_widget_to_keep
                const new_ids: number[] = [];
                let intersects = false;
                let found = false;
                for (const id of column.show_if_any_filter_active) {
                    if (!RangeHandler.elt_intersects_any_range(id, RangeHandler.get_ids_ranges_from_vos(page_widgets_to_delete))) {
                        new_ids.push(id);
                    } else {
                        intersects = true;
                    }

                    if (id === page_widget_to_keep.id) {
                        found = true;
                    }
                }

                if (intersects && !found) {
                    new_ids.push(page_widget_to_keep.id);
                }

                column.show_if_any_filter_active = new_ids;
            }

            // et en récursif
            if (column.children && Array.isArray(column.children) && column.children.length > 0) {
                column.children = this.migrate_table_column_descs(column.children, page_widget_to_keep, page_widgets_to_delete);
            }
        }

        return columns;
    }


    private async delete_references_to_page_widgets(
        all_page_widgets: DashboardPageWidgetVO[],
        all_widgets_by_id: { [widget_id: number]: DashboardWidgetVO },
        all_pages_by_id: { [page_id: number]: DashboardPageVO },
        all_widgets_by_id_for_update: { [widget_id: number]: DashboardWidgetVO },
        page_widgets_to_delete: DashboardPageWidgetVO[],
        page_widget_to_keep: DashboardPageWidgetVO,
        exports_by_id: { [id: number]: ExportContextQueryToXLSXQueryVO },
    ) {

        /**
         * On informe du merge qu'on s'apprête à faire
         */

        ConsoleHandler.log(`Deleting ${page_widgets_to_delete.length} page widgets`);

        for (const page_widget of page_widgets_to_delete) {
            ConsoleHandler.log(` - ${page_widget.id} (${LocaleManager.t(all_pages_by_id[page_widget.page_id].titre_page)})`);
        }

        /**
         * On met à jour les références vers les widgets qu'on va supprimer
         */
        // DashboardViewportPageWidgetVO.page_widget_id => on supprime
        await query(DashboardViewportPageWidgetVO.API_TYPE_ID)
            .filter_by_num_x_ranges(field_names<DashboardViewportPageWidgetVO>().page_widget_id, RangeHandler.get_ids_ranges_from_vos(page_widgets_to_delete))
            .exec_as_server()
            .delete_vos();

        // TableColumnDescVO.column_dynamic_page_widget_id
        // TableColumnDescVO.do_not_user_filter_active_ids
        // TableColumnDescVO.hide_if_any_filter_active
        // TableColumnDescVO.show_if_any_filter_active

        // là on doit modifier en base si ça existe mais surtout dans les params de widgets pour le moment qui ne sont pas encore des vos mais des jsons...
        // 1 . On met à jour les vos
        await query(TableColumnDescVO.API_TYPE_ID)
            .filter_by_num_x_ranges(field_names<TableColumnDescVO>().column_dynamic_page_widget_id, RangeHandler.get_ids_ranges_from_vos(page_widgets_to_delete))
            .exec_as_server()
            .update_vos<TableColumnDescVO>({
                column_dynamic_page_widget_id: page_widget_to_keep.id, // eslint-disable-line @stylistic/indent
            }); // eslint-disable-line @stylistic/indent

        await query(TableColumnDescVO.API_TYPE_ID)
            .filter_by_num_x_ranges(field_names<TableColumnDescVO>().do_not_user_filter_active_ids, RangeHandler.get_ids_ranges_from_vos(page_widgets_to_delete))
            .exec_as_server()
            .update_vos<TableColumnDescVO>({
                do_not_user_filter_active_ids: [page_widget_to_keep.id], // eslint-disable-line @stylistic/indent
            }); // eslint-disable-line @stylistic/indent

        await query(TableColumnDescVO.API_TYPE_ID)
            .filter_by_num_x_ranges(field_names<TableColumnDescVO>().hide_if_any_filter_active, RangeHandler.get_ids_ranges_from_vos(page_widgets_to_delete))
            .exec_as_server()
            .update_vos<TableColumnDescVO>({
                hide_if_any_filter_active: [page_widget_to_keep.id], // eslint-disable-line @stylistic/indent
            }); // eslint-disable-line @stylistic/indent

        await query(TableColumnDescVO.API_TYPE_ID)
            .filter_by_num_x_ranges(field_names<TableColumnDescVO>().show_if_any_filter_active, RangeHandler.get_ids_ranges_from_vos(page_widgets_to_delete))
            .exec_as_server()
            .update_vos<TableColumnDescVO>({
                show_if_any_filter_active: [page_widget_to_keep.id], // eslint-disable-line @stylistic/indent
            }); // eslint-disable-line @stylistic/indent


        // 2 . On met à jour les jsons des widgets
        for (const page_widget of all_page_widgets) {
            if (page_widget.json_options) {
                const options = ObjectHandler.try_get_json(page_widget.json_options);

                // TableWidgetOptionsVO.columns ?: TableColumnDescVO[];
                if (options && options.columns && Array.isArray(options.columns) && options.columns.length > 0) {

                    const new_columns = this.migrate_table_column_descs(
                        options.columns,
                        page_widget_to_keep,
                        page_widgets_to_delete,
                    );

                    if (JSON.stringify(new_columns) !== JSON.stringify(options.columns)) {
                        options.columns = new_columns;
                        page_widget.json_options = JSON.stringify(options);
                        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(page_widget);
                    }

                    // TableColumnDescVO.children: TableColumnDescVO[] :)
                    // ExportContextQueryToXLSXQueryVO.columns: TableColumnDescVO[];
                }
            }
        }

        // On doit chercher tous les TableColumnDescVO dans les TableWidgetOptionsVO
        // 1 . les vos TableWidgetOptionsVO => c'est pas un VO en réalité pour le moment => on ne peut pas le faire

        // On doit chercher tous les TableColumnDescVO dans les ExportContextQueryToXLSXQueryVO
        for (const i in exports_by_id) {
            const export_query: ExportContextQueryToXLSXQueryVO = exports_by_id[i];

            if (export_query.columns && Array.isArray(export_query.columns) && export_query.columns.length > 0) {

                const new_columns = this.migrate_table_column_descs(
                    export_query.columns,
                    page_widget_to_keep,
                    page_widgets_to_delete,
                );

                if (JSON.stringify(new_columns) !== JSON.stringify(export_query.columns)) {
                    export_query.columns = new_columns;
                    await ModuleDAOServer.instance.insertOrUpdateVO_as_server(export_query);
                    exports_by_id[i] = export_query; // on met à jour le tableau pour les prochaines itérations
                }
            }
        }


        // YearFilterWidgetOptionsVO.relative_to_other_filter_id
        // AdvancedDateFilterWidgetOptions.relative_to_other_filter_id
        // FieldValueFilterWidgetOptionsVO.relative_to_other_filter_id
        // MonthFilterWidgetOptionsVO.relative_to_other_filter_id
        // VarChartOptionsVO.selected_filter_id

        // là on doit modifier en base si ça existe mais surtout dans les params de widgets pour le moment qui ne sont pas encore des vos mais des jsons...

        // 1 . On met à jour les vos => YearFilterWidgetOptionsVO.relative_to_other_filter_id : C'est pas un VO en réalité pour le moment => on ne peut pas le faire
        // 1 . On met à jour les vos => AdvancedDateFilterWidgetOptions.relative_to_other_filter_id : C'est pas un VO en réalité pour le moment => on ne peut pas le faire
        // 1 . On met à jour les vos => FieldValueFilterWidgetOptionsVO.relative_to_other_filter_id : C'est pas un VO en réalité pour le moment => on ne peut pas le faire
        // 1 . On met à jour les vos => MonthFilterWidgetOptionsVO.relative_to_other_filter_id : C'est pas un VO en réalité pour le moment => on ne peut pas le faire
        // 1 . On met à jour les vos => VarChartOptionsVO.selected_filter_id : C'est pas un VO en réalité pour le moment => on ne peut pas le faire
        // await query(YearFilterWidgetOptionsVO.API_TYPE_ID)
        //     .filter_by_num_x_ranges(field_names<YearFilterWidgetOptionsVO>().relative_to_other_filter_id, RangeHandler.get_ids_ranges_from_vos(page_widgets_to_delete))
        //     .exec_as_server()
        //     .update_vos<YearFilterWidgetOptionsVO>({
        //         relative_to_other_filter_id: page_widget_to_keep.id, // eslint-disable-line @stylistic/indent
        //     }); // eslint-disable-line @stylistic/indent

        // 2 . On met à jour les jsons des widgets : relative_to_other_filter_id
        for (const page_widget of all_page_widgets) {
            if (page_widget.json_options) {
                const options = ObjectHandler.try_get_json(page_widget.json_options);
                if (options && options.relative_to_other_filter_id) {
                    if (RangeHandler.elt_intersects_any_range(options.relative_to_other_filter_id, RangeHandler.get_ids_ranges_from_vos(page_widgets_to_delete))) {
                        options.relative_to_other_filter_id = page_widget_to_keep.id;
                        page_widget.json_options = JSON.stringify(options);
                        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(page_widget);
                    }
                }
            }
        }


        // 2 . On met à jour les jsons des widgets : selected_filter_id
        for (const page_widget of all_page_widgets) {
            if (page_widget.json_options) {
                const options = ObjectHandler.try_get_json(page_widget.json_options);
                if (options && options.selected_filter_id) {
                    if (RangeHandler.elt_intersects_any_range(options.selected_filter_id, RangeHandler.get_ids_ranges_from_vos(page_widgets_to_delete))) {
                        options.selected_filter_id = page_widget_to_keep.id;
                        page_widget.json_options = JSON.stringify(options);
                        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(page_widget);
                    }
                }
            }
        }
    }
}
