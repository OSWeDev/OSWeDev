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

    @Prop()
    public var_param: IVarDataParamVOBase;

    public mounted() {
        console.error('VarDataRefComponent:' + JSON.stringify(this.var_param));
    }

    get var_data(): IVarDataVOBase {

        console.error('VarDataRefComponent:var_data1:' + JSON.stringify(this.var_param));

        if ((!this.getVarDatas) || (!this.var_param)) {
            return null;
        }

        let varController: VarControllerBase<any, any> = VarsController.getInstance().getVarControllerById(this.var_param.var_id);
        let data_index: string = varController.varDataParamController.getIndex(this.var_param);
        console.error('VarDataRefComponent:var_data2:' + JSON.stringify(this.getVarDatas[data_index]));
        return this.getVarDatas[data_index];
    }

    @Watch('var_param', { immediate: true })
    private onChangeVarParam(new_var_param: IVarDataParamVOBase, old_var_param: IVarDataParamVOBase) {
        console.error('VarDataRefComponent:var_param:' + JSON.stringify(this.var_param));

        if (old_var_param) {
            VarsController.getInstance().unregisterDataParam(old_var_param);
        }

        if (new_var_param) {
            VarsController.getInstance().registerDataParam(new_var_param);
        }
    }
}