
import cloneDeep from 'lodash/cloneDeep';
import debounce from 'lodash/debounce';
import { Component, Prop, Watch } from 'vue-property-decorator';
import ModuleDAO from '../../../../../../shared/modules/DAO/ModuleDAO';
import SimpleDatatableField from '../../../../../../shared/modules/DAO/vos/datatable/SimpleDatatableField';
import Dates from '../../../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ModuleFormatDatesNombres from '../../../../../../shared/modules/FormatDatesNombres/ModuleFormatDatesNombres';
import ModuleVar from '../../../../../../shared/modules/Var/ModuleVar';
import VarsController from '../../../../../../shared/modules/Var/VarsController';
import VarDataBaseVO from '../../../../../../shared/modules/Var/vos/VarDataBaseVO';
import VarDataValueResVO from '../../../../../../shared/modules/Var/vos/VarDataValueResVO';
import VarUpdateCallback from '../../../../../../shared/modules/Var/vos/VarUpdateCallback';
import VOsTypesManager from '../../../../../../shared/modules/VOsTypesManager';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import RangeHandler from '../../../../../../shared/tools/RangeHandler';
import ThrottleHelper from '../../../../../../shared/tools/ThrottleHelper';
import VueComponentBase from '../../../VueComponentBase';
import { ModuleVarAction, ModuleVarGetter } from '../../store/VarStore';
import VarsClientController from '../../VarsClientController';
import './VarDataRefComponent.scss';

@Component({
    template: require('./VarDataRefComponent.pug')
})
export default class VarDataRefComponent extends VueComponentBase {
    @ModuleVarGetter
    public getDescSelectedVarParam: VarDataBaseVO;
    @ModuleVarAction
    public setDescSelectedVarParam: (desc_selected_var_param: VarDataBaseVO) => void;
    @ModuleVarGetter
    public isDescMode: boolean;
    @ModuleVarGetter
    public is_show_public_tooltip: boolean;

    @Prop()
    public var_param: VarDataBaseVO;

    @Prop({ default: null })
    public var_value_callback: (var_value: VarDataValueResVO, component: VarDataRefComponent) => any;

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

    @Prop({ default: false })
    public can_inline_edit: boolean;

    @Prop({ default: null })
    public null_value_replacement: string;

    @Prop({ default: null })
    public zero_value_replacement: string;

    @Prop({ default: false })
    public consider_zero_value_as_null: boolean;

    @Prop({ default: true })
    public use_intersector: boolean;

    @Prop({ default: false })
    public add_infos: string[]; // tableau de champs que l'on veut afficher

    @Prop({ default: false })
    public add_infos_additional_params: any[];  // tableau des params pour chacun des champs présents dans add_infos

    @Prop({ default: false })
    public show_import: boolean;

    @Prop({ default: false })
    public show_import_aggregated: boolean;

    @Prop({ default: false })
    public show_tooltip: boolean;

    private entered_once: boolean = false;

    private var_data: VarDataValueResVO = null;
    private throttled_var_data_updater = ThrottleHelper.getInstance().declare_throttle_without_args(this.var_data_updater.bind(this), 200, { leading: false, trailing: true });

    // Pour éviter de rentrer en conflit avec le clic
    private debounced_on_cancel_input = debounce(this.on_cancel_input, 100);

    private is_inline_editing: boolean = false;

    private varUpdateCallbacks: { [cb_uid: number]: VarUpdateCallback } = {
        [VarsClientController.get_CB_UID()]: VarUpdateCallback.newCallbackEvery(this.throttled_var_data_updater.bind(this), VarUpdateCallback.VALUE_TYPE_ALL)
    };

    get var_conf() {
        if ((!this.var_param) || (!this.var_param.var_id) ||
            (!VarsController.getInstance().var_conf_by_id) || (!VarsController.getInstance().var_conf_by_id[this.var_param.var_id])) {
            return null;
        }

        return VarsController.getInstance().var_conf_by_id[this.var_param.var_id];
    }

    get public_tooltip() {
        if ((!this.var_conf) || (!this.var_conf.show_help_tooltip)) {
            return null;
        }

        return this.t(this.public_explaination_code_text);
    }

    get has_public_tooltip(): boolean {
        if ((!this.var_param) || (!this.public_tooltip)) {
            return null;
        }

        return VarsController.getInstance().get_translatable_public_explaination_by_var_id(this.var_param.var_id) != this.public_tooltip;
    }

    /**
     * cf VarDescExplainComponent
     */
    get public_explaination_code_text(): string {
        if (!this.var_param) {
            return null;
        }

        return VarsController.getInstance().get_translatable_public_explaination_by_var_id(this.var_param.var_id);
    }

    private aggregated_var_param: VarDataBaseVO = null;

