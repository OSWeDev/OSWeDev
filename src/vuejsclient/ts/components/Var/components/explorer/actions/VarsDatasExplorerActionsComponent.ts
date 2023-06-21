import { Component } from 'vue-property-decorator';
import { query } from '../../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import MatroidController from '../../../../../../../shared/modules/Matroid/MatroidController';
import ModuleVar from '../../../../../../../shared/modules/Var/ModuleVar';
import VarDataBaseVO from '../../../../../../../shared/modules/Var/vos/VarDataBaseVO';
import VOsTypesManager from '../../../../../../../shared/modules/VO/manager/VOsTypesManager';
import RangeHandler from '../../../../../../../shared/tools/RangeHandler';
import VueComponentBase from '../../../../VueComponentBase';
import { ModuleVarsDatasExplorerVuexAction, ModuleVarsDatasExplorerVuexGetter } from '../VarsDatasExplorerVuexStore';
import './VarsDatasExplorerActionsComponent.scss';

@Component({
    template: require('./VarsDatasExplorerActionsComponent.pug'),
})
export default class VarsDatasExplorerActionsComponent extends VueComponentBase {

    @ModuleVarsDatasExplorerVuexGetter
    private get_filter_params: VarDataBaseVO[];

    @ModuleVarsDatasExplorerVuexAction
    private set_filtered_datas: (filtered_datas: { [index: string]: VarDataBaseVO }) => void;

    private busy: boolean = false;

    get visible(): boolean {
        return this.get_filter_params && !!this.get_filter_params.length;
    }

    get can_act(): boolean {
        return this.visible && !this.busy;
    }

    get can_show_exact(): boolean {

        if ((!this.get_filter_params) || (this.get_filter_params.length != 1)) {
            return false;
        }

        let filter_param = this.get_filter_params[0];

        if (!filter_param.var_id) {
            return false;
        }

        // Pour des raisons de sécurité pour le moment on empeche de faire les demandes avec des maxranges
        let matroid_bases = MatroidController.getInstance().getMatroidBases(filter_param);
        let moduleTable = VOsTypesManager.moduleTables_by_voType[filter_param._type];
        for (let i in matroid_bases) {
            let matroid_base = matroid_bases[i];

            let max_range = RangeHandler.getMaxRange(moduleTable.get_field_by_id(matroid_base.field_id));

            if ((RangeHandler.getSegmentedMax_from_ranges(matroid_base.ranges) == RangeHandler.getSegmentedMax(max_range)) ||
                (RangeHandler.getSegmentedMin_from_ranges(matroid_base.ranges) == RangeHandler.getSegmentedMin(max_range))) {
                return false;
            }
        }

        return true;
    }

    private show_exact() {
        if (!this.can_show_exact) {
            return;
        }

        let filter_param = this.get_filter_params[0];

        this.set_filtered_datas({
            [filter_param.index]: filter_param
        });
    }

    private async get_exact() {
        if (!this.can_act) {
            return;
        }

        this.busy = true;

        let res: { [index: string]: VarDataBaseVO } = {};
        for (let i in this.get_filter_params) {
            let filter_param = this.get_filter_params[i];

            let datas: VarDataBaseVO[] = await ModuleDAO.getInstance().getVosByExactMatroids(filter_param._type, [filter_param], null);
            for (let j in datas) {
                let data = datas[j];
                res[data.index] = data;
            }
        }

        this.set_filtered_datas(res);

        this.busy = false;
    }

    private async get_intersection() {
        if (!this.can_act) {
            return;
        }

        this.busy = true;

        let res: { [index: string]: VarDataBaseVO } = {};
        for (let i in this.get_filter_params) {
            let filter_param = this.get_filter_params[i];

            let datas: VarDataBaseVO[] = await query(filter_param._type)
                .filter_by_matroids_intersection([filter_param])
                .select_vos<VarDataBaseVO>();

            for (let j in datas) {
                let data = datas[j];
                res[data.index] = data;
            }
        }

        this.set_filtered_datas(res);

        this.busy = false;
    }

    private async get_included() {
        if (!this.can_act) {
            return;
        }

        this.busy = true;

        let res: { [index: string]: VarDataBaseVO } = {};
        for (let i in this.get_filter_params) {
            let filter_param = this.get_filter_params[i];

            let datas: VarDataBaseVO[] = await query(filter_param._type)
                .filter_by_matroids_inclusion([filter_param])
                .select_vos<VarDataBaseVO>();

            for (let j in datas) {
                let data = datas[j];
                res[data.index] = data;
            }
        }

        /**
         * on veut retirer les valeurs strictement égales
         */
        for (let i in this.get_filter_params) {
            let filter_param = this.get_filter_params[i];

            if (res[filter_param.index]) {
                delete res[filter_param.index];
            }
        }

        this.set_filtered_datas(res);

        this.busy = false;
    }

    private async invalidate_cache_intersection_and_depstree() {
        if (!this.can_act) {
            return;
        }

        this.busy = true;

        await ModuleVar.getInstance().invalidate_cache_intersection_and_parents(this.get_filter_params);

        this.busy = false;
    }

    // private async invalidate_cache_intersection() {
    //     if (!this.can_act) {
    //         return;
    //     }

    //     this.busy = true;

    //     await ModuleVar.getInstance().invalidate_cache_intersection(this.get_filter_params);

    //     this.busy = false;
    // }

    private async delete_cache_intersection() {
        if (!this.can_act) {
            return;
        }

        this.busy = true;

        await ModuleVar.getInstance().delete_cache_intersection(this.get_filter_params);

        this.busy = false;
    }

    private async delete_cache_and_import_intersection() {
        if (!this.can_act) {
            return;
        }

        let self = this;
        self.snotify.confirm(self.label('vars_datas_explorer_actions.delete_cache_and_import_intersection.body'), self.label('vars_datas_explorer_actions.delete_cache_and_import_intersection.title'), {
            timeout: 10000,
            showProgressBar: true,
            closeOnClick: false,
            pauseOnHover: true,
            buttons: [
                {
                    text: self.t('YES'),
                    action: async (toast) => {
                        self.$snotify.remove(toast.id);
                        self.snotify.async(self.label('vars_datas_explorer_actions.delete_cache_and_import_intersection.start'), () =>
                            new Promise(async (resolve, reject) => {

                                self.busy = true;
                                await ModuleVar.getInstance().delete_cache_and_imports_intersection(self.get_filter_params);
                                self.busy = false;

                                resolve({
                                    body: self.label('vars_datas_explorer_actions.delete_cache_and_import_intersection.ok'),
                                    config: {
                                        timeout: 10000,
                                        showProgressBar: true,
                                        closeOnClick: false,
                                        pauseOnHover: true,
                                    },
                                });
                            })
                        );
                    },
                    bold: false
                },
                {
                    text: self.t('NO'),
                    action: (toast) => {
                        self.$snotify.remove(toast.id);
                    }
                }
            ]
        });
    }
}
