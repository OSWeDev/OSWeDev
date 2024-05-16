/* istanbul ignore file: WARNING No test on module main file, causes trouble, but NEEDs to externalize any function that can profite a test */

import AccessPolicyTools from '../../tools/AccessPolicyTools';
import { field_names } from '../../tools/ObjectHandler';
import APIControllerWrapper from '../API/APIControllerWrapper';
import GetAPIDefinition from '../API/vos/GetAPIDefinition';
import PostForGetAPIDefinition from '../API/vos/PostForGetAPIDefinition';
import ModuleTableController from '../DAO/ModuleTableController';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../DAO/vos/ModuleTableFieldVO';
import ModuleTableVO from '../DAO/vos/ModuleTableVO';
import TimeSegment from '../DataRender/vos/TimeSegment';
import Module from '../Module';
import { ClockifyTimeEntryParamStatic } from './params/ClockifyTimeEntryParam';
import TimeParamClockifyTimeEntry from './params/TimeParamClockifyTimeEntry';
import ClockifyClientVO from './vos/ClockifyClientVO';
import ClockifyProjetVO from './vos/ClockifyProjetVO';
import ClockifyTacheVO from './vos/ClockifyTacheVO';
import ClockifyTimeEntryVO from './vos/ClockifyTimeEntryVO';
import ClockifyUserVO from './vos/ClockifyUserVO';

export default class ModuleClockifyAPI extends Module {

    public static ClockifyAPI_API_KEY_API_PARAM_NAME: string = 'ClockifyAPI.ClockifyAPI_API_KEY_API';
    public static ClockifyAPI_WORKSPACE_ID_API_PARAM_NAME: string = 'ClockifyAPI.ClockifyAPI_WORKSPACE_ID_API';

    public static ClockifyAPI_BaseURL: string = 'api.clockify.me';
    public static APINAME_get_all_clockify_users: string = "get_all_clockify_users";
    public static APINAME_get_all_clockify_clients: string = "get_all_clockify_clients";
    public static APINAME_get_all_clockify_projects: string = "get_all_clockify_projects";
    public static APINAME_get_all_clockify_tasks_by_project: string = "get_all_clockify_tasks_by_project";
    public static APINAME_get_all_clockify_timentries_by_user: string = "get_all_clockify_timentries_by_user";

    public static MODULE_NAME: string = 'ClockifyAPI';

    public static POLICY_GROUP: string = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleClockifyAPI.MODULE_NAME;
    public static POLICY_BO_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleClockifyAPI.MODULE_NAME + '.BO_ACCESS';
    public static POLICY_FO_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleClockifyAPI.MODULE_NAME + '.FO_ACCESS';

    private static instance: ModuleClockifyAPI = null;

    public get_all_clockify_users: () => Promise<ClockifyUserVO[]> = APIControllerWrapper.sah(ModuleClockifyAPI.APINAME_get_all_clockify_users);
    public get_all_clockify_clients: () => Promise<ClockifyClientVO[]> = APIControllerWrapper.sah(ModuleClockifyAPI.APINAME_get_all_clockify_clients);
    public get_all_clockify_projects: () => Promise<ClockifyProjetVO[]> = APIControllerWrapper.sah(ModuleClockifyAPI.APINAME_get_all_clockify_projects);
    public get_all_clockify_tasks_by_project: () => Promise<ClockifyTacheVO[]> = APIControllerWrapper.sah(ModuleClockifyAPI.APINAME_get_all_clockify_tasks_by_project);
    public get_all_clockify_timentries_by_user: (time_param: TimeParamClockifyTimeEntry) => Promise<ClockifyTimeEntryVO[]> = APIControllerWrapper.sah(ModuleClockifyAPI.APINAME_get_all_clockify_timentries_by_user);

    private constructor() {

        super("clockifyapi", ModuleClockifyAPI.MODULE_NAME);
    }

    public static getInstance(): ModuleClockifyAPI {
        if (!ModuleClockifyAPI.instance) {
            ModuleClockifyAPI.instance = new ModuleClockifyAPI();
        }
        return ModuleClockifyAPI.instance;
    }

