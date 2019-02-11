import { Component, Prop, Watch } from 'vue-property-decorator';
import 'vue-tables-2';
import './VarDescRegistrationsComponent.scss';
import moment = require('moment');
import { ModuleVarGetter, ModuleVarAction } from '../../../store/VarStore';
import IVarDataParamVOBase from '../../../../../../../shared/modules/Var/interfaces/IVarDataParamVOBase';
import VueComponentBase from '../../../../VueComponentBase';
import VarsController from '../../../../../../../shared/modules/Var/VarsController';
import SimpleNumberVarDataController from '../../../../../../../shared/modules/Var/simple_vars/SimpleNumberVarDataController';

@Component({
    template: require('./VarDescRegistrationsComponent.pug')
})
export default class VarDescRegistrationsComponent extends VueComponentBase {

    @ModuleVarGetter
    public getDescSelectedIndex: string;
    @ModuleVarAction
    public setDescSelectedIndex: (desc_selected_index: string) => void;

    get registered_indexes(): { [paramIndex: string]: number } {
        return VarsController.getInstance().registeredDatasParamsIndexes;
    }

    private is_selected_var(var_index: string): boolean {
        return this.getDescSelectedIndex == var_index;
    }

    private index_name(paramIndex: string): string {
        try {
            return this.t(VarsController.getInstance().get_translatable_name_code(VarsController.getInstance().registeredDatasParams[paramIndex].var_id));
        } catch (error) {
            console.error(error);
        }
        return null;
    }

    private index_params(paramIndex: string): string {
        try {
            let param: IVarDataParamVOBase = VarsController.getInstance().registeredDatasParams[paramIndex];
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