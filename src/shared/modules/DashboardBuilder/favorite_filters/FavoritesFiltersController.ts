

/**
 * FavoritesFiltersController
 */

import RangeHandler from "../../../tools/RangeHandler";
import TimeSegment from "../../DataRender/vos/TimeSegment";
import TSRange from "../../DataRender/vos/TSRange";
import Dates from "../../FormatDatesNombres/Dates/Dates";
import FieldFiltersVOManager from "../manager/FieldFiltersVOManager";
import VOFieldRefVOManager from "../manager/VOFieldRefVOManager";
import WidgetOptionsVOManager from "../manager/WidgetOptionsVOManager";
import FavoritesFiltersExportFrequencyVO from "../vos/FavoritesFiltersExportFrequencyVO";
import FavoritesFiltersExportParamsVO from "../vos/FavoritesFiltersExportParamsVO";
import FavoritesFiltersVO from "../vos/FavoritesFiltersVO";
import FieldFiltersVO from "../vos/FieldFiltersVO";

export default class FavoritesFiltersController {


    private static instance: FavoritesFiltersController = null;

    private constructor() { }

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
        const default_field_filters: FieldFiltersVO = await FieldFiltersVOManager.find_default_field_filters_by_dashboard_page_id(
            favorites_filters.page_id
        );

        // TODO: Deduct default_field_filters behaviors depending on the favorites_filters_options
        //  - (For related filters) If the user choose to config its dates filters, the default_field_filters must be updated
        //    depending on if default_field_filters has one related to a date widget_options

        const filters_

        // Create context_field_filters with the default one
        for (const api_type_id in default_field_filters) {
            const filters = default_field_filters[api_type_id];

            for (const field_id in filters) {
                // Add default context filters
                context_field_filters = FieldFiltersVOManager.overwrite_field_filters_with_context_filter(
                    context_field_filters,
                    { api_type_id, field_id },
                    filters[field_id]
                );
            }
        }

        // Merge/replace default_field_filters with favorites_field_filters
        for (const api_type_id in favorites_field_filters) {
            const filters = favorites_field_filters[api_type_id];

            for (const field_id in filters) {
                // Add default context filters
                context_field_filters = FieldFiltersVOManager.overwrite_field_filters_with_context_filter(
                    context_field_filters,
                    { api_type_id, field_id },
                    filters[field_id]
                );
            }
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
                    custom_field_filters = FieldFiltersVOManager.merge_field_filters_with_context_filter(
                        custom_field_filters,
                        vo_field_ref,
                        context_filter
                    );
                }
            }

            // Une fois qu'on a écrasé, on doit aussi rejouer les filtrages par défaut pour les champs qui d'une part dépendent d'un custom filter surchargé, et d'autre part ne sont pas déjà surchargés ...
            TODO

        }

        // Merge/replace context_field_filters with custom_field_filters
        for (const api_type_id in custom_field_filters) {
            const filters = custom_field_filters[api_type_id];

            for (const field_id in filters) {
                // Add custom context filters
                context_field_filters = FieldFiltersVOManager.overwrite_field_filters_with_context_filter(
                    context_field_filters,
                    { api_type_id, field_id },
                    filters[field_id]
                );
            }
        }

        return context_field_filters;
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): FavoritesFiltersController {
        if (!FavoritesFiltersController.instance) {
            FavoritesFiltersController.instance = new FavoritesFiltersController();
        }

        return FavoritesFiltersController.instance;
    }
}