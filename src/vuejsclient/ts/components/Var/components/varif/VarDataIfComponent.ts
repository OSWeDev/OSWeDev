import { Component, Prop, Watch } from 'vue-property-decorator';
import VarDataBaseVO from '../../../../../../shared/modules/Var/vos/VarDataBaseVO';
import VarDataValueResVO from '../../../../../../shared/modules/Var/vos/VarDataValueResVO';
import VarUpdateCallback from '../../../../../../shared/modules/Var/vos/VarUpdateCallback';
import ThrottleHelper from '../../../../../../shared/tools/ThrottleHelper';
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
    public isDescMode: boolean;

    @Prop()
    public var_param: VarDataBaseVO;

    @Prop({ default: null })
    public condition: (value: VarDataValueResVO) => boolean;

    @Prop({ default: false })
    public reload_on_mount: boolean;

    @Prop({ default: false })
    public preload_content: boolean;

    private var_data: VarDataValueResVO = null;
    private throttled_var_data_updater = ThrottleHelper.getInstance().declare_throttle_without_args(this.var_data_updater.bind(this), 500, { leading: false, trailing: true });

    private varUpdateCallbacks: { [cb_uid: number]: VarUpdateCallback } = {
        [VarsClientController.get_CB_UID()]: VarUpdateCallback.newCallbackEvery(this.throttled_var_data_updater.bind(this), VarUpdateCallback.VALUE_TYPE_VALID)
    };

    private var_data_updater() {
        if (!this.var_param) {
            this.var_data = null;
            return;
        }
        this.var_data = VarsClientController.getInstance().cached_var_datas[this.var_param.index];
    }

    private async destroyed() {
        if (!this.var_param) {
            return;
        }

        await VarsClientController.getInstance().unRegisterParams([this.var_param], this.varUpdateCallbacks);
    }

    @Watch('var_param', { immediate: true })
    private async onChangeVarParam(new_var_param: VarDataBaseVO, old_var_param: VarDataBaseVO) {

        // On doit vérifier qu'ils sont bien différents
        if (VarDataBaseVO.are_same(new_var_param, old_var_param)) {
            return;
        }

        if (old_var_param) {
            await VarsClientController.getInstance().unRegisterParams([old_var_param], this.varUpdateCallbacks);
        }

        if (new_var_param) {
            await VarsClientController.getInstance().registerParams([new_var_param], this.varUpdateCallbacks);
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