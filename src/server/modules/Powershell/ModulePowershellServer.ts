import * as Shell from 'node-powershell';
import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import ModulePowershell from '../../../shared/modules/Powershell/ModulePowershell';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import StackContext from '../../StackContext';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ModuleServerBase from '../ModuleServerBase';
import ModulesManagerServer from '../ModulesManagerServer';
import PushDataServerController from '../PushData/PushDataServerController';

export default class ModulePowershellServer extends ModuleServerBase {

    public static getInstance() {
        if (!ModulePowershellServer.instance) {
            ModulePowershellServer.instance = new ModulePowershellServer();
        }
        return ModulePowershellServer.instance;
    }

    private static instance: ModulePowershellServer = null;

    private ps = null;

    private constructor() {
        super(ModulePowershell.getInstance().name);
    }

    public async registerAccessPolicies(): Promise<void> {
        let group: AccessPolicyGroupVO = new AccessPolicyGroupVO();
        group.translatable_name = ModulePowershell.POLICY_GROUP;
        group = await ModuleAccessPolicyServer.getInstance().registerPolicyGroup(group, new DefaultTranslation({
            'fr-fr': 'Powershell'
        }));

        let bo_access: AccessPolicyVO = new AccessPolicyVO();
        bo_access.group_id = group.id;
        bo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        bo_access.translatable_name = ModulePowershell.POLICY_BO_ACCESS;
        bo_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(bo_access, new DefaultTranslation({
            'fr-fr': 'Administration Powershell'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let admin_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        admin_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        admin_access_dependency.src_pol_id = bo_access.id;
        admin_access_dependency.depends_on_pol_id = AccessPolicyServerController.getInstance().get_registered_policy(ModuleAccessPolicy.POLICY_BO_ACCESS).id;
        admin_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);

        let POLICY_FO_ACCESS: AccessPolicyVO = new AccessPolicyVO();
        POLICY_FO_ACCESS.group_id = group.id;
        POLICY_FO_ACCESS.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        POLICY_FO_ACCESS.translatable_name = ModulePowershell.POLICY_FO_ACCESS;
        POLICY_FO_ACCESS = await ModuleAccessPolicyServer.getInstance().registerPolicy(POLICY_FO_ACCESS, new DefaultTranslation({
            'fr-fr': 'Accès front - Powershell'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
    }

    public async configure() {
        this.ps = new Shell({
            executionPolicy: 'Bypass',
            noProfile: true
        });

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Identifiant AD'
        }, 'ActiveDirectory.prompt.login.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Mot de passe AD'
        }, 'ActiveDirectory.prompt.pwd.___LABEL___'));
    }

    public registerServerApiHandlers() { }

    public async ask_user_credentials_and_change_cred_value() {
        let login: string = null;
        let pwd: string = null;

        try {

            let uid: number = StackContext.getInstance().get('UID');
            let CLIENT_TAB_ID: string = StackContext.getInstance().get('CLIENT_TAB_ID');

            if ((!uid) || (!CLIENT_TAB_ID)) {
                //on doit venir d'un onglet précis
                ConsoleHandler.getInstance().error('ask_user_credentials_and_change_ps_user:on doit venir d\'un onglet précis');
                return null;
            }

            login = await PushDataServerController.getInstance().notifyPrompt(uid, CLIENT_TAB_ID, 'ActiveDirectory.prompt.login.___LABEL___');
            pwd = await PushDataServerController.getInstance().notifyPrompt(uid, CLIENT_TAB_ID, 'ActiveDirectory.prompt.pwd.___LABEL___');

            if ((!login) || (!pwd)) {
                ConsoleHandler.getInstance().error('ask_user_credentials_and_change_ps_user:login ou mot de passe manquant');
                return null;
            }

        } catch (error) {
            ConsoleHandler.getInstance().error('ask_user_credentials_and_change_ps_user:' + error);
        }

        await this.change_cred_value(login, pwd);
    }

    public async change_cred_value(login: string, pwd: string) {
        ConsoleHandler.getInstance().log(await this.execute_ps_command_and_get_output('$password = "' + pwd + '" | ConvertTo-SecureString -AsPlainText -Force'));
        ConsoleHandler.getInstance().log(await this.execute_ps_command_and_get_output('$cred = New-Object System.Management.Automation.PSCredential -ArgumentList "' + login + '",$password'));
    }

    public async execute_ps_command_and_get_output(command: string): Promise<string> {
        let self = this;

        return new Promise((resolve, reject) => {
            try {
                self.ps.addCommand(command);
                self.ps.invoke().then((output) => resolve(output)).catch((err) => reject(err));
            } catch (error) {
                reject(error);
            }
        });
    }
}