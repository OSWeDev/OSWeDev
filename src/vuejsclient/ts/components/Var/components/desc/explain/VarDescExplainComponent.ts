import { Component, Prop, Watch } from 'vue-property-decorator';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import IRange from '../../../../../../../shared/modules/DataRender/interfaces/IRange';
import MatroidController from '../../../../../../../shared/modules/Matroid/MatroidController';
import MainAggregateOperatorsHandlers from '../../../../../../../shared/modules/Var/MainAggregateOperatorsHandlers';
import ModuleVar from '../../../../../../../shared/modules/Var/ModuleVar';
import VarsController from '../../../../../../../shared/modules/Var/VarsController';
import VarConfVO from '../../../../../../../shared/modules/Var/vos/VarConfVO';
import VarDataBaseVO from '../../../../../../../shared/modules/Var/vos/VarDataBaseVO';
import VarDataValueResVO from '../../../../../../../shared/modules/Var/vos/VarDataValueResVO';
import VarUpdateCallback from '../../../../../../../shared/modules/Var/vos/VarUpdateCallback';
import ObjectHandler from '../../../../../../../shared/tools/ObjectHandler';
import { all_promises } from '../../../../../../../shared/tools/PromiseTools';
import RangeHandler from '../../../../../../../shared/tools/RangeHandler';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';
import InlineTranslatableText from '../../../../InlineTranslatableText/InlineTranslatableText';
import VueComponentBase from '../../../../VueComponentBase';
import VarsClientController from '../../../VarsClientController';
import './VarDescExplainComponent.scss';

@Component({
    template: require('./VarDescExplainComponent.pug'),
    components: {
        Inlinetranslatabletext: InlineTranslatableText,
        Vardescexplaindepcomponent: () => import('./dep/VarDescExplainDepComponent'),
        Vardescexplaindscomponent: () => import('./ds/VarDescExplainDsComponent'),
        Vardescexplainimportscomponent: () => import('./imports/VarDescExplainImportsComponent'),
    }
})
export default class VarDescExplainComponent extends VueComponentBase {

    @Prop()
    private var_param: VarDataBaseVO;

    private deps_loading: boolean = true;
    private deps_params: { [dep_id: string]: VarDataBaseVO } = {};
    private vars_deps: { [dep_name: string]: string } = {};

    private limit_10_var_deps: boolean = true;

    private ds_values_jsoned: { [ds_name: string]: string } = null;

    private opened: boolean = true;
    private opened_public: boolean = true;

    private var_data: VarDataValueResVO = null;
    private var_datas_deps: VarDataValueResVO[] = [];
    private var_conf: VarConfVO = null;

    private aggregated_var_datas: { [var_data_index: string]: VarDataBaseVO } = {};

    private throttled_var_datas_updater = ThrottleHelper.getInstance().declare_throttle_without_args(this.var_datas_updater.bind(this), 500, { leading: false, trailing: true });

    private varUpdateCallbacks: { [cb_uid: number]: VarUpdateCallback } = {
        [VarsClientController.get_CB_UID()]: VarUpdateCallback.newCallbackEvery(this.throttled_var_datas_updater.bind(this), VarUpdateCallback.VALUE_TYPE_VALID)
    };

    get vars_deps_has_mode_than_10_elts() {
        return Object.keys(this.vars_deps).length > 10;
    }

    get shown_vars_deps(): { [dep_name: string]: string } {
        if (!this.vars_deps_has_mode_than_10_elts) {
            return this.vars_deps;
        }

        if (!this.limit_10_var_deps) {
            return this.vars_deps;
        }

        let res: { [dep_name: string]: string } = {};
        let i = 0;
        for (let dep_name in this.vars_deps) {
            res[dep_name] = this.vars_deps[dep_name];
            i++;
            if (i >= 10) {
                break;
            }
        }

        return res;
    }

    private async switch_show_help_tooltip() {

        if (!this.var_conf) {
            return;
        }

        this.var_conf.show_help_tooltip = !this.var_conf.show_help_tooltip;
        await ModuleDAO.getInstance().insertOrUpdateVO(this.var_conf);
    }

    get show_help_tooltip() {
        if (!this.var_conf) {
            return false;
        }

        return this.var_conf.show_help_tooltip;
    }

