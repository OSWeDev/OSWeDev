import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import ModuleTableController from '../../../shared/modules/DAO/ModuleTableController';
import NumSegment from '../../../shared/modules/DataRender/vos/NumSegment';
import ModuleLogger from '../../../shared/modules/Logger/ModuleLogger';
import LogTypeVO from '../../../shared/modules/Logger/vos/LogTypeVO';
import LogVO from '../../../shared/modules/Logger/vos/LogVO';
import DefaultTranslationVO from '../../../shared/modules/Translation/vos/DefaultTranslationVO';
import RangeHandler from '../../../shared/tools/RangeHandler';
import StackContext from '../../StackContext';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import DAOPostCreateTriggerHook from '../DAO/triggers/DAOPostCreateTriggerHook';
import DAOPreCreateTriggerHook from '../DAO/triggers/DAOPreCreateTriggerHook';
import ModuleServerBase from '../ModuleServerBase';
import ModulesManagerServer from '../ModulesManagerServer';
import ModuleTableDBService from '../ModuleTableDBService';
import ModuleTriggerServer from '../Trigger/ModuleTriggerServer';
import LoggerCleanerWorkersHandler from './LoggerCleanerWorkersHandler';

export default class ModuleLoggerServer extends ModuleServerBase {

    private static instance: ModuleLoggerServer = null;

    protected constructor() {
        super(ModuleLogger.getInstance().name);
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): ModuleLoggerServer {
        if (!ModuleLoggerServer.instance) {
            ModuleLoggerServer.instance = new ModuleLoggerServer();
        }
        return ModuleLoggerServer.instance;
    }

    /**
     * On définit les droits d'accès du module
     */
    // istanbul ignore next: cannot test registerAccessPolicies
    public async registerAccessPolicies(): Promise<void> {
        let group: AccessPolicyGroupVO = new AccessPolicyGroupVO();
        group.translatable_name = ModuleLogger.POLICY_GROUP;
        group = await ModuleAccessPolicyServer.getInstance().registerPolicyGroup(group, DefaultTranslationVO.create_new({
            'fr-fr': 'Loggers'
        }));

        let bo_access: AccessPolicyVO = new AccessPolicyVO();
        bo_access.group_id = group.id;
        bo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        bo_access.translatable_name = ModuleLogger.POLICY_BO_ACCESS;
        bo_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(bo_access, DefaultTranslationVO.create_new({
            'fr-fr': 'Administration des Loggers'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let admin_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        admin_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        admin_access_dependency.src_pol_id = bo_access.id;
        admin_access_dependency.depends_on_pol_id = AccessPolicyServerController.get_registered_policy(ModuleAccessPolicy.POLICY_BO_ACCESS).id;
        admin_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);
    }

    public async configure() {
        const preCreateTrigger: DAOPreCreateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPreCreateTriggerHook.DAO_PRE_CREATE_TRIGGER);
        preCreateTrigger.registerHandler(LogVO.API_TYPE_ID, this, this.onPreCreateLogVO);
        const postCreateTrigger: DAOPostCreateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPostCreateTriggerHook.DAO_POST_CREATE_TRIGGER);
        postCreateTrigger.registerHandler(LogTypeVO.API_TYPE_ID, this, this.onCreateLogTypeVO);
    }

    public registerServerApiHandlers() {
        APIControllerWrapper.registerServerApiHandler(ModuleLogger.APINAME_addLogsClient, this.addLogsClient.bind(this));
    }

    // istanbul ignore next: cannot test registerCrons
    public registerCrons(): void {
        LoggerCleanerWorkersHandler.getInstance();
    }

    private async addLogsClient(logs: LogVO[]) {
        if (!logs?.length) {
            return;
        }

        const user_id = StackContext.get('UID');
        const client_tab_id = StackContext.get('CLIENT_TAB_ID');

        for (const i in logs) {
            logs[i].client_tab_id = client_tab_id;
            logs[i].user_id = user_id;
        }

        await ModuleDAOServer.getInstance().insertOrUpdateVOs_as_server(logs, true);
    }

    private async onCreateLogTypeVO(vo: LogTypeVO): Promise<void> {
        if ((!vo) || (!vo.id)) {
            return;
        }

        await ModuleTableDBService.getInstance(null).create_or_update_datatable(
            ModuleTableController.module_tables_by_vo_type[LogVO.API_TYPE_ID],
            [RangeHandler.create_single_elt_NumRange(vo.id, NumSegment.TYPE_INT)],
            []
        );
    }

    private async onPreCreateLogVO(vo: LogVO): Promise<boolean> {
        if (vo?.msg?.length > 1000) {
            vo.msg = vo.msg?.substr(0, 1000) + '[...]';
        }

        return true;
    }
}