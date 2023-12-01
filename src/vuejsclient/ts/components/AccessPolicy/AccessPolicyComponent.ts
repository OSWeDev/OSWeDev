import Vue from 'vue';
import Component from 'vue-class-component';
import VueScrollingTable from 'vue-scrolling-table/dist/vue-scrolling-table';
import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyGroupVO from '../../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import RolePolicyVO from '../../../../shared/modules/AccessPolicy/vos/RolePolicyVO';
import RoleVO from '../../../../shared/modules/AccessPolicy/vos/RoleVO';
import { query } from '../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import { all_promises } from '../../../../shared/tools/PromiseTools';
import ThrottleHelper from '../../../../shared/tools/ThrottleHelper';
import VueComponentBase from '../../../ts/components/VueComponentBase';
import { ModuleDAOAction, ModuleDAOGetter } from '../dao/store/DaoStore';
import DaoStoreTypeWatcherDefinition from '../dao/vos/DaoStoreTypeWatcherDefinition';
import './AccessPolicyComponent.scss';
import PolicyGroupSegmentation from './PolicyGroupSegmentation';

@Component({
    template: require('./AccessPolicyComponent.pug'),
    components: {
        "vue-scrolling-table": VueScrollingTable
    }
})
export default class AccessPolicyComponent extends VueComponentBase {

    @ModuleDAOGetter
    private getStoredDatas: { [API_TYPE_ID: string]: { [id: number]: IDistantVOBase } };

    @ModuleDAOAction
    private storeDatas: (infos: { API_TYPE_ID: string, vos: IDistantVOBase[] }) => void;
    @ModuleDAOAction
    private updateData: (vo: IDistantVOBase) => void;
    @ModuleDAOAction
    private removeData: (infos: { API_TYPE_ID: string, id: number }) => void;
    @ModuleDAOAction
    private storeData: (vo: IDistantVOBase) => void;

    @ModuleDAOAction
    private registerTypeWatcher: (watcher: DaoStoreTypeWatcherDefinition) => void;
    @ModuleDAOAction
    private unregisterTypeWatcher: (watcher: DaoStoreTypeWatcherDefinition) => void;

    private busy: boolean = false;

    private initialized: boolean = false;

    private access_matrix: { [policy_id: number]: { [role_id: number]: boolean } } = {};
    private inherited_access_matrix: { [policy_id: number]: { [role_id: number]: boolean } } = {};
    private display_policy_groups: { [policy_group_id: number]: boolean } = {};
    private display_policy_group_segmentations: { [policy_group_segmentation_id: number]: boolean } = {};

    private dao_watchers = [];

    private policy_groups_segmentations: { [group_id: number]: PolicyGroupSegmentation[] } = {};
    private ordered_policy_groups: AccessPolicyGroupVO[] = [];
    private policy_groups_vibility: { [group_id: number]: boolean } = {};
    private dependencies_by_policy_id: { [policy_id: number]: PolicyDependencyVO[] } = {};
    private policies_visibility_by_role_id: { [role_id: number]: { [policy_id: number]: boolean } } = {};
    private policies_by_group_id: { [group_id: number]: AccessPolicyVO[] } = {};
    private policy_visibility: { [policy_id: number]: boolean } = {};
    private visible_policies_by_group_id: { [group_id: number]: AccessPolicyVO[] } = {};
    private roles: { [id: number]: RoleVO } = {};

    private throttled_update_component = ThrottleHelper.declare_throttle_without_args(this.update_component.bind(this), 500);

    public async beforeDestroy() {
        for (let i in this.dao_watchers) {
            this.unregisterTypeWatcher(this.dao_watchers[i]);
        }
    }

