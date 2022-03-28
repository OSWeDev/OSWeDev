import { cloneDeep } from 'lodash';
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

    public static getInstance() {
        if (!AccessPolicyDeleteSessionBGThread.instance) {
            AccessPolicyDeleteSessionBGThread.instance = new AccessPolicyDeleteSessionBGThread();
        }
        return AccessPolicyDeleteSessionBGThread.instance;
    }

    private static instance: AccessPolicyDeleteSessionBGThread = null;

    public session_to_delete_by_sids: { [sid: string]: IServerUserSession } = {};

    public current_timeout: number = 2000;
    public MAX_timeout: number = 2000;
    public MIN_timeout: number = 100;

    private constructor() {
        ForkedTasksController.getInstance().register_task(AccessPolicyDeleteSessionBGThread.TASK_NAME_set_session_to_delete_by_sids, this.set_session_to_delete_by_sids.bind(this));
    }

    get name(): string {
        return "AccessPolicyDeleteSessionBGThread";
    }

    public async work(): Promise<number> {

        try {

            let invalidate_sessions: any[] = ObjectHandler.getInstance().arrayFromMap(this.session_to_delete_by_sids);

            if (!invalidate_sessions || !invalidate_sessions.length) {
                return ModuleBGThreadServer.TIMEOUT_COEF_SLEEP;
            }

            let session_to_delete_by_sids = cloneDeep(this.session_to_delete_by_sids);
            this.session_to_delete_by_sids = {};

            for (let i in session_to_delete_by_sids) {
                let session_to_delete = session_to_delete_by_sids[i];

                if (!!session_to_delete.id) {
                    continue;
                }

                if (!session_to_delete.sid) {
                    continue;
                }

                session_to_delete.id = session_to_delete.sid.replace(/^[^:]+:([^.]+)\..*/i, '$1');
            }

            let TEAMS_WEBHOOK_PARAM_NAME: string = await ModuleParams.getInstance().getParamValue(AccessPolicyDeleteSessionBGThread.TEAMS_WEBHOOK_PARAM_NAME);

            let message: TeamsWebhookContentVO = new TeamsWebhookContentVO();

            message.title = "AccessPolicyDeleteSessionBGThread - " + ConfigurationService.getInstance().getNodeConfiguration().APP_TITLE + " - " + ConfigurationService.getInstance().getNodeConfiguration().BASE_URL;
            message.summary = "Suppression de sessions suite invalidation";
            message.sections.push(new TeamsWebhookContentSectionVO().set_text('<blockquote>Suppression de sessions suite invalidation</blockquote>'));
            await ModuleTeamsAPIServer.getInstance().send_to_teams_webhook(
                TEAMS_WEBHOOK_PARAM_NAME,
                message
            );

            await ForkedTasksController.getInstance().exec_self_on_main_process(ModuleAccessPolicyServer.TASK_NAME_delete_sessions_from_other_thread, session_to_delete_by_sids);

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
}