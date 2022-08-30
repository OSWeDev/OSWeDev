import { cloneDeep } from 'lodash';
import TimeSegment from '../../../../shared/modules/DataRender/vos/TimeSegment';
import Dates from '../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ModuleParams from '../../../../shared/modules/Params/ModuleParams';
import TeamsWebhookContentSectionVO from '../../../../shared/modules/TeamsAPI/vos/TeamsWebhookContentSectionVO';
import TeamsWebhookContentVO from '../../../../shared/modules/TeamsAPI/vos/TeamsWebhookContentVO';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import ObjectHandler from '../../../../shared/tools/ObjectHandler';
import ConfigurationService from '../../../env/ConfigurationService';
import IServerUserSession from '../../../IServerUserSession';
import IBGThread from '../../BGThread/interfaces/IBGThread';
import ModuleBGThreadServer from '../../BGThread/ModuleBGThreadServer';
import ForkedTasksController from '../../Fork/ForkedTasksController';
import ModuleTeamsAPIServer from '../../TeamsAPI/ModuleTeamsAPIServer';
import ModuleAccessPolicyServer from '../ModuleAccessPolicyServer';

export default class AccessPolicyDeleteSessionBGThread implements IBGThread {

    public static TEAMS_WEBHOOK_PARAM_NAME: string = 'AccessPolicyDeleteSessionBGThread.TEAMS_WEBHOOK';
    public static TASK_NAME_set_session_to_delete_by_sids: string = 'AccessPolicyDeleteSessionBGThread.set_session_to_delete_by_sids';
    public static TASK_NAME_add_api_reqs: string = 'AccessPolicyDeleteSessionBGThread.add_api_reqs';

    public static getInstance() {
        if (!AccessPolicyDeleteSessionBGThread.instance) {
            AccessPolicyDeleteSessionBGThread.instance = new AccessPolicyDeleteSessionBGThread();
        }
        return AccessPolicyDeleteSessionBGThread.instance;
    }

    private static instance: AccessPolicyDeleteSessionBGThread = null;

    public session_last_send_date: { [sid: string]: number } = {};
    public session_to_delete_by_sids: { [sid: string]: IServerUserSession } = {};
    public api_reqs: string[] = [];

    public current_timeout: number = 2000;
    public MAX_timeout: number = 2000;
    public MIN_timeout: number = 100;

    private constructor() {
        ForkedTasksController.getInstance().register_task(AccessPolicyDeleteSessionBGThread.TASK_NAME_set_session_to_delete_by_sids, this.set_session_to_delete_by_sids.bind(this));
        ForkedTasksController.getInstance().register_task(AccessPolicyDeleteSessionBGThread.TASK_NAME_add_api_reqs, this.add_api_reqs.bind(this));
    }

    get name(): string {
        return "AccessPolicyDeleteSessionBGThread";
    }

    public async work(): Promise<number> {

        try {

            let invalidate_sessions: IServerUserSession[] = ObjectHandler.getInstance().arrayFromMap(this.session_to_delete_by_sids);

            if (!invalidate_sessions || !invalidate_sessions.length) {
                return ModuleBGThreadServer.TIMEOUT_COEF_SLEEP;
            }

            let session_to_delete_by_sids_cp: { [sid: string]: IServerUserSession } = cloneDeep(this.session_to_delete_by_sids);
            this.session_to_delete_by_sids = {};

            let api_reqs: string[] = cloneDeep(this.api_reqs);
            this.api_reqs = [];

            let to_invalidate: IServerUserSession[] = [];

            for (let sid in session_to_delete_by_sids_cp) {
                let session_to_delete = session_to_delete_by_sids_cp[sid];

                if (!!session_to_delete.id) {
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
                if (!ConfigurationService.getInstance().node_configuration.ISDEV) {
                    let TEAMS_WEBHOOK_PARAM_NAME: string = await ModuleParams.getInstance().getParamValue(AccessPolicyDeleteSessionBGThread.TEAMS_WEBHOOK_PARAM_NAME);

                    let message: TeamsWebhookContentVO = new TeamsWebhookContentVO();

                    message.title = "AccessPolicyDeleteSessionBGThread - " + ConfigurationService.getInstance().node_configuration.APP_TITLE + " - " + ConfigurationService.getInstance().node_configuration.BASE_URL;
                    message.summary = "Suppression de sessions suite invalidation";
                    message.sections.push(new TeamsWebhookContentSectionVO().set_text('<blockquote><div>SID</div><ul>' + to_invalidate.map((m) => "<li>" + m.id + "</li>").join("") + '</ul></blockquote>'));

                    if (api_reqs && (api_reqs.length > 0)) {
                        message.sections.push(new TeamsWebhookContentSectionVO().set_text('<blockquote><div>Requêtes</div><ul>' + api_reqs.map((m) => "<li>" + m + "</li>").join("") + '</ul></blockquote>'));
                    }

                    await ModuleTeamsAPIServer.getInstance().send_to_teams_webhook(
                        TEAMS_WEBHOOK_PARAM_NAME,
                        message
                    );
                }

                // On supprime la session
                await ForkedTasksController.getInstance().exec_self_on_main_process(ModuleAccessPolicyServer.TASK_NAME_delete_sessions_from_other_thread, to_invalidate);
            }

            return ModuleBGThreadServer.TIMEOUT_COEF_RUN;
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
        }

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
}