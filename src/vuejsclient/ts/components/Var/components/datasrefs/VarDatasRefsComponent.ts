import { Component, Prop, Watch } from 'vue-property-decorator';
import VarsController from '../../../../../../shared/modules/Var/VarsController';
import VarDataBaseVO from '../../../../../../shared/modules/Var/vos/VarDataBaseVO';
import VarDataValueResVO from '../../../../../../shared/modules/Var/vos/VarDataValueResVO';
import VarUpdateCallback from '../../../../../../shared/modules/Var/vos/VarUpdateCallback';
import ThrottleHelper from '../../../../../../shared/tools/ThrottleHelper';
import VueComponentBase from '../../../VueComponentBase';
import { ModuleVarGetter } from '../../store/VarStore';
import VarsClientController from '../../VarsClientController';
import VarDatasRefsParamSelectComponent from './paramselect/VarDatasRefsParamSelectComponent';
import './VarDatasRefsComponent.scss';

@Component({
    template: require('./VarDatasRefsComponent.pug')
})
export default class VarDatasRefsComponent extends VueComponentBase {

    private static UID: number = 0;

    @ModuleVarGetter
    public isDescMode: boolean;

    @Prop()
    public var_params: VarDataBaseVO[];

    @Prop({ default: null })
    public var_value_callback: (var_values: VarDataValueResVO[], component: VarDatasRefsComponent) => any;

    @Prop({ default: null })
    public filter: () => any;

    @Prop({ default: null })
    public filter_additional_params: any[];

    @Prop({ default: false })
    public reload_on_mount: boolean;

    @Prop({ default: null })
    public prefix: string;

    @Prop({ default: null })
    public suffix: string;

    @Prop({ default: null })
    public null_value_replacement: string;

    @Prop({ default: null })
    public zero_value_replacement: string;

    @Prop({ default: false })
    public consider_zero_value_as_null: boolean;

    private entered_once: boolean = false;

    private this_uid: number = VarDatasRefsComponent.UID++;

    private var_datas: VarDataValueResVO[] = [];
    private throttled_var_datas_updater = ThrottleHelper.declare_throttle_without_args(this.var_datas_updater.bind(this), 500, { leading: false, trailing: true });

    private varUpdateCallbacks: { [cb_uid: number]: VarUpdateCallback } = {
        [VarsClientController.get_CB_UID()]: VarUpdateCallback.newCallbackEvery(this.throttled_var_datas_updater.bind(this), VarUpdateCallback.VALUE_TYPE_ALL)
    };

    private var_datas_updater() {
        let var_datas: VarDataValueResVO[] = [];
        for (let i in this.var_params) {
            let var_param = this.var_params[i];
            var_datas.push(VarsClientController.cached_var_datas[var_param.index]);
        }
        this.var_datas = var_datas;
    }

    get is_being_updated(): boolean {

        // Si la var data est null on considère qu'elle est en cours de chargement. C'est certainement faux, souvent, mais ça peut aider beaucoup pour afficher au plus tôt le fait que la var est en attente de calcul
        if (!this.var_datas) {
            return true;
        }

        for (let i in this.var_datas) {
            let var_data = this.var_datas[i];

            if ((!var_data) || (typeof var_data.value === 'undefined') || var_data.is_computing) {
                return true;
            }
        }

        return false;
    }

    get filtered_value() {

        if (!this.var_datas) {
            return null;
        }

        if (!this.filter) {

            return this.var_data_value;
        }

        let params = [this.var_data_value];

        if (!!this.filter_additional_params) {
            params = params.concat(this.filter_additional_params);
        }

        return this.filter.apply(null, params);
    }

    get var_data_value() {

        if (!this.var_value_callback) {
            return null;
        }

        if ((!this.var_datas) || (!this.var_params) || (this.var_datas.length != this.var_params.length)) {
            return null;
        }

        return this.var_value_callback(this.var_datas, this);
    }

    get is_selected_var(): boolean {
        return false;
    }

    private async destroyed() {
        await this.unregister(this.var_params);
    }

    private async mounted() {
        await this.intersect_in();
    }

    private async intersect_in() {
        this.entered_once = true;

        await this.register(this.var_params);
    }

    private async intersect_out() {
        await this.unregister(this.var_params);
    }

    private async register(var_params: VarDataBaseVO[]) {
        if (!this.entered_once) {
            return;
        }

        if (var_params && var_params.length) {
            await VarsClientController.getInstance().registerParams(var_params, this.varUpdateCallbacks);
        }
    }

    private async unregister(var_params: VarDataBaseVO[]) {
        if (!this.entered_once) {
            return;
        }

        this.var_datas = null;

        if (var_params && var_params.length) {
            await VarsClientController.getInstance().unRegisterParams(var_params, this.varUpdateCallbacks);
        }
    }

    @Watch('var_params')
    private async onChangeVarParam(new_var_params: VarDataBaseVO[], old_var_params: VarDataBaseVO[]) {

        if ((!new_var_params) && (!old_var_params)) {
            return;
        }

        // On doit vérifier qu'ils sont bien différents
        if (VarsController.isSameParamArray(new_var_params, old_var_params)) {
            return;
        }

        if (old_var_params && old_var_params.length) {
            await this.unregister(old_var_params);
        }

        if (new_var_params) {
            await this.register(new_var_params);
        }
    }

    private selectVar() {
        if (!this.isDescMode) {
            return;
        }

        /**
         * On ouvre la modal qui propose de choisir la var à sélectionner
         */
        this.$modal.show(
            VarDatasRefsParamSelectComponent,
            { var_params: this.var_params },
            {
                width: 465,
                height: 'auto',
                scrollable: true
            }
        );
    }

    get is_computing() {
        if (!this.var_datas) {
            return false;
        }

        for (let i in this.var_datas) {
            let var_data = this.var_datas[i];

            if (var_data && var_data.is_computing) {
                return true;
            }
        }

        return false;
    }
}