import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import ModuleFacturationProAPI from '../../../shared/modules/FacturationProAPI/ModuleFacturationProAPI';
import ModuleRequest from '../../../shared/modules/Request/ModuleRequest';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ModuleServerBase from '../ModuleServerBase';
import ModulesManagerServer from '../ModulesManagerServer';
import * as fs from 'fs';
import ModuleFile from '../../../shared/modules/File/ModuleFile';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ConfigurationService from '../../env/ConfigurationService';

export default class ModuleFacturationProAPIServer extends ModuleServerBase {

    public static getInstance() {
        if (!ModuleFacturationProAPIServer.instance) {
            ModuleFacturationProAPIServer.instance = new ModuleFacturationProAPIServer();
        }
        return ModuleFacturationProAPIServer.instance;
    }

    private static instance: ModuleFacturationProAPIServer = null;

    private constructor() {
        super(ModuleFacturationProAPI.getInstance().name);
    }

    public async registerAccessPolicies(): Promise<void> {
        let group: AccessPolicyGroupVO = new AccessPolicyGroupVO();
        group.translatable_name = ModuleFacturationProAPI.POLICY_GROUP;
        group = await ModuleAccessPolicyServer.getInstance().registerPolicyGroup(group, new DefaultTranslation({
            'fr-fr': 'API FacturationPro'
        }));

        let bo_access: AccessPolicyVO = new AccessPolicyVO();
        bo_access.group_id = group.id;
        bo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        bo_access.translatable_name = ModuleFacturationProAPI.POLICY_BO_ACCESS;
        bo_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(bo_access, new DefaultTranslation({
            'fr-fr': 'Administration API FacturationPro'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let admin_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        admin_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        admin_access_dependency.src_pol_id = bo_access.id;
        admin_access_dependency.depends_on_pol_id = AccessPolicyServerController.getInstance().get_registered_policy(ModuleAccessPolicy.POLICY_BO_ACCESS).id;
        admin_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);

        let POLICY_FO_ACCESS: AccessPolicyVO = new AccessPolicyVO();
        POLICY_FO_ACCESS.group_id = group.id;
        POLICY_FO_ACCESS.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        POLICY_FO_ACCESS.translatable_name = ModuleFacturationProAPI.POLICY_FO_ACCESS;
        POLICY_FO_ACCESS = await ModuleAccessPolicyServer.getInstance().registerPolicy(POLICY_FO_ACCESS, new DefaultTranslation({
            'fr-fr': 'Accès front - API FacturationPro'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
    }

    public async configure() {
    }

    public registerServerApiHandlers() {
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleFacturationProAPI.APINAME_download_invoice, this.download_invoice.bind(this));
    }

    private async download_invoice(firm_id: number, invoice_id: string, original: boolean): Promise<string> {
        // Je récupère le pdf de la facture
        let invoice_pdf = await ModuleRequest.getInstance().sendRequestFromApp(
            ModuleRequest.METHOD_GET,
            "www.facturation.pro",
            "/firms/" + firm_id + "/invoices/" + invoice_id + ".pdf" + (original ? "?original=1" : ""),
            null,
            await ModuleFacturationProAPI.getInstance().getHeadersRequest(),
            true,
            null,
            true
        );

        if (!invoice_pdf) {
            return null;
        }

        let file_name: string = ModuleFile.SECURED_FILES_ROOT + 'invoices/';

        // Si le dossier n'existe pas, je le crée
        if (!fs.existsSync(file_name)) {
            fs.mkdirSync(file_name);
        }

        file_name += invoice_id + '.pdf';

        try {
            // On va écrire le résultat dans le fichier
            fs.appendFileSync(file_name, invoice_pdf);
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
            return null;
        }

        // On retourne l'URL du fichier créé en supprimant les 2 premiers caractères (./)
        return ConfigurationService.getInstance().node_configuration.BASE_URL + file_name.substring(2);
    }
    // X-Pagination: { "current_page": 1, "total_pages": 10, "per_page": 30, "total_entries": 300 }
    // Vous pouvez accéder aux différentes pages d’une liste en utilisant le paramètre “page = N” dans vos requêtes, ou N est le numéro de page souhaité.

    // Si vous dépassez l’une ou l’autre de ces limitations, vous receverez un code d’erreur 429, avec un message “Retry later” dans le corps de la réponse.

    // Afin de suivre vos quotas, vous pouvez consulter les champs d’entête suivant:

    // X-RateLimit - Limit: nombre total de requêtes autorisées
    // X - RateLimit - Remaining: nombre total de requêtes restantes

}