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
import PushDataVueModule from '../../../../modules/PushData/PushDataVueModule';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';

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

    private currently_registered_params: VarDataBaseVO[] = null;
    private semaphore_unregister: boolean = false;
    private semaphore_register: boolean = false;

    private been_destroyed: boolean = false;

    private var_datas: VarDataValueResVO[] = [];
    private throttled_var_datas_updater = ThrottleHelper.declare_throttle_without_args(this.var_datas_updater.bind(this), 200, { leading: false, trailing: true });

    private throttled_unregister = ThrottleHelper.declare_throttle_without_args(this.unregister.bind(this), 200, { leading: true, trailing: true });
    private throttled_register = ThrottleHelper.declare_throttle_without_args(this.register.bind(this), 200, { leading: true, trailing: true });

    private varUpdateCallbacks: { [cb_uid: number]: VarUpdateCallback } = {
        [VarsClientController.get_CB_UID()]: VarUpdateCallback.newCallbackEvery(
            (async (varData: VarDataBaseVO | VarDataValueResVO) => {

                if (PushDataVueModule.getInstance().env_params && PushDataVueModule.getInstance().env_params.debug_vars_notifs) {
                    if (varData) {
                        ConsoleHandler.log('VarDatasRefsComponent:varUpdateCallbacks:' + varData.index + ':' + varData.value + ':' + varData.value_ts + ':' + varData.value_type + ':');
                    } else {
                        ConsoleHandler.log('VarDatasRefsComponent:varUpdateCallbacks:null');
                    }
                }

                await this.throttled_var_datas_updater();
            }).bind(this),
            VarUpdateCallback.VALUE_TYPE_ALL
        )
    };

    get is_being_updated(): boolean {

        // Si la var data est null on considère qu'elle est en cours de chargement. C'est certainement faux, souvent, mais ça peut aider beaucoup pour afficher au plus tôt le fait que la var est en attente de calcul
        if (!this.var_datas) {
            return true;
        }

        for (const i in this.var_datas) {
            const var_data = this.var_datas[i];

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

        if (this.filter_additional_params) {
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

    get is_computing() {
        if (!this.var_datas) {
            return false;
        }

        for (const i in this.var_datas) {
            const var_data = this.var_datas[i];

            if (var_data && var_data.is_computing) {
                return true;
            }
        }

        return false;
    }

    @Watch('var_params')
    private onChangeVarParam(new_var_params: VarDataBaseVO[], old_var_params: VarDataBaseVO[]) {

        if ((!new_var_params) && (!old_var_params)) {
            return;
        }

        // On doit vérifier qu'ils sont bien différents
        if (VarsController.isSameParamArray(new_var_params, old_var_params)) {
            return;
        }

        this.throttled_register();
    }

    private var_datas_updater() {
        const var_datas: VarDataValueResVO[] = [];
        for (const i in this.var_params) {
            const var_param = this.var_params[i];
            var_datas.push(VarsClientController.cached_var_datas[var_param.index]);
        }
        this.var_datas = var_datas;
    }

    private destroyed() {
        this.been_destroyed = true;
        this.unregister();
    }

    private mounted() {
        this.intersect_in();
    }

    private async intersect_in() {
        this.entered_once = true;

        this.throttled_register();
    }

    // private async intersect_out() {
    //     await this.unregister(this.var_params);
    // }

    private register() {
        // if (!this.entered_once) {
        //     return;
        // }

        if (this.semaphore_register) {
            return;
        }
        this.semaphore_register = true;

        const var_params = this.var_params;

        // Si on a les mêmes params déjà enregistrés, on ne fait rien
        if (VarsController.isSameParamArray(this.currently_registered_params, var_params)) {
            this.semaphore_register = false;
            return;
        }

        // Changement de méthode : on a une seule liste registered à la fois.
        //  Donc si des params sont déjà enregistrés, on les désenregistre avant d'enregistrer les nouveaux
        if (this.currently_registered_params && this.currently_registered_params.length) {
            this.unregister();
        }

        if ((!var_params) || !var_params.length) {
            return;
        }

        //vvvvvv! DEBUG DELETE ME !vvvvvv
        if (var_params[1] && var_params[1].index && var_params[1].index.startsWith('4W|') && var_params[1].index.endsWith('|1&3|P5@A;&PR:qo')) {
            ConsoleHandler.warn('VarDatasRefsComponent:register:' + var_params[1].index);
        }
        //^^^^^^! DEBUG DELETE ME !^^^^^^

        // De manière générale, si on est destroyed, on ne fait rien
        if (this.been_destroyed) {
            this.semaphore_register = false;
            return;
        }

        VarsClientController.getInstance().registerParams(var_params, this.varUpdateCallbacks);
        this.currently_registered_params = var_params;
        this.semaphore_register = false;
    }

    private unregister() {

        if (this.semaphore_unregister) {
            return;
        }
        this.semaphore_unregister = true;

        // if (!this.entered_once) {
        //     return;
        // }

        const currently_registered_params = this.currently_registered_params;
        this.currently_registered_params = null;

        if ((!currently_registered_params) || !currently_registered_params.length) {
            this.semaphore_unregister = false;
            return;
        }

        //vvvvvv! DEBUG DELETE ME !vvvvvv
        if (currently_registered_params[1] && currently_registered_params[1].index && currently_registered_params[1].index.startsWith('4W|') && currently_registered_params[1].index.endsWith('|1&3|P5@A;&PR:qo')) {
            ConsoleHandler.warn('VarDatasRefsComponent:unregister:' + currently_registered_params[1].index);
        }
        //^^^^^^! DEBUG DELETE ME !^^^^^^

        VarsClientController.getInstance().unRegisterParams(currently_registered_params, this.varUpdateCallbacks);
        this.var_datas = null;
        this.semaphore_unregister = false;
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
}