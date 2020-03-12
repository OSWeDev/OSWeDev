export default class VocusHandler {
    public static Vocus_ROUTE_BASE: string = '/vocus';

    public static getVocusLink(API_TYPE_ID: string, vo_id: number): string {
        if ((!API_TYPE_ID) || (!vo_id)) {
            return null;
        }

        return VocusHandler.Vocus_ROUTE_BASE + '/' + API_TYPE_ID + '/' + vo_id;
    }
}