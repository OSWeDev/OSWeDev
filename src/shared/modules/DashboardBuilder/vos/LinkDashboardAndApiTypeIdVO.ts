import IDistantVOBase from '../../IDistantVOBase';

/**
 * @deprecated only there for migration to DashboardVO purpose
 */
export default class LinkDashboardAndApiTypeIdVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "link_dbb_api_type_id";

    public id: number;
    public _type: string = LinkDashboardAndApiTypeIdVO.API_TYPE_ID;

    public dashboard_id: number;
    public api_type_id: string;

    public static createNew(
        dashboard_id: number,
        api_type_id: string
    ): LinkDashboardAndApiTypeIdVO {
        const res: LinkDashboardAndApiTypeIdVO = new LinkDashboardAndApiTypeIdVO();

        res.dashboard_id = dashboard_id;
        res.api_type_id = api_type_id;

        return res;
    }
}