import IDistantVOBase from "../../../../shared/modules/IDistantVOBase";
import IWeightedItem from "../../../tools/interfaces/IWeightedItem";
import NumRange from "../../DataRender/vos/NumRange";

export default class DashboardVO implements IDistantVOBase, IWeightedItem {
    public static API_TYPE_ID: string = "dashboard";

    public static MODULE_TABLE_CRUD_TEMPLATE_TYPE_CONSULTATION: number = 0;
    public static MODULE_TABLE_CRUD_TEMPLATE_TYPE_CREATE_UPDATE: number = 1;
    public static MODULE_TABLE_CRUD_TEMPLATE_TYPE_QUERY: number = 2;
    public static MODULE_TABLE_CRUD_TEMPLATE_TYPE_LABELS: string[] = [
        "dashboard_builder.module_table_crud_template_type_consultation",
        "dashboard_builder.module_table_crud_template_type_create_update",
        "dashboard_builder.module_table_crud_template_type_query"
    ];

    public static MODULE_TABLE_CRUD_TEMPLATE_SAISIE_MODE_CREATE: number = 0;
    public static MODULE_TABLE_CRUD_TEMPLATE_SAISIE_MODE_UPDATE: number = 1;
    public static MODULE_TABLE_CRUD_TEMPLATE_SAISIE_MODE_CREATE_UPDATE: number = 2;
    public static MODULE_TABLE_CRUD_TEMPLATE_SAISIE_MODE_LABELS: string[] = [
        "dashboard_builder.module_table_crud_template_saisie_mode_create",
        "dashboard_builder.module_table_crud_template_saisie_mode_update",
        "dashboard_builder.module_table_crud_template_saisie_mode_create_update"
    ];

    public _type: string = DashboardVO.API_TYPE_ID;

    public id: number;

    public title: string;

    /**
     * Pour les DBs qu'on désigne comme template de type de données
     * Si rempli, ce db est un template de type de données
     */
    public moduletable_crud_template_ref_id: number;

    /**
     * on choisi entre consultation ou création/saisie
     */
    public moduletable_crud_template_type: number;

    /**
     * Si en mode saise, est qu'on est création, mise à jour ou les deux
     */
    public moduletable_crud_template_saisie_mode: number;

    public cycle_tables: string[];
    public cycle_fields: { [voType: string]: string[] };
    public cycle_links: { [voType: string]: string[] };
    public has_cycle: boolean;

    public weight: number;

    public dbb_conf_id: number; // Conf de Dashboard Builder à laquelle ce dashboard est lié, permet de savoir dans quelle conf de dbb on peut l'éditer (celle sélectionnée ou la conf admin qui est toujours possible)

    public activated_viewport_id_ranges: NumRange[];
}