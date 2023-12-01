
import INamedVO from '../../../interfaces/INamedVO';
import IDistantVOBase from '../../IDistantVOBase';

/**
 * Le principe est de créer automatiquement les groupes lors de l'ajout d'une stat
 * si le groupe n'existe pas encore, et de l'affecter à un parent automatiquement
 * en fonction du split sur le . du nom
 */
export default class StatsGroupVO implements INamedVO {
    public static API_TYPE_ID: string = "stats_groupe";

    public id: number;
    public _type: string = StatsGroupVO.API_TYPE_ID;

    public name: string;

    /**
     * Used to create the group if it does not exist
     *  and keep necessary infos for the autolink by the dedicated bgthread
     */
    public category_name: string;
    public sub_category_name: string;
    public event_name: string;
    public stat_type_name: string;
    public thread_name: string;

    public category_id: number;
    public sub_category_id: number;
    public event_id: number;
    public stat_type_id: number;
    public thread_id: number;

    public stats_aggregator: number;
    public stats_aggregator_min_segment_type: number;
}