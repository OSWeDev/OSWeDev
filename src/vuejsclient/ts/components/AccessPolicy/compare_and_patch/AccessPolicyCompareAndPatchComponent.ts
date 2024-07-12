import CodeMirror from 'vue-codemirror6';
import Component from 'vue-class-component';
import VueComponentBase from '../../../../ts/components/VueComponentBase';
import './AccessPolicyCompareAndPatchComponent.scss';
import RoleVO from '../../../../../shared/modules/AccessPolicy/vos/RoleVO';
import { query } from '../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import Dates from '../../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import AccessPolicyVO from '../../../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import ModuleAccessPolicy from '../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ConsoleHandler from '../../../../../shared/tools/ConsoleHandler';
import { all_promises } from '../../../../../shared/tools/PromiseTools';

@Component({
    template: require('./AccessPolicyCompareAndPatchComponent.pug'),
    components: {
        CodeMirror,
    }
})
export default class AccessPolicyCompareAndPatchComponent extends VueComponentBase {


    private roles: RoleVO[] = [];

    private role_a: RoleVO = null;
    private role_b: RoleVO = null;

    private comparison_summary: {
        rights_in_a_not_in_b: AccessPolicyVO[],
        rights_in_b_not_in_a: AccessPolicyVO[],
    } = null;

    private patch_code: string = null;


    private async mounted() {
        this.roles = await query(RoleVO.API_TYPE_ID).select_vos<RoleVO>();
    }

    private async select_role(role: RoleVO) {
        if (this.role_a) {
            this.role_b = role;
            await this.compare();
        } else {
            this.role_a = role;
        }
    }

    private async compare() {

        // Il nous faut la matrice des droits
        // Pour chaque cas où il manque dans A et pas dans B, on ajoute dans la liste 'rights_in_a_not_in_b'
        // Pour chaque cas où il manque dans B et pas dans A, on ajoute dans la liste 'rights_in_b_not_in_a'
        if (!this.role_a || !this.role_b) {
            return;
        }

        const access_matrix = await ModuleAccessPolicy.getInstance().getAccessMatrix(false);

        const rights_in_a_not_in_b: AccessPolicyVO[] = [];
        const rights_in_b_not_in_a: AccessPolicyVO[] = [];

        const promises = [];
        for (const policy_id in access_matrix) {
            const policy_access_matrix = access_matrix[policy_id];

            if ((!policy_access_matrix[this.role_a.id]) && !!policy_access_matrix[this.role_b.id]) {
                promises.push((async () => {
                    rights_in_b_not_in_a.push(await query(AccessPolicyVO.API_TYPE_ID).filter_by_id(parseInt(policy_id)).select_vo<AccessPolicyVO>());
                })());
            }

            if (policy_access_matrix[this.role_a.id] && !policy_access_matrix[this.role_b.id]) {
                promises.push((async () => {
                    rights_in_a_not_in_b.push(await query(AccessPolicyVO.API_TYPE_ID).filter_by_id(parseInt(policy_id)).select_vo<AccessPolicyVO>());
                })());
            }
        }

        await all_promises(promises);

        this.comparison_summary = {
            rights_in_a_not_in_b: rights_in_a_not_in_b,
            rights_in_b_not_in_a: rights_in_b_not_in_a,
        };
    }

