import { isEqual } from 'lodash';
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import DataFilterOptionsHandler from '../../../../shared/modules/DataRender/DataFilterOptionsHandler';
import DataFilterOption from '../../../../shared/modules/DataRender/vos/DataFilterOption';
import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import ModuleTable from '../../../../shared/modules/ModuleTable';
import ArrayHandler from '../../../../shared/tools/ArrayHandler';
import VOsTypesManager from '../../../../shared/modules/VOsTypesManager';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import ObjectHandler from '../../../../shared/tools/ObjectHandler';
import VueComponentBase from '../../../ts/components/VueComponentBase';
import './MultipleSelectFilterComponent.scss';
import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';

@Component({
    template: require('./MultipleSelectFilterComponent.pug'),
    components: {}
})
export default class MultipleSelectFilterComponent extends VueComponentBase {

    @Prop({
        default: null
    })
    private placeholder: string;

    @Prop()
    private api_type_id: string;

    @Prop({ default: 0 })
    private max: number;

    @Prop({
        default: null
    })
    private option_label_func: (vo: IDistantVOBase) => string;

    /**
     * Pour cacher l'input si on a une seule option possible
     */
    @Prop({ default: true })
    private hide_unique_option: boolean;

    /**
     * Convention de nommage :
     *  - Pour les filter_active_otions, on doit trouver dans le store :
     *      state : 'filter_' + api_type_id + '_active_options'
     *      commit : 'set_filter_' + api_type_id + '_active_options'
     *  - Pour avoir la liste des vos du type sur lesquels on peut filtrer, on doit trouver dans le store :
     *      state : 'all_' + api_type_id + '_by_ids'
     *  - On peut modifier pour passer par un controller de filtres ...
     */
    @Prop({
        default: null
    })
    private store_module_uid: string;
    @Prop({
        default: true
    })
    private store_module_is_namespaced: boolean;

    @Prop({
        default: true
    })
    private multiselect: boolean;

    @Prop({
        type: Array,
        default: () => []
    })
    private depends_on_api_type_ids: string[];
    @Prop({
        type: Object,
        default: () => new Object()
    })
    private depends_on_mandatory: { [api_type_id: string]: boolean };
    @Prop({
        type: Object,
        default: () => new Object()
    })
    private depends_on_condition: { [api_type_id: string]: (vo: IDistantVOBase, dependent_active_options: DataFilterOption[], dependent_all_by_ids: { [id: number]: IDistantVOBase }) => boolean };

    /**
     * Permet d'appeler la condition sur la dependance même si le dependent_active_options est null, à gérer côté condition, pour savoir si on doit filtrer par le all_by_ids
     */
    @Prop({
        type: Object,
        default: () => new Object()
    })
    private depends_on_call_condition_on_empty_active_options: { [api_type_id: string]: boolean };

    @Prop({
        default: false
    })
    private disabled: boolean;

    @Prop({ default: false })
    private update_selectable_options_in_store: boolean;

    @Prop({
        default: null
    })
    @Prop({})
    private group_values: string;
    @Prop({})
    private group_label: string;
    @Prop({})
    private group_select: string;
    // @Prop({})
    // private label: string;
    private sort_options_func: (options: DataFilterOption[]) => void;

    private tmp_filter_active_options: DataFilterOption[] = [];

    private filter_state_selected: number = DataFilterOption.STATE_SELECTED;
    private filter_state_selectable: number = DataFilterOption.STATE_SELECTABLE;
    private filter_state_unselectable: number = DataFilterOption.STATE_UNSELECTABLE;

    private actual_query: string = null;
    private final_array = [{}];

