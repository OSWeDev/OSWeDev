import { isEqual } from 'lodash';
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import DataFilterOptionsHandler from '../../../../shared/modules/DataRender/DataFilterOptionsHandler';
import DataFilterOption from '../../../../shared/modules/DataRender/vos/DataFilterOption';
import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import ModuleTable from '../../../../shared/modules/ModuleTable';
import ArrayHandler from '../../../../shared/tools/ArrayHandler';
import VOsTypesManager from '../../../../shared/modules/VO/manager/VOsTypesManager';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import ObjectHandler from '../../../../shared/tools/ObjectHandler';
import VueComponentBase from '../../../ts/components/VueComponentBase';
import './MultipleSelectFilterComponent.scss';

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
    private option_label_func: (vo: IDistantVOBase, dfo_options: DataFilterOption[]) => string;

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
    private function_group: (selectable_options_by_ids: { [id: number]: IDistantVOBase }, actual_query: string) => DataFilterOption[];

    @Prop({
        default: false
    })
    private have_options: boolean;

    @Prop({
        default: null
    })
    private sort_options_func: (options: DataFilterOption[]) => void;

    @Prop({ default: true })
    private preselect_first_if_one_element: boolean;

    private tmp_active_filter_options: DataFilterOption[] = [];

    private filter_state_selected: number = DataFilterOption.STATE_SELECTED;
    private filter_state_selectable: number = DataFilterOption.STATE_SELECTABLE;
    private filter_state_unselectable: number = DataFilterOption.STATE_UNSELECTABLE;

    private actual_query: string = null;

    /**
     * Utilisable pour forcer les options actives depuis le composant parent en utilisant une $refs
     */
    public force_active_options(active_options: DataFilterOption[]) {
        this.tmp_active_filter_options = active_options;
    }

    @Watch('tmp_active_filter_options')
    public onchange_tmp_active_filter_options() {

        /**
         * On check avant le commit si il y a une modification de la sélection
         */
        let old_value = this.active_filter_options;
        let new_value = this.tmp_active_filter_options;

        if (ArrayHandler.is_same(old_value, new_value)) {
            return;
        }

        if ((!this.store_module_is_namespaced) || (!this.store_module_uid)) {
            this.$store.commit(this.internal_store_filter_commit_uid, this.tmp_active_filter_options);
        } else {
            this.$store.commit(this.store_module_uid + '/' + this.internal_store_filter_commit_uid, this.tmp_active_filter_options);
        }
    }

    @Watch('$route', { immediate: true })
    public async onRouteChange() {
        try {
            this.tmp_active_filter_options = this.active_filter_options;
            this.actual_query = null;
        } catch (error) {
            ConsoleHandler.error(error);
        }
    }

    @Watch('active_filter_options')
    public async onchange_active_filter_options() {
        this.actual_query = null;

        if (!isEqual(this.tmp_active_filter_options, this.active_filter_options)) {

            if (!(this.active_filter_options?.length > 0)) {
                let res = this.$store.state[this.store_module_uid][this.internal_store_all_by_ids_state_uid];

                if (ObjectHandler.hasOneAndOnlyOneAttribute(res)) {
                    let selected = res[ObjectHandler.getFirstAttributeName(res)];

                    const option = new DataFilterOption(
                        DataFilterOption.STATE_SELECTABLE,
                        this.get_label(selected),
                        selected.id
                    );

                    this.tmp_active_filter_options = [option];
                } else {
                    this.tmp_active_filter_options = this.active_filter_options;
                }
            } else {
                this.tmp_active_filter_options = this.active_filter_options;
            }
        }
    }

    @Watch('selectable_options_by_ids', { immediate: true })
    private onchange_selectable_options_by_ids() {

        if (!this.update_selectable_options_in_store) {
            return;
        }

        let selectable_options_by_ids: {
            [id: number]: IDistantVOBase
        } = this.$store.state[this.store_module_uid]['filter_' + this.api_type_id + '_selectable_options_by_ids'];

        // Avant de commit, on check si il y a une modification pour éviter de boucler
        if (isEqual(selectable_options_by_ids, this.selectable_options_by_ids)) {
            return;
        }

        if ((!this.store_module_is_namespaced) || (!this.store_module_uid)) {
            this.$store.commit(this.internal_store_filter_commit_selectable_options_by_ids_uid, this.selectable_options_by_ids);
        } else {
            this.$store.commit(this.store_module_uid + '/' + this.internal_store_filter_commit_selectable_options_by_ids_uid, this.selectable_options_by_ids);
        }
    }

    private async on_input(selected: []) {
        this.$emit('select', selected);
    }

    private get_label(vo: IDistantVOBase, dfo_options: DataFilterOption[] = null): string {

        if (!vo) {
            return null;
        }

        if (!this.option_label_func) {
            // On utilise la fonction de label de la table
            if (!!this.moduletable?.default_label_field) {
                return vo[this.moduletable.default_label_field.field_id];
            }

            if (!!this.moduletable?.table_label_function) {
                return this.moduletable.table_label_function(vo);
            }
        } else {
            return this.option_label_func(vo, dfo_options);
        }

        return null;
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
        this.tmp_active_filter_options = [];
    }

    private async select_all() {
        let res: DataFilterOption[] = [];

        for (let i in this.selectable_options_by_ids) {
            let vo: IDistantVOBase = this.selectable_options_by_ids[i];

            const option = new DataFilterOption(
                DataFilterOption.STATE_SELECTABLE,
                this.get_label(vo),
                vo.id
            );

            res.push(option);
        }

        this.tmp_active_filter_options = res;
    }

    private mounted() {
        // TODO A tester
        this.$refs.multiselectRef['$refs'].search.setAttribute("autocomplete", "off");
    }

    get filter_options(): DataFilterOption[] {
        let res: DataFilterOption[] = [];
        let id_marker: number[] = [];

        for (let i in this.active_filter_options) {
            let filter_zone_active_option: DataFilterOption = this.active_filter_options[i];

            const option = new DataFilterOption(
                DataFilterOption.STATE_SELECTED,
                filter_zone_active_option.label,
                filter_zone_active_option.id
            );

            res.push(option);

            id_marker.push(filter_zone_active_option.id);
        }

        if (!this.have_options) {
            for (let i in this.selectable_options_by_ids) {
                let vo: IDistantVOBase = this.selectable_options_by_ids[i];

                if (id_marker.indexOf(vo.id) > -1) {
                    continue;
                }

                let label = this.get_label(vo);
                if (((!!this.actual_query) && (new RegExp('.*' + this.actual_query + '.*', 'i')).test(label)) || (!this.actual_query)) {
                    res.push(new DataFilterOption(DataFilterOption.STATE_SELECTABLE, label, vo.id));
                }
            }
        }

        if (this.have_options && this.function_group) {
            res = this.function_group(this.selectable_options_by_ids, this.actual_query);
        }

        if (this.sort_options_func) {
            this.sort_options_func(res);
        } else {
            DataFilterOptionsHandler.getInstance().sort_options(res);
        }

        return res;
    }

    get active_filter_options(): DataFilterOption[] {
        try {

            return this.$store.state[this.store_module_uid][this.internal_store_filter_state_uid];
        } catch (error) {
            ConsoleHandler.error(error);
        }
        return [];
    }

    get selectable_options_by_ids(): { [id: number]: IDistantVOBase } {
        let res: { [id: number]: IDistantVOBase } = {};

        try {

            if ((!this.all_by_ids) || (!ObjectHandler.hasAtLeastOneAttribute(this.all_by_ids))) {
                return res;
            }

            for (let id in this.all_by_ids) {
                let vo = this.all_by_ids[id];

                let vo_res: boolean = true;
                for (const j in this.depends_on_api_type_ids) {
                    const depends_on_api_type_id = this.depends_on_api_type_ids[j];

                    /**
                     * Si !depends_on_api_type_id_active_options => ! depends_on_mandatory[depends_on_api_type_id]
                     * Sinon depends_on_condition[depends_on_api_type_id](vo, depends_on_api_type_id_active_options)
                     */
                    let depends_on_api_type_id_active_options: DataFilterOption[] = this.$store.state[this.store_module_uid]['filter_' + depends_on_api_type_id + '_active_options'];
                    let depends_on_api_type_id_all_by_ids: { [id: number]: IDistantVOBase } = this.$store.state[this.store_module_uid]['all_' + depends_on_api_type_id + '_by_ids'];

                    if (!(depends_on_api_type_id_active_options?.length > 0)) {
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
            // return this.$store.state[this.store_module_uid][this.internal_store_selectable_options_by_ids_state_uid];
        } catch (error) {
            ConsoleHandler.error(error);
        }
        return res;
    }

    get all_by_ids(): { [id: number]: IDistantVOBase } {
        try {

            let res = this.$store.state[this.store_module_uid][this.internal_store_all_by_ids_state_uid];

            if (this.preselect_first_if_one_element && ObjectHandler.hasOneAndOnlyOneAttribute(res)) {
                const selected = res[ObjectHandler.getFirstAttributeName(res)];

                const option = new DataFilterOption(
                    DataFilterOption.STATE_SELECTABLE,
                    this.get_label(selected),
                    selected.id
                );

                this.tmp_active_filter_options = [option];
            }

            return res;

        } catch (error) {
            ConsoleHandler.error(error);
        }

        return {};
    }

    get moduletable(): ModuleTable<any> {
        return VOsTypesManager.moduleTables_by_voType[this.api_type_id];
    }

    get internal_store_filter_state_uid(): string {
        return 'filter_' + this.api_type_id + '_active_options';
    }

    get internal_store_filter_commit_uid(): string {
        return 'set_filter_' + this.api_type_id + '_active_options';
    }

    get internal_store_filter_commit_selectable_options_by_ids_uid(): string {
        return 'set_filter_' + this.api_type_id + '_selectable_options_by_ids';
    }

    get internal_store_all_by_ids_state_uid(): string {
        return 'all_' + this.api_type_id + '_by_ids';
    }
}