    private async var_datas_updater() {

        let old_value_type = this.var_data ? this.var_data.value_type : null;
        let old_value = this.var_data ? this.var_data.value : null;
        this.var_data = this.var_param ? VarsClientController.cached_var_datas[this.var_param.index] : null;

        let var_datas: VarDataValueResVO[] = [];
        for (let i in this.deps_params) {
            let dep_param = this.deps_params[i];
            var_datas.push(VarsClientController.cached_var_datas[dep_param.index]);
        }
        this.var_datas_deps = var_datas;

        let promises = [];

        // Si on a une nouvelle data on recharge les DS
        if (this.var_data && (!this.var_data.is_computing) && (old_value != null) && (old_value != this.var_data.value)) {
            promises.push((async () => this.ds_values_jsoned = await ModuleVar.getInstance().getVarParamDatas(this.var_param))());
        }

        // Si on change de type de valeur on recharge les deps et les aggregated
        if (this.var_data && (!this.var_data.is_computing) && (old_value_type != null) && (old_value_type != this.var_data.value_type)) {
            promises.push((async () => this.deps_params = await ModuleVar.getInstance().getParamDependencies(this.var_param))());
            promises.push((async () => this.vars_deps = await ModuleVar.getInstance().getVarControllerVarsDeps(VarsController.var_conf_by_id[this.var_param.var_id].name))());
            promises.push((async () => this.aggregated_var_datas = await ModuleVar.getInstance().getAggregatedVarDatas(this.var_param))());
        }

        await all_promises(promises);
    }

    get is_aggregator(): boolean {
        return ObjectHandler.hasAtLeastOneAttribute(this.aggregated_var_datas);
    }

    private var_id_from_name(name: string): number {
        return VarsController.var_conf_by_name[name].id;
    }

    get params_from_var_dep_id(): { [var_dep_id: string]: VarDataBaseVO[] } {
        let res: { [var_dep_id: string]: VarDataBaseVO[] } = {};

        for (let var_dep_id in this.vars_deps) {
            res[var_dep_id] = [];

            for (let param_dep_id in this.deps_params) {
                if (!param_dep_id.startsWith(var_dep_id)) {
                    continue;
                }

                res[var_dep_id].push(this.deps_params[param_dep_id]);
            }
        }

        return res;
    }

    // private params_from_var_dep_id(var_dep_id: string): VarDataBaseVO[] {
    //     let res: VarDataBaseVO[] = [];

    //     for (let param_dep_id in this.deps_params) {
    //         if (!param_dep_id.startsWith(var_dep_id)) {
    //             continue;
    //         }

    //         res.push(this.deps_params[param_dep_id]);
    //     }
    //     return res;
    // }

    @Watch('var_param', { immediate: true })
    private async load_param_infos() {

        this.limit_10_var_deps = true;

        if ((!this.var_param) || (!VarsController.var_conf_by_id[this.var_param.var_id])) {
            this.var_conf = null;
            return;
        }

        this.var_conf = VarsController.var_conf_by_id[this.var_param.var_id];
        this.deps_loading = true;

        let promises = [];

        promises.push((async () => this.deps_params = await ModuleVar.getInstance().getParamDependencies(this.var_param))());
        promises.push((async () => this.vars_deps = await ModuleVar.getInstance().getVarControllerVarsDeps(VarsController.var_conf_by_id[this.var_param.var_id].name))());
        promises.push((async () => this.ds_values_jsoned = await ModuleVar.getInstance().getVarParamDatas(this.var_param))());
        promises.push((async () => this.aggregated_var_datas = await ModuleVar.getInstance().getAggregatedVarDatas(this.var_param))());

        await all_promises(promises);

        this.deps_loading = false;
    }

    get self_param_loaded() {
        if (this.deps_loading) {
            return false;
        }

        if ((!this.var_data) || (typeof this.var_data.value === 'undefined')) {
            return false;
        }

        return true;
    }

    get deps_params_loaded() {
        if (this.deps_loading || !this.self_param_loaded) {
            return false;
        }

        for (let i in this.var_datas_deps) {
            let dep_data = this.var_datas_deps[i];

            if ((!dep_data) || (typeof dep_data.value === 'undefined')) {
                return false;
            }
        }

        return true;
    }

