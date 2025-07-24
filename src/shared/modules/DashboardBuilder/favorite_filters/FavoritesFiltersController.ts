

/**
 * FavoritesFiltersController
 */

import { cloneDeep } from "lodash";
import { field_names } from "../../../tools/ObjectHandler";
import RangeHandler from "../../../tools/RangeHandler";
import ContextFilterVO from "../../ContextFilter/vos/ContextFilterVO";
import { query } from "../../ContextFilter/vos/ContextQueryVO";
import TimeSegment from "../../DataRender/vos/TimeSegment";
import TSRange from "../../DataRender/vos/TSRange";
import Dates from "../../FormatDatesNombres/Dates/Dates";
import FieldFiltersVOManager from "../manager/FieldFiltersVOManager";
import VOFieldRefVOManager from "../manager/VOFieldRefVOManager";
import WidgetOptionsVOManager from "../manager/WidgetOptionsVOManager";
import DashboardWidgetVO from "../vos/DashboardWidgetVO";
import FavoritesFiltersExportFrequencyVO from "../vos/FavoritesFiltersExportFrequencyVO";
import FavoritesFiltersExportParamsVO from "../vos/FavoritesFiltersExportParamsVO";
import FavoritesFiltersVO from "../vos/FavoritesFiltersVO";
import FieldFiltersVO from "../vos/FieldFiltersVO";

export default class FavoritesFiltersController {

    /**
     * can_export_favorites_filters
     * - This method is responsible for checking if the given favorites_filters can be exported
     *
     * TODO: This method must be moved to the shared module FavoritesFiltersVOHandler
     *
     * @param {FavoritesFiltersVO} favorites_filters
     * @returns {boolean}
     */
    public static can_export_favorites_filters(favorites_filters: FavoritesFiltersVO): boolean {
        const export_params: FavoritesFiltersExportParamsVO = favorites_filters.export_params ?? null;

        if (
            !export_params?.is_export_planned ||
            !export_params?.export_frequency ||
            !export_params?.exportable_data
        ) {
            return false;
        }

        const export_frequency = export_params.export_frequency;

        // Si on a une date de début des exports, on peut pas lancer tant qu'elle n'est pas passée
        if (export_params.begin_export_after_ts && (export_params.begin_export_after_ts > Dates.now())) {
            return false; // On ne peut pas exporter avant la date de début
        }

        // Permier export
        if (!export_params.last_export_at_ts) {
            return true;
        }

        let time_segment = 0;
        switch (export_frequency.granularity) {
            case FavoritesFiltersExportFrequencyVO.GRANULARITY_DAY:
                time_segment = TimeSegment.TYPE_DAY;
                break;
            case FavoritesFiltersExportFrequencyVO.GRANULARITY_MONTH:
                time_segment = TimeSegment.TYPE_MONTH;
                break;
            case FavoritesFiltersExportFrequencyVO.GRANULARITY_WEEK:
                time_segment = TimeSegment.TYPE_WEEK;
                break;
            case FavoritesFiltersExportFrequencyVO.GRANULARITY_YEAR:
                time_segment = TimeSegment.TYPE_YEAR;
                break;
            default: throw new Error(`Invalid granularity given! :${export_frequency.granularity}`);
        }

        const last_export: TSRange = RangeHandler.create_single_elt_TSRange(export_params.last_export_at_ts, time_segment);

        let export_after: number = Dates.add(last_export.min, export_frequency.every, time_segment);
        if (export_frequency.granularity === FavoritesFiltersExportFrequencyVO.GRANULARITY_MONTH) {
            export_after = Dates.add(export_after, export_frequency.day_in_month - 1, TimeSegment.TYPE_DAY); // ajouter le jour de day_in_month
        }
        if (export_frequency.granularity === FavoritesFiltersExportFrequencyVO.GRANULARITY_WEEK) {
            export_after = Dates.add(export_after, export_frequency.day_in_week - 1, TimeSegment.TYPE_DAY); // ajouter le jour de day_in_week
        }
        export_after = Dates.add(export_after, export_frequency.prefered_time, TimeSegment.TYPE_HOUR); // ajouter l'heure de prefered time

        const offset = new Date().getTimezoneOffset() / 60;
        const now = Dates.now() - (offset * 60 * 60);
        return now >= export_after;
    }