    private async onchangevo(data: VarDataBaseVO, field, value) {

        if (!data) {
            return;
        }

        if (data.index != this.var_param.index) {
            return;
        }

        let clone = VarDataBaseVO.cloneFromVarId(this.var_param);

        if ((value == null) || isNaN(value) || (value === '')) {

            // Si on envoie une value null || '', on veut en fait supprimer l'import de la base et refresh l'arbre depuis cette var
            clone.value_type = VarDataBaseVO.VALUE_TYPE_COMPUTED;
            clone.value_ts = null;
            clone.value = null;
            clone.id = data.id;

            this.var_data.value = null;
            this.var_data.value_ts = null;
            this.var_data.is_computing = true;
            this.var_data.id = data.id;
            this.var_data.value_type = VarDataBaseVO.VALUE_TYPE_COMPUTED;
        } else {

            // Sinon on set le type import, et on met à jour la var puis on invalide l'arbre
            clone.value_type = VarDataBaseVO.VALUE_TYPE_IMPORT;
            clone.value = value;
            clone.value_ts = Dates.now();
            clone.id = data.id;

            this.var_data.value = value;
            this.var_data.value_ts = clone.value_ts;
            this.var_data.id = data.id;
            this.var_data.is_computing = false;
            this.var_data.value_type = VarDataBaseVO.VALUE_TYPE_IMPORT;
        }

        // On va enregistrer un cb qui attend le retour de validation de prise en compte de la nouvelle valeur importée
        let cb = () => {
            // ça devrait fermer l'inline edit de cette var et retirer le cb du sémaphore
            if (VarsClientController.getInstance().inline_editing_cb) {
                VarsClientController.getInstance().inline_editing_cb();
            }
        };

        await VarsClientController.getInstance().registerParams([clone], {
            [VarsClientController.get_CB_UID()]: VarUpdateCallback.newCallbackOnce(cb.bind(this), VarUpdateCallback.VALUE_TYPE_VALID)
        });

        let res = await ModuleDAO.getInstance().insertOrUpdateVO(clone);
        if ((!res) || (!res.id)) {
            ConsoleHandler.warn('Echec onchangevo insertOrUpdateVO : On tente de récupérer la data en base, si elle existe on met à jour...');
            let bdddatas: VarDataBaseVO[] = await ModuleDAO.getInstance().getVosByExactMatroids<VarDataBaseVO, VarDataBaseVO>(clone._type, [clone]);
            if (bdddatas && bdddatas.length) {
                ConsoleHandler.log('...trouvé on met à jour');
                let bdddata: VarDataBaseVO = bdddatas[0];

                if ((bdddata.value_type == VarDataBaseVO.VALUE_TYPE_IMPORT) && (bdddata.value_ts && clone.value_ts && (bdddata.value_ts > clone.value_ts))) {
                    ConsoleHandler.error('...valeur en BDD plus récente que celle saisie, on refuse la maj');
                    return;
                }
                bdddata.value_type = clone.value_type;
                bdddata.value = clone.value;
                bdddata.value_ts = clone.value_ts;
                res = await ModuleDAO.getInstance().insertOrUpdateVO(bdddata);
                if ((!res) || (!res.id)) {
                    ConsoleHandler.error('...la mise à jour a échouée');
                    return;
                }
            } else {
                ConsoleHandler.error('...pas trouvé, il y a eu une erreur et la valeur est perdue');
                return;
            }
        }
    }

    private on_cancel_input() {
        // ça devrait fermer l'inline edit de cette var et retirer le cb du sémaphore
        if (VarsClientController.getInstance().inline_editing_cb) {
            VarsClientController.getInstance().inline_editing_cb();
        }
    }

    get editable_field() {
        if (!this.var_param) {
            return null;
        }
        return new SimpleDatatableField("value").setModuleTable(VOsTypesManager.moduleTables_by_voType[this.var_param._type]);
    }

    private var_data_updater() {
        if (!this.var_param) {
            this.var_data = null;
            return;
        }


        this.var_data = VarsClientController.getInstance().cached_var_datas[this.var_param.index];
    }

    get is_being_updated(): boolean {

        if (!this.var_data) {
            return true;
        }

        return (typeof this.var_data.value === 'undefined') || (this.var_data.is_computing);
    }

