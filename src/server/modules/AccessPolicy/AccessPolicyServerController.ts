import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import RolePolicyVO from '../../../shared/modules/AccessPolicy/vos/RolePolicyVO';
import RoleVO from '../../../shared/modules/AccessPolicy/vos/RoleVO';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import InsertOrDeleteQueryResult from '../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';

export default class AccessPolicyServerController {

    public static getInstance() {
        if (!AccessPolicyServerController.instance) {
            AccessPolicyServerController.instance = new AccessPolicyServerController();
        }
        return AccessPolicyServerController.instance;
    }

    private static instance: AccessPolicyServerController = null;

    public role_anonymous: RoleVO = null;
    public role_logged: RoleVO = null;
    public role_admin: RoleVO = null;

    public registered_dependencies: { [src_pol_id: number]: PolicyDependencyVO[] };

    public registered_roles_by_ids: { [role_id: number]: RoleVO };
    public registered_users_roles: { [uid: number]: RoleVO[] };
    public registered_roles_policies: { [role_id: number]: { [pol_id: number]: RolePolicyVO } };
    public registered_policies_by_ids: { [policy_id: number]: AccessPolicyVO };

    private registered_roles: { [role_name: string]: RoleVO };
    private registered_policy_groups: { [group_name: string]: AccessPolicyGroupVO };
    private registered_policies: { [policy_name: string]: AccessPolicyVO };

    public get_registered_role(role_name: string): RoleVO {
        return this.registered_roles[role_name ? role_name.toLowerCase() : role_name];
    }

    public get_registered_policy_group(group_name: string): AccessPolicyGroupVO {
        return this.registered_policy_groups[group_name ? group_name.toLowerCase() : group_name];
    }

    public get_registered_policy(policy_name: string): AccessPolicyVO {
        return this.registered_policies[policy_name ? policy_name.toLowerCase() : policy_name];
    }

    public clean_registered_roles() {
        this.registered_roles = {};
    }

    public clean_registered_policy_groups() {
        this.registered_policy_groups = {};
    }

    public clean_registered_policies() {
        this.registered_policies = {};
    }

    public set_registered_role(name: string, object: RoleVO) {
        if (!name) {
            return;
        }
        this.registered_roles[name.toLowerCase()] = object;
    }

    public set_registered_policy_group(name: string, object: AccessPolicyGroupVO) {
        if (!name) {
            return;
        }
        this.registered_policy_groups[name.toLowerCase()] = object;
    }

    public set_registered_policy(name: string, object: AccessPolicyVO) {
        if (!name) {
            return;
        }
        this.registered_policies[name.toLowerCase()] = object;
    }

    public delete_registered_role(name: string) {
        if (!name) {
            return;
        }
        delete this.registered_roles[name.toLowerCase()];
    }

    public delete_registered_policy_group(name: string) {
        if (!name) {
            return;
        }
        delete this.registered_policy_groups[name.toLowerCase()];
    }

    public delete_registered_policy(name: string) {
        if (!name) {
            return;
        }
        delete this.registered_policies[name.toLowerCase()];
    }

