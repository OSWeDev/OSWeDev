import moment = require('moment');
import ModuleDataImport from '../../../../shared/modules/DataImport/ModuleDataImport';
import DataImportHistoricVO from '../../../../shared/modules/DataImport/vos/DataImportHistoricVO';
import DataImportLogVO from '../../../../shared/modules/DataImport/vos/DataImportLogVO';
import IBGThread from '../../BGThread/interfaces/IBGThread';
import ModuleDAOServer from '../../DAO/ModuleDAOServer';
import ModuleDataImportServer from '../ModuleDataImportServer';
import ThreadHandler from '../../../../shared/tools/ThreadHandler';

export default class DataImportBGThread implements IBGThread {

    public static getInstance() {
        if (!DataImportBGThread.instance) {
            DataImportBGThread.instance = new DataImportBGThread();
        }
        return DataImportBGThread.instance;
    }

    private static instance: DataImportBGThread = null;

    private constructor() {
    }

    get name(): string {
        return "DataImportBGThread";
    }

    public async work(): Promise<boolean> {

        try {

            // Objectif, on prend l'import en attente le plus ancien, et on l'importe tout simplement.
            //  en fin d'import, si on voit qu'il y en a un autre à importer, on demande d'aller plus vite.

            let dih: DataImportHistoricVO = await ModuleDAOServer.getInstance().selectOne<DataImportHistoricVO>(DataImportHistoricVO.API_TYPE_ID, ' where state in ($1, $2, $3, $4) order by last_up_date desc limit 1;', [
                ModuleDataImport.IMPORTATION_STATE_UPLOADED,
                ModuleDataImport.IMPORTATION_STATE_FORMATTED,
                ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT,
                ModuleDataImport.IMPORTATION_STATE_IMPORTED
            ]);

            if (!dih) {
                return false;
            }

            console.debug('DataImportBGThread DIH[' + dih.id + '] state:' + dih.state + ':');

            if (!await this.handleImportHistoricProgression(dih)) {
                // on doit pouvoir supprimer les logs inutiles de ce style...
                console.debug('DataImportBGThread import en attente ou en erreur, et pas pressé.');
                return false;
            }

            await ThreadHandler.getInstance().sleep(1000);

            dih = await ModuleDAOServer.getInstance().selectOne<DataImportHistoricVO>(DataImportHistoricVO.API_TYPE_ID, ' where state in ($1, $2, $3, $4) order by last_up_date desc limit 1;', [
                ModuleDataImport.IMPORTATION_STATE_UPLOADED,
                ModuleDataImport.IMPORTATION_STATE_FORMATTED,
                ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT,
                ModuleDataImport.IMPORTATION_STATE_IMPORTED
            ]);

            if (!dih) {
                console.debug('DataImportBGThread import terminé, et rien en attente.');
                return false;
            }
            console.debug('DataImportBGThread import avancé, mais il reste des tâches à gérer. Accélération.');
            return true;
        } catch (error) {
            console.error(error);
        }

        return false;
    }

    private async handleImportHistoricProgression(importHistoric: DataImportHistoricVO): Promise<boolean> {

        if (!(importHistoric && importHistoric.id)) {
            return false;
        }

        // Call the workers async to give the hand back to the client, but change the state right now since we're ready to launch the trigger
        // The updates will be pushed later on, no need to wait
        switch (importHistoric.state) {
            case ModuleDataImport.IMPORTATION_STATE_UPLOADED:
                importHistoric.state = ModuleDataImport.IMPORTATION_STATE_FORMATTING;
                await ModuleDataImportServer.getInstance().updateImportHistoric(importHistoric);
                ModuleDataImportServer.getInstance().formatDatas(importHistoric);
                return true;

            case ModuleDataImport.IMPORTATION_STATE_FORMATTED:
                //  Si on est sur une autovalidation, et qu'on a des résultats, on peut passer directement à l'étape suivante
                if (importHistoric.autovalidate) {
                    await ModuleDataImportServer.getInstance().logAndUpdateHistoric(importHistoric, null, ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT, 'Autovalidation', "import.success.autovalidation", DataImportLogVO.LOG_LEVEL_SUCCESS);
                    return true;
                } else {
                    return false;
                }

            case ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT:
                importHistoric.state = ModuleDataImport.IMPORTATION_STATE_IMPORTING;
                await ModuleDataImportServer.getInstance().updateImportHistoric(importHistoric);
                ModuleDataImportServer.getInstance().importDatas(importHistoric);
                return true;

            case ModuleDataImport.IMPORTATION_STATE_IMPORTED:
                importHistoric.state = ModuleDataImport.IMPORTATION_STATE_POSTTREATING;
                await ModuleDataImportServer.getInstance().updateImportHistoric(importHistoric);
                ModuleDataImportServer.getInstance().posttreatDatas(importHistoric);
                return true;

            default:
                return false;
        }
    }
}