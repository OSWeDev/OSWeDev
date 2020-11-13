import { Component, Prop, Watch } from 'vue-property-decorator';
import VarDataBaseVO from '../../../../../../shared/modules/Var/vos/VarDataBaseVO';
import VarDataValueResVO from '../../../../../../shared/modules/Var/vos/VarDataValueResVO';
import VueComponentBase from '../../../VueComponentBase';
import { ModuleVarAction, ModuleVarGetter } from '../../store/VarStore';
import VarsClientController from '../../VarsClientController';

@Component({
    template: require('./VarDataIfComponent.pug')
})
export default class VarDataIfComponent extends VueComponentBase {
    @ModuleVarAction
    public setDescSelectedVarParam: (desc_selected_var_param: VarDataBaseVO) => void;

    @ModuleVarGetter
    public getVarDatas: { [paramIndex: string]: VarDataValueResVO };
    @ModuleVarGetter
    public isDescMode: boolean;

    @Prop()
    public var_param: VarDataBaseVO;

    @Prop({ default: null })
    public condition: (value: VarDataValueResVO) => boolean;

    @Prop({ default: false })
    public reload_on_mount: boolean;

    @Prop({ default: false })
    public preload_content: boolean;

    get var_data(): VarDataValueResVO {

        if ((!this.getVarDatas) || (!this.var_param)) {
            return null;
        }

        return this.getVarDatas[this.var_param.index];
    }

    public destroyed() {

        VarsClientController.getInstance().unRegisterParams([this.var_param]);
    }

    @Watch('var_param', { immediate: true })
    private onChangeVarParam(new_var_param: VarDataBaseVO, old_var_param: VarDataBaseVO) {

        // On doit vérifier qu'ils sont bien différents
        if (VarDataBaseVO.are_same(new_var_param, old_var_param)) {
            return;
        }

        if (old_var_param) {
            VarsClientController.getInstance().unRegisterParams([old_var_param]);
        }

        if (new_var_param) {
            VarsClientController.getInstance().registerParams([new_var_param]);
        }
    }

    get condition_is_true(): boolean {
        if (!this.condition) {
            return false;
        }

        return this.condition(this.var_data);
    }

    private selectVar() {
        if (!this.isDescMode) {
            return;
        }

        this.setDescSelectedVarParam(this.var_param);
    }
}