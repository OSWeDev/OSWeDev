
import IDistantVOBase from '../../IDistantVOBase';

/**
 * This is a wrapper for the StatVO, to be able to use it as a distant VO
 *  including all infos for the group creation if necessary, and without the need
 *  to know the groups client side
 */
export default class StatClientWrapperVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "stat_client_wrapper";

    public id: number;
    public _type: string = StatClientWrapperVO.API_TYPE_ID;

    public value: number;
    public timestamp_s: number; // FIXME TODO this is client side timestamp, not server side timestamp, so we should add a check on the api

    public tmp_category_name: string;
    public tmp_sub_category_name: string;
    public tmp_event_name: string;
    public tmp_stat_type_name: string;
    public tmp_thread_name: string;

    public stats_aggregator: number;
    public stats_aggregator_min_segment_type: number;
}