    private async generate_patch_code() {
        if (!this.role_a || !this.role_b) {
            return;
        }

        if (!this.comparison_summary) {
            await this.compare();
        }

        const class_name = 'Patch' + Dates.format(Dates.now(), 'YYYYMMDD') + 'UpdateRightsOfRoleId' + this.role_b.id;
        let patch_code =
            '/* istanbul ignore file: no unit tests on patchs */' + '\n' +
            '\n' +
            '// IF project patch : ' + '\n' +
            'import PostModulesPoliciesPatchBase from "oswedev/dist/generator/patchs/PostModulesPoliciesPatchBase"; ' + '\n' +
            '// ELSE' + '\n' +
            '// import PostModulesPoliciesPatchBase from "../PostModulesPoliciesPatchBase";' + '\n' +
            '\n' +
            'export default class ' + class_name + ' extends PostModulesPoliciesPatchBase {' + '\n' +
            '\n' +
            '   public static getInstance(): ' + class_name + ' {' + '\n' +
            '       if (!' + class_name + '.instance) {' + '\n' +
            '           ' + class_name + '.instance = new ' + class_name + '();' + '\n' +
            '       }' + '\n' +
            '       return ' + class_name + '.instance;' + '\n' +
            '   }' + '\n' +
            '\n' +
            '   private static instance: ' + class_name + ' = null;' + '\n' +
            '\n' +
            '   private constructor() {' + '\n' +
            '       super(\'' + class_name + '\');' + '\n' +
            '   }' + '\n' +
            '\n' +
            '   protected async do_policies_activations(' + '\n' +
            '       roles_ids_by_name: { [role_name: string]: number },' + '\n' +
            '       policies_ids_by_name: { [policy_name: string]: number }' + '\n' +
            '   ) {' + '\n';

        // Ajout des droits manquants
        for (const i in this.comparison_summary.rights_in_a_not_in_b) {
            const access_policy = this.comparison_summary.rights_in_a_not_in_b[i];

            patch_code +=
                '       await this.activate_policy(' + '\n' +
                '           ' + access_policy.id + ', ' + '\n' +
                '           ' + this.role_b.id + '\n' +
                '       ); ' + '\n';
        }

        // Retrait des droits en trop
        for (const i in this.comparison_summary.rights_in_b_not_in_a) {
            const access_policy = this.comparison_summary.rights_in_b_not_in_a[i];

            patch_code +=
                '       await this.revoke_policy(' + '\n' +
                '           ' + access_policy.id + ', ' + '\n' +
                '           ' + this.role_b.id + '\n' +
                '       ); ' + '\n';
        }

        patch_code +=
            '   }' + '\n' +
            '}';

        this.patch_code = patch_code;
    }

    private async do_update() {
        if (!this.role_a || !this.role_b) {
            return;
        }

        if (!this.comparison_summary) {
            await this.compare();
        }

        const self = this;
        self.snotify.confirm(self.label('AccessPolicyCompareAndPatchComponent.do_update.confirmation.body'), self.label('AccessPolicyCompareAndPatchComponent.do_update.confirmation.title'), {
            timeout: 10000,
            showProgressBar: true,
            closeOnClick: false,
            pauseOnHover: true,
            buttons: [
                {
                    text: self.t('YES'),
                    action: async (toast) => {
                        self.$snotify.remove(toast.id);
                        self.snotify.async(self.label('AccessPolicyCompareAndPatchComponent.do_update.start'), () =>
                            new Promise(async (resolve, reject) => {

                                try {

                                    // Ajout des droits manquants
                                    for (const i in self.comparison_summary.rights_in_a_not_in_b) {
                                        const access_policy = self.comparison_summary.rights_in_a_not_in_b[i];

                                        await ModuleAccessPolicy.getInstance().togglePolicy(access_policy.id, self.role_b.id);
                                    }

                                    // Retrait des droits en trop
                                    for (const i in self.comparison_summary.rights_in_b_not_in_a) {
                                        const access_policy = self.comparison_summary.rights_in_b_not_in_a[i];

                                        await ModuleAccessPolicy.getInstance().togglePolicy(access_policy.id, self.role_b.id);
                                    }
                                    resolve({
                                        body: self.label('AccessPolicyCompareAndPatchComponent.do_update.ok'),
                                        config: {
                                            timeout: 10000,
                                            showProgressBar: true,
                                            closeOnClick: false,
                                            pauseOnHover: true,
                                        }
                                    });

                                    await self.compare();
                                } catch (error) {
                                    ConsoleHandler.error(error);
                                }

                                reject({
                                    body: self.label('AccessPolicyCompareAndPatchComponent.do_update.failed'),
                                    config: {
                                        timeout: 10000,
                                        showProgressBar: true,
                                        closeOnClick: false,
                                        pauseOnHover: true,
                                    }
                                });
                            })
                        );
                    }
                }
            ]
        });
    }
}