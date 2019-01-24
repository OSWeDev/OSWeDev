import { Component, Prop, Watch } from 'vue-property-decorator';
import 'vue-tables-2';
import './VarDataRefComponent.scss';
import moment = require('moment');
import VueComponentBase from '../../../VueComponentBase';
import { ModuleVarGetter, ModuleVarAction } from '../../store/VarStore';
import IVarDataVOBase from '../../../../../../shared/modules/Var/interfaces/IVarDataVOBase';
import IVarDataParamVOBase from '../../../../../../shared/modules/Var/interfaces/IVarDataParamVOBase';
import VarsController from '../../../../../../shared/modules/Var/VarsController';
import VarControllerBase from '../../../../../../shared/modules/Var/VarControllerBase';

@Component({
    template: require('./VarDataRefComponent.pug')
})
export default class VarDataRefComponent extends VueComponentBase {
    @ModuleVarGetter
    public getVarDatas: { [paramIndex: string]: IVarDataVOBase };
    @ModuleVarGetter
    public is_updating: boolean;
    @ModuleVarAction
    public setVarData: (varData: IVarDataVOBase) => void;
    @ModuleVarAction
    public removeVarData: (varDataParam: IVarDataParamVOBase) => void;
    @ModuleVarAction
    public setIsUpdating: (is_updating: boolean) => void;

    @Prop()
    private datas_params: IVarDataParamVOBase[];

    get datas_params_by_index(): { [index: string]: IVarDataParamVOBase } {
        let res: { [index: string]: IVarDataParamVOBase } = {};

        for (let i in this.datas_params) {
            let data_params: IVarDataParamVOBase = this.datas_params[i];

            let varController: VarControllerBase<any, any, any> = VarsController.getInstance().getVarControllerById(data_params.var_id);

            res[varController.varDataParamController.getIndex(data_params)] = data_params;
        }

        return res;
    }

    get datas_by_index(): { [index: string]: IVarDataVOBase } {
        let res: { [index: string]: IVarDataVOBase } = {};

        if ((!this.getVarDatas) || (!this.datas_params)) {
            return null;
        }

        for (let i in this.datas_params) {
            let data_params: IVarDataParamVOBase = this.datas_params[i];

            let varController: VarControllerBase<any, any, any> = VarsController.getInstance().getVarControllerById(data_params.var_id);
            let data_index: string = varController.varDataParamController.getIndex(data_params);

            res[data_index] = this.getVarDatas[data_index];
        }

        return res;
    }

    get datas_array(): IVarDataVOBase[] {
        let res: IVarDataVOBase[] = [];

        if ((!this.getVarDatas) || (!this.datas_params)) {
            return null;
        }

        for (let i in this.datas_params) {
            let data_params: IVarDataParamVOBase = this.datas_params[i];

            let varController: VarControllerBase<any, any, any> = VarsController.getInstance().getVarControllerById(data_params.var_id);
            let data_index: string = varController.varDataParamController.getIndex(data_params);

            res.push(this.getVarDatas[data_index]);
        }

        return res;
    }

    @Watch('dataParams', { immediate: true })
    private onChangeDataParams(new_datas_params: IVarDataParamVOBase[], old_datas_params: IVarDataParamVOBase[]) {

        if (old_datas_params && old_datas_params.length) {
            for (let i in old_datas_params) {
                let data_params: IVarDataParamVOBase = old_datas_params[i];

                VarsController.getInstance().unregisterDataParam(data_params);
            }
        }

        if (!this.datas_params) {
            return;
        }

        for (let i in this.datas_params) {
            let data_params: IVarDataParamVOBase = this.datas_params[i];

            VarsController.getInstance().registerDataParam(data_params);
        }
    }
}