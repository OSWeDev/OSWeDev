import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import { VueNestable, VueNestableHandle } from 'vue-nestable';
import AdvancedDateFilterOptDescVO from '../../../../../../../shared/modules/DashboardBuilder/vos/AdvancedDateFilterOptDescVO';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import VOFieldRefVO from '../../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import VOsTypesManager from '../../../../../../../shared/modules/VOsTypesManager';
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
import ModuleTableField from '../../../../../../../shared/modules/ModuleTableField';

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

    @ModuleDashboardPageAction
    private set_custom_filters: (custom_filters: string[]) => void;

    private editable_opts: AdvancedDateFilterOptDescVO[] = null;
    private is_checkbox: boolean = false;

    private next_update_options: AdvancedDateFilterWidgetOptions = null;
    private throttled_update_options = ThrottleHelper.getInstance().declare_throttle_without_args(this.update_options.bind(this), 50, { leading: false, trailing: true });

    @Watch('widget_options', { immediate: true })
    private onchange_widget_options() {
        if (!this.widget_options) {
            this.is_checkbox = false;
            this.editable_opts = null;
            return;
        }

        this.editable_opts = this.opts;

        if (this.is_checkbox != this.widget_options.is_checkbox) {
            this.is_checkbox = this.widget_options.is_checkbox;
        }
    }

    private async update_options() {
        try {
            this.page_widget.json_options = JSON.stringify(this.next_update_options);
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
        }
        await ModuleDAO.getInstance().insertOrUpdateVO(this.page_widget);

        this.set_page_widget(this.page_widget);
        this.$emit('update_layout_widget', this.page_widget);

        let name = VOsTypesManager.getInstance().vosArray_to_vosByIds(DashboardBuilderWidgetsController.getInstance().sorted_widgets)[this.page_widget.widget_id].name;
        let get_selected_fields = DashboardBuilderWidgetsController.getInstance().widgets_get_selected_fields[name];
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
            this.next_update_options = new AdvancedDateFilterWidgetOptions(null, null, false);
        }

        let vo_field_ref = new VOFieldRefVO();
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

        let field = VOsTypesManager.getInstance().moduleTables_by_voType[api_type_id].get_field_by_id(field_id);

        if (!field) {
            return false;
        }

        switch (field.field_type) {
            case ModuleTableField.FIELD_TYPE_tstz:
                return true;

            default:
                return false;
        }
    }

    private async changed_opts() {

        /**
         * On applique les nouveaux poids
         */
        for (let i in this.editable_opts) {
            let opt = this.editable_opts[i];

            this.opts.find((c) => c.id == opt.id).weight = parseInt(i.toString());
        }

        await ModuleDAO.getInstance().insertOrUpdateVOs(this.opts);
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

        let i = this.next_update_options.opts.findIndex((opt) => {
            if (opt.id == update_opt.id) {
                old_opt = opt;
                return true;
            }

            return false;
        });

        if (i < 0) {
            ConsoleHandler.getInstance().error('update_opt failed');
            return null;
        }

        this.next_update_options.opts[i] = update_opt;

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

        let i = this.next_update_options.opts.findIndex((opt) => {
            return opt.id == del_opt.id;
        });

        if (i < 0) {
            ConsoleHandler.getInstance().error('remove_opt failed');
            return null;
        }

        this.next_update_options.opts.splice(i, 1);

        await this.throttled_update_options();
    }

    private get_new_opt_id() {
        if (!this.widget_options) {
            ConsoleHandler.getInstance().error('get_new_opt_id:failed');
            return null;
        }

        if ((!this.widget_options.opts) || (!this.widget_options.opts.length)) {
            return 0;
        }

        let ids = this.widget_options.opts.map((c) => c.id ? c.id : 0);
        let max = -1;
        for (let i in ids) {
            if (max < ids[i]) {
                max = ids[i];
            }
        }

        return max + 1;
    }

    private get_default_options(): AdvancedDateFilterWidgetOptions {
        return new AdvancedDateFilterWidgetOptions(null, null, false);
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

    get widget_options(): AdvancedDateFilterWidgetOptions {
        if (!this.page_widget) {
            return null;
        }

        let options: AdvancedDateFilterWidgetOptions = null;
        try {
            if (!!this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as AdvancedDateFilterWidgetOptions;
                options = options ? new AdvancedDateFilterWidgetOptions(
                    options.vo_field_ref,
                    options.opts,
                    options.is_checkbox,
                ) : null;
            }
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
        }

        return options;
    }

    get vo_field_ref(): VOFieldRefVO {
        let options: AdvancedDateFilterWidgetOptions = this.widget_options;

        if ((!options) || (!options.vo_field_ref)) {
            return null;
        }

        return Object.assign(new VOFieldRefVO(), options.vo_field_ref);
    }

    get opts(): AdvancedDateFilterOptDescVO[] {
        let options: AdvancedDateFilterWidgetOptions = this.widget_options;

        if ((!options) || (!options.opts) || (!options.opts.length)) {
            return null;
        }

        let res: AdvancedDateFilterOptDescVO[] = [];

        for (let i in options.opts) {
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
}