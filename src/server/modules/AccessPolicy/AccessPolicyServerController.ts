import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import RolePolicyVO from '../../../shared/modules/AccessPolicy/vos/RolePolicyVO';
import RoleVO from '../../../shared/modules/AccessPolicy/vos/RoleVO';

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

    public registered_roles: { [role_name: string]: RoleVO };
    public registered_policy_groups: { [group_name: string]: AccessPolicyGroupVO };
    public registered_policies: { [policy_name: string]: AccessPolicyVO };
    public registered_dependencies: { [src_pol_id: number]: PolicyDependencyVO[] };

    public registered_roles_by_ids: { [role_id: number]: RoleVO };
    public registered_users_roles: { [uid: number]: RoleVO[] };
    public registered_roles_policies: { [role_id: number]: { [pol_id: number]: RolePolicyVO } };
    public registered_policies_by_ids: { [policy_id: number]: AccessPolicyVO };

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
        ignore_role_policy: boolean = false): boolean {

        if ((!target_policy) || (!user_roles) || (!all_roles)) {
            return false;
        }

        if (ignore_role_policy && (Object.keys(user_roles).length > 1)) {
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
            if (ignore_role_policy && user_roles[user_role.id]) {
                is_ignored_role = true;
            }

            // Cas 0
            if (user_role.id == this.role_admin.id) {
                return true;
            }

            if (!this.hasCleanDependencies(
                target_policy,
                user_roles,
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