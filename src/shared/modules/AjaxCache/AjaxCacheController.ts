import ConsoleHandler from "../../tools/ConsoleHandler";
import RequestResponseCacheVO from "./vos/RequestResponseCacheVO";

export default class AjaxCacheController {

    public static MSGPACK_REQUEST_TYPE: string = 'application/x-msgpack; charset=utf-8';
    public static POST_UID: number = 1;

    public static getInstance(): AjaxCacheController {
        if (!AjaxCacheController.instance) {
            AjaxCacheController.instance = new AjaxCacheController();
        }
        return AjaxCacheController.instance;
    }

    private static instance: AjaxCacheController = null;

    public getUIDIndex(url: string, postdatas: any, type: number): string {
        try {
            switch (type) {
                case RequestResponseCacheVO.API_TYPE_GET:
                    return url;
                case RequestResponseCacheVO.API_TYPE_POST_FOR_GET:
                    return url + (postdatas ? '###___###' + JSON.stringify(postdatas) : '');
                case RequestResponseCacheVO.API_TYPE_POST:
                    return url + (postdatas ? '##___##' + (AjaxCacheController.POST_UID++) : '');
            }
        } catch (error) {
            ConsoleHandler.getInstance().error('Index impossible à créer:' + url + ':' + postdatas + ':' + error + ':');
        }
    }
}