    public async mounted() {
        this.startLoading();
        let self = this;

        let promises: Array<Promise<any>> = [];
        promises.push((async () => {
            let vos: IDistantVOBase[] = await query(AccessPolicyVO.API_TYPE_ID).select_vos<IDistantVOBase>();
            self.storeDatas({
                API_TYPE_ID: AccessPolicyVO.API_TYPE_ID,
                vos: vos
            });
        })());
        promises.push((async () => {
            let vos: IDistantVOBase[] = await query(AccessPolicyGroupVO.API_TYPE_ID).select_vos<IDistantVOBase>();
            self.storeDatas({
                API_TYPE_ID: AccessPolicyGroupVO.API_TYPE_ID,
                vos: vos
            });
        })());
        promises.push((async () => {
            let vos: IDistantVOBase[] = await query(PolicyDependencyVO.API_TYPE_ID).select_vos<IDistantVOBase>();
            self.storeDatas({
                API_TYPE_ID: PolicyDependencyVO.API_TYPE_ID,
                vos: vos
            });
        })());
        promises.push((async () => {
            let vos: IDistantVOBase[] = await query(RolePolicyVO.API_TYPE_ID).select_vos<IDistantVOBase>();
            self.storeDatas({
                API_TYPE_ID: RolePolicyVO.API_TYPE_ID,
                vos: vos
            });
        })());
        promises.push((async () => {
            let vos: IDistantVOBase[] = await query(RoleVO.API_TYPE_ID).select_vos<IDistantVOBase>();
            self.storeDatas({
                API_TYPE_ID: RoleVO.API_TYPE_ID,
                vos: vos
            });
        })());

        promises.push((async () => {
            self.access_matrix = await ModuleAccessPolicy.getInstance().getAccessMatrix(false);
        })());
        promises.push((async () => {
            self.inherited_access_matrix = await ModuleAccessPolicy.getInstance().getAccessMatrix(true);
        })());

        await all_promises(promises);

        for (let i in this.getStoredDatas[AccessPolicyGroupVO.API_TYPE_ID]) {
            let group: AccessPolicyGroupVO = this.getStoredDatas[AccessPolicyGroupVO.API_TYPE_ID][i] as AccessPolicyGroupVO;

            Vue.set(this.display_policy_groups as any, group.id, false);
        }

        /**
         * On ajoute des watchers sur tous les types de données liés aux droits, et on supprime ces watchers quand on quitte le composant
         */
        this.add_dao_watcher(AccessPolicyGroupVO.API_TYPE_ID);
        this.add_dao_watcher(AccessPolicyVO.API_TYPE_ID);
        this.add_dao_watcher(PolicyDependencyVO.API_TYPE_ID);
        this.add_dao_watcher(RolePolicyVO.API_TYPE_ID);
        this.add_dao_watcher(RoleVO.API_TYPE_ID);

        this.throttled_update_component();

        this.stopLoading();
    }

    private add_dao_watcher(api_type_id: string) {
        let watcher: DaoStoreTypeWatcherDefinition = new DaoStoreTypeWatcherDefinition();
        watcher.API_TYPE_ID = api_type_id;
        watcher.UID = 'AccessPolicyComponent__' + api_type_id;
        watcher.handler = this.throttled_update_component.bind(this);
        this.registerTypeWatcher(watcher);
        this.dao_watchers.push(watcher);
    }

    private update_component() {

        if (!this.initialized) {
            this.set_ordered_policy_groups();
            this.set_dependencies_by_policy_id();
            this.set_roles();
        }

        this.set_policies_visibility_by_role_id();
        this.set_visible_policies_by_group_id();
        this.set_policy_groups_vibility();

        if (!this.initialized) {
            this.set_policies_by_group_id();
            this.set_policy_groups_segmentations();
        }

        this.set_policy_visibility();
        this.initialized = true;
    }

    private switch_display_policy_group_segmentation(policy_group_segmentation: PolicyGroupSegmentation) {
        Vue.set(this.display_policy_group_segmentations as any, policy_group_segmentation.id, !this.display_policy_group_segmentations[policy_group_segmentation.id]);
    }

    private set_policy_groups_segmentations() {
        let res: { [group_id: number]: PolicyGroupSegmentation[] } = {};

        let policies_by_segmentation_index: { [group_id: number]: { [segmentation_index: string]: AccessPolicyVO[] } } = {};

        for (let group_id_ in this.policies_by_group_id) {
            let group_id: number = parseInt(group_id_.toString());

            if (!policies_by_segmentation_index[group_id]) {
                policies_by_segmentation_index[group_id] = {};
            }

            for (let i in this.policies_by_group_id[group_id_]) {
                let policy: AccessPolicyVO = this.policies_by_group_id[group_id_][i];

                if (!res[group_id]) {
                    res[group_id] = [];
                }

                let segmentation_index: string = policy.translatable_name
                    .replace(/access\.policy_groups\.names\.DAO_MODULES_CONF\.[^.]+\./, '')
                    .replace(/access\.policy_groups\.names\.DAO_DATAS\.[^.]+\./, '')
                    .replace(/\.___LABEL___/, '');
                if (!policies_by_segmentation_index[group_id][segmentation_index]) {
                    policies_by_segmentation_index[group_id][segmentation_index] = [];
                }

                policies_by_segmentation_index[group_id][segmentation_index].push(policy);
            }
        }

        for (let group_id_ in policies_by_segmentation_index) {
            let group_id = parseInt(group_id_.toString());
            let policies_by_segmentation = policies_by_segmentation_index[group_id];

            if (!res[group_id]) {
                res[group_id] = [];
            }

            let default_segment: PolicyGroupSegmentation = new PolicyGroupSegmentation(
                group_id, 'N/A', []);

            for (let segmentation_index in policies_by_segmentation) {
                let policies = policies_by_segmentation[segmentation_index];

                if ((!policies) || (!policies.length)) {
                    continue;
                }

                if (policies.length == 1) {
                    default_segment.policies.push(policies[0]);
                    continue;
                }

                let segment: PolicyGroupSegmentation = new PolicyGroupSegmentation(
                    group_id, segmentation_index, policies);
                res[group_id].push(segment);
            }
            res[group_id].push(default_segment);
        }

        this.policy_groups_segmentations = res;
    }

