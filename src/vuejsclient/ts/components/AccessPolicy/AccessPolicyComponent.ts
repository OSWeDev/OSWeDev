import Vue from 'vue';
import Component from 'vue-class-component';
import VueScrollingTable from 'vue-scrolling-table/dist/vue-scrolling-table';
import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyGroupVO from '../../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import RolePolicyVO from '../../../../shared/modules/AccessPolicy/vos/RolePolicyVO';
import RoleVO from '../../../../shared/modules/AccessPolicy/vos/RoleVO';
import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import VueComponentBase from '../../../ts/components/VueComponentBase';
import { ModuleDAOAction, ModuleDAOGetter } from '../dao/store/DaoStore';
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
    public getStoredDatas: { [API_TYPE_ID: string]: { [id: number]: IDistantVOBase } };

    @ModuleDAOAction
    public storeDatas: (infos: { API_TYPE_ID: string, vos: IDistantVOBase[] }) => void;
    @ModuleDAOAction
    public updateData: (vo: IDistantVOBase) => void;
    @ModuleDAOAction
    public removeData: (infos: { API_TYPE_ID: string, id: number }) => void;
    @ModuleDAOAction
    public storeData: (vo: IDistantVOBase) => void;

    private busy: boolean = false;

    private access_matrix: { [policy_id: number]: { [role_id: number]: boolean } } = {};
    private inherited_access_matrix: { [policy_id: number]: { [role_id: number]: boolean } } = {};
    private display_policy_groups: { [policy_group_id: number]: boolean } = {};
    private display_policy_group_segmentations: { [policy_group_segmentation_id: number]: boolean } = {};

    public async mounted() {
        this.startLoading();
        let self = this;

        let promises: Array<Promise<any>> = [];
        promises.push((async () => {
            let vos: IDistantVOBase[] = await ModuleDAO.getInstance().getVos<IDistantVOBase>(AccessPolicyVO.API_TYPE_ID);
            self.storeDatas({
                API_TYPE_ID: AccessPolicyVO.API_TYPE_ID,
                vos: vos
            });
        })());
        promises.push((async () => {
            let vos: IDistantVOBase[] = await ModuleDAO.getInstance().getVos<IDistantVOBase>(AccessPolicyGroupVO.API_TYPE_ID);
            self.storeDatas({
                API_TYPE_ID: AccessPolicyGroupVO.API_TYPE_ID,
                vos: vos
            });
        })());
        promises.push((async () => {
            let vos: IDistantVOBase[] = await ModuleDAO.getInstance().getVos<IDistantVOBase>(PolicyDependencyVO.API_TYPE_ID);
            self.storeDatas({
                API_TYPE_ID: PolicyDependencyVO.API_TYPE_ID,
                vos: vos
            });
        })());
        promises.push((async () => {
            let vos: IDistantVOBase[] = await ModuleDAO.getInstance().getVos<IDistantVOBase>(RolePolicyVO.API_TYPE_ID);
            self.storeDatas({
                API_TYPE_ID: RolePolicyVO.API_TYPE_ID,
                vos: vos
            });
        })());
        promises.push((async () => {
            let vos: IDistantVOBase[] = await ModuleDAO.getInstance().getVos<IDistantVOBase>(RoleVO.API_TYPE_ID);
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

        await Promise.all(promises);

        for (let i in this.getStoredDatas[AccessPolicyGroupVO.API_TYPE_ID]) {
            let group: AccessPolicyGroupVO = this.getStoredDatas[AccessPolicyGroupVO.API_TYPE_ID][i] as AccessPolicyGroupVO;

            Vue.set(this.display_policy_groups as any, group.id, false);
        }

        this.stopLoading();
    }


    private switch_display_policy_group_segmentation(policy_group_segmentation: PolicyGroupSegmentation) {
        Vue.set(this.display_policy_group_segmentations as any, policy_group_segmentation.id, !this.display_policy_group_segmentations[policy_group_segmentation.id]);
    }

    get policy_groups_segmentations(): { [group_id: number]: PolicyGroupSegmentation[] } {
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

        return res;
    }

    get ordered_policy_groups(): AccessPolicyGroupVO[] {
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

        return res;
    }

    get policy_groups_vibility(): { [group_id: number]: boolean } {
        // sont visibles les groupes qui ont au moins une policy visible
        let res: { [group_id: number]: boolean } = {};

        for (let i in this.getStoredDatas[AccessPolicyGroupVO.API_TYPE_ID]) {
            let group: AccessPolicyGroupVO = this.getStoredDatas[AccessPolicyGroupVO.API_TYPE_ID][i] as AccessPolicyGroupVO;

            if ((!this.visible_policies_by_group_id[group.id]) || (!this.visible_policies_by_group_id[group.id].length)) {
                res[group.id] = false;
            }
            res[group.id] = true;
        }

        return res;
    }

    get dependencies_by_policy_id(): { [policy_id: number]: PolicyDependencyVO[] } {

        let res: { [policy_id: number]: PolicyDependencyVO[] } = {};

        for (let i in this.getStoredDatas[PolicyDependencyVO.API_TYPE_ID]) {
            let dependency: PolicyDependencyVO = this.getStoredDatas[PolicyDependencyVO.API_TYPE_ID][i] as PolicyDependencyVO;

            if (!res[dependency.src_pol_id]) {
                res[dependency.src_pol_id] = [];
            }
            res[dependency.src_pol_id].push(dependency);
        }

        return res;
    }

    get policies_visibility_by_role_id(): { [role_id: number]: { [policy_id: number]: boolean } } {
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

        return res;
    }

    get policies_by_group_id(): { [group_id: number]: AccessPolicyVO[] } {
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

        return res;
    }

    get policy_visibility(): { [policy_id: number]: boolean } {
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

        return res;
    }

    get visible_policies_by_group_id(): { [group_id: number]: AccessPolicyVO[] } {
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

        return res;
    }

    get roles(): { [id: number]: RoleVO } {
        let res: { [id: number]: RoleVO } = {};

        for (let i in this.getStoredDatas[RoleVO.API_TYPE_ID]) {
            let role: RoleVO = this.getStoredDatas[RoleVO.API_TYPE_ID][i] as RoleVO;

            if (role.translatable_name == ModuleAccessPolicy.ROLE_ADMIN) {
                continue;
            }
            res[role.id] = role;
        }
        return res;
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

        await Promise.all(promises);
        // this.stopLoading();
    }

    private async set_policy(policy_id: number, role_id: number) {
        if ((!policy_id) || (!role_id)) {
            return;
        }
        this.snotify.info(this.label('access_policy.admin.set_policy.start'));
        this.busy = true;

        if (!await ModuleAccessPolicy.getInstance().togglePolicy(policy_id, role_id)) {
            // On devrait pas pouvoir arriver là
            await this.updateMatrices();
            this.busy = false;
            this.snotify.error(this.label('access_policy.admin.set_policy.ko'));
            return;
        }

        await this.updateMatrices();
        this.busy = false;
        this.snotify.success(this.label('access_policy.admin.set_policy.ok'));
    }

    private set_display_policy_group(policy_group_id: number) {
        Vue.set(this.display_policy_groups as any, policy_group_id, !this.display_policy_groups[policy_group_id]);
    }
}