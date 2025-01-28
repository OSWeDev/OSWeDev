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
    private throttled_update_colors = ThrottleHelper.declare_throttle_without_args(this.update_colors.bind(this), 800, { leading: false, trailing: true });

    private fg_color_text: string = null;
    private bg_color: string = null;
    private load_widgets_prevalidation: boolean = false;

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

        if (!options) {
            options = this.get_default_options();
        }

        return options;
    }

    get title_name_code_text(): string {
        if (!this.widget_options) {
            return null;
        }

        return this.widget_options.get_title_name_code_text(this.page_widget.id);
    }

    @Watch('page_widget', { immediate: true })
    private async onchange_page_widget() {
        if ((!this.page_widget) || (!this.widget_options)) {
            if (!this.load_widgets_prevalidation) {
                this.load_widgets_prevalidation = false;
            }
            if (!this.fg_color_text) {
                this.fg_color_text = null;
            }
            if (!this.bg_color) {
                this.bg_color = null;
            }

            return;
        }

        if (this.load_widgets_prevalidation != this.widget_options.load_widgets_prevalidation) {
            this.load_widgets_prevalidation = this.widget_options.load_widgets_prevalidation;
        }
        if (this.fg_color_text != this.widget_options.fg_color_text) {
            this.fg_color_text = this.widget_options.fg_color_text;
        }
        if (this.bg_color != this.widget_options.bg_color) {
            this.bg_color = this.widget_options.bg_color;
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

        await ModuleDAO.instance.insertOrUpdateVO(this.page_widget);

        if (!this.widget_options) {
            return;
        }

        this.set_page_widget(this.page_widget);
        this.$emit('update_layout_widget', this.page_widget);
    }

    private async update_colors() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        this.next_update_options.fg_color_text = this.fg_color_text;
        this.next_update_options.bg_color = this.bg_color;
        await this.throttled_update_options();
    }

    private get_default_options(): ValidationFiltersWidgetOptions {
        return new ValidationFiltersWidgetOptions(
            false,
        );
    }
}