    private set_ordered_policy_groups() {
        // sont visibles les groupes qui ont au moins une policy visible
        let res: AccessPolicyGroupVO[] = [];

        for (let i in this.getStoredDatas[AccessPolicyGroupVO.API_TYPE_ID]) {
            let group: AccessPolicyGroupVO = this.getStoredDatas[AccessPolicyGroupVO.API_TYPE_ID][i] as AccessPolicyGroupVO;

            res.push(group);
        }

        res.sort((a: AccessPolicyGroupVO, b: AccessPolicyGroupVO) => {
            if (a.weight < b.weight) {
                return -1;
            }
            if (a.weight > b.weight) {
                return 1;
            }
            return 0;
        });

        this.ordered_policy_groups = res;
    }

    private set_policy_groups_vibility() {
        // sont visibles les groupes qui ont au moins une policy visible
        let res: { [group_id: number]: boolean } = {};

        for (let i in this.getStoredDatas[AccessPolicyGroupVO.API_TYPE_ID]) {
            let group: AccessPolicyGroupVO = this.getStoredDatas[AccessPolicyGroupVO.API_TYPE_ID][i] as AccessPolicyGroupVO;

            if ((!this.visible_policies_by_group_id[group.id]) || (!this.visible_policies_by_group_id[group.id].length)) {
                res[group.id] = false;
            }
            res[group.id] = true;
        }

        this.policy_groups_vibility = res;
    }

    private set_dependencies_by_policy_id() {

        let res: { [policy_id: number]: PolicyDependencyVO[] } = {};

        for (let i in this.getStoredDatas[PolicyDependencyVO.API_TYPE_ID]) {
            let dependency: PolicyDependencyVO = this.getStoredDatas[PolicyDependencyVO.API_TYPE_ID][i] as PolicyDependencyVO;

            if (!res[dependency.src_pol_id]) {
                res[dependency.src_pol_id] = [];
            }
            res[dependency.src_pol_id].push(dependency);
        }

        this.dependencies_by_policy_id = res;
    }

    private set_policies_visibility_by_role_id() {
        // sont visibles les policies dont les deps mandatory sont validées
        let res: { [role_id: number]: { [policy_id: number]: boolean } } = {};

        for (let k in this.getStoredDatas[RoleVO.API_TYPE_ID]) {
            let role: RoleVO = this.getStoredDatas[RoleVO.API_TYPE_ID][k] as RoleVO;

            for (let i in this.getStoredDatas[AccessPolicyVO.API_TYPE_ID]) {
                let policy: AccessPolicyVO = this.getStoredDatas[AccessPolicyVO.API_TYPE_ID][i] as AccessPolicyVO;

                let visible: boolean = true;
                for (let j in this.dependencies_by_policy_id[policy.id]) {
                    let dependency: PolicyDependencyVO = this.dependencies_by_policy_id[policy.id][j];

                    // Si on est en access granted par défaut, on a donc pas de relation de nécessité mais d'implication
                    if (dependency.default_behaviour == PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_GRANTED) {
                        continue;
                    }

                    if (!this.access_matrix[dependency.depends_on_pol_id] || !this.access_matrix[dependency.depends_on_pol_id][role.id]) {
                        visible = false;
                        break;
                    }
                }

                if (!res[role.id]) {
                    res[role.id] = {};
                }
                res[role.id][policy.id] = visible;
            }
        }

        this.policies_visibility_by_role_id = res;
    }

    private set_policies_by_group_id() {
        let res: { [group_id: number]: AccessPolicyVO[] } = {};

        for (let i in this.getStoredDatas[AccessPolicyVO.API_TYPE_ID]) {
            let policy: AccessPolicyVO = this.getStoredDatas[AccessPolicyVO.API_TYPE_ID][i] as AccessPolicyVO;

            if (!res[policy.group_id]) {
                res[policy.group_id] = [];
            }

            res[policy.group_id].push(policy);
        }

        // On ordonne les policies dans les groupes
        for (let i in this.getStoredDatas[AccessPolicyGroupVO.API_TYPE_ID]) {
            let group: AccessPolicyGroupVO = this.getStoredDatas[AccessPolicyGroupVO.API_TYPE_ID][i] as AccessPolicyGroupVO;

            if (res[group.id]) {
                res[group.id].sort((a: AccessPolicyVO, b: AccessPolicyVO) => {
                    if (a.weight < b.weight) {
                        return -1;
                    }
                    if (a.weight > b.weight) {
                        return 1;
                    }
                    return 0;
                });
            }
        }

        this.policies_by_group_id = res;
    }

