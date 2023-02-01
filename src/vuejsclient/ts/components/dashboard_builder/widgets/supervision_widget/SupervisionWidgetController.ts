import ISupervisedItem from "../../../../../../shared/modules/Supervision/interfaces/ISupervisedItem";

export default class SupervisionWidgetController {

    public static getInstance(): SupervisionWidgetController {
        if (!this.instance) {
            this.instance = new SupervisionWidgetController();
        }

        return this.instance;
    }

    private static instance = null;

    public is_item_accepted: { [dashboard_id: number]: (supervised_item: ISupervisedItem) => boolean } = {};

    private constructor() { }

    /**
     * permet de définir une fonction de test pour filtrer les Items affichées dans le dashboard de la supervision
     * @param dashboard_id ID du dashboard
     * @param condition fonction faisant le test sur l'item
     */
    public set_item_filter_condition_for_key(dashboard_id: number, condition: (supervised_item: ISupervisedItem) => boolean): void {
        this.is_item_accepted[dashboard_id] = condition;
    }
}