    get filtered_value() {

        if (!this.var_data) {
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
        if (!this.var_data) {
            return null;
        }

        if (!this.var_value_callback) {
            return this.var_data.value;
        }

        return this.var_value_callback(this.var_data, this);
    }

    get is_selected_var(): boolean {
        if ((!this.isDescMode) || (!this.getDescSelectedVarParam)) {
            return false;
        }
        return this.getDescSelectedVarParam.index == this.var_param.index;
    }

    private async mounted() {
        await this.intersect_in();
    }

    private async destroyed() {
        await this.unregister();
    }

    private async intersect_in() {
        this.entered_once = true;
        await this.register();
    }

    private async intersect_out() {
        await this.unregister();
    }

    private async register(var_param: VarDataBaseVO = null) {
        if (!this.entered_once) {
            return;
        }

        if (var_param || this.var_param) {
            await VarsClientController.getInstance().registerParams([var_param ? var_param : this.var_param], this.varUpdateCallbacks);

            if (this.show_import_aggregated) {
                await ModuleVar.getInstance().getAggregatedVarDatas((var_param ? var_param : this.var_param)).then((datas: { [var_data_index: string]: VarDataBaseVO }) => {
                    for (let var_data_index in datas) {
                        if (datas[var_data_index].value_type == VarDataBaseVO.VALUE_TYPE_IMPORT) {
                            this.aggregated_var_param = cloneDeep(datas[var_data_index]);
                            break;
                        }
                    }
                });
            }
        }
    }

    private async unregister(var_param: VarDataBaseVO = null) {
        if (!this.entered_once) {
            return;
        }

        this.var_data = null;

        if (var_param || this.var_param) {
            await VarsClientController.getInstance().unRegisterParams([var_param ? var_param : this.var_param], this.varUpdateCallbacks);
        }
    }

    @Watch('var_param')
    private async onChangeVarParam(new_var_param: VarDataBaseVO, old_var_param: VarDataBaseVO) {

        // On doit vérifier qu'ils sont bien différents
        if (VarDataBaseVO.are_same(new_var_param, old_var_param)) {
            return;
        }

        if (old_var_param) {
            await this.unregister(old_var_param);
        }

        if (new_var_param) {
            await this.register();
        }
    }

    private close_inline_editing() {
        this.is_inline_editing = false;
        VarsClientController.getInstance().inline_editing_cb = null;
    }

    @Watch('can_inline_edit')
    private onchange_can_inline_edit() {
        if (!this.can_inline_edit) {
            this.is_inline_editing = false;
        }
    }

    private selectVar() {

        if (this.can_inline_edit && !this.is_inline_editing) {
            if (VarsClientController.getInstance().inline_editing_cb) {
                VarsClientController.getInstance().inline_editing_cb();
            }
            VarsClientController.getInstance().inline_editing_cb = this.close_inline_editing.bind(this);

            this.is_inline_editing = true;
        }

        if (!this.isDescMode) {
            return;
        }

        this.setDescSelectedVarParam(this.var_param);
    }

    get is_show_import_aggregated(): boolean {
        return (this.show_import_aggregated && this.aggregated_var_param) ? true : false;
    }

    get var_data_value_tooltip() {

        let res = null;

        if (this.is_show_public_tooltip && this.has_public_tooltip) {
            res = this.public_tooltip;
        }

        if (!this.show_tooltip) {
            return res;
        }

        if ((this.var_data == null) || (this.var_data_value == null)) {
            return res;
        }

        res = (res ? res + '<hr>' : '') + this.label('VarDataRefComponent.var_data_value_tooltip_prefix');

        let formatted_date: string = Dates.format(this.var_data.value_ts, ModuleFormatDatesNombres.FORMAT_YYYYMMDD_HHmmss);

        let value: any = this.var_data_value;

        if (this.filter) {
            let params = [value];

            if (!!this.filter_additional_params) {
                params = params.concat(this.filter_additional_params);
            }

            value = this.filter.apply(null, params);
        }

        res += this.label('VarDataRefComponent.var_data_value_tooltip', {
            value: value,
            formatted_date: formatted_date,
        });

        if (!!this.var_data_value_import_tooltip) {
            res += this.var_data_value_import_tooltip;
        }

        res += this.label('VarDataRefComponent.var_data_value_tooltip_suffix');

        return res;
    }

    get var_data_value_import_tooltip() {

        if (!this.var_data_value_is_imported && !this.is_show_import_aggregated) {
            return null;
        }

        let formatted_date: string = null;

        if (this.is_show_import_aggregated) {
            if ((this.aggregated_var_param as any).ts_ranges) {
                formatted_date = Dates.format(RangeHandler.getSegmentedMax_from_ranges((this.aggregated_var_param as any).ts_ranges),
                    ModuleFormatDatesNombres.FORMAT_YYYYMMDD
                );
            } else {
                formatted_date = Dates.format(this.aggregated_var_param.value_ts, ModuleFormatDatesNombres.FORMAT_YYYYMMDD_HHmmss);
            }
        } else {
            formatted_date = Dates.format(this.var_data.value_ts, ModuleFormatDatesNombres.FORMAT_YYYYMMDD_HHmmss);
        }

        let value: any = (this.is_show_import_aggregated) ? this.aggregated_var_param.value : this.var_data_value;

        if (this.filter) {
            let params = [value];

            if (!!this.filter_additional_params) {
                params = params.concat(this.filter_additional_params);
            }

            value = this.filter.apply(null, params);
        }

        return this.label('VarDataRefComponent.var_data_value_import_tooltip', {
            value: value,
            formatted_date: formatted_date,
        });
    }

    get var_data_value_is_imported() {
        if (!this.var_data) {
            return false;
        }

        return this.var_data.value_type == VarDataBaseVO.VALUE_TYPE_IMPORT;
    }

    get var_data_value_is_denied() {
        if (!this.var_data) {
            return false;
        }

        return this.var_data.value_type == VarDataBaseVO.VALUE_TYPE_DENIED;
    }
}