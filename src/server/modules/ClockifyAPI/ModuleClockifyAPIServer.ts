import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import ModuleClockifyAPI from '../../../shared/modules/ClockifyAPI/ModuleClockifyAPI';
import ClockifyClientVO from '../../../shared/modules/ClockifyAPI/vos/ClockifyClientVO';
import ClockifyProjetVO from '../../../shared/modules/ClockifyAPI/vos/ClockifyProjetVO';
import ClockifyTacheVO from '../../../shared/modules/ClockifyAPI/vos/ClockifyTacheVO';
import ClockifyTimeEntryVO from '../../../shared/modules/ClockifyAPI/vos/ClockifyTimeEntryVO';
import ClockifyUserVO from '../../../shared/modules/ClockifyAPI/vos/ClockifyUserVO';
import TimeParamClockifyTimeEntry from '../../../shared/modules/ClockifyAPI/vos/TimeParamClockifyTimeEntry';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ModuleParams from '../../../shared/modules/Params/ModuleParams';
import ModuleRequest from '../../../shared/modules/Request/ModuleRequest';
import DefaultTranslationVO from '../../../shared/modules/Translation/vos/DefaultTranslationVO';
import { field_names } from '../../../shared/tools/ObjectHandler';
import ThreadHandler from '../../../shared/tools/ThreadHandler';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ModuleServerBase from '../ModuleServerBase';
import ModulesManagerServer from '../ModulesManagerServer';

export default class ModuleClockifyAPIServer extends ModuleServerBase {

    private static instance: ModuleClockifyAPIServer = null;