    public registerApis() {
        APIControllerWrapper.registerApi(new GetAPIDefinition<null, ClockifyUserVO[]>(
            null,
            ModuleClockifyAPI.APINAME_get_all_clockify_users,
            []
        ));

        APIControllerWrapper.registerApi(new GetAPIDefinition<null, ClockifyClientVO[]>(
            null,
            ModuleClockifyAPI.APINAME_get_all_clockify_clients,
            []
        ));

        APIControllerWrapper.registerApi(new GetAPIDefinition<null, ClockifyProjetVO[]>(
            null,
            ModuleClockifyAPI.APINAME_get_all_clockify_projects,
            []
        ));

        APIControllerWrapper.registerApi(new GetAPIDefinition<null, ClockifyTacheVO[]>(
            null,
            ModuleClockifyAPI.APINAME_get_all_clockify_tasks_by_project,
            []
        ));

        APIControllerWrapper.registerApi(new PostForGetAPIDefinition<TimeParamClockifyTimeEntry, ClockifyTimeEntryVO[]>(
            null,
            ModuleClockifyAPI.APINAME_get_all_clockify_timentries_by_user,
            [],
            ClockifyTimeEntryParamStatic
        ));
    }

    public initialize() {
        this.initializeClockifyUser();
        this.initializeClockifyClient();
        this.initializeClockifyProjet();
        this.initializeClockifyTache();
        this.initializeClockifyTimeEntry();
    }

