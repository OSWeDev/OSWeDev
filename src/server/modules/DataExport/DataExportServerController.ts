import IExportHandler from './interfaces/IExportHandler';

export default class DataExportServerController {

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