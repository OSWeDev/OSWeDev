import AbstractVO from '../../VO/abstract/AbstractVO';
import NumRange from '../../DataRender/vos/NumRange';

/**
 * SharedFiltersVO
 * - One Dashboard page may share many field_filters between many dashboards
 * - One Dashboard page may share many field_filters between dashboard pages
 * - We should be able to decide whether or not we have to share specific field_filters between specific dashboards
 */
export default class SharedFiltersVO extends AbstractVO {
    public static API_TYPE_ID: string = "shared_filters";

    public _type: string = SharedFiltersVO.API_TYPE_ID;

    public id: number;

    // dashboard_id of this shared_filters
    public dashboard_id: number;

    // Name which the admin gave to the current shared field_filters
    public name: string;

    public weight: number;

    // JSON object of field_filters to share
    public field_filters_to_share: { [api_type_id: string]: { [field_id: string]: boolean } };

    // ids of page which this shared_filters is shared with
    // TODO: change into num_ranges
    public shared_with_dashboard_ids: NumRange[];
}