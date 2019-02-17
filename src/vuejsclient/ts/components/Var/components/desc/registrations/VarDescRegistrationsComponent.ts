import { Component, Prop, Watch } from 'vue-property-decorator';
import 'vue-tables-2';
import './VarDescRegistrationsComponent.scss';
import moment = require('moment');
import { ModuleVarGetter, ModuleVarAction } from '../../../store/VarStore';
import IVarDataParamVOBase from '../../../../../../../shared/modules/Var/interfaces/IVarDataParamVOBase';
import VueComponentBase from '../../../../VueComponentBase';
import VarsController from '../../../../../../../shared/modules/Var/VarsController';
import SimpleNumberVarDataController from '../../../../../../../shared/modules/Var/simple_vars/SimpleNumberVarDataController';
import VarDAGNode from '../../../../../../../shared/modules/Var/graph/var/VarDAGNode';

@Component({
    template: require('./VarDescRegistrationsComponent.pug')
})
export default class VarDescRegistrationsComponent extends VueComponentBase {

    @ModuleVarGetter
    public getDescSelectedIndex: string;
    @ModuleVarAction
    public setDescSelectedIndex: (desc_selected_index: string) => void;

    get registered_indexes(): { [paramIndex: string]: VarDAGNode } {
        return VarsController.getInstance().varDAG.nodes;
    }

    private is_selected_var(var_index: string): boolean {
        return this.getDescSelectedIndex == var_index;
    }

    private index_name(paramIndex: string): string {
        try {
            return this.t(VarsController.getInstance().get_translatable_name_code(VarsController.getInstance().varDAG.nodes[paramIndex].param.var_id));
        } catch (error) {
            console.error(error);
        }
        return null;
    }

    private index_params(paramIndex: string): string {
        try {
            let param: IVarDataParamVOBase = VarsController.getInstance().varDAG.nodes[paramIndex].param;
            return this.t(VarsController.getInstance().get_translatable_params_desc_code(param.var_id), param);
        } catch (error) {
            console.error(error);
        }
        return null;
    }

    private selectVar(index: string) {
        this.setDescSelectedIndex(index);
    }
}