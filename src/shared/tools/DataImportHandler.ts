import TimeSegment from '../modules/DataRender/vos/TimeSegment';

export default class DataImportHandler {
    public static DATAIMPORT_ROUTE_BASE: string = '/data_import/';

    public static getDATAIMPORTLink(API_TYPE_IDs: string[]): string {
        return DataImportHandler.DATAIMPORT_ROUTE_BASE + API_TYPE_IDs.join('_');
    }
    public static getDATAIMPORTModalLink(API_TYPE_IDs: string[], segment: TimeSegment): string {
        return DataImportHandler.getDATAIMPORTLink(API_TYPE_IDs) + "/segment/" + segment.dateIndex;
    }
}