    private initializeClockifyClient() {

        const datatable_fields = [
            ModuleTableFieldController.create_new(ClockifyClientVO.API_TYPE_ID, field_names<ClockifyClientVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom', true),
            ModuleTableFieldController.create_new(ClockifyClientVO.API_TYPE_ID, field_names<ClockifyClientVO>().clockify_id, ModuleTableFieldVO.FIELD_TYPE_string, 'ID Clockify', true),
            ModuleTableFieldController.create_new(ClockifyClientVO.API_TYPE_ID, field_names<ClockifyClientVO>().email, ModuleTableFieldVO.FIELD_TYPE_string, 'Email', false),
            ModuleTableFieldController.create_new(ClockifyClientVO.API_TYPE_ID, field_names<ClockifyClientVO>().archived, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Archivé ?', true),
            ModuleTableFieldController.create_new(ClockifyClientVO.API_TYPE_ID, field_names<ClockifyClientVO>().note, ModuleTableFieldVO.FIELD_TYPE_string, 'Note', false),
        ];

        const datatable: ModuleTableVO = ModuleTableController.create_new(this.name, ClockifyClientVO, null, "Client Clockify");
    }

    private initializeClockifyUser() {

        const datatable_fields = [
            ModuleTableFieldController.create_new(ClockifyUserVO.API_TYPE_ID, field_names<ClockifyUserVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom', true),
            ModuleTableFieldController.create_new(ClockifyUserVO.API_TYPE_ID, field_names<ClockifyUserVO>().clockify_id, ModuleTableFieldVO.FIELD_TYPE_string, 'ID Clockify', true),
            ModuleTableFieldController.create_new(ClockifyUserVO.API_TYPE_ID, field_names<ClockifyUserVO>().email, ModuleTableFieldVO.FIELD_TYPE_string, 'Email', true),
            ModuleTableFieldController.create_new(ClockifyUserVO.API_TYPE_ID, field_names<ClockifyUserVO>().status, ModuleTableFieldVO.FIELD_TYPE_string, 'Statut', false),
        ];

        const datatable: ModuleTableVO = ModuleTableController.create_new(this.name, ClockifyUserVO, null, "Utilisateur Clockify");
    }

    private initializeClockifyProjet() {
        const client_id = ModuleTableFieldController.create_new(ClockifyProjetVO.API_TYPE_ID, field_names<ClockifyProjetVO>().client_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'ID Client Clockify');

        const datatable_fields = [
            ModuleTableFieldController.create_new(ClockifyProjetVO.API_TYPE_ID, field_names<ClockifyProjetVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom', true),
            ModuleTableFieldController.create_new(ClockifyProjetVO.API_TYPE_ID, field_names<ClockifyProjetVO>().clockify_id, ModuleTableFieldVO.FIELD_TYPE_string, 'ID Clockify', true),
            ModuleTableFieldController.create_new(ClockifyProjetVO.API_TYPE_ID, field_names<ClockifyProjetVO>().archived, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Archivé ?', true),
            ModuleTableFieldController.create_new(ClockifyProjetVO.API_TYPE_ID, field_names<ClockifyProjetVO>().note, ModuleTableFieldVO.FIELD_TYPE_string, 'Note', false),
            ModuleTableFieldController.create_new(ClockifyProjetVO.API_TYPE_ID, field_names<ClockifyProjetVO>().is_public, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Publique ?', true),
            client_id
        ];

        const datatable: ModuleTableVO = ModuleTableController.create_new(this.name, ClockifyProjetVO, null, "Projet Clockify");

        client_id.set_many_to_one_target_moduletable_name(ClockifyClientVO.API_TYPE_ID);
    }

    private initializeClockifyTache() {
        const projet_id = ModuleTableFieldController.create_new(ClockifyTacheVO.API_TYPE_ID, field_names<ClockifyTacheVO>().projet_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'ID Projet Clockify');

        const datatable_fields = [
            ModuleTableFieldController.create_new(ClockifyTacheVO.API_TYPE_ID, field_names<ClockifyTacheVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom', true),
            ModuleTableFieldController.create_new(ClockifyTacheVO.API_TYPE_ID, field_names<ClockifyTacheVO>().clockify_id, ModuleTableFieldVO.FIELD_TYPE_string, 'ID Clockify', true),
            ModuleTableFieldController.create_new(ClockifyTacheVO.API_TYPE_ID, field_names<ClockifyTacheVO>().status, ModuleTableFieldVO.FIELD_TYPE_string, 'Statut', false),
            projet_id
        ];

        const datatable: ModuleTableVO = ModuleTableController.create_new(this.name, ClockifyTacheVO, null, "Tâche Clockify");

        projet_id.set_many_to_one_target_moduletable_name(ClockifyProjetVO.API_TYPE_ID);
    }

    private initializeClockifyTimeEntry() {
        const projet_id = ModuleTableFieldController.create_new(ClockifyTimeEntryVO.API_TYPE_ID, field_names<ClockifyTimeEntryVO>().projet_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'ID Projet Clockify');
        const tache_id = ModuleTableFieldController.create_new(ClockifyTimeEntryVO.API_TYPE_ID, field_names<ClockifyTimeEntryVO>().tache_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'ID Tache Clockify');
        const user_id = ModuleTableFieldController.create_new(ClockifyTimeEntryVO.API_TYPE_ID, field_names<ClockifyTimeEntryVO>().user_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'ID User Clockify');

        const datatable_fields = [
            ModuleTableFieldController.create_new(ClockifyTimeEntryVO.API_TYPE_ID, field_names<ClockifyTimeEntryVO>().description, ModuleTableFieldVO.FIELD_TYPE_string, 'Description', false),
            ModuleTableFieldController.create_new(ClockifyTimeEntryVO.API_TYPE_ID, field_names<ClockifyTimeEntryVO>().clockify_id, ModuleTableFieldVO.FIELD_TYPE_string, 'ID Clockify', true),
            ModuleTableFieldController.create_new(ClockifyTimeEntryVO.API_TYPE_ID, field_names<ClockifyTimeEntryVO>().start_time, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Heure de début', true).set_segmentation_type(TimeSegment.TYPE_SECOND),
            ModuleTableFieldController.create_new(ClockifyTimeEntryVO.API_TYPE_ID, field_names<ClockifyTimeEntryVO>().end_time, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Heure de fin', false).set_segmentation_type(TimeSegment.TYPE_SECOND),
            projet_id,
            tache_id,
            user_id
        ];

        const datatable: ModuleTableVO = ModuleTableController.create_new(this.name, ClockifyTimeEntryVO, null, "Entrée de temps Clockify");

        projet_id.set_many_to_one_target_moduletable_name(ClockifyProjetVO.API_TYPE_ID);
        tache_id.set_many_to_one_target_moduletable_name(ClockifyTacheVO.API_TYPE_ID);
        user_id.set_many_to_one_target_moduletable_name(ClockifyUserVO.API_TYPE_ID);
    }
}
