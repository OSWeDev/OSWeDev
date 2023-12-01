import IExportHandler from "../../../shared/modules/DataExport/interfaces/IExportHandler";
import TimeSegment from "../../../shared/modules/DataRender/vos/TimeSegment";
import Dates from "../../../shared/modules/FormatDatesNombres/Dates/Dates";

export default class DataExportServerController {

    /**
     * Objectif : formatage d'un timestamp en object Date en utc pour l'export excel
     * @param timestamp timestamp à convertir en date UTC
     * @returns Objet Date
     */
    public static format_date_utc_excel(timestamp: number, target_segmentation_type: number = TimeSegment.TYPE_DAY): Date {
        if (timestamp) {

            let utc_date = null;
            switch (target_segmentation_type) {
                case TimeSegment.TYPE_YEAR:
                    utc_date = Date.UTC(Dates.year(timestamp), 0, 1, 0, 0, 0);
                    break;
                case TimeSegment.TYPE_MONTH:
                    utc_date = Date.UTC(Dates.year(timestamp), Dates.month(timestamp), 1, 0, 0, 0);
                    break;
                case TimeSegment.TYPE_DAY:
                    utc_date = Date.UTC(Dates.year(timestamp), Dates.month(timestamp), Dates.day(timestamp), 0, 0, 0);
                    break;
                case TimeSegment.TYPE_HOUR:
                    utc_date = Date.UTC(Dates.year(timestamp), Dates.month(timestamp), Dates.day(timestamp), Dates.hour(timestamp), 0, 0);
                    break;
                case TimeSegment.TYPE_MINUTE:
                    utc_date = Date.UTC(Dates.year(timestamp), Dates.month(timestamp), Dates.day(timestamp), Dates.hour(timestamp), Dates.minute(timestamp), 0);
                    break;
                case TimeSegment.TYPE_SECOND:
                    utc_date = Date.UTC(Dates.year(timestamp), Dates.month(timestamp), Dates.day(timestamp), Dates.hour(timestamp), Dates.minute(timestamp), Dates.second(timestamp));
                    break;
                default:
                    utc_date = Date.UTC(Dates.year(timestamp), Dates.month(timestamp), Dates.day(timestamp), 0, 0, 0);
                    break;
            }

            /**
             * On soustrait le timezone local, et les 21 secondes pour Excel ... cf https://github.com/SheetJS/sheetjs/issues/2152 pour les 21 seconds en dur....
             */
            return new Date(utc_date + ((new Date()).getTimezoneOffset() * 60 * 1000) - 21000);
        }
        return null;
    }

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!DataExportServerController.instance) {
            DataExportServerController.instance = new DataExportServerController();
        }
        return DataExportServerController.instance;
    }

    private static instance: DataExportServerController = null;

    /**
     * Local thread cache -----
     */
    private registered_export_handlers: { [export_type_id: string]: IExportHandler } = {};
    /**
     * ----- Local thread cache
     */

    private constructor() { }

    public register_export_handler(export_type_id: string, exhandler: IExportHandler) {
        this.registered_export_handlers[export_type_id] = exhandler;
    }

    get export_handlers(): { [export_type_id: string]: IExportHandler } {
        return this.registered_export_handlers;
    }
}