    get filter_options(): DataFilterOption[] {
        let res: DataFilterOption[] = [];

        let id_marker: number[] = [];

        for (let i in this.filter_active_options) {
            let filter_zone_active_option: DataFilterOption = this.filter_active_options[i];

            res.push(new DataFilterOption(DataFilterOption.STATE_SELECTED, filter_zone_active_option.label, filter_zone_active_option.id));
            id_marker.push(filter_zone_active_option.id);
        }

        let array_other = [];
        let array_white_cousin = [];
        let unite = {
            name_group: '',
            group: [{}]
        };
        let copy_of_all_pdvs = Object.values(this.selectables_by_ids);



        for (let i in this.selectables_by_ids) {
            let vo: IDistantVOBase = this.selectables_by_ids[i];

            if (id_marker.indexOf(vo.id) > -1) {
                continue;
            }

            let pdv: any = this.selectables_by_ids[i];
            if (pdv.multimarque_cousin_1_id == null &&
                pdv.multimarque_cousin_2_id == null &&
                pdv.multimarque_cousin_3_id == null &&
                pdv.multimarque_cousin_4_id == null
            ) {
                array_other.push(pdv);
            } else {
                array_white_cousin.push(pdv);
            }

            for (const c in array_white_cousin) {
                let pdvv = array_white_cousin[c];
                let name: string;
                let tab = [];
                tab.push(pdvv);
                if (pdvv.multimarque_cousin_1_id == null) {
                    pdvv.multimarque_cousin_1_id = '';
                }
                if (pdvv.multimarque_cousin_2_id == null) {
                    pdvv.multimarque_cousin_2_id = '';
                }
                if (pdvv.multimarque_cousin_3_id == null) {
                    pdvv.multimarque_cousin_3_id = '';
                }
                if (pdvv.multimarque_cousin_4_id == null) {
                    pdvv.multimarque_cousin_4_id = '';
                }
                // on veut effacer dans array white cousin le pdvv
                if (pdvv.multimarque_cousin_1_id != null && pdvv.multimarque_cousin_1_id != '') {
                    for (const w in copy_of_all_pdvs) {
                        let wpdv = copy_of_all_pdvs[w];
                        if (pdv.multimarque_cousin_1_id == wpdv.id) {
                            tab.push(wpdv);
                            copy_of_all_pdvs.splice(parseInt(w), 1);
                            let index_of_splice = array_white_cousin.findIndex((o) => o.id == wpdv.id);
                            array_white_cousin.splice(index_of_splice, 1);
                            name = wpdv.rrdi;
                        }
                    }
                    let coucou: typeof unite = {
                        name_group: name,
                        group: tab
                    };
                    this.final_array.push(coucou);
                }
                if (pdv.multimarque_cousin_2_id != null && pdv.multimarque_cousin_2_id != '') {
                    for (const w in copy_of_all_pdvs) {
                        let wpdv = copy_of_all_pdvs[w];
                        if (pdv.multimarque_cousin_1_id == wpdv.id) {
                            tab.push(wpdv);
                            copy_of_all_pdvs.splice(parseInt(w), 1);
                            let index_of_splice = array_white_cousin.findIndex((o) => o.id == wpdv.id);
                            array_white_cousin.splice(index_of_splice, 1);
                            name = name + wpdv.rrdi;
                        }
                    }
                    let coucou: typeof unite = {
                        name_group: name,
                        group: tab
                    };
                    this.final_array.push(coucou);
                }
                if (pdv.multimarque_cousin_3_id != null && pdv.multimarque_cousin_3_id != '') {
                    for (const w in copy_of_all_pdvs) {
                        let wpdv = copy_of_all_pdvs[w];
                        if (pdv.multimarque_cousin_1_id == wpdv.id) {
                            tab.push(wpdv);
                            copy_of_all_pdvs.splice(parseInt(w), 1);
                            let index_of_splice = array_white_cousin.findIndex((o) => o.id == wpdv.id);
                            array_white_cousin.splice(index_of_splice, 1);
                            name = name + wpdv.rrdi;
                        }
                    }
                    let coucou: typeof unite = {
                        name_group: name,
                        group: tab
                    };
                    this.final_array.push(coucou);
                }
                if (pdv.multimarque_cousin_4_id != null && pdv.multimarque_cousin_4_id != '') {
                    for (const w in copy_of_all_pdvs) {
                        let wpdv = copy_of_all_pdvs[w];
                        if (pdv.multimarque_cousin_1_id == wpdv.id) {
                            tab.push(wpdv);
                            copy_of_all_pdvs.splice(parseInt(w), 1);
                            let index_of_splice = array_white_cousin.findIndex((o) => o.id == wpdv.id);
                            array_white_cousin.splice(index_of_splice, 1);
                            name = name + wpdv.rrdi;
                        }
                    }
                    let coucou: typeof unite = {
                        name_group: name,
                        group: tab
                    };
                    this.final_array.push(coucou);
                }
                array_white_cousin.splice(parseInt(c), 1);
            }
        }
        for (let i in this.selectables_by_ids) {
            let vo: IDistantVOBase = this.selectables_by_ids[i];

            if (id_marker.indexOf(vo.id) > -1) {
                continue;
            }
            let label = this.get_label(vo);
            if (((!!this.actual_query) && (new RegExp('.*' + this.actual_query + '.*', 'i')).test(label)) || (!this.actual_query)) {

                res.push(new DataFilterOption(DataFilterOption.STATE_SELECTABLE, label, vo.id));
            }
        }

        if (this.sort_options_func) {
            this.sort_options_func(res);
        } else {
            DataFilterOptionsHandler.getInstance().sort_options(res);
        }

        return res;
    }

