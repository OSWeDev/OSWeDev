import * as moment from 'moment';
import { Moment } from 'moment';
import DataImportFileVO from '../../../../shared/modules/DataImport/vos/DataImportFileVO';
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
     * Crée un nouveau historique pour l'import d'un fichier du type passé en paramètre
     * @param dataImportFile Le type de fichier en cours d'import
     * @param target_date La date cible de l'import
     */
    public async newImportHistoric(dataImportFile: DataImportFileVO, target_date: Moment): Promise<DataImportHistoricVO> {

        let res: DataImportHistoricVO = new DataImportHistoricVO();

        res.data_import_file_id = dataImportFile.id;
        res.start_date = DateHandler.getInstance().formatDateTimeForBDD(moment());
        res.last_up_date = DateHandler.getInstance().formatDateTimeForBDD(moment());
        res.state = DataImportHistoricVO.IMPORT_STATE_STARTED;
        res.target_date = DateHandler.getInstance().formatDateTimeForBDD(target_date);

        try {
            let inserts = await ModuleDAO.getInstance().insertOrUpdateVOs([res]);
            res = await ModuleDAO.getInstance().getVoById<DataImportHistoricVO>(DataImportHistoricVO.API_TYPE_ID, inserts[0].id) as DataImportHistoricVO;
        } catch (error) {
            console.error("Impossible de créer un historique pour ce fichier d'import : " + dataImportFile.id + " : " + DateHandler.getInstance().formatDateTimeForBDD(target_date) + ":" + error);
            return null;
        }

        return res;
    }

    /**
     * Pour mettre à jour la date d'update sur log pour cet historique et mettre à jour le status pour terminer l'historique
     * @param historique L'historique à updater
     * @param state Facultatif : si renseigné permet de mettre à jour les dates de fin de traitement en même temps automatiquement. Sinon juste update la date d'update
     */
    public async updateImportHistoric(historique: DataImportHistoricVO, state: number = null) {

        if (state != null) {

            historique.state = state;

            if ((state == DataImportHistoricVO.IMPORT_STATE_FAILED) ||
                (state == DataImportHistoricVO.IMPORT_STATE_OK) ||
                (state == DataImportHistoricVO.IMPORT_STATE_POSTTRAITMENT_FAILED)) {
                historique.end_date = DateHandler.getInstance().formatDateTimeForBDD(moment());
            }
        }
        historique.last_up_date = DateHandler.getInstance().formatDateTimeForBDD(moment());

        await ModuleDAO.getInstance().insertOrUpdateVOs([historique]);
    }

    /**
     * Logger en base pour un historique d'import
     * @param historique L'historique sur lequel on log
     * @param message Le message à logger (l'horodatage est géré par ailleurs, donc message brut)
     * @param log_level Facultatif : Par défaut INFO. Le niveau de criticité du log (voir DataImportLogVO.LOG_LEVEL_XXX)
     * @param updateHistoric Facultatif : par défaut true. Si true on update aussi l'historique (mais sans changement de state). Mettre false si un changement d'état
     * est réalisé en parralèle pour éviter les updates inutiles en base
     */
    public async log(historique: DataImportHistoricVO, message: string, log_level: string = DataImportLogVO.LOG_LEVEL_10_INFO, updateHistoric: boolean = true) {

        let log: DataImportLogVO = new DataImportLogVO();

        log.data_import_file_id = historique.data_import_file_id;
        log.data_import_historic_id = historique.id;
        log.date = DateHandler.getInstance().formatDateTimeForBDD(moment());
        log.log_level = log_level;
        log.message = message;

        let promises: Array<Promise<any>> = [];
        promises.push(ModuleDAO.getInstance().insertOrUpdateVOs([log]));
        if (updateHistoric) {
            promises.push(this.updateImportHistoric(historique));
        }
        await Promise.all(promises);
    }
}