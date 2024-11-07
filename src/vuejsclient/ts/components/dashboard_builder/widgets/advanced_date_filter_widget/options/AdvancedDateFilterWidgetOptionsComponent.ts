import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import { VueNestable, VueNestableHandle } from 'vue-nestable';
import AdvancedDateFilterOptDescVO from '../../../../../../../shared/modules/DashboardBuilder/vos/AdvancedDateFilterOptDescVO';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import VOFieldRefVO from '../../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import VOsTypesManager from '../../../../../../../shared/modules/VO/manager/VOsTypesManager';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';
import VueComponentBase from '../../../../VueComponentBase';
import { ModuleDroppableVoFieldsAction } from '../../../droppable_vo_fields/DroppableVoFieldsStore';
import SingleVoFieldRefHolderComponent from '../../../options_tools/single_vo_field_ref_holder/SingleVoFieldRefHolderComponent';
import { ModuleDashboardPageAction, ModuleDashboardPageGetter } from '../../../page/DashboardPageStore';
import DashboardBuilderWidgetsController from '../../DashboardBuilderWidgetsController';
import AdvancedDateFilterWidgetOptions from './AdvancedDateFilterWidgetOptions';
import './AdvancedDateFilterWidgetOptionsComponent.scss';
import AdvancedDateFilterWidgetOptionsOptComponent from './opt/AdvancedDateFilterWidgetOptionsOptComponent';
import ModuleTableFieldVO from '../../../../../../../shared/modules/DAO/vos/ModuleTableFieldVO';
import ModuleTableController from '../../../../../../../shared/modules/DAO/ModuleTableController';

@Component({
    template: require('./AdvancedDateFilterWidgetOptionsComponent.pug'),
    components: {
        Singlevofieldrefholdercomponent: SingleVoFieldRefHolderComponent,
        Vuenestable: VueNestable,
        Vuenestablehandle: VueNestableHandle,
        Advanceddatefilterwidgetoptionsoptcomponent: AdvancedDateFilterWidgetOptionsOptComponent,
    }
})
export default class AdvancedDateFilterWidgetOptionsComponent extends VueComponentBase {

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @ModuleDroppableVoFieldsAction
    private set_selected_fields: (selected_fields: { [api_type_id: string]: { [field_id: string]: boolean } }) => void;

    @ModuleDashboardPageAction
    private set_page_widget: (page_widget: DashboardPageWidgetVO) => void;

    @ModuleDashboardPageGetter
    private get_custom_filters: string[];
    @ModuleDashboardPageGetter
    private get_page_widgets: DashboardPageWidgetVO[];

    @ModuleDashboardPageAction
    private set_custom_filters: (custom_filters: string[]) => void;

    private editable_opts: AdvancedDateFilterOptDescVO[] = null;
    private is_checkbox: boolean = false;
    private hide_opts: boolean = false;
    private refuse_left_open: boolean = false;
    private refuse_right_open: boolean = false;
    private is_relative_to_other_filter: boolean = false;
    private is_relative_to_today: boolean = false;
    private hide_filter: boolean = false;
    private tmp_default_value: AdvancedDateFilterOptDescVO = null;
    private relative_to_other_filter_id: number = null;
    private auto_select_relative_date_min: number = null;
    private auto_select_relative_date_max: number = null;

    private next_update_options: AdvancedDateFilterWidgetOptions = null;
    private throttled_update_options = ThrottleHelper.declare_throttle_without_args(this.update_options.bind(this), 50, { leading: false, trailing: true });

    private custom_filter_name: string = null;
    private is_vo_field_ref: boolean = true;

