import { Component, Prop } from 'vue-property-decorator';
import 'vue-tables-2';
import ModuleDAO from '../../../../../../../../shared/modules/DAO/ModuleDAO';
import VarDataBaseVO from '../../../../../../../../shared/modules/Var/vos/VarDataBaseVO';
import VueComponentBase from '../../../../../VueComponentBase';
import VarsClientController from '../../../../VarsClientController';
import './VarDescExplainDepComponent.scss';

@Component({
    template: require('./VarDescExplainDepComponent.pug'),
    components: {
        Vardesccontrollercomponent: () => import(/* webpackChunkName: "VarDescControllerComponent" */ '../../controller/VarDescControllerComponent'),
        Vardescparamfieldscomponent: () => import(/* webpackChunkName: "VarDescParamFieldsComponent" */ '../../param_fields/VarDescParamFieldsComponent')
    }
})
export default class VarDescExplainDepComponent extends VueComponentBase {

    @Prop()
    private dep_id: string;

    @Prop()
    private var_id: number;

    @Prop()
    private params: VarDataBaseVO[];

    get dep_name(): string {
        if (!this.dep_id) {
            return null;
        }
        return this.t(VarsClientController.getInstance().get_translatable_dep_name(this.dep_id));
    }

    private async update_var_data(param: VarDataBaseVO) {
        param.value_ts = null;
        await ModuleDAO.getInstance().insertOrUpdateVO(param);
        this.snotify.info(this.label('var.desc_mode.update_var_data'));
    }
}