    /**
     * @param role Le rôle à déclarer
     * @param default_translation La traduction par défaut. Le code_text est écrasé par la fonction avec le translatable_name
     */
    public async registerRole(role: RoleVO, default_translation: DefaultTranslation): Promise<RoleVO> {
        if ((!role) || (!role.translatable_name)) {
            return null;
        }

        let translatable_name: string = role.translatable_name.toLowerCase();

        if (!AccessPolicyServerController.getInstance().registered_roles) {
            AccessPolicyServerController.getInstance().registered_roles = {};
        }
        if (!AccessPolicyServerController.getInstance().registered_roles_by_ids) {
            AccessPolicyServerController.getInstance().registered_roles_by_ids = {};
        }

        if (AccessPolicyServerController.getInstance().registered_roles[translatable_name]) {
            return AccessPolicyServerController.getInstance().registered_roles[translatable_name];
        }

        if (default_translation) {
            default_translation.code_text = role.translatable_name + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
            DefaultTranslationManager.getInstance().registerDefaultTranslation(default_translation);
        }

        // Un nouveau rôle a forcément un parent :
        //  - si c'est le rôle 'identifié', son parent est le rôle 'anonyme'
        //  - si c'est le rôle 'anonyme', il n'a pas de parent (c'est le seul)
        //  - si c'est le rôle 'admin', son parent est 'identifié'
        //  - pour tout autre rôle, son parent est soit 'identifié' soit un autre rôle ajouté (ne peut dépendre de 'anonyme' ou de 'admin')

        if (role.translatable_name == AccessPolicyServerController.getInstance().role_anonymous.translatable_name) {
            role.parent_role_id = null;
        } else if (role.translatable_name == AccessPolicyServerController.getInstance().role_logged.translatable_name) {
            role.parent_role_id = AccessPolicyServerController.getInstance().role_anonymous.id;
        } else if (role.translatable_name == AccessPolicyServerController.getInstance().role_admin.translatable_name) {
            role.parent_role_id = AccessPolicyServerController.getInstance().role_logged.id;
        } else {
            if ((!role.parent_role_id) || (role.parent_role_id == AccessPolicyServerController.getInstance().role_anonymous.id) || (role.parent_role_id == AccessPolicyServerController.getInstance().role_admin.id)) {
                role.parent_role_id = AccessPolicyServerController.getInstance().role_logged.id;
            }
        }

        let roleFromBDD: RoleVO = await ModuleDAOServer.getInstance().selectOne<RoleVO>(RoleVO.API_TYPE_ID, "where translatable_name = $1", [role.translatable_name]);
        if (roleFromBDD) {
            AccessPolicyServerController.getInstance().registered_roles[translatable_name] = roleFromBDD;
            AccessPolicyServerController.getInstance().registered_roles_by_ids[roleFromBDD.id] = roleFromBDD;
            return roleFromBDD;
        }

        let insertOrDeleteQueryResult: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(role);
        if ((!insertOrDeleteQueryResult) || (!insertOrDeleteQueryResult.id)) {
            console.error('Ajout de role échoué:' + role.translatable_name + ':');
            return null;
        }

        role.id = parseInt(insertOrDeleteQueryResult.id);
        AccessPolicyServerController.getInstance().registered_roles[role.translatable_name] = role;
        AccessPolicyServerController.getInstance().registered_roles_by_ids[role.id] = role;
        console.error('Ajout du role OK:' + role.translatable_name + ':');
        return role;
    }

    /**
     * @param group Le group à déclarer
     * @param default_translation La traduction par défaut. Le code_text est écrasé par la fonction avec le translatable_name
     */
    public async registerPolicyGroup(group: AccessPolicyGroupVO, default_translation: DefaultTranslation): Promise<AccessPolicyGroupVO> {
        if ((!group) || (!group.translatable_name)) {
            return null;
        }

        let translatable_name: string = group.translatable_name.toLowerCase();

        if (!AccessPolicyServerController.getInstance().registered_policy_groups) {
            AccessPolicyServerController.getInstance().registered_policy_groups = {};
        }

        if (AccessPolicyServerController.getInstance().registered_policy_groups[translatable_name]) {
            return AccessPolicyServerController.getInstance().registered_policy_groups[translatable_name];
        }

        if (default_translation) {
            default_translation.code_text = group.translatable_name + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
            DefaultTranslationManager.getInstance().registerDefaultTranslation(default_translation);
        }

        let groupFromBDD: AccessPolicyGroupVO = await ModuleDAOServer.getInstance().selectOne<AccessPolicyGroupVO>(AccessPolicyGroupVO.API_TYPE_ID, "where translatable_name = $1", [group.translatable_name]);
        if (groupFromBDD) {
            AccessPolicyServerController.getInstance().registered_policy_groups[translatable_name] = groupFromBDD;
            return groupFromBDD;
        }

        let insertOrDeleteQueryResult: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(group);
        if ((!insertOrDeleteQueryResult) || (!insertOrDeleteQueryResult.id)) {
            console.error('Ajout de groupe échoué :' + group.translatable_name + ':');
            return null;
        }

        group.id = parseInt(insertOrDeleteQueryResult.id);
        AccessPolicyServerController.getInstance().registered_policy_groups[translatable_name] = group;
        console.error('Ajout du groupe OK :' + group.translatable_name + ':');
        return group;
    }

