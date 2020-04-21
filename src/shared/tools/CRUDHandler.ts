export default class CRUDHandler {
    public static CRUD_ROUTE_BASE: string = '/manage/';

    public static getCRUDLink(API_TYPE_ID: string): string {
        if (!API_TYPE_ID) {
            return null;
        }
        return CRUDHandler.CRUD_ROUTE_BASE + API_TYPE_ID;
    }
    public static getCreateLink(API_TYPE_ID: string, embed: boolean): string {
        if (!API_TYPE_ID) {
            return null;
        }
        return (embed) ? "#create_" + API_TYPE_ID : CRUDHandler.getCRUDLink(API_TYPE_ID) + "/create";
    }
    public static getUpdateLink(API_TYPE_ID: string, vo_id: number): string {
        if ((!API_TYPE_ID) || (!vo_id)) {
            return null;
        }
        return CRUDHandler.getCRUDLink(API_TYPE_ID) + "/update/" + vo_id;
    }
    public static getDeleteLink(API_TYPE_ID: string, vo_id: number): string {
        if ((!API_TYPE_ID) || (!vo_id)) {
            return null;
        }
        return CRUDHandler.getCRUDLink(API_TYPE_ID) + "/delete/" + vo_id;
    }
}