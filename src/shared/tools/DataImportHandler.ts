import TimeSegment from '../modules/DataRender/vos/TimeSegment';

export default class DataImportHandler {
    public static DATAIMPORT_ROUTE_BASE: string = '/data_import/';

    public static getDATAIMPORTLink(API_TYPE_IDs: string[]): string {
        if ((!API_TYPE_IDs) || (!API_TYPE_IDs.length)) {
            return null;
        }
        API_TYPE_IDs = API_TYPE_IDs.filter((e) => !!e);
        if ((!API_TYPE_IDs) || (!API_TYPE_IDs.length)) {
            return null;
        }
        return DataImportHandler.DATAIMPORT_ROUTE_BASE + API_TYPE_IDs.join('_');
    }
    public static getDATAIMPORTModalLink(API_TYPE_IDs: string[], segment: TimeSegment): string {
        if ((!API_TYPE_IDs) || (!API_TYPE_IDs.length)) {
            return null;
        }
        API_TYPE_IDs = API_TYPE_IDs.filter((e) => !!e);
        if ((!API_TYPE_IDs) || (!API_TYPE_IDs.length)) {
            return null;
        }
        return DataImportHandler.getDATAIMPORTLink(API_TYPE_IDs) + "/segment/" + segment.index;
    }
}