    /**
     * @param policy La policy à déclarer
     * @param default_translation La traduction par défaut. Le code_text est écrasé par la fonction avec le translatable_name
     */
    public async registerPolicy(policy: AccessPolicyVO, default_translation: DefaultTranslation): Promise<AccessPolicyVO> {
        if ((!policy) || (!policy.translatable_name)) {
            return null;
        }

        let translatable_name: string = policy.translatable_name.toLowerCase();

        if (!AccessPolicyServerController.getInstance().registered_policies) {
            AccessPolicyServerController.getInstance().registered_policies = {};
        }

        if (!AccessPolicyServerController.getInstance().registered_policies_by_ids) {
            AccessPolicyServerController.getInstance().registered_policies_by_ids = {};
        }

        if (AccessPolicyServerController.getInstance().registered_policies[translatable_name]) {
            return AccessPolicyServerController.getInstance().registered_policies[translatable_name];
        }

        if (default_translation) {
            default_translation.code_text = policy.translatable_name + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
            DefaultTranslationManager.getInstance().registerDefaultTranslation(default_translation);
        }

        let policyFromBDD: AccessPolicyVO = await ModuleDAOServer.getInstance().selectOne<AccessPolicyVO>(AccessPolicyVO.API_TYPE_ID, "where translatable_name = $1", [policy.translatable_name]);
        if (policyFromBDD) {
            AccessPolicyServerController.getInstance().registered_policies[translatable_name] = policyFromBDD;
            AccessPolicyServerController.getInstance().registered_policies_by_ids[policyFromBDD.id] = policyFromBDD;
            return policyFromBDD;
        }

        let insertOrDeleteQueryResult: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(policy);
        if ((!insertOrDeleteQueryResult) || (!insertOrDeleteQueryResult.id)) {
            console.error('Ajout de droit échoué :' + policy.translatable_name + ':');
            return null;
        }

        policy.id = parseInt(insertOrDeleteQueryResult.id);
        AccessPolicyServerController.getInstance().registered_policies[translatable_name] = policy;
        AccessPolicyServerController.getInstance().registered_policies_by_ids[policy.id] = policy;
        console.error('Ajout du droit OK :' + policy.translatable_name + ':');
        return policy;
    }

    /**
     * Public pour faire des tests unitaires principalement.
     * @param bdd_user_roles Les roles tels qu'extraits de la bdd (donc potentiellement sans les héritages de rôles)
     * @param all_roles Tous les rôles possibles
     */
    public getUsersRoles(
        logged_in: boolean,
        bdd_user_roles: RoleVO[],
        all_roles: { [role_id: number]: RoleVO }): { [role_id: number]: RoleVO } {
        let res: { [role_id: number]: RoleVO } = {};

        if ((!logged_in) || (!all_roles)) {
            return {
                [AccessPolicyServerController.getInstance().role_anonymous.id]: AccessPolicyServerController.getInstance().role_anonymous
            };
        }

        // On ajoute le role connecté par défaut dans ce cas au cas où il serait pas en param
        let user_roles: RoleVO[] = [];

        for (let i in bdd_user_roles) {
            if (bdd_user_roles[i]) {
                user_roles.push(bdd_user_roles[i]);
            }
        }
        user_roles.push(AccessPolicyServerController.getInstance().role_logged);

        for (let i in user_roles) {
            let role: RoleVO = user_roles[i];

            while (role && role.translatable_name) {

                if (!res[role.id]) {
                    res[role.id] = role;
                }
                role = role.parent_role_id ? all_roles[role.parent_role_id] : null;
            }
        }

        return res;
    }