    // istanbul ignore next: cannot test module constructor
    private constructor() {
        super(ModuleClockifyAPI.getInstance().name);
    }

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!ModuleClockifyAPIServer.instance) {
            ModuleClockifyAPIServer.instance = new ModuleClockifyAPIServer();
        }
        return ModuleClockifyAPIServer.instance;
    }

    // istanbul ignore next: cannot test registerAccessPolicies
    public async registerAccessPolicies(): Promise<void> {
        let group: AccessPolicyGroupVO = new AccessPolicyGroupVO();
        group.translatable_name = ModuleClockifyAPI.POLICY_GROUP;
        group = await ModuleAccessPolicyServer.getInstance().registerPolicyGroup(group, DefaultTranslationVO.create_new({
            'fr-fr': 'API ClockifyAPI'
        }));

        let bo_access: AccessPolicyVO = new AccessPolicyVO();
        bo_access.group_id = group.id;
        bo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        bo_access.translatable_name = ModuleClockifyAPI.POLICY_BO_ACCESS;
        bo_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(bo_access, DefaultTranslationVO.create_new({
            'fr-fr': 'Administration API ClockifyAPI'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let admin_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        admin_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        admin_access_dependency.src_pol_id = bo_access.id;
        admin_access_dependency.depends_on_pol_id = AccessPolicyServerController.get_registered_policy(ModuleAccessPolicy.POLICY_BO_ACCESS).id;
        admin_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);

        let POLICY_FO_ACCESS: AccessPolicyVO = new AccessPolicyVO();
        POLICY_FO_ACCESS.group_id = group.id;
        POLICY_FO_ACCESS.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        POLICY_FO_ACCESS.translatable_name = ModuleClockifyAPI.POLICY_FO_ACCESS;
        POLICY_FO_ACCESS = await ModuleAccessPolicyServer.getInstance().registerPolicy(POLICY_FO_ACCESS, DefaultTranslationVO.create_new({
            'fr-fr': 'Accès front - API ClockifyAPI'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
    }

    // istanbul ignore next: cannot test configure
    public async configure() {
    }

    // istanbul ignore next: cannot test registerServerApiHandlers
    public registerServerApiHandlers() {
        APIControllerWrapper.registerServerApiHandler(ModuleClockifyAPI.APINAME_get_all_clockify_users, this.get_all_clockify_users.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleClockifyAPI.APINAME_get_all_clockify_clients, this.get_all_clockify_clients.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleClockifyAPI.APINAME_get_all_clockify_projects, this.get_all_clockify_projects.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleClockifyAPI.APINAME_get_all_clockify_tasks_by_project, this.get_all_clockify_tasks_by_project.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleClockifyAPI.APINAME_get_all_clockify_timentries_by_user, this.get_all_clockify_timentries_by_user.bind(this));
    }

    // Getter des utilisateurs clockify d'un workspace donné
    public async get_all_clockify_users(): Promise<ClockifyUserVO[]> {
        try {
            const workspace_id: string = await ModuleParams.getInstance().getParamValueAsString(ModuleClockifyAPI.ClockifyAPI_WORKSPACE_ID_API_PARAM_NAME);

            const clockify_users: any[] = await this.get_all_pages('api/v1/workspaces/' + workspace_id + '/users');
            const users: ClockifyUserVO[] = clockify_users.map((clockify_user) => {
                return ClockifyUserVO.createNew(
                    clockify_user.id,
                    clockify_user.name,
                    clockify_user.email,
                    clockify_user.status,
                );
            });
            return users;
        } catch (error) {
            console.error(error);
        }
    }

    // Getter des clients clockify d'un workspace donné
    public async get_all_clockify_clients(): Promise<ClockifyClientVO[]> {
        try {
            const workspace_id: string = await ModuleParams.getInstance().getParamValueAsString(ModuleClockifyAPI.ClockifyAPI_WORKSPACE_ID_API_PARAM_NAME);

            const clockify_clients: any[] = await this.get_all_pages('api/v1/workspaces/' + workspace_id + '/clients');
            const clients: ClockifyClientVO[] = clockify_clients.map((clockify_client) => {
                return ClockifyClientVO.createNew(
                    clockify_client.id,
                    clockify_client.name,
                    clockify_client.email,
                    clockify_client.archived,
                    clockify_client.note,
                );
            });
            return clients;
        } catch (error) {
            console.error(error);
        }
    }

    // Getter des projets clockify d'un workspace donné
    public async get_all_clockify_projects(): Promise<ClockifyProjetVO[]> {
        try {
            const workspace_id: string = await ModuleParams.getInstance().getParamValueAsString(ModuleClockifyAPI.ClockifyAPI_WORKSPACE_ID_API_PARAM_NAME);

            const clockify_projects: any[] = await this.get_all_pages('api/v1/workspaces/' + workspace_id + '/projects');
            const projects: ClockifyProjetVO[] = [];

            for (const i in clockify_projects) {
                const clockify_project = clockify_projects[i];
                let clockify_client: ClockifyClientVO = null;

                // Si le projet est relié à un client, on essaye de le récupérer pour l'y connecter
                if (clockify_project.clientId) {
                    clockify_client = await query(ClockifyClientVO.API_TYPE_ID).filter_by_text_eq(field_names<ClockifyClientVO>().clockify_id, clockify_project.clientId).select_vo();
                }

                const new_projet = ClockifyProjetVO.createNew(
                    clockify_project.id,
                    clockify_client ? clockify_client.id : null,
                    clockify_project.name,
                    clockify_project.archived,
                    clockify_project.note,
                    clockify_project.public,
                );
                projects.push(new_projet);
            }
            return projects;
        } catch (error) {
            console.error(error);
        }
    }

    // Getter des tâches clockify d'un workspace donné
    public async get_all_clockify_tasks_by_project(): Promise<ClockifyTacheVO[]> {
        try {
            const workspace_id: string = await ModuleParams.getInstance().getParamValueAsString(ModuleClockifyAPI.ClockifyAPI_WORKSPACE_ID_API_PARAM_NAME);

            // On récupère tous les projets clockify que l'on a en base
            const projets: ClockifyProjetVO[] = await query(ClockifyProjetVO.API_TYPE_ID).select_vos();
            const taches: ClockifyTacheVO[] = [];

            for (const i in projets) {
                const projet: ClockifyProjetVO = projets[i];
                // Pour chaque projet, on récupère toutes les tâches clockify associées (il n'y a pas d'api nous permettant de récupérer les tâches en masse autrement pour le moment (07/12/2023))
                const clockify_tasks: any[] = await this.get_all_pages('api/v1/workspaces/' + workspace_id + '/projects/' + projet.clockify_id + '/tasks');

                for (const j in clockify_tasks) {
                    const clockify_task = clockify_tasks[j];

                    const new_task = ClockifyTacheVO.createNew(
                        clockify_task.id,
                        projet.id,
                        clockify_task.name,
                        clockify_task.status
                    );
                    taches.push(new_task);
                }

                // On attend 1 seconde entre chaque requête pour ne pas surcharger l'api clockify qui nous bloque sinon
                await ThreadHandler.sleep(1000, "get_all_clockify_tasks_by_project");
            }
            return taches;
        } catch (error) {
            console.error(error);
        }
    }

    // Getter des entrées de temps clockify d'un workspace donné
    public async get_all_clockify_timentries_by_user(time_param: TimeParamClockifyTimeEntry): Promise<ClockifyTimeEntryVO[]> {
        try {
            const workspace_id: string = await ModuleParams.getInstance().getParamValueAsString(ModuleClockifyAPI.ClockifyAPI_WORKSPACE_ID_API_PARAM_NAME);

            // On récupère tous les utilisateurs clockify que l'on a en base
            const users: ClockifyUserVO[] = await query(ClockifyUserVO.API_TYPE_ID).select_vos();
            const entrees: ClockifyTimeEntryVO[] = [];

            for (const i in users) {
                const user: ClockifyUserVO = users[i];
                // Pour chaque utilisateur, on récupère toutes les entrées de temps clockify associées (il n'y a pas d'api nous permettant de récupérer les entrées de temps en masse autrement pour le moment (07/12/2023))
                const clockify_timeentries: any[] = await this.get_all_time_entries('api/v1/workspaces/' + workspace_id + '/user/' + user.clockify_id + '/time-entries', time_param.start_time, time_param.end_time);

                for (const j in clockify_timeentries) {
                    const clockify_timeentry = clockify_timeentries[j];
                    let projet: ClockifyProjetVO = null;
                    let tache: ClockifyTacheVO = null;
                    if (clockify_timeentry.projectId) {
                        projet = await query(ClockifyProjetVO.API_TYPE_ID).filter_by_text_eq(field_names<ClockifyProjetVO>().clockify_id, clockify_timeentry.projectId).select_vo();
                    }
                    if (clockify_timeentry.taskId) {
                        tache = await query(ClockifyTacheVO.API_TYPE_ID).filter_by_text_eq(field_names<ClockifyTacheVO>().clockify_id, clockify_timeentry.taskId).select_vo();
                    }

                    const new_entry = ClockifyTimeEntryVO.createNew(
                        clockify_timeentry.id,
                        clockify_timeentry.description,
                        projet?.id,
                        tache?.id,
                        user.id,
                        Dates.parse(clockify_timeentry.timeInterval.start),
                        Dates.parse(clockify_timeentry.timeInterval.end)
                    );
                    entrees.push(new_entry);
                }

                // On attend 1 seconde entre chaque requête pour ne pas surcharger l'api clockify qui nous bloque sinon
                await ThreadHandler.sleep(1000, "get_all_clockify_timeentries_by_project");
            }
            return entrees;
        } catch (error) {
            console.error(error);
        }
    }

    private async get_all_pages(url: string) {

        let res: any[] = [];
        let has_more: boolean = true;
        let page: number = 1;
        const api_key: string = await ModuleParams.getInstance().getParamValueAsString(ModuleClockifyAPI.ClockifyAPI_API_KEY_API_PARAM_NAME);

        while (has_more) {
            const elts: any[] = await ModuleRequest.getInstance().sendRequestFromApp(
                ModuleRequest.METHOD_GET,
                ModuleClockifyAPI.ClockifyAPI_BaseURL,
                (url.startsWith('/') ? url : '/' + url) + ModuleRequest.getInstance().get_params_url({
                    page: page.toString(),
                }),
                null,
                {
                    'X-Api-Key': api_key,
                    'Content-Type': 'application/json',
                },
                true,
                null,
                false,
            );

            res = res.concat(elts);
            page++;

            has_more = elts?.length > 0;
        }

        return res;
    }

    private async get_all_time_entries(url: string, start_time: number, end_time: number) {

        let res: any[] = [];
        let has_more: boolean = true;
        let page: number = 1;
        const api_key: string = await ModuleParams.getInstance().getParamValueAsString(ModuleClockifyAPI.ClockifyAPI_API_KEY_API_PARAM_NAME);

        while (has_more) {
            const elts: any[] = await ModuleRequest.getInstance().sendRequestFromApp(
                ModuleRequest.METHOD_GET,
                ModuleClockifyAPI.ClockifyAPI_BaseURL,
                (url.startsWith('/') ? url : '/' + url) + ModuleRequest.getInstance().get_params_url({
                    page: page.toString(),
                    start: Dates.format(start_time, "YYYY-MM-DD", true) + "T00:00:00Z",
                    end: Dates.format(end_time, "YYYY-MM-DD", true) + "T23:59:59Z",
                }),
                null,
                {
                    'X-Api-Key': api_key,
                    'Content-Type': 'application/json',
                },
                true,
                null,
                false,
            );

            res = res.concat(elts);
            page++;

            has_more = elts?.length > 0;
        }

        return res;
    }
}