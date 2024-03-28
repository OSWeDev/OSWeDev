/* istanbul ignore file: WARNING No test on module main file, causes trouble, but NEEDs to externalize any function that can profite a test */

import AccessPolicyTools from '../../tools/AccessPolicyTools';
import APIControllerWrapper from '../API/APIControllerWrapper';
import GetAPIDefinition from '../API/vos/GetAPIDefinition';
import PostForGetAPIDefinition from '../API/vos/PostForGetAPIDefinition';
import TimeSegment from '../DataRender/vos/TimeSegment';
import Module from '../Module';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import VOsTypesManager from '../VOsTypesManager';
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

    public static getInstance(): ModuleClockifyAPI {
        if (!ModuleClockifyAPI.instance) {
            ModuleClockifyAPI.instance = new ModuleClockifyAPI();
        }
        return ModuleClockifyAPI.instance;
    }

    private static instance: ModuleClockifyAPI = null;

    public get_all_clockify_users: () => Promise<ClockifyUserVO[]> = APIControllerWrapper.sah(ModuleClockifyAPI.APINAME_get_all_clockify_users);
    public get_all_clockify_clients: () => Promise<ClockifyClientVO[]> = APIControllerWrapper.sah(ModuleClockifyAPI.APINAME_get_all_clockify_clients);
    public get_all_clockify_projects: () => Promise<ClockifyProjetVO[]> = APIControllerWrapper.sah(ModuleClockifyAPI.APINAME_get_all_clockify_projects);
    public get_all_clockify_tasks_by_project: () => Promise<ClockifyTacheVO[]> = APIControllerWrapper.sah(ModuleClockifyAPI.APINAME_get_all_clockify_tasks_by_project);
    public get_all_clockify_timentries_by_user: (time_param: TimeParamClockifyTimeEntry) => Promise<ClockifyTimeEntryVO[]> = APIControllerWrapper.sah(ModuleClockifyAPI.APINAME_get_all_clockify_timentries_by_user);

    private constructor() {

        super("clockifyapi", ModuleClockifyAPI.MODULE_NAME);
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
        this.fields = [];
        this.datatables = [];

        this.initializeClockifyUser();
        this.initializeClockifyClient();
        this.initializeClockifyProjet();
        this.initializeClockifyTache();
        this.initializeClockifyTimeEntry();
    }

    private initializeClockifyClient() {

        let datatable_fields = [
            new ModuleTableField('name', ModuleTableField.FIELD_TYPE_string, 'Nom', true),
            new ModuleTableField('clockify_id', ModuleTableField.FIELD_TYPE_string, 'ID Clockify', true),
            new ModuleTableField('email', ModuleTableField.FIELD_TYPE_string, 'Email', false),
            new ModuleTableField('archived', ModuleTableField.FIELD_TYPE_boolean, 'Archivé ?', true),
            new ModuleTableField('note', ModuleTableField.FIELD_TYPE_string, 'Note', false),
        ];

        let datatable: ModuleTable<any> = new ModuleTable(this, ClockifyClientVO.API_TYPE_ID, () => new ClockifyClientVO(), datatable_fields, null, "Client Clockify");

        this.datatables.push(datatable);
    }

    private initializeClockifyUser() {

        let datatable_fields = [
            new ModuleTableField('name', ModuleTableField.FIELD_TYPE_string, 'Nom', true),
            new ModuleTableField('clockify_id', ModuleTableField.FIELD_TYPE_string, 'ID Clockify', true),
            new ModuleTableField('email', ModuleTableField.FIELD_TYPE_string, 'Email', true),
            new ModuleTableField('status', ModuleTableField.FIELD_TYPE_string, 'Statut', false),
        ];

        let datatable: ModuleTable<any> = new ModuleTable(this, ClockifyUserVO.API_TYPE_ID, () => new ClockifyUserVO(), datatable_fields, null, "Utilisateur Clockify");

        this.datatables.push(datatable);
    }

    private initializeClockifyProjet() {
        let client_id = new ModuleTableField('client_id', ModuleTableField.FIELD_TYPE_foreign_key, 'ID Client Clockify');

        let datatable_fields = [
            new ModuleTableField('name', ModuleTableField.FIELD_TYPE_string, 'Nom', true),
            new ModuleTableField('clockify_id', ModuleTableField.FIELD_TYPE_string, 'ID Clockify', true),
            new ModuleTableField('archived', ModuleTableField.FIELD_TYPE_boolean, 'Archivé ?', true),
            new ModuleTableField('note', ModuleTableField.FIELD_TYPE_string, 'Note', false),
            new ModuleTableField('is_public', ModuleTableField.FIELD_TYPE_boolean, 'Publique ?', true),
            client_id
        ];

        let datatable: ModuleTable<any> = new ModuleTable(this, ClockifyProjetVO.API_TYPE_ID, () => new ClockifyProjetVO(), datatable_fields, null, "Projet Clockify");
        this.datatables.push(datatable);

        client_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[ClockifyClientVO.API_TYPE_ID]);
    }

    private initializeClockifyTache() {
        let projet_id = new ModuleTableField('projet_id', ModuleTableField.FIELD_TYPE_foreign_key, 'ID Projet Clockify');

        let datatable_fields = [
            new ModuleTableField('name', ModuleTableField.FIELD_TYPE_string, 'Nom', true),
            new ModuleTableField('clockify_id', ModuleTableField.FIELD_TYPE_string, 'ID Clockify', true),
            new ModuleTableField('status', ModuleTableField.FIELD_TYPE_string, 'Statut', false),
            projet_id
        ];

        let datatable: ModuleTable<any> = new ModuleTable(this, ClockifyTacheVO.API_TYPE_ID, () => new ClockifyTacheVO(), datatable_fields, null, "Tâche Clockify");
        this.datatables.push(datatable);

        projet_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[ClockifyProjetVO.API_TYPE_ID]);
    }

    private initializeClockifyTimeEntry() {
        let projet_id = new ModuleTableField('projet_id', ModuleTableField.FIELD_TYPE_foreign_key, 'ID Projet Clockify');
        let tache_id = new ModuleTableField('tache_id', ModuleTableField.FIELD_TYPE_foreign_key, 'ID Tache Clockify');
        let user_id = new ModuleTableField('user_id', ModuleTableField.FIELD_TYPE_foreign_key, 'ID User Clockify');

        let datatable_fields = [
            new ModuleTableField('description', ModuleTableField.FIELD_TYPE_string, 'Description', false),
            new ModuleTableField('clockify_id', ModuleTableField.FIELD_TYPE_string, 'ID Clockify', true),
            new ModuleTableField('start_time', ModuleTableField.FIELD_TYPE_tstz, 'Heure de début', true).set_segmentation_type(TimeSegment.TYPE_SECOND),
            new ModuleTableField('end_time', ModuleTableField.FIELD_TYPE_tstz, 'Heure de fin', false).set_segmentation_type(TimeSegment.TYPE_SECOND),
            projet_id,
            tache_id,
            user_id
        ];

        let datatable: ModuleTable<any> = new ModuleTable(this, ClockifyTimeEntryVO.API_TYPE_ID, () => new ClockifyTimeEntryVO(), datatable_fields, null, "Entrée de temps Clockify");
        this.datatables.push(datatable);

        projet_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[ClockifyProjetVO.API_TYPE_ID]);
        tache_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[ClockifyTacheVO.API_TYPE_ID]);
        user_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[ClockifyUserVO.API_TYPE_ID]);
    }
}
