import { Component, Prop } from 'vue-property-decorator';
import VarDataBaseVO from '../../../../../../../shared/modules/Var/vos/VarDataBaseVO';
import VueComponentBase from '../../../../VueComponentBase';
import { ModuleVarAction } from '../../../store/VarStore';
import './VarDatasRefsParamSelectComponent.scss';

@Component({
    template: require('./VarDatasRefsParamSelectComponent.pug')
})
export default class VarDatasRefsParamSelectComponent extends VueComponentBase {

    @ModuleVarAction
    public setDescSelectedVarParam: (desc_selected_var_param: VarDataBaseVO) => void;

    @Prop()
    public var_params: VarDataBaseVO[];
}