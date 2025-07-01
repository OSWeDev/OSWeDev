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

    /**
     * On se met les noms de confs principales pré-créées par OSWedev
     */
    public static CONF_NAME_DBB_FULL: string = "DBB Full - Admins";
    public static CONF_NAME_DBB_CMS: string = "CMS Builder";
    public static CONF_NAME_DBB_TEMPLATES_CONSULTATION: string = "Templates de consultation des données";
    public static CONF_NAME_DBB_TEMPLATES_CREATE_UPDATE: string = "Formulaires de saisie des données";

    public static API_TYPE_ID: string = "dbb_conf";

    public id: number;
    public _type: string = DBBConfVO.API_TYPE_ID;

    public name: string;
    public description: string;

    public is_main_admin_conf: boolean; // Si true, cette conf est la conf principale pour les admins, elle est donc utilisée par défaut pour les admins et surtout elle permet d'accèder à tous les dbs quelques soit la conf actuellement liée au db

    public weight: number; // Permet de trier les confs dans l'interface pour présélectionner la conf la plus pertinente pour l'utilisateur en fonction de son rôle (les confs auxquelles il a accès)
    public is_active: boolean; // Si false, la conf n'est pas active et ne sera pas utilisée

    public role_id_ranges: NumRange[];
    public valid_moduletable_id_ranges: NumRange[];
    public valid_widget_id_ranges: NumRange[];

    public has_access_to_tables_tab: boolean;
    public has_access_to_tables_tab_graph: boolean;
    public has_access_to_templating_options: boolean;
    public has_access_to_create_or_update_crud_templating_option: boolean;

    public has_access_to_widgets_tab: boolean;

    public has_access_to_menus_tab: boolean;

    public has_access_to_shared_filters_tab: boolean;

    public has_access_to_export_to_json: boolean;
    public has_access_to_import_from_json: boolean;
}