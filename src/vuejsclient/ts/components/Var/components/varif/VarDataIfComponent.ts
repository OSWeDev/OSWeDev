import { Component, Prop, Watch } from 'vue-property-decorator';
import 'vue-tables-2';
import VarsController from '../../../../../../shared/modules/Var/VarsController';
import VarDataBaseVO from '../../../../../../shared/modules/Var/vos/VarDataBaseVO';
import VarDataValueResVO from '../../../../../../shared/modules/Var/vos/VarDataValueResVO';
import VueComponentBase from '../../../VueComponentBase';
import { ModuleVarGetter } from '../../store/VarStore';

@Component({
    template: require('./VarDataIfComponent.pug')
})
export default class VarDataIfComponent extends VueComponentBase {
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

        VarsController.getInstance().unregisterDataParam(this.var_param);
    }

    @Watch('var_param', { immediate: true })
    private onChangeVarParam(new_var_param: VarDataBaseVO, old_var_param: VarDataBaseVO) {

        // On doit vérifier qu'ils sont bien différents
        if (VarsController.getInstance().isSameParam(new_var_param, old_var_param)) {
            return;
        }

        if (old_var_param) {
            VarsController.getInstance().unregisterDataParam(old_var_param);
        }

        if (new_var_param) {
            VarsController.getInstance().registerDataParam(new_var_param, this.reload_on_mount);
        }
    }

    get condition_is_true(): boolean {
        if (!this.condition) {
            return false;
        }

        return this.condition(this.var_data);
    }
}