import ContextFilterVO, { filter } from '../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import { query } from '../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import SortByVO from '../../../../shared/modules/ContextFilter/vos/SortByVO';
import IExportableDatas from '../../../../shared/modules/DataExport/interfaces/IExportableDatas';
import ExportHistoricVO from '../../../../shared/modules/DataExport/vos/ExportHistoricVO';
import Dates from '../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import StatsController from '../../../../shared/modules/Stats/StatsController';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import { field_names } from '../../../../shared/tools/ObjectHandler';
import IBGThread from '../../BGThread/interfaces/IBGThread';
import ModuleBGThreadServer from '../../BGThread/ModuleBGThreadServer';
import ModuleDAOServer from '../../DAO/ModuleDAOServer';
import PushDataServerController from '../../PushData/PushDataServerController';
import DataExportServerController from '../DataExportServerController';

export default class DataExportBGThread implements IBGThread {

    private static instance: DataExportBGThread = null;

    private static request: string = ' where state in ($1, $2) order by creation_date asc limit 1;';

    public current_timeout: number = 60000;
    public MAX_timeout: number = 60000;
    public MIN_timeout: number = 100;

    private constructor() {
    }

    get name(): string {
        return "DataExportBGThread";
    }

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!DataExportBGThread.instance) {
            DataExportBGThread.instance = new DataExportBGThread();
        }
        return DataExportBGThread.instance;
    }

    public async work(): Promise<number> {

        const time_in = Dates.now_ms();
        try {

            StatsController.register_stat_COMPTEUR('DataExportBGThread', 'work', 'IN');

            // Objectif, on prend l'export en attente le plus ancien, et on l'exécute. Si un export est en cours, à ce stade on devrait pas
            //  le voir, donc il y a eu une erreur, on l'indique (c'est peut-être juste un redémarrage serveur) et on relance.

            const exhi: ExportHistoricVO = await query(ExportHistoricVO.API_TYPE_ID)
                .add_filters([
                    ContextFilterVO.or([
                        filter(ExportHistoricVO.API_TYPE_ID, field_names<ExportHistoricVO>().state).by_num_eq(ExportHistoricVO.EXPORT_STATE_TODO),
                        filter(ExportHistoricVO.API_TYPE_ID, field_names<ExportHistoricVO>().state).by_num_eq(ExportHistoricVO.EXPORT_STATE_RUNNING)
                    ])]
                ).set_limit(1).set_sort(new SortByVO(ExportHistoricVO.API_TYPE_ID, field_names<ExportHistoricVO>().creation_date, true)).select_vo<ExportHistoricVO>();

            if (!exhi) {
                this.stats_out('inactive', time_in);
                return ModuleBGThreadServer.TIMEOUT_COEF_SLEEP;
            }

            if (exhi.state == ExportHistoricVO.EXPORT_STATE_RUNNING) {
                ConsoleHandler.warn('ATTENTION : Un export est relancé :' + exhi.id + ':' + exhi.export_type_id + ':');
            }

            if (!await this.handleHistoric(exhi)) {
                ConsoleHandler.error('ATTENTION : Un export a échoué :' + exhi.id + ':' + exhi.export_type_id + ':');
                this.stats_out('failed', time_in);
                return ModuleBGThreadServer.TIMEOUT_COEF_SLEEP;
            }
            ConsoleHandler.log('Un export est terminé :' + exhi.id + ':' + exhi.export_type_id + ':');
            this.stats_out('ok', time_in);
            return ModuleBGThreadServer.TIMEOUT_COEF_RUN;
        } catch (error) {
            ConsoleHandler.error(error);
        }

        this.stats_out('throws', time_in);
        return ModuleBGThreadServer.TIMEOUT_COEF_SLEEP;
    }

    private stats_out(activity: string, time_in: number) {

        const time_out = Dates.now_ms();
        StatsController.register_stat_COMPTEUR('DataExportBGThread', 'work', activity + '_OUT');
        StatsController.register_stat_DUREE('DataExportBGThread', 'work', activity + '_OUT', time_out - time_in);
    }

    private async handleHistoric(exhi: ExportHistoricVO): Promise<boolean> {

        if (!(exhi && exhi.id)) {
            return false;
        }

        exhi.start_date = Dates.now();
        exhi.state = ExportHistoricVO.EXPORT_STATE_RUNNING;
        await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(exhi);

        if (!DataExportServerController.getInstance().export_handlers[exhi.export_type_id]) {
            ConsoleHandler.error('Impossible de trouver la méthode pour exporter');

            await this.failExport(exhi);
            return false;
        }

        try {

            if (exhi.export_to_uid) {
                await PushDataServerController.notifySimpleINFO(exhi.export_to_uid, null, "DataExportBGThread.handleHistoric.start");
            }

            const datas: IExportableDatas = await DataExportServerController.getInstance().export_handlers[exhi.export_type_id].prepare_datas(exhi);

            if (!datas || !datas.datas) {
                await DataExportServerController.getInstance().export_handlers[exhi.export_type_id].send(exhi);
                throw new Error('Echec lors de l\'export :no datas:' + exhi.id + ':' + exhi.export_type_id + ':export_to_uid:' + exhi.export_to_uid + ':export_params_stringified:' + exhi.export_params_stringified + ':');
            }

            exhi.prepare_date = Dates.now();
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(exhi);

            if (!await DataExportServerController.getInstance().export_handlers[exhi.export_type_id].export(exhi, datas)) {
                throw new Error('Echec lors de l\'export :' + exhi.id + ':' + exhi.export_type_id + ':');
            }

            exhi.export_date = Dates.now();
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(exhi);

            if (!await DataExportServerController.getInstance().export_handlers[exhi.export_type_id].send(exhi)) {
                throw new Error('Echec lors de l\'envoi :' + exhi.id + ':' + exhi.export_type_id + ':');
            }

            exhi.sent_date = Dates.now();
            exhi.state = ExportHistoricVO.EXPORT_STATE_DONE;
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(exhi);

            if (exhi.export_to_uid) {
                await PushDataServerController.notifySimpleSUCCESS(exhi.export_to_uid, null, "DataExportBGThread.handleHistoric.success");
            }

            return true;

        } catch (error) {
            ConsoleHandler.error(error);
            await this.failExport(exhi);

            if (exhi.export_to_uid) {
                await PushDataServerController.notifySimpleERROR(exhi.export_to_uid, null, "DataExportBGThread.handleHistoric.failed");
            }

            return false;
        }
    }

    private async failExport(exhi: ExportHistoricVO) {
        exhi.state = ExportHistoricVO.EXPORT_STATE_ERROR;
        await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(exhi);
    }
}