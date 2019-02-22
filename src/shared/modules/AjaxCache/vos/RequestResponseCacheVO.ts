import { Moment } from 'moment';
import * as moment from 'moment';

export default class RequestResponseCacheVO {

    public static STATE_INIT: number = 0;
    public static STATE_REQUESTED: number = 1;
    public static STATE_RESOLVED: number = 2;
    public static STATE_REJECTED: number = 3;

    public state: number = RequestResponseCacheVO.STATE_INIT;
    public datas = null;
    public creationDate: Moment = moment();
    public datasDate: Moment = null;
    public url: string;

    public resolve_callbacks: Array<(datas) => void> = [];
    public reject_callbacks: Array<(datas) => void> = [];

    public tries: number = 0;

    public wrappable_request: boolean = false;

    public api_types_involved: string[] = [];

    public constructor(url: string, api_types_involved: string[]) {
        this.url = url;
        this.api_types_involved = api_types_involved;
    }
}