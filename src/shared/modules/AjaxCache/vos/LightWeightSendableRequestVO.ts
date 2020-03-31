import RequestResponseCacheVO from './RequestResponseCacheVO';
import EnvHandler from '../../../tools/EnvHandler';

export default class LightWeightSendableRequestVO {

    public static API_TYPE_GET: number = 0;
    public static API_TYPE_POST: number = 1;
    public static API_TYPE_POST_FOR_GET: number = 2;

    public datas;
    public url: string;
    public contentType: string;

    public index: string;

    public postdatas: any;
    public dataType: string;
    public processData;

    public type: number;

    public constructor(request: RequestResponseCacheVO) {

        if (!request) {
            return;
        }
        this.url = request.url;
        this.datas = Object.assign({}, request.datas);
        this.contentType = request.contentType;
        this.index = request.index;
        this.postdatas = (!EnvHandler.getInstance().MSGPCK) ? request.postdatas : Object.assign({}, request.postdatas);
        this.dataType = request.dataType;
        this.processData = request.processData;
        this.type = request.type;
    }
}