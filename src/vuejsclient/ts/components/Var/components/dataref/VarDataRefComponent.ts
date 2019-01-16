import { Component, Prop, Watch } from 'vue-property-decorator';
import 'vue-tables-2';
import './VarDataRefComponent.scss';
import moment = require('moment');
import VueComponentBase from '../../../VueComponentBase';
import { ModuleVarGetter, ModuleVarAction } from '../../store/VarStore';
import IVarDataVOBase from '../../../../../../shared/modules/Var/interfaces/IVarDataVOBase';
import IVarDataParamVOBase from '../../../../../../shared/modules/Var/interfaces/IVarDataParamVOBase';
import VarsController from '../../../../../../shared/modules/Var/VarsController';
import VarGroupControllerBase from '../../../../../../shared/modules/Var/VarGroupControllerBase';

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
    private data_params: IVarDataParamVOBase;

    get var_group_controller(): VarGroupControllerBase<any, any, any> {
        if ((!this.getVarDatas) || (!this.data_params)) {
            return null;
        }

        let varGroupController: VarGroupControllerBase<any, any, any> = VarsController.getInstance().getVarGroupControllerById(this.data_params.var_group_id);
        return varGroupController;
    }

    get data_index(): string {
        if (!this.data_params) {
            return null;
        }

        return this.var_group_controller ? this.var_group_controller.varDataParamController.getIndex(this.data_params) : null;
    }

    get var_data(): IVarDataVOBase {
        if ((!this.getVarDatas) || (!this.data_params)) {
            return null;
        }

        if ((!this.data_index) || (!this.getVarDatas[this.data_index])) {
            return null;
        }

        return this.getVarDatas[this.data_index];
    }

    @Watch('dataParams', { immediate: true })
    private onChangeDataParams() {
        if (!this.data_params) {
            return;
        }
        VarsController.getInstance().stageUpdateData(this.data_params);
    }
}