    @Watch('tmp_filter_active_options')
    public onchange_tmp_filter_active_options() {

        /**
         * On check avant le commit si il y a une modification de la sélection
         */
        let old_value = this.filter_active_options;
        let new_value = this.tmp_filter_active_options;

        if (ArrayHandler.is_same(old_value, new_value)) {
            return;
        }

        if ((!this.store_module_is_namespaced) || (!this.store_module_uid)) {
            this.$store.commit(this.internal_store_filter_commit_uid, this.tmp_filter_active_options);
        } else {
            this.$store.commit(this.store_module_uid + '/' + this.internal_store_filter_commit_uid, this.tmp_filter_active_options);
        }
    }

    @Watch('$route', { immediate: true })
    public async onRouteChange() {
        try {
            this.tmp_filter_active_options = this.filter_active_options;
            this.actual_query = null;
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
        }
    }

    @Watch('filter_active_options')
    public async onchange_filter_active_options() {
        this.actual_query = null;
        if (!isEqual(this.tmp_filter_active_options, this.filter_active_options)) {
            if (!this.filter_active_options || !this.filter_active_options.length) {
                let res = this.$store.state[this.store_module_uid][this.internal_store_all_by_ids_state_uid];
                if (ObjectHandler.getInstance().hasOneAndOnlyOneAttribute(res)) {
                    let selected = res[ObjectHandler.getInstance().getFirstAttributeName(res)];
                    this.tmp_filter_active_options = [new DataFilterOption(DataFilterOption.STATE_SELECTABLE, this.get_label(selected), selected.id)];
                } else {
                    this.tmp_filter_active_options = this.filter_active_options;
                }
            } else {
                this.tmp_filter_active_options = this.filter_active_options;
            }
        }
    }

    get filter_active_options(): DataFilterOption[] {
        try {

            return this.$store.state[this.store_module_uid][this.internal_store_filter_state_uid];
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
        }
        return [];
    }

    get selectables_by_ids(): { [id: number]: IDistantVOBase } {
        let res: { [id: number]: IDistantVOBase } = {};

        try {

            if ((!this.all_by_ids) || (!ObjectHandler.getInstance().hasAtLeastOneAttribute(this.all_by_ids))) {
                return res;
            }

            for (let id in this.all_by_ids) {
                let vo = this.all_by_ids[id];

                let vo_res: boolean = true;
                for (let j in this.depends_on_api_type_ids) {
                    let depends_on_api_type_id = this.depends_on_api_type_ids[j];

                    /**
                     * Si !depends_on_api_type_id_active_options => ! depends_on_mandatory[depends_on_api_type_id]
                     * Sinon depends_on_condition[depends_on_api_type_id](vo, depends_on_api_type_id_active_options)
                     */
                    let depends_on_api_type_id_active_options: DataFilterOption[] = this.$store.state[this.store_module_uid]['filter_' + depends_on_api_type_id + '_active_options'];
                    let depends_on_api_type_id_all_by_ids: { [id: number]: IDistantVOBase } = this.$store.state[this.store_module_uid]['all_' + depends_on_api_type_id + '_by_ids'];
                    if ((!depends_on_api_type_id_active_options) || (!depends_on_api_type_id_active_options.length)) {
                        if (this.depends_on_mandatory[depends_on_api_type_id]) {
                            vo_res = false;
                            break;
                        }

                        if (this.depends_on_call_condition_on_empty_active_options[depends_on_api_type_id] && !this.depends_on_condition[depends_on_api_type_id](vo, null, depends_on_api_type_id_all_by_ids)) {
                            vo_res = false;
                            break;
                        }
                        continue;
                    }

                    if (!this.depends_on_condition[depends_on_api_type_id](vo, depends_on_api_type_id_active_options, depends_on_api_type_id_all_by_ids)) {
                        vo_res = false;
                        break;
                    }
                }

                if (vo_res) {
                    res[id] = vo;
                }
            }
            // return this.$store.state[this.store_module_uid][this.internal_store_selectables_by_ids_state_uid];
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
        }
        return res;
    }