    public async getAccessMatrix(ignore_role: boolean = false): Promise<{ [policy_id: number]: { [role_id: number]: boolean } }> {
        if (!await ModuleAccessPolicy.getInstance().checkAccess(ModuleAccessPolicy.POLICY_BO_RIGHTS_MANAGMENT_ACCESS)) {
            return null;
        }

        let res: { [policy_id: number]: { [role_id: number]: boolean } } = {};

        // Pour toutes les policies et tous les rôles, on fait un checkaccess. C'est bourrin mais pas mieux en stock pour être sûr d'avoir le bon résultat
        for (let i in AccessPolicyServerController.getInstance().registered_policies) {
            let policy: AccessPolicyVO = AccessPolicyServerController.getInstance().registered_policies[i];

            if (!res[policy.id]) {
                res[policy.id] = {};
            }

            for (let j in AccessPolicyServerController.getInstance().registered_roles) {
                let role: RoleVO = AccessPolicyServerController.getInstance().registered_roles[j];

                // On ignore l'admin qui a accès à tout
                if (role.id == AccessPolicyServerController.getInstance().role_admin.id) {
                    continue;
                }

                res[policy.id][role.id] = AccessPolicyServerController.getInstance().checkAccessTo(
                    policy,
                    { [role.id]: role },
                    AccessPolicyServerController.getInstance().registered_roles_by_ids,
                    AccessPolicyServerController.getInstance().registered_roles_policies,
                    AccessPolicyServerController.getInstance().registered_policies_by_ids,
                    AccessPolicyServerController.getInstance().registered_dependencies,
                    ignore_role ? role : null);
            }
        }

        return res;
    }