    /**
     * create_field_filters_for_export
     *
     * @param {FavoritesFiltersVO} favorites_filters
     * @returns {Promise<FieldFiltersVO>}
     */
    public static async create_field_filters_for_export(favorites_filters: FavoritesFiltersVO): Promise<FieldFiltersVO> {
        const favorites_field_filters = favorites_filters.field_filters;
        const favorites_filters_options = favorites_filters.options;

        // Actual context field filters to be used for the export
        let context_field_filters: FieldFiltersVO = {};
        let custom_field_filters: FieldFiltersVO = {}; // custom field filters (if the user choose to config its dates filters)

        // Default field_filters from each page widget_options
        const default_field_filters: FieldFiltersVO = await FieldFiltersVOManager.find_default_field_filters_by_dashboard_id(
            favorites_filters.dashboard_id,
        );

        // TODO: Deduct default_field_filters behaviors depending on the favorites_filters_options
        //  - (For related filters) If the user choose to config its dates filters, the default_field_filters must be updated
        //    depending on if default_field_filters has one related to a date widget_options

        // const filters_

        // Create context_field_filters with the default one
        for (const api_type_id in default_field_filters) {
            const filters = default_field_filters[api_type_id];

            for (const field_id in filters) {
                const field_filters = filters[field_id];

                for (const widget_id_str in field_filters) {

                    // Add default context filters
                    context_field_filters = FieldFiltersVOManager.overwrite_field_filters_with_context_filter(
                        context_field_filters,
                        { api_type_id, field_id },
                        parseInt(widget_id_str),
                        field_filters[widget_id_str],
                    );
                }
            }
        }

        // Merge/replace default_field_filters with favorites_field_filters
        for (const api_type_id in favorites_field_filters) {
            const filters = favorites_field_filters[api_type_id];

            for (const field_id in filters) {
                const field_filters = filters[field_id];

                for (const widget_id_str in field_filters) {

                    // Add default context filters
                    context_field_filters = FieldFiltersVOManager.overwrite_field_filters_with_context_filter(
                        context_field_filters,
                        { api_type_id, field_id },
                        parseInt(widget_id_str),
                        field_filters[widget_id_str],
                    );
                }
            }
        }

        // On va avoir besoin d'identifier l'id de widget year et month
        const year_filter_widget = await query(DashboardWidgetVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<DashboardWidgetVO>().name, DashboardWidgetVO.WIDGET_NAME_yearfilter)
            .select_vo<DashboardWidgetVO>();

        const month_filter_widget = await query(DashboardWidgetVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<DashboardWidgetVO>().name, DashboardWidgetVO.WIDGET_NAME_monthfilter)
            .select_vo<DashboardWidgetVO>();

        if (!year_filter_widget || !month_filter_widget) {
            throw new Error("Year and Month filter widgets must be defined in the dashboard to use custom dates filters");
        }

        // Create field_filters depend on if the user choose to config a custom dates filters
        if (
            favorites_filters_options &&
            favorites_filters_options?.is_field_filters_fixed_dates === false
        ) {
            // Overwrite active field filters with custom dates widget_options (month, year, etc.)
            const custom_dates_widgets_options_by_field_id = favorites_filters_options.custom_dates_widgets_options_by_field_id;

            for (const field_id in custom_dates_widgets_options_by_field_id) {
                const custom_dates_widget_options = custom_dates_widgets_options_by_field_id[field_id];

                // set up the custum_field_filters with this custom dates widget_options
                for (const widget_name in custom_dates_widget_options) {
                    const widget_options = custom_dates_widget_options[widget_name];

                    // Month Context Filter
                    const vo_field_ref = VOFieldRefVOManager.create_vo_field_ref_vo_from_widget_options(
                        widget_options
                    );

                    const context_filter = WidgetOptionsVOManager.create_context_filter_from_widget_options(
                        widget_name,
                        widget_options
                    );

                    // Add|Merge the custom_field_filters
                    // On doit impatcer le filtre année sur un widget_id de filtre année, et le filtre mois sur un widget_id de filtre mois
                    // Si on ne trouve pas de widget_id cohérent, c'est probablement une erreur à remonter, qu'on log simplement pour le moment, et on crée un widget_id 0

                    const widget_id = (widget_name === DashboardWidgetVO.WIDGET_NAME_yearfilter) ? year_filter_widget.id : month_filter_widget.id;

                    custom_field_filters = FieldFiltersVOManager.merge_field_filters_with_context_filter(
                        custom_field_filters,
                        vo_field_ref,
                        widget_id,
                        context_filter,
                    );
                }
            }

            // V JNE : je sais pas si c'est encore d'actualité cette remarque V depuis qu'on a des filtres qui sont par widget id ? pas sur du coup V
            // Une fois qu'on a écrasé, on doit aussi rejouer les filtrages par défaut pour les champs qui d'une part dépendent d'un custom filter surchargé, et d'autre part ne sont pas déjà surchargés ...
            // TODO

        }

        // Merge/replace context_field_filters with custom_field_filters
        for (const api_type_id in custom_field_filters) {
            const filters = custom_field_filters[api_type_id];

            for (const field_id in filters) {
                const field_filters = filters[field_id];

                for (const widget_id_str in field_filters) {

                    // Add custom context filters
                    context_field_filters = FieldFiltersVOManager.overwrite_field_filters_with_context_filter(
                        context_field_filters,
                        { api_type_id, field_id },
                        parseInt(widget_id_str),
                        field_filters[widget_id_str]
                    );
                }
            }
        }

        // Une fois qu'on a défini les customs, on les pousse dans les datas type var qui dépendent de ces customs
        // On doit aussi retrouver tous les custom_filters des colonnes de l'export_datas qui seraient dépendantes (car de type var probablement) de ce filtre
        // Donc dans export_params.exportable_datas[x].custom_filters[y][z]
        if (favorites_filters?.export_params?.exportable_data) {
            for (const exportable_data_key in favorites_filters.export_params.exportable_data) {
                const exportable_data = favorites_filters.export_params.exportable_data[exportable_data_key];

                const custom_filters = exportable_data.custom_filters;
                if (custom_filters) {

                    for (const custom_filter_key_1 in custom_filters) {
                        const custom_filter = custom_filters[custom_filter_key_1];

                        for (const custom_filter_key_2 in custom_filter) {
                            const field_filters = custom_filter[custom_filter_key_2];

                            for (const custom_filter_widget_id in field_filters) {
                                const custom_arbo = field_filters[custom_filter_widget_id];

                                if (custom_arbo.vo_type !== ContextFilterVO.CUSTOM_FILTERS_TYPE) {
                                    continue;
                                }

                                if ((!custom_field_filters) || (!custom_field_filters[custom_arbo.vo_type]) || (!custom_field_filters[custom_arbo.vo_type][custom_arbo.field_name]) || (!custom_field_filters[custom_arbo.vo_type][custom_arbo.field_name][custom_filter_widget_id])) {
                                    continue;
                                }

                                const custom_copy = cloneDeep(custom_field_filters[custom_arbo.vo_type][custom_arbo.field_name][custom_filter_widget_id]);
                                field_filters[custom_filter_widget_id] = custom_copy;
                            }
                        }
                    }
                }
            }
        }


        return context_field_filters;
    }

    // /**
    //  * On génère le context de requete global qui par défaut est celui du dashboard, et est surchargé par les filtres favoris
    //  * On utilise l'arborescence des widgets pour savoir dans quel ordre on doit appliquer les filtres
    //  * Le fonctionnement est le suivant :
    //  *  - On part du haut de l'arbre niveau par niveau (depth first)
    //  *  - Si le widget n'est pas un filtrage, osef
    //  *  - On demande les context de filtre de ce widget, basé sur les filtres déjà params et sur le context actuellement généré
    //  *  - Pour chaque champs du context filter ou du customfilter qui sont impactés par le widget, si on a un filtre dans le filtrefavori, on l'applique
    //  *
    //  * @param {FavoritesFiltersVO} favorites_filters
    //  * @returns {Promise<FieldFiltersVO>}
    //  */
    // public static async create_field_filters_for_export(favorites_filters: FavoritesFiltersVO): Promise<FieldFiltersVO> {

    // }
}