import ISupervisedItem from "../../Supervision/interfaces/ISupervisedItem";
import { SupervisionWidgetOptionsVO } from "../vos/SupervisionWidgetOptionsVO";
import ContextFilterVO from '../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import { FieldFilterManager } from '../../ContextFilter/manager/FieldFilterManager';

/**
 * @class SupervisionWidgetManager
 *  - Manager for the supervision widget
 */
export class SupervisionWidgetManager {

    /**
     * Load supervision probs by api type ids
     *  - The aim of this function is to load the supervision probs for the given api_type_ids
     *  - That means (for now) we must loop on the given api_type_ids and load the supervision probs for each of them
     *
     * TODO: Do it in single request
     *
     * @param {SupervisionWidgetOptionsVO} widget_options
     * @param {{ [api_type_id: string]: { [field_name: string]: ContextFilterVO } }} active_field_filters
     * @param {string[]} active_api_type_ids API type ids that have been selected by the user
     * @returns {Promise<ISupervisedItem[]>}
     */
    public static async load_supervision_probs_by_api_type_ids(
        widget_options: SupervisionWidgetOptionsVO,
        active_field_filters: { [api_type_id: string]: { [field_name: string]: ContextFilterVO } },
        active_api_type_ids: string[]

    ): Promise<ISupervisedItem[]> {

        const supervision_api_type_ids: string[] = widget_options?.supervision_api_type_ids ?? [];

        let available_api_type_ids: string[] = [];

        if (active_api_type_ids?.length > 0) {
            // Setted api_type_ids (default or setted from filters)
            available_api_type_ids = active_api_type_ids;
        } else {
            // Default (from supervision widget) api_type_ids
            available_api_type_ids = widget_options?.supervision_api_type_ids;
        }

        // Check if the given active_field_filters are compatible with the supervision_api_type_ids
        // If not, we must reject the active_field_filters
        // At least one of the supervision_api_type_ids must be present in the active_field_filters
        const api_type_ids_for_request = Object.keys(active_field_filters).filter((api_type_id: string) => {
            return supervision_api_type_ids.includes(api_type_id);
        });


        const active_field_filter_by_api_type_id: { [api_type_id: string]: { [field_name: string]: ContextFilterVO } } = FieldFilterManager.get_field_filters_by_required_api_type_ids

        return [];
    }

    public static getInstance(): SupervisionWidgetManager {
        if (!SupervisionWidgetManager.instance) {
            SupervisionWidgetManager.instance = new SupervisionWidgetManager();
        }

        return SupervisionWidgetManager.instance;
    }

    private static instance: SupervisionWidgetManager;

    public is_item_accepted: { [dashboard_id: number]: (supervised_item: ISupervisedItem) => boolean } = {};

    protected constructor() { }

    /**
     * permet de définir une fonction de test pour filtrer les Items affichées dans le dashboard de la supervision
     * @param dashboard_id ID du dashboard
     * @param condition fonction faisant le test sur l'item
     */
    public set_item_filter_condition_for_key(dashboard_id: number, condition: (supervised_item: ISupervisedItem) => boolean): void {
        this.is_item_accepted[dashboard_id] = condition;
    }
}