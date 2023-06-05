import AbstractVO from '../../VO/abstract/AbstractVO';
import FieldFiltersVO from '../../ContextFilter/vos/FieldFiltersVO';

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

    // page id of this shared_filters (No need dashboard_id because it's can be found from page object)
    public page_id: number;

    // Name which the admin gave to the current shared field_filters
    public name: string;

    public weight: number;

    // JSON object of favorites active field filters
    public field_filters: FieldFiltersVO;

    // ids of dashboard_page which this shared_filters is shared with
    public shared_with_dashboard_page_ids: number[];
}