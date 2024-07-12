import { cloneDeep } from 'lodash';
import IServerUserSession from '../../../../shared/modules/AccessPolicy/vos/IServerUserSession';
import TimeSegment from '../../../../shared/modules/DataRender/vos/TimeSegment';
import Dates from '../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import StatsController from '../../../../shared/modules/Stats/StatsController';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import ObjectHandler from '../../../../shared/tools/ObjectHandler';
import ConfigurationService from '../../../env/ConfigurationService';
import ModuleBGThreadServer from '../../BGThread/ModuleBGThreadServer';
import IBGThread from '../../BGThread/interfaces/IBGThread';
import ForkedTasksController from '../../Fork/ForkedTasksController';
import TeamsAPIServerController from '../../TeamsAPI/TeamsAPIServerController';
import ModuleAccessPolicyServer from '../ModuleAccessPolicyServer';

export default class AccessPolicyDeleteSessionBGThread implements IBGThread {

    public static TEAMS_WEBHOOK_PARAM_NAME: string = 'AccessPolicyDeleteSessionBGThread.TEAMS_WEBHOOK';
    public static TASK_NAME_set_session_to_delete_by_sids: string = 'AccessPolicyDeleteSessionBGThread.set_session_to_delete_by_sids';
    public static TASK_NAME_add_api_reqs: string = 'AccessPolicyDeleteSessionBGThread.add_api_reqs';

    private static instance: AccessPolicyDeleteSessionBGThread = null;

    public session_last_send_date: { [sid: string]: number } = {};
    public session_to_delete_by_sids: { [sid: string]: IServerUserSession } = {};
    public api_reqs: string[] = [];

    public current_timeout: number = 2000;
    public MAX_timeout: number = 2000;
    public MIN_timeout: number = 100;

    public semaphore: boolean = false;
    public run_asap: boolean = false;
    public last_run_unix: number = null;

    private constructor() {
        // istanbul ignore next: nothing to test : register_task
        ForkedTasksController.register_task(AccessPolicyDeleteSessionBGThread.TASK_NAME_set_session_to_delete_by_sids, this.set_session_to_delete_by_sids.bind(this));
        // istanbul ignore next: nothing to test : register_task
        ForkedTasksController.register_task(AccessPolicyDeleteSessionBGThread.TASK_NAME_add_api_reqs, this.add_api_reqs.bind(this));
    }

    get name(): string {
        return "AccessPolicyDeleteSessionBGThread";
    }

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!AccessPolicyDeleteSessionBGThread.instance) {
            AccessPolicyDeleteSessionBGThread.instance = new AccessPolicyDeleteSessionBGThread();
        }
        return AccessPolicyDeleteSessionBGThread.instance;
    }

    public async work(): Promise<number> {

        const time_in = Dates.now_ms();

        try {

            StatsController.register_stat_COMPTEUR('AccessPolicyDeleteSessionBGThread', 'work', 'IN');

            if (!this.session_to_delete_by_sids || !ObjectHandler.hasAtLeastOneAttribute(this.session_to_delete_by_sids)) {
                this.stats_out('inactive', time_in);
                return ModuleBGThreadServer.TIMEOUT_COEF_SLEEP;
            }

            const session_to_delete_by_sids_cp: { [sid: string]: IServerUserSession } = cloneDeep(this.session_to_delete_by_sids);
            this.session_to_delete_by_sids = {};

            const api_reqs: string[] = cloneDeep(this.api_reqs);
            this.api_reqs = [];

            const to_invalidate: IServerUserSession[] = [];

            for (const sid in session_to_delete_by_sids_cp) {
                const session_to_delete = session_to_delete_by_sids_cp[sid];

                if (session_to_delete.id) {
                    continue;
                }

                if (!session_to_delete.sid) {
                    continue;
                }

                // Si on a un uid, on ne fait rien
                if (session_to_delete.uid) {
                    continue;
                }

                // Si on a envoyé la dernière fois il y a moins de 1 minute, on ne renvoie rien
                if (this.session_last_send_date[sid] && (Dates.diff(Dates.now(), this.session_last_send_date[sid], TimeSegment.TYPE_MINUTE) < 1)) {
                    continue;
                }

                this.session_last_send_date[sid] = Dates.now();

                session_to_delete.id = session_to_delete.sid.replace(/^[^:]+:([^.]+)\..*/i, '$1');

                to_invalidate.push(session_to_delete);
            }

            // Si on a quelque chose et qu'on est pas en DEV, on met un message sur Teams et on invalide la session
            if (to_invalidate.length > 0) {
                // On ne met pas de message sur Teams si on est en DEV
                if (!ConfigurationService.node_configuration.isdev) {

                    await TeamsAPIServerController.send_teams_info(
                        'Suppression de sessions suite invalidation - ' + ConfigurationService.node_configuration.app_title + " - " + ConfigurationService.node_configuration.base_url,
                        'SID : <ul><li>' + to_invalidate.map((m) => m.id).join('</li><li>') + '</li></ul>' +
                        'Requêtes : <ul><li>' + api_reqs.join('</li><li>') + '</li></ul>'
                    );
                }

                // On supprime la session
                await ForkedTasksController.exec_self_on_main_process(ModuleAccessPolicyServer.TASK_NAME_delete_sessions_from_other_thread, to_invalidate);
            }

            this.stats_out('ok', time_in);
            return ModuleBGThreadServer.TIMEOUT_COEF_RUN;
        } catch (error) {
            ConsoleHandler.error(error);
        }

        this.stats_out('throws', time_in);
        return ModuleBGThreadServer.TIMEOUT_COEF_SLEEP;
    }

    public set_session_to_delete_by_sids(session: IServerUserSession): boolean {
        if (!session) {
            return false;
        }

        this.session_to_delete_by_sids[session.sid] = session;

        return true;
    }

    public add_api_reqs(api_reqs: string[]): boolean {
        if (!api_reqs) {
            return false;
        }

        this.api_reqs.unshift(...api_reqs);
        this.api_reqs = this.api_reqs.splice(0, 20);

        return true;
    }

    private stats_out(activity: string, time_in: number) {

        const time_out = Dates.now_ms();
        StatsController.register_stat_COMPTEUR('AccessPolicyDeleteSessionBGThread', 'work', activity + '_OUT');
        StatsController.register_stat_DUREE('AccessPolicyDeleteSessionBGThread', 'work', activity + '_OUT', time_out - time_in);
    }
}