    @Watch('widget_options', { immediate: true })
    private onchange_widget_options() {
        if (!this.widget_options) {
            this.is_checkbox = false;
            this.hide_opts = false;
            this.refuse_left_open = false;
            this.refuse_right_open = false;
            this.is_relative_to_other_filter = false;
            this.is_relative_to_today = false;
            this.hide_filter = false;
            this.relative_to_other_filter_id = null;
            this.auto_select_relative_date_min = null;
            this.auto_select_relative_date_max = null;
            this.tmp_default_value = null;
            this.editable_opts = null;
            this.is_vo_field_ref = true;
            this.custom_filter_name = null;
            return;
        }

        this.editable_opts = this.opts;

        if (this.is_checkbox != this.widget_options.is_checkbox) {
            this.is_checkbox = this.widget_options.is_checkbox;
        }
        if (this.hide_opts != this.widget_options.hide_opts) {
            this.hide_opts = this.widget_options.hide_opts;
        }
        if (this.refuse_left_open != this.widget_options.refuse_left_open) {
            this.refuse_left_open = this.widget_options.refuse_left_open;
        }
        if (this.refuse_right_open != this.widget_options.refuse_right_open) {
            this.refuse_right_open = this.widget_options.refuse_right_open;
        }
        if (this.is_relative_to_other_filter != this.widget_options.is_relative_to_other_filter) {
            this.is_relative_to_other_filter = this.widget_options.is_relative_to_other_filter;
        }
        if (this.is_relative_to_today != this.widget_options.is_relative_to_today) {
            this.is_relative_to_today = this.widget_options.is_relative_to_today;
        }
        if (this.hide_filter != this.widget_options.hide_filter) {
            this.hide_filter = this.widget_options.hide_filter;
        }
        if (this.relative_to_other_filter_id != this.widget_options.relative_to_other_filter_id) {
            this.relative_to_other_filter_id = this.widget_options.relative_to_other_filter_id;
        }
        if (this.auto_select_relative_date_min != this.widget_options.auto_select_relative_date_min) {
            this.auto_select_relative_date_min = this.widget_options.auto_select_relative_date_min;
        }
        if (this.auto_select_relative_date_max != this.widget_options.auto_select_relative_date_max) {
            this.auto_select_relative_date_max = this.widget_options.auto_select_relative_date_max;
        }
        if (this.is_vo_field_ref != this.widget_options.is_vo_field_ref) {
            this.is_vo_field_ref = this.widget_options.is_vo_field_ref;
        }
        if (this.custom_filter_name != this.widget_options.custom_filter_name) {
            this.custom_filter_name = this.widget_options.custom_filter_name;
        }
        if (this.tmp_default_value != this.widget_options.default_value) {
            this.tmp_default_value = this.widget_options.default_value;
        }
    }

    @Watch('custom_filter_name')
    private async onchange_custom_filter_name() {
        if (!this.widget_options) {
            return;
        }

        if (this.widget_options.custom_filter_name != this.custom_filter_name) {
            this.next_update_options = this.widget_options;
            this.next_update_options.custom_filter_name = this.custom_filter_name;

            await this.throttled_update_options();
        }
    }

