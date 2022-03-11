import IDistantVOBase from "../../../../shared/modules/IDistantVOBase";
import ContextFilterVO from "./ContextFilterVO";
import ContextQueryFieldVO from "./ContextQueryFieldVO";
import SortByVO from "./SortByVO";

/**
 * Encapsuler la définition d'une requête ou d'une sous-requête (qu'on liera à la requête principale par un filtre)
 */
export default class ContextQueryVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "context_query";

    public id: number;
    public _type: string = ContextQueryVO.API_TYPE_ID;

    /**
     * La table de départ de la requête
     */
    public base_api_type_id: string;

    /**
     * Sur un type select fields, on a besoin des champs ciblés, dans un ordre défini.
     *  Si on veut juste les vos du base_api_type_id on passe null
     */
    public fields: ContextQueryFieldVO[];

    /**
     * Les filtres à appliquer à la requête
     */
    public filters: ContextFilterVO[];

    /**
     * Les types utilisables dans la requete pour faire les jointures
     */
    public active_api_type_ids: string[];

    /**
     * Pour limiter le nombre de résultats sur un select
     *  0 => no limit
     */
    public limit: number;

    /**
     * Pour décaler le curseur dans le cas d'un select
     *  0 => on renvoie dès le premier résultat
     *  10 => on renvoie à partir du 11ème résultat (on ignore les 10 premiers)
     * Pas d'offset sans limit (cf postgresql LIMIT)
     */
    public offset: number;

    /**
     * Pour ajouter un ordre à la requête : null pour garder l'ordre par défaut
     */
    public sort_by: SortByVO;

    /**
     * Par défaut vide, mais doit être utilisé pour les sub queries
     *  pour assurer l'unicité des noms des tables au sein de la requête globale
     */
    public query_tables_prefix: string;
}