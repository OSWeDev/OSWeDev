import { Component } from 'vue-property-decorator';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import ModuleVar from '../../../../../../../shared/modules/Var/ModuleVar';
import VarDataBaseVO from '../../../../../../../shared/modules/Var/vos/VarDataBaseVO';
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

            let datas: VarDataBaseVO[] = await ModuleDAO.getInstance().filterVosByMatroidsIntersections(filter_param._type, [filter_param], null);
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

            let datas: VarDataBaseVO[] = await ModuleDAO.getInstance().filterVosByMatroids(filter_param._type, [filter_param], null);
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

    private async invalidate_cache_intersection() {
        if (!this.can_act) {
            return;
        }

        this.busy = true;

        await ModuleVar.getInstance().invalidate_cache_intersection(this.get_filter_params);

        this.busy = false;
    }

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

        this.busy = true;

        await ModuleVar.getInstance().delete_cache_and_imports_intersection(this.get_filter_params);

        this.busy = false;
    }
}
