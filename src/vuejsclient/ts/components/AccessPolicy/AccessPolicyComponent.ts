import Component from 'vue-class-component';
import VueComponentBase from '../../../ts/components/VueComponentBase';
import VueScrollingTable from 'vue-scrolling-table/dist/vue-scrolling-table';
import RoleVO from '../../../../shared/modules/AccessPolicy/vos/RoleVO';
import { ModuleDAOGetter, ModuleDAOAction } from '../dao/store/DaoStore';
import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import AccessPolicyGroupVO from '../../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import AccessPolicyVO from '../../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import RolePoliciesVO from '../../../../shared/modules/AccessPolicy/vos/RolePoliciesVO';
import UserRolesVO from '../../../../shared/modules/AccessPolicy/vos/UserRolesVO';
import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';

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
            let vos: IDistantVOBase[] = await ModuleDAO.getInstance().getVos<IDistantVOBase>(RolePoliciesVO.API_TYPE_ID);
            self.storeDatas({
                API_TYPE_ID: RolePoliciesVO.API_TYPE_ID,
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

        this.stopLoading();
    }

    get visible_policy_groups(): AccessPolicyGroupVO[] {
        // sont visibles les groupes qui ont au moins une policy visible
        let res: AccessPolicyGroupVO[] = [];

        for (let i in this.getStoredDatas[AccessPolicyGroupVO.API_TYPE_ID]) {
            let group: AccessPolicyGroupVO = this.getStoredDatas[AccessPolicyGroupVO.API_TYPE_ID][i] as AccessPolicyGroupVO;

            if ((!this.visible_policies_by_group_id[group.id]) || (!this.visible_policies_by_group_id[group.id].length)) {
                continue;
            }
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
        // sont visibles les policies dont les deps sont validées
        let res: { [role_id: number]: { [policy_id: number]: boolean } } = {};

        for (let k in this.getStoredDatas[RoleVO.API_TYPE_ID]) {
            let role: RoleVO = this.getStoredDatas[RoleVO.API_TYPE_ID][k] as RoleVO;
            for (let i in this.getStoredDatas[AccessPolicyVO.API_TYPE_ID]) {
                let policy: AccessPolicyVO = this.getStoredDatas[AccessPolicyVO.API_TYPE_ID][i] as AccessPolicyVO;

                let visible: boolean = true;
                for (let j in this.dependencies_by_policy_id[policy.id]) {
                    let dependency: PolicyDependencyVO = this.dependencies_by_policy_id[policy.id][j];

                    if (!this.access_matrix[dependency.depends_on_pol_id][role.id]) {
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

    get visible_policies_by_group_id(): { [group_id: number]: AccessPolicyVO[] } {
        // sont visibles les policies dont au moins un role/policy est visible
        let res: { [group_id: number]: AccessPolicyVO[] } = {};

        for (let i in this.getStoredDatas[AccessPolicyVO.API_TYPE_ID]) {
            let policy: AccessPolicyVO = this.getStoredDatas[AccessPolicyVO.API_TYPE_ID][i] as AccessPolicyVO;

            let visible: boolean = true;
            for (let j in this.getStoredDatas[RoleVO.API_TYPE_ID]) {
                let role: RoleVO = this.getStoredDatas[RoleVO.API_TYPE_ID][j] as RoleVO;

                if (!this.policies_visibility_by_role_id[role.id][policy.id]) {
                    visible = false;
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
        return this.getStoredDatas[RoleVO.API_TYPE_ID] as { [id: number]: RoleVO };
    }

    private async updateMatrices() {
        this.startLoading();
        let self = this;

        let promises: Array<Promise<any>> = [];
        promises.push((async () => {
            self.access_matrix = await ModuleAccessPolicy.getInstance().getAccessMatrix(false);
        })());
        promises.push((async () => {
            self.inherited_access_matrix = await ModuleAccessPolicy.getInstance().getAccessMatrix(true);
        })());

        await Promise.all(promises);
        this.stopLoading();
    }

    private async set_policy(policy_id: number, role_id: number) {
        if ((!policy_id) || (!role_id)) {
            return;
        }
        this.snotify.info('access_policy.admin.set_policy.start');
        this.busy = true;

        if (!await ModuleAccessPolicy.getInstance().togglePolicy(policy_id, role_id)) {
            // On devrait pas pouvoir arriver là
            await this.updateMatrices();
            this.busy = false;
            this.snotify.error('access_policy.admin.set_policy.ko');
            return;
        }

        await this.updateMatrices();
        this.busy = false;
        this.snotify.success('access_policy.admin.set_policy.ok');
    }
}