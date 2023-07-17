import { readFileSync } from 'fs';
import { IAuthOptions } from 'sp-request';
import { FileOptions, ICoreOptions, spsave } from "spsave";
import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import FileVO from '../../../shared/modules/File/vos/FileVO';
import ModuleParams from '../../../shared/modules/Params/ModuleParams';
import ModuleSharepoint from '../../../shared/modules/Sharepoint/ModuleSharepoint';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import FileHandler from '../../../shared/tools/FileHandler';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ModuleDataExportServer from '../DataExport/ModuleDataExportServer';
import ModuleServerBase from '../ModuleServerBase';
import ModulesManagerServer from '../ModulesManagerServer';

export default class ModuleSharepointServer extends ModuleServerBase {

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!ModuleSharepointServer.instance) {
            ModuleSharepointServer.instance = new ModuleSharepointServer();
        }
        return ModuleSharepointServer.instance;
    }

    private static instance: ModuleSharepointServer = null;

    private ps = null;

    private constructor() {
        super(ModuleSharepoint.getInstance().name);
    }

    // istanbul ignore next: cannot test registerAccessPolicies
    public async registerAccessPolicies(): Promise<void> {
        let group: AccessPolicyGroupVO = new AccessPolicyGroupVO();
        group.translatable_name = ModuleSharepoint.POLICY_GROUP;
        group = await ModuleAccessPolicyServer.getInstance().registerPolicyGroup(group, new DefaultTranslation({
            'fr-fr': 'Sharepoint'
        }));

        let bo_access: AccessPolicyVO = new AccessPolicyVO();
        bo_access.group_id = group.id;
        bo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        bo_access.translatable_name = ModuleSharepoint.POLICY_BO_ACCESS;
        bo_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(bo_access, new DefaultTranslation({
            'fr-fr': 'Administration Sharepoint'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let admin_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        admin_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        admin_access_dependency.src_pol_id = bo_access.id;
        admin_access_dependency.depends_on_pol_id = AccessPolicyServerController.get_registered_policy(ModuleAccessPolicy.POLICY_BO_ACCESS).id;
        admin_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);

        let POLICY_FO_ACCESS: AccessPolicyVO = new AccessPolicyVO();
        POLICY_FO_ACCESS.group_id = group.id;
        POLICY_FO_ACCESS.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        POLICY_FO_ACCESS.translatable_name = ModuleSharepoint.POLICY_FO_ACCESS;
        POLICY_FO_ACCESS = await ModuleAccessPolicyServer.getInstance().registerPolicy(POLICY_FO_ACCESS, new DefaultTranslation({
            'fr-fr': 'Accès front - Sharepoint'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
    }

    // istanbul ignore next: cannot test configure
    public async configure() {
    }

    // istanbul ignore next: cannot test registerServerApiHandlers
    public registerServerApiHandlers() { }

    /**
     * Envoyer des fichiers vers SharePoint
     * @param coreOptions
     * @param creds You can pass a null as credentials, in that case spsave will ask you for credentials and will store your credentials in a user folder in an encrypted manner (everything is handled by node-sp-auth actually).
     * @param fileOptions
     */
    public async save_to_sharepoint(coreOptions: ICoreOptions, fileOptions: FileOptions) {
        return new Promise(async (resolve, reject) => {

            let clientId = await ModuleParams.getInstance().getParamValueAsString(ModuleSharepoint.PARAM_NAME_clientId);
            let clientSecret = await ModuleParams.getInstance().getParamValueAsString(ModuleSharepoint.PARAM_NAME_clientSecret);
            // realm == tenant
            let realm = await ModuleParams.getInstance().getParamValueAsString(ModuleSharepoint.PARAM_NAME_realm);

            if ((!clientId) || (!clientSecret)) {
                /**
                 * HTTPError: Response code 403 (Forbidden)
                 * https://www.c-sharpcorner.com/article/how-to-perform-sharepoint-app-only-authentication-in-power-automate/
                 * https://github.com/s-KaiNet/node-sp-auth/wiki/SharePoint%20Online%20addin%20only%20authentication
                 *
                 * 1 . https://XXX.sharepoint.com/_layouts/15/appregnew.aspx
                 * 2 . https://XXX.sharepoint.com/_layouts/15/appinv.aspx
                 * <AppPermissionRequests AllowAppOnlyPolicy="true">
                 * <AppPermissionRequest Scope="http://sharepoint/content/sitecollection" Right="FullControl" />
                 * </AppPermissionRequests>
                 */
                ConsoleHandler.error('save_to_sharepoint missing credential parameters "' + ModuleSharepoint.PARAM_NAME_clientId + '", "' + ModuleSharepoint.PARAM_NAME_clientSecret + '" and "' + ModuleSharepoint.PARAM_NAME_realm + '". Use https://XXX.sharepoint.com/_layouts/15/appregnew.aspx to register new. Then access https://XXX.sharepoint.com/_layouts/15/appinv.aspx and add the XML that you will find on this code page.');
                return null;
            }

            let creds: IAuthOptions = {
                clientId,
                clientSecret
            };

            if (realm) {
                creds['realm'] = realm;
            }

            spsave(coreOptions, creds, fileOptions)
                .then(resolve)
                .catch((error) => {
                    ConsoleHandler.error("FAILED save_to_sharepoint : " + error);
                    reject(error);
                });
        });
    }

    public async export_moduletable_to_sharepoint(
        coreOptions: ICoreOptions,
        sharepoint_folder: string,
        api_type_id: string,
        lang_id: number = null,
        filename: string = null,
        file_access_policy_name: string = null) {

        let file: FileVO = await ModuleDataExportServer.getInstance().exportModuletableDataToXLSXFile(
            api_type_id,
            lang_id,
            filename,
            file_access_policy_name
        );

        if (!file) {
            ConsoleHandler.error('Export échoué:' + api_type_id);
            return;
        }

        await this.save_to_sharepoint(coreOptions, {
            fileName: FileHandler.getInstance().get_file_name(file),
            fileContent: readFileSync(file.path),
            folder: sharepoint_folder + '/' + api_type_id,
        });
    }
}