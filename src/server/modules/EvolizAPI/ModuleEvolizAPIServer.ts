import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import ModuleEvolizAPI from '../../../shared/modules/EvolizAPI/ModuleEvolizAPI';
import EvolizClientVO from '../../../shared/modules/EvolizAPI/vos/clients/EvolizClientVO';
import EvolizInvoiceVO from '../../../shared/modules/EvolizAPI/vos/invoices/EvolizInvoiceVO';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ModuleServerBase from '../ModuleServerBase';
import ModulesManagerServer from '../ModulesManagerServer';

export default class ModuleEvolizAPIServer extends ModuleServerBase {

    public static getInstance() {
        if (!ModuleEvolizAPIServer.instance) {
            ModuleEvolizAPIServer.instance = new ModuleEvolizAPIServer();
        }
        return ModuleEvolizAPIServer.instance;
    }

    private static instance: ModuleEvolizAPIServer = null;

    private constructor() {
        super(ModuleEvolizAPIServer.getInstance().name);
    }

    public async registerAccessPolicies(): Promise<void> {
        let group: AccessPolicyGroupVO = new AccessPolicyGroupVO();
        group.translatable_name = ModuleEvolizAPI.POLICY_GROUP;
        group = await ModuleAccessPolicyServer.getInstance().registerPolicyGroup(group, new DefaultTranslation({
            'fr-fr': 'API EvolizAPI'
        }));

        let bo_access: AccessPolicyVO = new AccessPolicyVO();
        bo_access.group_id = group.id;
        bo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        bo_access.translatable_name = ModuleEvolizAPI.POLICY_BO_ACCESS;
        bo_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(bo_access, new DefaultTranslation({
            'fr-fr': 'Administration API EvolizAPI'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let admin_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        admin_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        admin_access_dependency.src_pol_id = bo_access.id;
        admin_access_dependency.depends_on_pol_id = AccessPolicyServerController.getInstance().get_registered_policy(ModuleAccessPolicy.POLICY_BO_ACCESS).id;
        admin_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);

        let POLICY_FO_ACCESS: AccessPolicyVO = new AccessPolicyVO();
        POLICY_FO_ACCESS.group_id = group.id;
        POLICY_FO_ACCESS.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        POLICY_FO_ACCESS.translatable_name = ModuleEvolizAPI.POLICY_FO_ACCESS;
        POLICY_FO_ACCESS = await ModuleAccessPolicyServer.getInstance().registerPolicy(POLICY_FO_ACCESS, new DefaultTranslation({
            'fr-fr': 'Accès front - API EvolizAPI'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
    }

    public async configure() {
    }

    public registerServerApiHandlers() {
    }

    public async connexion_to_api() {
        let res = await fetch(ModuleEvolizAPI.EvolizAPI_BaseURL + 'api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                public: ModuleEvolizAPI.EvolizAPI_PublicKey_API_PARAM_NAME,
                secret: ModuleEvolizAPI.EvolizAPI_SecretKey_API_PARAM_NAME
            })
        })
            .then((result) => {
                return result.json();
            })
            .then(async (data) => {
                ModuleEvolizAPI.EvolizAPI_AccessToken_API_PARAM_NAME = data.access_token;
            });
    }

    public async list_invoices() {
        try {
            let response = await fetch(ModuleEvolizAPI.EvolizAPI_BaseURL + 'api/v1/invoices', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la récupération des factures');
            }

            let result = (await response.json()) as EvolizInvoiceVO[];

            return result;

        } catch (error) {
            console.error(error);
        }
    }

    public async create_invoices() {
        try {
            let response = await fetch(ModuleEvolizAPI.EvolizAPI_BaseURL + 'api/v1/invoices', {
                method: 'POST',
                body: JSON.stringify({
                    //infos du EvolizInvoiceVO
                }),
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la création de la facture');
            }

            let result = (await response.json()) as EvolizInvoiceVO;

            return result;
        } catch (error) {
            console.error(error);
        }
    }

    public async list_clients() {
        try {
            let response = await fetch(ModuleEvolizAPI.EvolizAPI_BaseURL + 'api/v1/clients', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la récupération des clients');
            }

            let result = (await response.json()) as EvolizClientVO[];

            return result;

        } catch (error) {
            console.error(error);
        }
    }

    public async create_clients() {
        try {
            let response = await fetch(ModuleEvolizAPI.EvolizAPI_BaseURL + 'api/v1/clients', {
                method: 'POST',
                body: JSON.stringify({
                    //infos du EvolizClientVO
                }),
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la création du client');
            }

            let result = (await response.json()) as EvolizClientVO;

            return result;
        } catch (error) {
            console.error(error);
        }
    }
}