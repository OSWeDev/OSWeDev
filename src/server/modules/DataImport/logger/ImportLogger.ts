import * as moment from 'moment';
import { Moment } from 'moment';
import DataImportFormatVO from '../../../../shared/modules/DataImport/vos/DataImportFormatVO';
import DataImportHistoricVO from '../../../../shared/modules/DataImport/vos/DataImportHistoricVO';
import DateHandler from '../../../../shared/tools/DateHandler';
import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import DataImportLogVO from '../../../../shared/modules/DataImport/vos/DataImportLogVO';

export default class ImportLogger {

    public static getInstance(): ImportLogger {
        if (!ImportLogger.instance) {
            ImportLogger.instance = new ImportLogger();
        }
        return ImportLogger.instance;
    }

    private static instance: ImportLogger = null;

    private constructor() { }

    /**
     * Logger en base pour un historique d'import
     * @param historique L'historique sur lequel on log
     * @param message Le message à logger (l'horodatage est géré par ailleurs, donc message brut)
     * @param log_level Facultatif : Par défaut INFO. Le niveau de criticité du log (voir DataImportLogVO.LOG_LEVEL_XXX)
     * est réalisé en parralèle pour éviter les updates inutiles en base
     */
    public async log(historique: DataImportHistoricVO, format: DataImportFormatVO, message: string, log_level: number = DataImportLogVO.LOG_LEVEL_INFO) {

        let log: DataImportLogVO = new DataImportLogVO();

        log.data_import_format_id = historique.data_import_format_id;
        log.data_import_historic_id = historique.id;
        log.date = DateHandler.getInstance().formatDateTimeForBDD(moment());
        log.log_level = log_level;
        log.message = (format ? format.import_uid + '::' : '') + message;
        log.api_type_id = historique.api_type_id;

        let promises: Array<Promise<any>> = [];
        promises.push((async () => {
            await ModuleDAO.getInstance().insertOrUpdateVOs([log]);
        })());
        await Promise.all(promises);
    }
}