    /**
     * par convention on met dans le param de la trad ces infos par dep_id :
     *  - DEP_ID + '__sum' = somme des deps qui commencent par ce dep_id
     *  - DEP_ID + '__max' = max des deps qui commencent par ce dep_id
     *  - DEP_ID + '__min' = min des deps qui commencent par ce dep_id
     *  - DEP_ID + '__times' = produit des deps qui commencent par ce dep_id
     *  - DEP_ID + '__and' = and sur les deps qui commencent par ce dep_id
     *  - DEP_ID + '__or' = or sur les deps qui commencent par ce dep_id
     *  - DEP_ID + '__xor' = xor sur les deps qui commencent par ce dep_id
     *  - DEP_ID + '__length' = nombre de deps qui commencent par ce dep_id
     *  - DEP_ID + '__' + i = valeur de chaque dep 0 indexed
     *
     * + 'self' pour la value du param
     *
     * + FIELD_ID + '__card' = le cardinal de chaque dimension du matroid
     */
    get explaination_sample_param() {
        if ((!this.deps_params_loaded) || (!this.self_param_loaded)) {
            return null;
        }

        if (!this.var_data) {
            return null;
        }

        let res = {
            self: this.var_data.value
        };
        let matroid_bases = MatroidController.getInstance().getMatroidBases(this.var_param);
        for (let i in matroid_bases) {
            let matroid_base = matroid_bases[i];

            if (!this.var_param[matroid_base.field_id]) {
                continue;
            }
            res[VarsController.getInstance().get_card_field_code(matroid_base.field_id)] =
                RangeHandler.getCardinalFromArray(this.var_param[matroid_base.field_id] as IRange[]);
        }
        for (let var_dep_id in this.vars_deps) {

            let values: number[] = [];
            for (let param_dep_id in this.deps_params) {
                if (!param_dep_id.startsWith(var_dep_id)) {
                    continue;
                }
                if (!VarsClientController.cached_var_datas[this.deps_params[param_dep_id].index]) {
                    continue;
                }
                values.push(VarsClientController.cached_var_datas[this.deps_params[param_dep_id].index].value);
            }

            if ((!values) || (!values.length)) {
                continue;
            }

            res[VarsController.getInstance().get_sum_dep_code(var_dep_id)] = MainAggregateOperatorsHandlers.getInstance().aggregateValues_SUM(values);
            res[VarsController.getInstance().get_max_dep_code(var_dep_id)] = MainAggregateOperatorsHandlers.getInstance().aggregateValues_MAX(values);
            res[VarsController.getInstance().get_and_dep_code(var_dep_id)] = MainAggregateOperatorsHandlers.getInstance().aggregateValues_AND(values);
            res[VarsController.getInstance().get_min_dep_code(var_dep_id)] = MainAggregateOperatorsHandlers.getInstance().aggregateValues_MIN(values);
            res[VarsController.getInstance().get_or_dep_code(var_dep_id)] = MainAggregateOperatorsHandlers.getInstance().aggregateValues_OR(values);
            res[VarsController.getInstance().get_times_dep_code(var_dep_id)] = MainAggregateOperatorsHandlers.getInstance().aggregateValues_TIMES(values);
            res[VarsController.getInstance().get_xor_dep_code(var_dep_id)] = MainAggregateOperatorsHandlers.getInstance().aggregateValues_XOR(values);
        }

        return res;
    }

    get public_explaination_code_text(): string {
        if ((!this.deps_params_loaded) || (!this.self_param_loaded)) {
            return null;
        }

        return VarsController.getInstance().get_translatable_public_explaination_by_var_id(this.var_param.var_id);
    }

    get explaination_code_text(): string {
        if ((!this.deps_params_loaded) || (!this.self_param_loaded)) {
            return null;
        }

        return VarsController.getInstance().get_translatable_explaination_by_var_id(this.var_param.var_id);
    }

    get explaination(): string {
        if (!this.explaination_code_text) {
            return null;
        }

        return this.t(this.explaination_code_text, this.explaination_sample_param);
    }

    get public_explaination(): string {
        if (!this.public_explaination_code_text) {
            return null;
        }

        return this.t(this.public_explaination_code_text);
    }

    get has_public_explaination(): boolean {
        if ((!this.deps_params_loaded) || (!this.self_param_loaded)) {
            return false;
        }

        return VarsController.getInstance().get_translatable_public_explaination_by_var_id(this.var_param.var_id) != this.public_explaination;
    }

    get has_explaination(): boolean {
        if ((!this.deps_params_loaded) || (!this.self_param_loaded)) {
            return false;
        }

        return VarsController.getInstance().get_translatable_explaination_by_var_id(this.var_param.var_id) != this.explaination;
    }

    get has_deps_params(): boolean {
        if ((!this.deps_params_loaded) || (!this.self_param_loaded)) {
            return false;
        }

        return ObjectHandler.hasAtLeastOneAttribute(this.deps_params);
    }

    private async destroyed() {
        await this.unregister(this.deps_params);
    }

    private async register(deps_params: { [dep_id: string]: VarDataBaseVO }) {
        if (!deps_params) {
            return;
        }

        if (deps_params && ObjectHandler.hasAtLeastOneAttribute(deps_params)) {
            await VarsClientController.getInstance().registerParams(Object.values(deps_params), this.varUpdateCallbacks);
        }
    }

    private async unregister(deps_params: { [dep_id: string]: VarDataBaseVO }) {
        if (!deps_params) {
            return;
        }

        if (deps_params && ObjectHandler.hasAtLeastOneAttribute(deps_params)) {
            await VarsClientController.getInstance().unRegisterParams(Object.values(deps_params), this.varUpdateCallbacks);
        }
    }

    @Watch('deps_params')
    private async onChangeVarParam(new_var_params: { [dep_id: string]: VarDataBaseVO }, old_var_params: { [dep_id: string]: VarDataBaseVO }) {

        if ((!new_var_params) && (!old_var_params)) {
            return;
        }

        // On doit vérifier qu'ils sont bien différents
        if (new_var_params && old_var_params && VarsController.getInstance().isSameParamArray(Object.values(new_var_params), Object.values(old_var_params))) {
            return;
        }

        if (old_var_params && ObjectHandler.hasAtLeastOneAttribute(old_var_params)) {
            await this.unregister(old_var_params);
        }

        if (new_var_params && ObjectHandler.hasAtLeastOneAttribute(new_var_params)) {
            await this.register(new_var_params);
        }
    }
}