    @Watch('tmp_default_value')
    private async onchange_tmp_default_value() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        if (this.tmp_default_value != this.next_update_options.default_value) {
            this.next_update_options.default_value = this.tmp_default_value;

            await this.throttled_update_options();
        }
    }

    @Watch('relative_to_other_filter_id')
    private async onchange_relative_to_other_filter_id() {
        if (!this.widget_options) {
            return;
        }

        if (this.widget_options.relative_to_other_filter_id != this.relative_to_other_filter_id) {
            this.next_update_options = this.widget_options;
            this.next_update_options.relative_to_other_filter_id = this.relative_to_other_filter_id;

            this.throttled_update_options();
        }
    }

    @Watch('auto_select_relative_date_min')
    private async onchange_auto_select_relative_date_min() {
        if (!this.widget_options) {
            return;
        }

        if (this.widget_options.auto_select_relative_date_min != this.auto_select_relative_date_min) {
            this.next_update_options = this.widget_options;
            this.next_update_options.auto_select_relative_date_min = ((this.auto_select_relative_date_min != null) ? parseInt(this.auto_select_relative_date_min.toString()) : null);

            this.throttled_update_options();
        }
    }

    @Watch('auto_select_relative_date_max')
    private async onchange_auto_select_relative_date_max() {
        if (!this.widget_options) {
            return;
        }

        if (this.widget_options.auto_select_relative_date_max != this.auto_select_relative_date_max) {
            this.next_update_options = this.widget_options;
            this.next_update_options.auto_select_relative_date_max = ((this.auto_select_relative_date_max != null) ? parseInt(this.auto_select_relative_date_max.toString()) : null);

            this.throttled_update_options();
        }
    }

    private async switch_is_vo_field_ref() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = new AdvancedDateFilterWidgetOptions(this.is_vo_field_ref == null ? true : this.is_vo_field_ref, null, null, null, false, null, false, false, false, false, null, false, false, null, null);
        }

        this.next_update_options.is_vo_field_ref = !this.next_update_options.is_vo_field_ref;

        await this.throttled_update_options();
    }


    private async update_options() {
        try {
            this.page_widget.json_options = JSON.stringify(this.next_update_options);
        } catch (error) {
            ConsoleHandler.error(error);
        }
        await ModuleDAO.instance.insertOrUpdateVO(this.page_widget);

        this.set_page_widget(this.page_widget);
        this.$emit('update_layout_widget', this.page_widget);

        const name = VOsTypesManager.vosArray_to_vosByIds(DashboardBuilderWidgetsController.getInstance().sorted_widgets)[this.page_widget.widget_id].name;
        const get_selected_fields = DashboardBuilderWidgetsController.getInstance().widgets_get_selected_fields[name];
        this.set_selected_fields(get_selected_fields ? get_selected_fields(this.page_widget) : {});
    }

    private async remove_field_ref() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            return null;
        }

        if (!this.next_update_options.vo_field_ref) {
            return null;
        }

        this.next_update_options.vo_field_ref = null;

        await this.throttled_update_options();
    }

    private async add_field_ref(api_type_id: string, field_id: string) {
        this.next_update_options = this.widget_options;

        if (!this.is_type_date(api_type_id, field_id)) {
            return;
        }

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        const vo_field_ref = new VOFieldRefVO();
        vo_field_ref.api_type_id = api_type_id;
        vo_field_ref.field_id = field_id;
        vo_field_ref.weight = 0;

        this.next_update_options.vo_field_ref = vo_field_ref;

        await this.throttled_update_options();
    }

    private is_type_date(api_type_id: string, field_id: string): boolean {

        if (!api_type_id || !field_id) {
            return false;
        }

        const field = ModuleTableController.module_tables_by_vo_type[api_type_id].get_field_by_id(field_id);

        if (!field) {
            return false;
        }

        switch (field.field_type) {
            case ModuleTableFieldVO.FIELD_TYPE_tstz:
            case ModuleTableFieldVO.FIELD_TYPE_tsrange:
            case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
            case ModuleTableFieldVO.FIELD_TYPE_tstz_array:
                return true;

            default:
                return false;
        }
    }

    private async changed_opts() {

        /**
         * On applique les nouveaux poids
         */
        for (const i in this.editable_opts) {
            const opt = this.editable_opts[i];

            this.opts.find((c) => c.id == opt.id).weight = parseInt(i.toString());
        }

        await ModuleDAO.instance.insertOrUpdateVOs(this.opts);
        this.next_update_options = this.widget_options;
        this.next_update_options.opts = this.opts;
        await this.throttled_update_options();
    }

    private async add_opt(add_opt: AdvancedDateFilterOptDescVO) {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        if (!add_opt) {
            add_opt = new AdvancedDateFilterOptDescVO();
            add_opt.id = this.get_new_opt_id();
        }

        let i = -1;
        let found = false;

        if ((!!add_opt) && (!!this.next_update_options.opts)) {
            i = this.next_update_options.opts.findIndex((ref_elt) => {
                return ref_elt.id == add_opt.id;
            });
        }

        if (i < 0) {
            i = 0;
            add_opt.weight = 0;
        } else {
            found = true;
        }

        if (!found) {
            if (!this.next_update_options.opts) {
                this.next_update_options.opts = [];
            }
            this.next_update_options.opts.push(add_opt);
        }

        await this.throttled_update_options();
    }

    private async update_opt(update_opt: AdvancedDateFilterOptDescVO) {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            return null;
        }

        if (!this.next_update_options.opts) {
            return null;
        }

        let old_opt: AdvancedDateFilterOptDescVO = null;

        const i = this.next_update_options.opts.findIndex((opt) => {
            if (opt.id == update_opt.id) {
                old_opt = opt;
                return true;
            }

            return false;
        });

        if (i < 0) {
            ConsoleHandler.error('update_opt failed');
            return null;
        }

        this.next_update_options.opts[i] = update_opt;

        if (this.next_update_options.default_value?.id == update_opt.id) {
            this.next_update_options.default_value = update_opt;
        }

        await this.throttled_update_options();
    }

    private async remove_opt(del_opt: AdvancedDateFilterOptDescVO) {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            return null;
        }

        if (!this.next_update_options.opts) {
            return null;
        }

        const i = this.next_update_options.opts.findIndex((opt) => {
            return opt.id == del_opt.id;
        });

        if (i < 0) {
            ConsoleHandler.error('remove_opt failed');
            return null;
        }

        this.next_update_options.opts.splice(i, 1);

        await this.throttled_update_options();
    }

    private get_new_opt_id() {
        if (!this.widget_options) {
            ConsoleHandler.error('get_new_opt_id:failed');
            return null;
        }

        if ((!this.widget_options.opts) || (!this.widget_options.opts.length)) {
            return 0;
        }

        const ids = this.widget_options.opts.map((c) => c.id ? c.id : 0);
        let max = -1;
        for (const i in ids) {
            if (max < ids[i]) {
                max = ids[i];
            }
        }

        return max + 1;
    }

    private get_default_options(): AdvancedDateFilterWidgetOptions {
        return new AdvancedDateFilterWidgetOptions(true, null, null, null, false, null, false, false, false, false, null, false, false, null, null);
    }

    private async switch_is_checkbox() {
        this.is_checkbox = !this.is_checkbox;

        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        if (this.next_update_options.is_checkbox != this.is_checkbox) {
            this.next_update_options.is_checkbox = this.is_checkbox;
            await this.throttled_update_options();
        }
    }

    private async switch_hide_opts() {
        this.hide_opts = !this.hide_opts;

        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        if (this.next_update_options.hide_opts != this.hide_opts) {
            this.next_update_options.hide_opts = this.hide_opts;
            await this.throttled_update_options();
        }
    }

    private async switch_refuse_left_open() {
        this.refuse_left_open = !this.refuse_left_open;

        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        if (this.next_update_options.refuse_left_open != this.refuse_left_open) {
            this.next_update_options.refuse_left_open = this.refuse_left_open;
            await this.throttled_update_options();
        }
    }

    private async switch_refuse_right_open() {
        this.refuse_right_open = !this.refuse_right_open;

        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        if (this.next_update_options.refuse_right_open != this.refuse_right_open) {
            this.next_update_options.refuse_right_open = this.refuse_right_open;
            await this.throttled_update_options();
        }
    }

    private async switch_is_relative_to_other_filter() {
        this.is_relative_to_other_filter = !this.is_relative_to_other_filter;

        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        if (this.next_update_options.is_relative_to_other_filter != this.is_relative_to_other_filter) {
            this.next_update_options.is_relative_to_other_filter = this.is_relative_to_other_filter;
            await this.throttled_update_options();
        }
    }

    private async switch_is_relative_to_today() {
        this.is_relative_to_today = !this.is_relative_to_today;

        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        if (this.next_update_options.is_relative_to_today != this.is_relative_to_today) {
            this.next_update_options.is_relative_to_today = this.is_relative_to_today;
            await this.throttled_update_options();
        }
    }

    private async switch_hide_filter() {
        this.hide_filter = !this.hide_filter;

        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        if (this.next_update_options.hide_filter != this.hide_filter) {
            this.next_update_options.hide_filter = this.hide_filter;
            await this.throttled_update_options();
        }
    }

    get has_existing_other_custom_filters(): boolean {
        if (!this.other_custom_filters) {
            return false;
        }

        return this.other_custom_filters.length > 0;
    }

    get other_custom_filters(): string[] {
        if (!this.get_custom_filters) {
            return null;
        }

        const res: string[] = [];

        for (const i in this.get_custom_filters) {
            const get_custom_filter = this.get_custom_filters[i];

            if (get_custom_filter == this.custom_filter_name) {
                continue;
            }

            res.push(get_custom_filter);
        }

        return this.get_custom_filters;
    }

    private change_custom_filter(custom_filter: string) {
        this.custom_filter_name = custom_filter;
        if (this.get_custom_filters && (this.get_custom_filters.indexOf(custom_filter) < 0)) {
            const custom_filters = Array.from(this.get_custom_filters);
            custom_filters.push(custom_filter);
            this.set_custom_filters(custom_filters);
        }
    }

    get widget_options(): AdvancedDateFilterWidgetOptions {
        if (!this.page_widget) {
            return null;
        }

        let options: AdvancedDateFilterWidgetOptions = null;
        try {
            if (this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as AdvancedDateFilterWidgetOptions;
                options = options ? new AdvancedDateFilterWidgetOptions(
                    options.is_vo_field_ref == null ? true : options.is_vo_field_ref,
                    options.vo_field_ref,
                    options.custom_filter_name,
                    options.opts,
                    options.is_checkbox,
                    options.default_value,
                    options.hide_opts,
                    options.refuse_left_open,
                    options.refuse_right_open,
                    options.is_relative_to_other_filter,
                    options.relative_to_other_filter_id,
                    options.hide_filter,
                    options.is_relative_to_today,
                    options.auto_select_relative_date_min,
                    options.auto_select_relative_date_max,
                ) : null;
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }

        return options;
    }

    get vo_field_ref(): VOFieldRefVO {
        const options: AdvancedDateFilterWidgetOptions = this.widget_options;

        if ((!options) || (!options.vo_field_ref)) {
            return null;
        }

        return Object.assign(new VOFieldRefVO(), options.vo_field_ref);
    }

    get opts(): AdvancedDateFilterOptDescVO[] {
        const options: AdvancedDateFilterWidgetOptions = this.widget_options;

        if ((!options) || (!options.opts) || (!options.opts.length)) {
            return null;
        }

        const res: AdvancedDateFilterOptDescVO[] = [];

        for (const i in options.opts) {
            res.push(Object.assign(new AdvancedDateFilterOptDescVO(), options.opts[i]));
        }

        res.sort((a: AdvancedDateFilterOptDescVO, b: AdvancedDateFilterOptDescVO) => {
            if (a.weight < b.weight) {
                return -1;
            }
            if (a.weight > b.weight) {
                return 1;
            }
            return 0;
        });

        return res;
    }

    get other_filters_by_name(): { [filter_name: string]: DashboardPageWidgetVO } {
        if (!this.get_page_widgets) {
            return null;
        }

        let res: { [filter_name: string]: DashboardPageWidgetVO } = {};

        for (let i in this.get_page_widgets) {
            let get_page_widget = this.get_page_widgets[i];

            if (get_page_widget.id == this.page_widget.id) {
                continue;
            }

            if (get_page_widget.widget_id !== this.page_widget.widget_id) {
                continue;
            }

            if (!get_page_widget.json_options) {
                continue;
            }

            let other_filter_options = JSON.parse(get_page_widget.json_options) as AdvancedDateFilterWidgetOptions;
            if (!other_filter_options) {
                continue;
            }

            if (!!other_filter_options.is_vo_field_ref) {
                if ((!other_filter_options.vo_field_ref) || (!other_filter_options.vo_field_ref.api_type_id) || (!other_filter_options.vo_field_ref.field_id)) {
                    continue;
                }

                let name = 'Widget ID:' + get_page_widget.id + ' : ' + other_filter_options.vo_field_ref.api_type_id + '.' + other_filter_options.vo_field_ref.field_id;
                if (!!res[name]) {
                    continue;
                }
                res[name] = get_page_widget;
            } else {
                if (!other_filter_options.custom_filter_name) {
                    continue;
                }

                let name = 'Widget ID:' + get_page_widget.id + ' : ' + other_filter_options.custom_filter_name;
                if (!!res[name]) {
                    continue;
                }
                res[name] = get_page_widget;
            }
        }

        return res;
    }
}