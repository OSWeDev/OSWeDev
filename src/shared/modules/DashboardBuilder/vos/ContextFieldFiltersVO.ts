import ContextFilterVO from "../../ContextFilter/vos/ContextFilterVO";

/**
 * Une map pour traiter des filtrages en les découpant par type de VO et par id de champ
 * Anciennenement FieldFiltersVO mais on a ajouté le widget_id aux FieldFiltersVO pour gérer les filtres par widget
 *  - Par type de VO
 *  - Par id de champ
 */
export default class ContextFieldFiltersVO {
    [api_type_id: string]: { [field_id: string]: ContextFilterVO }
}