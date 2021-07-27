
import IDistantVOBase from '../../IDistantVOBase';

export default class MaintenanceVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "maintenance";

    public id: number;
    public _type: string = MaintenanceVO.API_TYPE_ID;

    public start_ts: number;
    public end_ts: number;

    public broadcasted_msg1: boolean;
    public broadcasted_msg2: boolean;
    public broadcasted_msg3: boolean;

    public maintenance_over: boolean;

    public creation_date: number;
    public author_id: number;
}