    @Watch('selectables_by_ids', { immediate: true })
    private onchange_selectables_by_ids() {

        if (!this.update_selectable_options_in_store) {
            return;
        }

        if ((!this.store_module_is_namespaced) || (!this.store_module_uid)) {
            this.$store.commit(this.internal_store_filter_commit_selectables_by_ids_uid, this.selectables_by_ids);
        } else {
            this.$store.commit(this.store_module_uid + '/' + this.internal_store_filter_commit_selectables_by_ids_uid, this.selectables_by_ids);
        }
    }

    get all_by_ids(): { [id: number]: IDistantVOBase } {
        try {

            let res = this.$store.state[this.store_module_uid][this.internal_store_all_by_ids_state_uid];
            if (ObjectHandler.getInstance().hasOneAndOnlyOneAttribute(res)) {
                let selected = res[ObjectHandler.getInstance().getFirstAttributeName(res)];
                this.tmp_filter_active_options = [new DataFilterOption(DataFilterOption.STATE_SELECTABLE, this.get_label(selected), selected.id)];
            }
            return res;
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
        }
        return {};
    }

    private get_label(vo: IDistantVOBase): string {

        if (!vo) {
            return null;
        }

        if (!this.option_label_func) {
            // On utilise la fonction de label de la table
            if (!!this.moduletable.default_label_field) {
                return vo[this.moduletable.default_label_field.field_id];
            }

            if (!!this.moduletable.table_label_function) {
                return this.moduletable.table_label_function(vo);
            }
        } else {
            return this.option_label_func(vo);
        }

        return null;
    }

    get moduletable(): ModuleTable<any> {
        return VOsTypesManager.getInstance().moduleTables_by_voType[this.api_type_id];
    }

    get internal_store_filter_state_uid(): string {
        return 'filter_' + this.api_type_id + '_active_options';
    }

    get internal_store_filter_commit_uid(): string {
        return 'set_filter_' + this.api_type_id + '_active_options';
    }

    get internal_store_filter_commit_selectables_by_ids_uid(): string {
        return 'set_filter_' + this.api_type_id + '_selectable_options_by_ids';
    }

    get internal_store_all_by_ids_state_uid(): string {
        return 'all_' + this.api_type_id + '_by_ids';
    }

    private multiselectOptionLabel(filter_item: DataFilterOption): string {
        if ((filter_item == null) || (typeof filter_item == 'undefined')) {
            return '';
        }

        return filter_item.label;
    }

    private updateMultiSelectFilterOptions(query) {
        this.actual_query = query;
    }

    private select_none() {
        this.tmp_filter_active_options = [];
    }

    private async select_all() {
        let res: DataFilterOption[] = [];

        for (let i in this.selectables_by_ids) {
            let vo: IDistantVOBase = this.selectables_by_ids[i];

            let label = this.get_label(vo);
            res.push(new DataFilterOption(DataFilterOption.STATE_SELECTED, label, vo.id));
        }

        this.tmp_filter_active_options = res;
    }

    private mounted() {
        // TODO A tester
        this.$refs.multiselectRef['$refs'].search.setAttribute("autocomplete", "off");
    }
}
