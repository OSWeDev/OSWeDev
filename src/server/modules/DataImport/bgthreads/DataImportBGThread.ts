import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import ModuleDataImport from '../../../../shared/modules/DataImport/ModuleDataImport';
import DataImportHistoricVO from '../../../../shared/modules/DataImport/vos/DataImportHistoricVO';
import DataImportLogVO from '../../../../shared/modules/DataImport/vos/DataImportLogVO';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import IBGThread from '../../BGThread/interfaces/IBGThread';
import ModuleBGThreadServer from '../../BGThread/ModuleBGThreadServer';
import ModuleDAOServer from '../../DAO/ModuleDAOServer';
import ModuleDataImportServer from '../ModuleDataImportServer';
import TypesHandler from '../../../../shared/tools/TypesHandler';
import ModuleParams from '../../../../shared/modules/Params/ModuleParams';

export default class DataImportBGThread implements IBGThread {

    public static getInstance() {
        if (!DataImportBGThread.instance) {
            DataImportBGThread.instance = new DataImportBGThread();
        }
        return DataImportBGThread.instance;
    }

    private static instance: DataImportBGThread = null;

    // private static request: string = ' where state in ($1, $3, $4, $5) or (state = $2 and autovalidate = true) order by last_up_date desc limit 1;';

    private static request: string = ' where state in ($1, $3, $4, $5) or (state = $2 and autovalidate = true) order by start_date asc limit 1;';
    private static importing_dih_id_param_name: string = 'DataImportBGThread.importing_dih_id';

    public current_timeout: number = 2000;
    public MAX_timeout: number = 2000;
    public MIN_timeout: number = 100;

    private constructor() {
    }

    get name(): string {
        return "DataImportBGThread";
    }

    public async work(): Promise<number> {

        try {


            // Objectif, on prend l'import en attente le plus ancien, et on l'importe tout simplement.
            //  en fin d'import, si on voit qu'il y en a un autre à importer, on demande d'aller plus vite.

            // Si un import est en cours et doit être continuer, on le récupère et on continue, sinon on en cherche un autre
            let importing_dih_id_param: string = await ModuleParams.getInstance().getParamValue(DataImportBGThread.importing_dih_id_param_name);
            let importing_dih_id: number = null;
            let dih: DataImportHistoricVO = null;
            if (!!importing_dih_id_param) {
                importing_dih_id = parseInt(importing_dih_id_param);
                dih = await ModuleDAO.getInstance().getVoById<DataImportHistoricVO>(DataImportHistoricVO.API_TYPE_ID, importing_dih_id);

                if ((!dih) || (
                    (dih.state != ModuleDataImport.IMPORTATION_STATE_UPLOADED) &&
                    (dih.state != ModuleDataImport.IMPORTATION_STATE_FORMATTED) &&
                    (dih.state != ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT) &&
                    (dih.state != ModuleDataImport.IMPORTATION_STATE_IMPORTED) &&
                    (dih.state != ModuleDataImport.IMPORTATION_STATE_NEEDS_REIMPORT))) {
                    dih = null;
                    await ModuleParams.getInstance().setParamValue(DataImportBGThread.importing_dih_id_param_name, null);
                }
            }

            if (!dih) {
                dih = await ModuleDAOServer.getInstance().selectOne<DataImportHistoricVO>(DataImportHistoricVO.API_TYPE_ID,
                    DataImportBGThread.request, [
                    ModuleDataImport.IMPORTATION_STATE_UPLOADED,
                    ModuleDataImport.IMPORTATION_STATE_FORMATTED,
                    ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT,
                    ModuleDataImport.IMPORTATION_STATE_IMPORTED,
                    ModuleDataImport.IMPORTATION_STATE_NEEDS_REIMPORT
                ]);
            }

            if (!dih) {
                return ModuleBGThreadServer.TIMEOUT_COEF_LITTLE_BIT_SLOWER;
            }

            await ModuleParams.getInstance().setParamValue(DataImportBGThread.importing_dih_id_param_name, dih.id.toString());

            if (!await this.handleImportHistoricProgression(dih)) {
                return ModuleBGThreadServer.TIMEOUT_COEF_LITTLE_BIT_SLOWER;
            }
            console.debug('DataImportBGThread DIH[' + dih.id + '] state:' + dih.state + ':');

            dih = await ModuleDAOServer.getInstance().selectOne<DataImportHistoricVO>(DataImportHistoricVO.API_TYPE_ID,
                DataImportBGThread.request, [
                ModuleDataImport.IMPORTATION_STATE_UPLOADED,
                ModuleDataImport.IMPORTATION_STATE_FORMATTED,
                ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT,
                ModuleDataImport.IMPORTATION_STATE_IMPORTED,
                ModuleDataImport.IMPORTATION_STATE_NEEDS_REIMPORT
            ]);

            if (!dih) {
                await ModuleParams.getInstance().setParamValue(DataImportBGThread.importing_dih_id_param_name, null);
                return ModuleBGThreadServer.TIMEOUT_COEF_LITTLE_BIT_SLOWER;
            }
            return ModuleBGThreadServer.TIMEOUT_COEF_RUN;
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
        }

        return ModuleBGThreadServer.TIMEOUT_COEF_LITTLE_BIT_SLOWER;
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
                await ModuleDataImportServer.getInstance().formatDatas(importHistoric);
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
                await ModuleDataImportServer.getInstance().importDatas(importHistoric);
                return true;

            case ModuleDataImport.IMPORTATION_STATE_IMPORTED:
                importHistoric.state = ModuleDataImport.IMPORTATION_STATE_POSTTREATING;
                await ModuleDataImportServer.getInstance().updateImportHistoric(importHistoric);
                await ModuleDataImportServer.getInstance().posttreatDatas(importHistoric);
                return true;

            case ModuleDataImport.IMPORTATION_STATE_NEEDS_REIMPORT:

                importHistoric.state = (((importHistoric.status_before_reimport != null) && (typeof importHistoric.status_before_reimport != 'undefined')) ? importHistoric.status_before_reimport : ModuleDataImport.IMPORTATION_STATE_POSTTREATED);
                await ModuleDAO.getInstance().insertOrUpdateVO(importHistoric);

                let new_importHistoric = new DataImportHistoricVO();
                new_importHistoric.api_type_id = importHistoric.api_type_id;
                new_importHistoric.autovalidate = true;
                new_importHistoric.file_id = importHistoric.file_id;
                new_importHistoric.import_type = importHistoric.import_type;
                new_importHistoric.segment_type = importHistoric.segment_type;
                new_importHistoric.segment_date_index = importHistoric.segment_date_index;
                new_importHistoric.params = importHistoric.params;
                new_importHistoric.state = ModuleDataImport.IMPORTATION_STATE_UPLOADED;
                new_importHistoric.user_id = importHistoric.user_id;
                new_importHistoric.reimport_of_dih_id = importHistoric.id;

                let insertOrDeleteQueryResult: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(new_importHistoric);

                if ((!insertOrDeleteQueryResult) || (!insertOrDeleteQueryResult.id)) {
                    ConsoleHandler.getInstance().error('!insertOrDeleteQueryResult dans handleImportHistoricProgression');
                    return false;
                }
                let id = parseInt(insertOrDeleteQueryResult.id);
                if ((!id) || (!TypesHandler.getInstance().isNumber(id))) {
                    ConsoleHandler.getInstance().error('!id dans handleImportHistoricProgression');
                    return false;
                }

            default:
                return false;
        }
    }
}