    private set_policy_visibility() {
        // sont visibles les policies dont au moins un role/policy est visible
        let res: { [policy_id: number]: boolean } = {};

        for (let i in this.getStoredDatas[AccessPolicyVO.API_TYPE_ID]) {
            let policy: AccessPolicyVO = this.getStoredDatas[AccessPolicyVO.API_TYPE_ID][i] as AccessPolicyVO;

            let visible: boolean = false;
            for (let j in this.getStoredDatas[RoleVO.API_TYPE_ID]) {
                let role: RoleVO = this.getStoredDatas[RoleVO.API_TYPE_ID][j] as RoleVO;

                if (this.policies_visibility_by_role_id[role.id][policy.id]) {
                    visible = true;
                    break;
                }
            }

            res[policy.id] = visible;
        }

        this.policy_visibility = res;
    }

    private set_visible_policies_by_group_id() {
        // sont visibles les policies dont au moins un role/policy est visible
        let res: { [group_id: number]: AccessPolicyVO[] } = {};

        for (let i in this.getStoredDatas[AccessPolicyVO.API_TYPE_ID]) {
            let policy: AccessPolicyVO = this.getStoredDatas[AccessPolicyVO.API_TYPE_ID][i] as AccessPolicyVO;

            let visible: boolean = false;
            for (let j in this.getStoredDatas[RoleVO.API_TYPE_ID]) {
                let role: RoleVO = this.getStoredDatas[RoleVO.API_TYPE_ID][j] as RoleVO;

                if (this.policies_visibility_by_role_id[role.id][policy.id]) {
                    visible = true;
                    break;
                }
            }

            if (!res[policy.group_id]) {
                res[policy.group_id] = [];
            }

            if (visible) {
                res[policy.group_id].push(policy);
            }
        }

        // On ordonne les policies dans les groupes
        for (let i in this.getStoredDatas[AccessPolicyGroupVO.API_TYPE_ID]) {
            let group: AccessPolicyGroupVO = this.getStoredDatas[AccessPolicyGroupVO.API_TYPE_ID][i] as AccessPolicyGroupVO;

            if (res[group.id]) {
                res[group.id].sort((a: AccessPolicyVO, b: AccessPolicyVO) => {
                    if (a.weight < b.weight) {
                        return -1;
                    }
                    if (a.weight > b.weight) {
                        return 1;
                    }
                    return 0;
                });
            }
        }

        this.visible_policies_by_group_id = res;
    }

    private set_roles() {
        let res: { [id: number]: RoleVO } = {};

        for (let i in this.getStoredDatas[RoleVO.API_TYPE_ID]) {
            let role: RoleVO = this.getStoredDatas[RoleVO.API_TYPE_ID][i] as RoleVO;

            if (role.translatable_name == ModuleAccessPolicy.ROLE_ADMIN) {
                continue;
            }
            res[role.id] = role;
        }
        this.roles = res;
    }

    private async updateMatrices() {
        // this.startLoading();
        let self = this;

        let promises: Array<Promise<any>> = [];
        promises.push((async () => {
            self.access_matrix = await ModuleAccessPolicy.getInstance().getAccessMatrix(false);
        })());
        promises.push((async () => {
            self.inherited_access_matrix = await ModuleAccessPolicy.getInstance().getAccessMatrix(true);
        })());

        await all_promises(promises);

        this.throttled_update_component();

        // this.stopLoading();
    }

    private async set_policy(policy_id: number, role_id: number) {
        if ((!policy_id) || (!role_id)) {
            return;
        }
        this.snotify.info(this.label('access_policy.admin.set_policy.start'));
        this.busy = true;

        // Suite à la mise à jour on attend 1.5 secondes pour avoir les nouvelles matrices à jour
        if (!await ModuleAccessPolicy.getInstance().togglePolicy(policy_id, role_id)) {

            // On devrait pas pouvoir arriver là
            setTimeout(async () => {
                await this.end_set_policy(true);
            }, 1500);
            return;
        }

        setTimeout(this.end_set_policy, 1500);
    }

    private async end_set_policy(is_error: boolean = false) {
        await this.updateMatrices();
        this.busy = false;

        if (is_error) {
            this.snotify.error(this.label('access_policy.admin.set_policy.ko'));
        } else {
            this.snotify.success(this.label('access_policy.admin.set_policy.ok'));
        }
    }

    private set_display_policy_group(policy_group_id: number) {
        Vue.set(this.display_policy_groups as any, policy_group_id, !this.display_policy_groups[policy_group_id]);
    }
}