    /**
     * Public pour faire des tests unitaires principalement.
     * Pour faciliter les tests on prend en entrée le maximum de données pour pas avoir besoin de la BDD
     * et on sort juste le boolean
     * @param target_policy La policy cible de l'appel pour laquelle on veut savoir si le user a accès
     * @param user_roles Les rôles du user
     * @param all_roles Tous les rôles
     * @param role_policies Les liaisons entre droits et rôles
     * @param policies Les droits
     * @param policies_dependencies Les dépendances
     * @param ignore_role_policy Pour le cas où on veut tester l'accès par héritage (important pour l'admin). Dans ce cas on a obligatoirement un seul role en param
     */
    public checkAccessTo(
        target_policy: AccessPolicyVO,
        user_roles: { [role_id: number]: RoleVO },
        all_roles: { [role_id: number]: RoleVO },
        role_policies: { [role_id: number]: { [pol_id: number]: RolePolicyVO } },
        policies: { [policy_id: number]: AccessPolicyVO },
        policies_dependencies: { [src_pol_id: number]: PolicyDependencyVO[] },
        ignore_role_policy: RoleVO = null): boolean {

        if ((!target_policy) || (!user_roles) || (!all_roles)) {
            return false;
        }

        /**
         * Les règles de résolution d'un accès :
         *  - Si un de mes rôle me donne accès, j'ai accès
         *  - On doit éliminer les rôles un par un en cherchant à autoriser l'accès. Par défaut on refusera l'accès
         *  - Pour chaque rôle, et chaque rôle hérité :
         *      - Cas 0 je suis Admin, j'ai accès
         *      - Cas 1 : Si j'ai explicitement un paramétrage pour ce droit sur ce rôle et !ignore_role_policy :
         *          - Si accès granted : return true;
         *          - Si accès denied : on ne peut pas avoir accès avec ce rôle, on passe au suivant.
         *      - Cas 2 : Sinon : Je peux vérifier que le droit lui-même me donne pas accès par défaut, suivant son comportement et le rôle que je suis entrain de tester.
         *      - Cas 3 : Sinon : Je peux tester les dépendances de droit sur ce droit
         *          - Si ces dépendances existent, et que l'un au moins est en "par défaut en Access granted",
         *              je peux retester sur les dépendances (et donc si checkAccess de tous les droits, alors return true)
         *          - Sinon, je n'ai pas accès à ce droit.
         */

        // On identifie d'abord les rôles et rôles hérités
        let user_roles_and_inherited: { [role_id: number]: RoleVO } = {};
        for (let i in user_roles) {
            let role: RoleVO = user_roles[i];

            while (!!role) {
                if (!user_roles_and_inherited[role.id]) {
                    user_roles_and_inherited[role.id] = role;
                }

                role = (role.parent_role_id && all_roles[role.parent_role_id]) ? all_roles[role.parent_role_id] : null;
            }
        }

        for (let i in user_roles_and_inherited) {
            let user_role: RoleVO = user_roles_and_inherited[i];


            let is_ignored_role: boolean = false;
            if (ignore_role_policy && (ignore_role_policy.id == user_role.id)) {
                is_ignored_role = true;
            }

            // Cas 0
            if (user_role.id == this.role_admin.id) {
                return true;
            }

            if (!this.hasCleanDependencies(
                target_policy,
                [user_role],
                all_roles,
                role_policies,
                policies,
                policies_dependencies)) {

                continue;
            }

            // Cas 1
            if ((!is_ignored_role) && role_policies && role_policies[user_role.id] && role_policies[user_role.id][target_policy.id]) {
                if (role_policies[user_role.id][target_policy.id].granted) {

                    return true;
                } else {
                    continue;
                }
            }

            // Cas 2
            if (policies && policies[target_policy.id]) {
                switch (policies[target_policy.id].default_behaviour) {
                    case AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_GRANTED_TO_ANYONE:
                        return true;
                    case AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ANONYMOUS:
                        if (user_role.id != this.role_anonymous.id) {
                            return true;
                        }
                        break;
                    case AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN:
                    default:
                    // Le cas de l'admin est déjà géré
                }
            }

            // Cas 3
            if (policies_dependencies && policies_dependencies[target_policy.id] && policies_dependencies[target_policy.id].length) {

                let accessGranted: boolean = false;
                for (let j in policies_dependencies[target_policy.id]) {
                    let dependency: PolicyDependencyVO = policies_dependencies[target_policy.id][j];

                    if (dependency.default_behaviour == PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_GRANTED) {
                        accessGranted = true;
                    }

                    if (!this.checkAccessTo(policies[dependency.depends_on_pol_id], user_roles, all_roles, role_policies, policies, policies_dependencies)) {
                        accessGranted = false;
                        break;
                    }
                }

                if (accessGranted) {
                    return true;
                }
            }
        }

        return false;
    }

    private hasCleanDependencies(
        target_policy: AccessPolicyVO,
        user_roles: { [role_id: number]: RoleVO },
        all_roles: { [role_id: number]: RoleVO },
        role_policies: { [role_id: number]: { [pol_id: number]: RolePolicyVO } },
        policies: { [policy_id: number]: AccessPolicyVO },
        policies_dependencies: { [src_pol_id: number]: PolicyDependencyVO[] }): boolean {

        if ((!policies_dependencies) || (!policies)) {
            return true;
        }

        for (let j in policies_dependencies[target_policy.id]) {
            let dependency: PolicyDependencyVO = policies_dependencies[target_policy.id][j];

            if ((dependency.default_behaviour == PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED) && (!this.checkAccessTo(policies[dependency.depends_on_pol_id], user_roles, all_roles, role_policies, policies, policies_dependencies))) {
                return false;
            }
        }

        return true;
    }
}