// import { cloneDeep } from 'lodash';
// import IServerUserSession from '../../../../shared/modules/AccessPolicy/vos/IServerUserSession';
// import TimeSegment from '../../../../shared/modules/DataRender/vos/TimeSegment';
// import Dates from '../../../../shared/modules/FormatDatesNombres/Dates/Dates';
// import StatsController from '../../../../shared/modules/Stats/StatsController';
// import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
// import ObjectHandler from '../../../../shared/tools/ObjectHandler';
// import ConfigurationService from '../../../env/ConfigurationService';
// import ModuleBGThreadServer from '../../BGThread/ModuleBGThreadServer';
// import { RunsOnBgThread } from '../../BGThread/annotations/RunsOnBGThread';
// import IBGThread from '../../BGThread/interfaces/IBGThread';
// import ForkedTasksController from '../../Fork/ForkedTasksController';
// import TeamsAPIServerController from '../../TeamsAPI/TeamsAPIServerController';
// import ModuleAccessPolicyServer from '../ModuleAccessPolicyServer';
// import PushDataServerController from '../../PushData/PushDataServerController';

// /**
//  * TODO FIXME réfléchir à ce truc et voir si on peut pas s'endébarrasser
//  */
// export default class AccessPolicyDeleteSessionBGThread implements IBGThread {

//     public static BGTHREAD_NAME: string = 'AccessPolicyDeleteSessionBGThread';
//     public static TEAMS_WEBHOOK_PARAM_NAME: string = 'AccessPolicyDeleteSessionBGThread.TEAMS_WEBHOOK';

//     private static instance: AccessPolicyDeleteSessionBGThread = null;

//     public session_last_send_date: { [sid: string]: number } = {};
//     public session_to_delete_by_sids: { [sid: string]: IServerUserSession } = {};
//     // public api_reqs: string[] = [];

//     public current_timeout: number = 10000;
//     public MAX_timeout: number = 300000;
//     public MIN_timeout: number = 60000;

//     private constructor() {
//     }

//     get name(): string {
//         return AccessPolicyDeleteSessionBGThread.BGTHREAD_NAME;
//     }

//     // istanbul ignore next: nothing to test : getInstance
//     public static getInstance() {
//         if (!AccessPolicyDeleteSessionBGThread.instance) {
//             AccessPolicyDeleteSessionBGThread.instance = new AccessPolicyDeleteSessionBGThread();
//         }
//         return AccessPolicyDeleteSessionBGThread.instance;
//     }

//     @RunsOnBgThread(AccessPolicyDeleteSessionBGThread.BGTHREAD_NAME)
//     public async push_sid_to_delete(sid: string): Promise<boolean> {
//         if (!sid) {
//             return false;
//         }

//         this.session_to_delete_by_sids[sid] = await PushDataServerController.getSessionBySid(sid);

//         return true;
//     }

//     public async work(): Promise<number> {

//         const time_in = Dates.now_ms();

//         try {

//             StatsController.register_stat_COMPTEUR('AccessPolicyDeleteSessionBGThread', 'work', 'IN');

//             if (!this.session_to_delete_by_sids || !ObjectHandler.hasAtLeastOneAttribute(this.session_to_delete_by_sids)) {
//                 this.stats_out('inactive', time_in);
//                 return ModuleBGThreadServer.TIMEOUT_COEF_SLEEP;
//             }

//             const session_to_delete_by_sids_cp: { [sid: string]: IServerUserSession } = cloneDeep(this.session_to_delete_by_sids);
//             this.session_to_delete_by_sids = {};

//             const sids_to_invalidate: string[] = [];
//             const ids_to_invalidate: string[] = [];

//             for (const sid in session_to_delete_by_sids_cp) {
//                 const session_to_delete = session_to_delete_by_sids_cp[sid];

//                 if (session_to_delete.id) {
//                     continue;
//                 }

//                 if (!session_to_delete.sid) {
//                     continue;
//                 }

//                 // Si on a un uid, on ne fait rien
//                 if (session_to_delete.uid) {
//                     continue;
//                 }

//                 // Si on a envoyé la dernière fois il y a moins de 1 minute, on ne renvoie rien
//                 if (this.session_last_send_date[sid] && (Dates.diff(Dates.now(), this.session_last_send_date[sid], TimeSegment.TYPE_MINUTE) < 1)) {
//                     continue;
//                 }

//                 this.session_last_send_date[sid] = Dates.now();

//                 session_to_delete.id = session_to_delete.sid.replace(/^[^:]+:([^.]+)\..*/i, '$1'); // Bien penser que l'on est sur un bgthread, donc la session n'est pas la vraie/express

//                 sids_to_invalidate.push(session_to_delete.sid);
//                 ids_to_invalidate.push(session_to_delete.id);
//             }

//             // Si on a quelque chose et qu'on est pas en DEV, on met un message sur Teams et on invalide la session
//             if (sids_to_invalidate.length > 0) {
//                 // On ne met pas de message sur Teams si on est en DEV
//                 if (!ConfigurationService.node_configuration.isdev) {

//                     await TeamsAPIServerController.send_teams_info(
//                         'Suppression de sessions suite invalidation - ' + ConfigurationService.node_configuration.app_title + " - " + ConfigurationService.node_configuration.base_url,
//                         'SID : <ul><li>' + ids_to_invalidate.join('</li><li>') + '</li></ul>' //+
//                     );
//                 }

//                 // On supprime la session
//                 await ModuleAccessPolicyServer.getInstance().delete_sessions_from_sids(sids_to_invalidate);
//             }

//             this.stats_out('ok', time_in);
//             return ModuleBGThreadServer.TIMEOUT_COEF_RUN;
//         } catch (error) {
//             ConsoleHandler.error(error);
//         }

//         this.stats_out('throws', time_in);
//         return ModuleBGThreadServer.TIMEOUT_COEF_SLEEP;
//     }

//     private stats_out(activity: string, time_in: number) {

//         const time_out = Dates.now_ms();
//         StatsController.register_stat_COMPTEUR('AccessPolicyDeleteSessionBGThread', 'work', activity + '_OUT');
//         StatsController.register_stat_DUREE('AccessPolicyDeleteSessionBGThread', 'work', activity + '_OUT', time_out - time_in);
//     }
// }