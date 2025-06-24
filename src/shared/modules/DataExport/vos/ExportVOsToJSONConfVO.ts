import NumRange from "../../DataRender/vos/NumRange";
import IDistantVOBase from "../../IDistantVOBase";

export default class ExportVOsToJSONConfVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "export_vos_to_json_conf";

    public id: number;
    public _type: string = ExportVOsToJSONConfVO.API_TYPE_ID;

    /**
     * Pour retrouver la conf et la référencer dans l'appli sur les boutons d'export
     */
    public name: string;

    /**
     * Description de la conf d'export, pour aider l'utilisateur à choisir la bonne conf
     */
    public description: string;

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
}