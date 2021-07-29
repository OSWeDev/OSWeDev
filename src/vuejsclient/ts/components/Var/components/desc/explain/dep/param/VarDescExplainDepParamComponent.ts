import { Component, Prop } from 'vue-property-decorator';
import ModuleDAO from '../../../../../../../../../shared/modules/DAO/ModuleDAO';
import ModuleVar from '../../../../../../../../../shared/modules/Var/ModuleVar';
import VarDataBaseVO from '../../../../../../../../../shared/modules/Var/vos/VarDataBaseVO';
import VueComponentBase from '../../../../../../VueComponentBase';
import './VarDescExplainDepParamComponent.scss';

@Component({
    template: require('./VarDescExplainDepParamComponent.pug'),
    components: {
        Vardescparamfieldscomponent: () => import(/* webpackChunkName: "VarDescParamFieldsComponent" */ '../../../param_fields/VarDescParamFieldsComponent')
    }
})
export default class VarDescExplainDepParamComponent extends VueComponentBase {

    @Prop()
    private param: VarDataBaseVO;

    private async update_var_data() {
        if (this.param.value_type == VarDataBaseVO.VALUE_TYPE_IMPORT) {
            this.snotify.error(this.label('var.desc_mode.update_var_data.not_allowed_on_imports'));
            return;
        }
        await ModuleVar.getInstance().invalidate_cache_exact([this.param]);
        this.snotify.info(this.label('var.desc_mode.update_var_data'));
    }
}