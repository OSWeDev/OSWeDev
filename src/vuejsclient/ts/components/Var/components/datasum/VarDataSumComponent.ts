// import { Component, Prop, Watch } from 'vue-property-decorator';
// import VarsController from '../../../../../../shared/modules/Var/VarsController';
// import VarDataBaseVO from '../../../../../../shared/modules/Var/vos/VarDataBaseVO';
// import VarDataValueResVO from '../../../../../../shared/modules/Var/vos/VarDataValueResVO';
// import VarUpdateCallback from '../../../../../../shared/modules/Var/vos/VarUpdateCallback';
// import ThrottleHelper from '../../../../../../shared/tools/ThrottleHelper';
// import VueComponentBase from '../../../VueComponentBase';
// import { ModuleVarAction, ModuleVarGetter } from '../../store/VarStore';
// import VarsClientController from '../../VarsClientController';
// import VarDatasRefsParamSelectComponent from '../datasrefs/paramselect/VarDatasRefsParamSelectComponent';
// import './VarDataSumComponent.scss';

// @Component({
//     template: require('./VarDataSumComponent.pug')
// })
// export default class VarDataSumComponent extends VueComponentBase {

//     private static UID: number = 0;

//     @ModuleVarGetter
//     public getDescSelectedVarParam: VarDataBaseVO;
//     @ModuleVarAction
//     public setDescSelectedVarParam: (desc_selected_var_param: VarDataBaseVO) => void;
//     @ModuleVarGetter
//     public isDescMode: boolean;

//     @Prop()
//     public var_params: VarDataBaseVO[];

//     @Prop({ default: null })
//     public filter: () => any;

//     @Prop({ default: null })
//     public filter_additional_params: any[];

//     @Prop({ default: null })
//     public prefix: string;

//     @Prop({ default: null })
//     public suffix: string;

//     @Prop({ default: null })
//     public null_value_replacement: string;

//     @Prop({ default: null })
//     public zero_value_replacement: string;

//     @Prop({ default: false })
//     public consider_zero_value_as_null: boolean;

//     private entered_once: boolean = false;

//     private this_uid: number = VarDataSumComponent.UID++;

//     private var_datas: VarDataValueResVO[] = [];
//     private throttled_var_datas_updater = ThrottleHelper.declare_throttle_without_args(this.var_datas_updater.bind(this), 500, { leading: false, trailing: true });

//     private varUpdateCallbacks: { [cb_uid: number]: VarUpdateCallback } = {
//         [VarsClientController.get_CB_UID()]: VarUpdateCallback.newCallbackEvery(this.throttled_var_datas_updater.bind(this), VarUpdateCallback.VALUE_TYPE_VALID)
//     };

//     get is_being_updated(): boolean {

//         // Si la var data est null on considère qu'elle est en cours de chargement. C'est certainement faux, souvent, mais ça peut aider beaucoup pour afficher au plus tôt le fait que la var est en attente de calcul
//         if (!this.var_datas) {
//             return true;
//         }

//         for (const i in this.var_datas) {
//             const var_data = this.var_datas[i];
//             if ((!var_data) || (typeof var_data.value === 'undefined') || var_data.is_computing) {
//                 return true;
//             }
//         }

//         return false;
//     }

//     get filtered_value() {

//         if (!this.var_datas) {
//             return null;
//         }

//         if (!this.filter) {

//             return this.var_data_value;
//         }

//         let params = [this.var_data_value];

//         if (this.filter_additional_params) {
//             params = params.concat(this.filter_additional_params);
//         }

//         return this.filter.apply(null, params);
//     }

//     get var_data_value() {
//         let res: number = 0;

//         for (const i in this.var_datas) {
//             const var_data = this.var_datas[i];

//             if ((!var_data) || (!var_data.value)) {
//                 continue;
//             }

//             res += var_data.value;
//         }

//         return res;
//     }

//     get is_selected_var(): boolean {
//         if ((!this.isDescMode) || (!this.getDescSelectedVarParam)) {
//             return false;
//         }

//         for (const i in this.var_params) {
//             const var_param = this.var_params[i];

//             if (this.getDescSelectedVarParam.index == var_param.index) {
//                 return true;
//             }
//         }
//         return false;
//     }

//     get is_computing() {
//         if (!this.var_datas) {
//             return false;
//         }

//         for (const i in this.var_datas) {
//             const var_data = this.var_datas[i];

//             if (var_data && var_data.is_computing) {
//                 return true;
//             }
//         }

//         return false;
//     }

//     @Watch('var_params')
//     private onChangeVarParam(new_var_params: VarDataBaseVO[], old_var_params: VarDataBaseVO[]) {

//         if ((!new_var_params) && (!old_var_params)) {
//             return;
//         }

//         // On doit vérifier qu'ils sont bien différents
//         if (VarsController.isSameParamArray(new_var_params, old_var_params)) {
//             return;
//         }

//         if (old_var_params && old_var_params.length) {
//             this.unregister(old_var_params);
//         }

//         if (new_var_params) {
//             this.register(new_var_params);
//         }
//     }

//     private var_datas_updater() {
//         const var_datas: VarDataValueResVO[] = [];
//         for (const i in this.var_params) {
//             const var_param = this.var_params[i];
//             var_datas.push(VarsClientController.cached_var_datas[var_param.index]);
//         }
//         this.var_datas = var_datas;
//     }

//     private destroyed() {
//         this.unregister(this.var_params);
//     }

//     private mounted() {
//         this.intersect_in();
//     }

//     private intersect_in() {
//         this.register(this.var_params);

//         this.entered_once = true;
//     }

//     private intersect_out() {
//         if (!this.entered_once) {
//             return;
//         }

//         this.unregister(this.var_params);
//     }

//     private register(var_params: VarDataBaseVO[]) {
//         if (var_params && var_params.length) {
//             VarsClientController.getInstance().registerParams(var_params, this.varUpdateCallbacks);
//         }
//     }

//     private unregister(var_params: VarDataBaseVO[]) {
//         if (var_params && var_params.length) {
//             VarsClientController.getInstance().unRegisterParams(var_params, this.varUpdateCallbacks);
//         }
//     }

//     private selectVar() {
//         if (!this.isDescMode) {
//             return;
//         }

//         /**
//          * On ouvre la modal qui propose de choisir la var à sélectionner
//          */
//         this.$modal.show(
//             VarDatasRefsParamSelectComponent,
//             { var_params: this.var_params },
//             {
//                 width: 465,
//                 height: 'auto',
//                 scrollable: true
//             }
//         );
//     }
// }