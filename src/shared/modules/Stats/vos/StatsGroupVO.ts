
import IDistantVOBase from '../../IDistantVOBase';

/**
 * Le principe est de créer automatiquement les groupes lors de l'ajout d'une stat
 * si le groupe n'existe pas encore, et de l'affecter à un parent automatiquement
 * en fonction du split sur le . du nom
 */
export default class StatsGroupVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "stats_groupe";

    public id: number;
    public _type: string = StatsGroupVO.API_TYPE_ID;

    public name: string;
    public stats_aggregator: number;
    public stats_aggregator_min_segment_type: number;
}