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
    @ModuleVarAction
    public setDescSelectedIndex: (desc_selected_index: string) => void;

    @Prop()
    public var_param: IVarDataParamVOBase;

    @Prop({ default: true })
    public load_on_mount: boolean;

    get var_index(): string {
        if (!this.var_param) {
            return null;
        }

        return VarsController.getInstance().getVarControllerById(this.var_param.var_id).varDataParamController.getIndex(this.var_param);
    }

    get var_data(): IVarDataVOBase {

        if ((!this.getVarDatas) || (!this.var_param)) {
            return null;
        }

        return this.getVarDatas[this.var_index];
    }

    @Watch('var_param', { immediate: true })
    private onChangeVarParam(new_var_param: IVarDataParamVOBase, old_var_param: IVarDataParamVOBase) {

        if (old_var_param) {
            VarsController.getInstance().unregisterDataParam(old_var_param);
        }

        if (new_var_param) {
            VarsController.getInstance().registerDataParam(new_var_param, this.load_on_mount);
        }
    }
}