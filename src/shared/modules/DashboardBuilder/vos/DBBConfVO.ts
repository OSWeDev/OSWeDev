import NumRange from "../../DataRender/vos/NumRange";
import IDistantVOBase from "../../IDistantVOBase";

/**
 * Cette classe permet de gérer les confs par rôles dans le Dashboard Builder.
 * - la liste des tables visibles et sélectionnables dans l'onglet Tables du DBB
 * - la liste des widgets visibles et sélectionnables dans l'onglet Widgets du DBB
 * - L'accès à l'onglet Tables du DBB
 * - L'accès à l'onglet Widgets du DBB
 * - L'accès à l'onglet Menus du DBB
 * - L'accès à l'onglet Filtres partagés du DBB
 * ...
 */
export default class DBBConfVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "dbb_conf";

    public id: number;
    public _type: string = DBBConfVO.API_TYPE_ID;

    public role_id_ranges: NumRange[];
    public valid_moduletable_id_ranges: NumRange[];
    public valid_widget_id_ranges: NumRange[];
}