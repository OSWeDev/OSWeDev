import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import ExportHistoricVO from '../../../../shared/modules/DataExport/vos/ExportHistoricVO';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import IBGThread from '../../BGThread/interfaces/IBGThread';
import ModuleBGThreadServer from '../../BGThread/ModuleBGThreadServer';
import ModuleDAOServer from '../../DAO/ModuleDAOServer';
import DataExportServerController from '../DataExportServerController';
import IExportableDatas from '../interfaces/IExportableDatas';
import moment = require('moment');
import ModulePushDataServer from '../../PushData/ModulePushDataServer';
import PushDataServerController from '../../PushData/PushDataServerController';

export default class DataExportBGThread implements IBGThread {

    public static getInstance() {
        if (!DataExportBGThread.instance) {
            DataExportBGThread.instance = new DataExportBGThread();
        }
        return DataExportBGThread.instance;
    }

    private static instance: DataExportBGThread = null;

    private static request: string = ' where state in ($1, $2) order by creation_date asc limit 1;';

    public current_timeout: number = 2000;
    public MAX_timeout: number = 2000;
    public MIN_timeout: number = 100;

    private constructor() {
    }

    get name(): string {
        return "DataExportBGThread";
    }

    public async work(): Promise<number> {

        try {

            // Objectif, on prend l'export en attente le plus ancien, et on l'exécute. Si un export est en cours, à ce stade on devrait pas
            //  le voir, donc il y a eu une erreur, on l'indique (c'est peut-être juste un redémarrage serveur) et on relance.

            let exhi: ExportHistoricVO = await ModuleDAOServer.getInstance().selectOne<ExportHistoricVO>(ExportHistoricVO.API_TYPE_ID,
                DataExportBGThread.request, [
                ExportHistoricVO.EXPORT_STATE_TODO,
                ExportHistoricVO.EXPORT_STATE_RUNNING
            ]);

            if (!exhi) {
                return ModuleBGThreadServer.TIMEOUT_COEF_SLEEP;
            }

            if (exhi.state == ExportHistoricVO.EXPORT_STATE_RUNNING) {
                ConsoleHandler.getInstance().warn('ATTENTION : Un export est relancé :' + exhi.id + ':' + exhi.export_type_id + ':');
            }

            if (!await this.handleHistoric(exhi)) {
                ConsoleHandler.getInstance().error('ATTENTION : Un export a échoué :' + exhi.id + ':' + exhi.export_type_id + ':');
                return ModuleBGThreadServer.TIMEOUT_COEF_SLEEP;
            }
            ConsoleHandler.getInstance().log('Un export est terminé :' + exhi.id + ':' + exhi.export_type_id + ':');
            return ModuleBGThreadServer.TIMEOUT_COEF_RUN;
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
        }

        return ModuleBGThreadServer.TIMEOUT_COEF_SLEEP;
    }

    private async handleHistoric(exhi: ExportHistoricVO): Promise<boolean> {

        if (!(exhi && exhi.id)) {
            return false;
        }

        exhi.start_date = moment().utc(true);
        exhi.state = ExportHistoricVO.EXPORT_STATE_RUNNING;
        await ModuleDAO.getInstance().insertOrUpdateVO(exhi);

        if (!DataExportServerController.getInstance().export_handlers[exhi.export_type_id]) {
            ConsoleHandler.getInstance().error('Impossible de trouver la méthode pour exporter');

            await this.failExport(exhi);
            return false;
        }

        try {

            if (!!exhi.export_to_uid) {
                PushDataServerController.getInstance().notifySimpleINFO(exhi.export_to_uid, null, "DataExportBGThread.handleHistoric.start");
            }

            let datas: IExportableDatas = await DataExportServerController.getInstance().export_handlers[exhi.export_type_id].prepare_datas(exhi);

            exhi.prepare_date = moment().utc(true);
            await ModuleDAO.getInstance().insertOrUpdateVO(exhi);

            if (!await DataExportServerController.getInstance().export_handlers[exhi.export_type_id].export(exhi, datas)) {
                throw new Error('Echec lors de l\'export :' + exhi.id + ':' + exhi.export_type_id + ':');
            }

            exhi.export_date = moment().utc(true);
            await ModuleDAO.getInstance().insertOrUpdateVO(exhi);

            if (!await DataExportServerController.getInstance().export_handlers[exhi.export_type_id].send(exhi)) {
                throw new Error('Echec lors de l\'envoi :' + exhi.id + ':' + exhi.export_type_id + ':');
            }

            exhi.sent_date = moment().utc(true);
            exhi.state = ExportHistoricVO.EXPORT_STATE_DONE;
            await ModuleDAO.getInstance().insertOrUpdateVO(exhi);

            if (!!exhi.export_to_uid) {
                PushDataServerController.getInstance().notifySimpleSUCCESS(exhi.export_to_uid, null, "DataExportBGThread.handleHistoric.success");
            }

            return true;

        } catch (error) {
            ConsoleHandler.getInstance().error(error);
            await this.failExport(exhi);

            if (!!exhi.export_to_uid) {
                PushDataServerController.getInstance().notifySimpleERROR(exhi.export_to_uid, null, "DataExportBGThread.handleHistoric.failed");
            }

            return false;
        }
    }

    private async failExport(exhi: ExportHistoricVO) {
        exhi.state = ExportHistoricVO.EXPORT_STATE_ERROR;
        await ModuleDAO.getInstance().insertOrUpdateVO(exhi);
    }
}