import ContextFilterVO from "../../ContextFilter/vos/ContextFilterVO";

/**
 * On stocke tous les filtres dans les stores de DB et en base pour les filtres favoris / exports en séparant :
 *  - Par type de VO
 *  - Par id de champ
 *  - Par id de widget (type de widget, pas pagewidget)
 */
export default class FieldFiltersVO {
    [api_type_id: string]: { [field_id: string]: { [widget_id: number]: ContextFilterVO } }
}