import { Component, Prop } from 'vue-property-decorator';
import ModuleDAO from '../../../../../../../../../shared/modules/DAO/ModuleDAO';
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

    private async update_var_data(param: VarDataBaseVO) {
        param.value_ts = null;
        await ModuleDAO.getInstance().insertOrUpdateVO(param);
        this.snotify.info(this.label('var.desc_mode.update_var_data'));
    }
}