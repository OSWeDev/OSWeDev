// TODO FIXME JNE DELETE if dao cache built otherwise
// import ContextFilterVO, { filter } from '../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
// import { query } from '../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
// import SortByVO from '../../../../shared/modules/ContextFilter/vos/SortByVO';
// import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
// import IExportableDatas from '../../../../shared/modules/DataExport/interfaces/IExportableDatas';
// import ExportHistoricVO from '../../../../shared/modules/DataExport/vos/ExportHistoricVO';
// import TimeSegment from '../../../../shared/modules/DataRender/vos/TimeSegment';
// import Dates from '../../../../shared/modules/FormatDatesNombres/Dates/Dates';
// import StatsController from '../../../../shared/modules/Stats/StatsController';
// import StatsTypeVO from '../../../../shared/modules/Stats/vos/StatsTypeVO';
// import StatVO from '../../../../shared/modules/Stats/vos/StatVO';
// import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
// import IBGThread from '../../BGThread/interfaces/IBGThread';
// import ModuleBGThreadServer from '../../BGThread/ModuleBGThreadServer';
// import PushDataServerController from '../../PushData/PushDataServerController';
// import DAOCacheParamVO from './vos/DAOCacheParamVO';

// export default class DAOCacheBGThread implements IBGThread {

//     public static TASK_NAME_query: string = 'DAOCacheBGThread.query';

//     public static getInstance() {
//         if (!DAOCacheBGThread.instance) {
//             DAOCacheBGThread.instance = new DAOCacheBGThread();
//         }
//         return DAOCacheBGThread.instance;
//     }

//     private static instance: DAOCacheBGThread = null;

//     private static dao_cache: { [parameterized_full_query: string]: any } = {};
//     private static dao_cache_params: { [parameterized_full_query: string]: DAOCacheParamVO } = {};

//     public exec_in_dedicated_thread: boolean = true;

//     public current_timeout: number = 5000;
//     public MAX_timeout: number = 10000;
//     public MIN_timeout: number = 1000;

//     private constructor() {
//     }

//     get name(): string {
//         return "DAOCacheBGThread";
//     }



//     public async work(): Promise<number> {

//         let time_in = Dates.now_ms();
//         try {

//             StatsController.register_stat_COMPTEUR('DAOCacheBGThread', 'work', 'IN');

//             // Objectif : libérer les caches de DAO dont le tiemout est dépassé

//             return ModuleBGThreadServer.TIMEOUT_COEF_RUN;
//         } catch (error) {
//             ConsoleHandler.error(error);
//         }

//         this.stats_out('throws', time_in);
//         return ModuleBGThreadServer.TIMEOUT_COEF_SLEEP;
//     }
// }