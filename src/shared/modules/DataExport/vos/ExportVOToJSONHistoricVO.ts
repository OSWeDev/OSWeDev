import NumRange from "../../DataRender/vos/NumRange";
import IDistantVOBase from "../../IDistantVOBase";

/**
 * Particularité de ce VO on intègre les champs de la conf aussi directement pour l'avoir facilement dès le départ et décoder la partie vo_exporté avec la conf
 */
export default class ExportVOToJSONHistoricVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "export_vo_to_json_historic";

    public id: number;
    public _type: string = ExportVOToJSONHistoricVO.API_TYPE_ID;

    /**
     * Pour retrouver l'export par nom : name + app_source + env source + date + useremail + version source
     */
    public label: string;

    /**
     * Pour retrouver la conf et la référencer dans l'appli sur les boutons d'export
     */
    public name: string;

    /**
     * Description de la conf d'export, pour aider l'utilisateur à choisir la bonne conf
     */
    public description: string;

    /**
     * Les api_type_ids impactés par cet import, pour faciliter l'invalidation des caches
     */
    public impacted_api_type_ids: string[];

    /**
     * Les moduletablefields que l'on utilise à la place de l'id du même type
     * Par exemple pour les VarConfVO, on veut pas exporter un id pour lien de var, mais le nom de la var beaucoup plus fiable et significatif d'un environnement à l'autre, voir d'un projet à l'autre
     */
    public unique_fields_to_use_id_ranges: NumRange[];

    /**
     * Les champs que l'on veut suivre pour l'export. Si on suit une liaison ça signifie qu'on exporte aussi le VO qui fait ref ou qui est ref par le VO actuellement exporté
     * Exemple si on exporte un DBVO, on veut aussi exporter les pages du DB, donc on suit dbpagevo.db_id, la ref vers le db qu'on exporte initialement
     *  à réfléchir : sur le papier on pourrait intégrer systématiquement dans l'export tous les VOs qui font référence au VO exporté, car par définition c'est une info
     *  qu'on ne retrouvera pas dans le nouvel environnement si on ne l'importe pas en même temps que le VO exporté. Cependant pas sûr que ça s'applique dans tous les cas ce raisonnement.
     *  J'aurai tendance pour le moment à rester sur du déclaratif. A voir plus tard ce qu'on en fait (dans la logique où un projet peut avoir un comportement qui surcharge les DB par exemple,
     *  mais exporter cette donnée hors du projet n'aurait aucun intéret...)
     */
    public ref_fields_to_follow_id_ranges: NumRange[];

    /**
     * Lien vers la conf, dans l'environnement source, à reconstruire au besoin dans l'environnement cible
     */
    public export_conf_id: number;

    /**
     * On stocke l'appli source de l'export
     */
    public source_app_name: string;

    /**
     * On stocke l'environemment source de l'export
     */
    public source_app_env: string;

    /**
     * On stocke la version source de l'export
     */
    public source_app_version: string;

    /**
     * On stocke la date de l'export
     */
    public export_date: number;

    /**
     * On stocke le user source de l'export : email
     */
    public export_user_email: string;

    /**
     * On stocke le user source de l'export : user_id dans l'env source
     * Attention ce lien doit être reconstruit dans le nouvel environnement ou supprimé si on ne retrouve pas l'email
     *  (ou alors on crée un compte sans rôle et bloqué juste pour permettre cette liaison dans tous les cas ? Attention ça veut dire qu'on crée potentiellement un moyen de créer des comptes à l'infini)
     */
    public export_user_id: number;

    public exported_data: string;
}