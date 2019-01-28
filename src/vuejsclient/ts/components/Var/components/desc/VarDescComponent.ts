import { Component, Prop, Watch } from 'vue-property-decorator';
import 'vue-tables-2';
import './VarDescComponent.scss';
import moment = require('moment');
import VueComponentBase from '../../../VueComponentBase';
import { ModuleVarGetter, ModuleVarAction } from '../../store/VarStore';
import IVarDataVOBase from '../../../../../../shared/modules/Var/interfaces/IVarDataVOBase';
import IVarDataParamVOBase from '../../../../../../shared/modules/Var/interfaces/IVarDataParamVOBase';
import VarsController from '../../../../../../shared/modules/Var/VarsController';
import VarControllerBase from '../../../../../../shared/modules/Var/VarControllerBase';

@Component({
    template: require('./VarDescComponent.pug')
})
export default class VarDescComponent extends VueComponentBase {

    @Prop()
    public var_param: IVarDataParamVOBase;

    get var_name(): string {
        return this.t(VarsController.getInstance().getVarControllerById(this.var_param.var_id).varConf.translatable_name, this.var_param);
    }

    get var_description(): string {
        return this.t(VarsController.getInstance().getVarControllerById(this.var_param.var_id).varConf.translatable_description, this.var_param);
    }

    get var_params_desc(): string {
        return this.t(
            VarsController.getInstance().getVarControllerById(this.var_param.var_id).varConf.translatable_params_desc, this.var_param);
    }

    get var_deps(): IVarDataParamVOBase[] {
        return VarsController.getInstance().last_batch_dependencies_by_param[
            VarsController.getInstance().getVarControllerById(this.var_param.var_id).varDataParamController.getIndex(this.var_param)];
    }
}