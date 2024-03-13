import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';
import InlineTranslatableText from '../../../../InlineTranslatableText/InlineTranslatableText';
import VueComponentBase from '../../../../VueComponentBase';
import { ModuleDroppableVoFieldsAction } from '../../../droppable_vo_fields/DroppableVoFieldsStore';
import { ModuleDashboardPageAction } from '../../../page/DashboardPageStore';
import ValidationFiltersWidgetOptions from './ValidationFiltersWidgetOptions';
import './ValidationFiltersWidgetOptionsComponent.scss';

@Component({
    template: require('./ValidationFiltersWidgetOptionsComponent.pug'),
    components: {
        Inlinetranslatabletext: InlineTranslatableText
    }
})
export default class ValidationFiltersWidgetOptionsComponent extends VueComponentBase {

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @ModuleDroppableVoFieldsAction
    private set_selected_fields: (selected_fields: { [api_type_id: string]: { [field_id: string]: boolean } }) => void;

    @ModuleDashboardPageAction
    private set_page_widget: (page_widget: DashboardPageWidgetVO) => void;

    private next_update_options: ValidationFiltersWidgetOptions = null;
    private throttled_update_options = ThrottleHelper.declare_throttle_without_args(this.update_options.bind(this), 50, { leading: false, trailing: true });

    private load_widgets_prevalidation: boolean = false;

    @Watch('page_widget', { immediate: true })
    private async onchange_page_widget() {
        if ((!this.page_widget) || (!this.widget_options)) {
            if (!this.load_widgets_prevalidation) {
                this.load_widgets_prevalidation = false;
            }

            return;
        }

        if (this.load_widgets_prevalidation != this.widget_options.load_widgets_prevalidation) {
            this.load_widgets_prevalidation = this.widget_options.load_widgets_prevalidation;
        }
    }

    private async switch_load_widgets_prevalidation() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        this.next_update_options.load_widgets_prevalidation = !this.next_update_options.load_widgets_prevalidation;

        this.throttled_update_options();
    }

    private async update_options() {
        try {
            this.page_widget.json_options = JSON.stringify(this.next_update_options);
        } catch (error) {
            ConsoleHandler.error(error);
        }

        await ModuleDAO.getInstance().insertOrUpdateVO(this.page_widget);

        if (!this.widget_options) {
            return;
        }

        this.set_page_widget(this.page_widget);
        this.$emit('update_layout_widget', this.page_widget);
    }

    private get_default_options(): ValidationFiltersWidgetOptions {
        return new ValidationFiltersWidgetOptions(
            false,
        );
    }

    get widget_options(): ValidationFiltersWidgetOptions {
        if (!this.page_widget) {
            return null;
        }

        let options: ValidationFiltersWidgetOptions = null;
        try {
            if (this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as ValidationFiltersWidgetOptions;
                options = options ? new ValidationFiltersWidgetOptions().from(options) : null;
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }

        return options;
    }
}