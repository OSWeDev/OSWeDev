import Component from 'vue-class-component';
import { Inject, Prop, Watch } from 'vue-property-decorator';
import Throttle from '../../../../../../../shared/annotations/Throttle';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import EventifyEventListenerConfVO from '../../../../../../../shared/modules/Eventify/vos/EventifyEventListenerConfVO';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import InlineTranslatableText from '../../../../InlineTranslatableText/InlineTranslatableText';
import VueComponentBase from '../../../../VueComponentBase';
import { ModuleDroppableVoFieldsAction } from '../../../droppable_vo_fields/DroppableVoFieldsStore';
import { IDashboardGetters, IDashboardPageActionsMethods, IDashboardPageConsumer } from '../../../page/DashboardPageStore';
import ValidationFiltersWidgetOptions from './ValidationFiltersWidgetOptions';
import './ValidationFiltersWidgetOptionsComponent.scss';

@Component({
    template: require('./ValidationFiltersWidgetOptionsComponent.pug'),
    components: {
        Inlinetranslatabletext: InlineTranslatableText
    }
})
export default class ValidationFiltersWidgetOptionsComponent extends VueComponentBase implements IDashboardPageConsumer {
    @Inject('storeNamespace') readonly storeNamespace!: string;

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @ModuleDroppableVoFieldsAction
    private set_selected_fields: (selected_fields: { [api_type_id: string]: { [field_id: string]: boolean } }) => void;

    private next_update_options: ValidationFiltersWidgetOptions = null;

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

    @Throttle({
        param_type: EventifyEventListenerConfVO.PARAM_TYPE_NONE,
        throttle_ms: 50,
        leading: false,
    })
    private async update_options() {
        try {
            this.page_widget.json_options = JSON.stringify(this.next_update_options);
        } catch (error) {
            ConsoleHandler.error(error);
        }

        await ModuleDAO.instance.insertOrUpdateVO(this.page_widget);
    }

    @Throttle({
        param_type: EventifyEventListenerConfVO.PARAM_TYPE_NONE,
        throttle_ms: 800,
        leading: false,
    })
    private async update_colors() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        this.next_update_options.fg_color_text = this.fg_color_text;
        this.next_update_options.bg_color = this.bg_color;
        await this.update_options();
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

    // Accès dynamiques Vuex
    public vuexGet<K extends keyof IDashboardGetters>(getter: K): IDashboardGetters[K] {
        return this.$store.getters[`${this.storeNamespace}/${String(getter)}`];
    }
    public vuexAct<K extends keyof IDashboardPageActionsMethods>(
        action: K,
        ...args: Parameters<IDashboardPageActionsMethods[K]>
    ) {
        this.$store.dispatch(`${this.storeNamespace}/${String(action)}`, ...args);
    }

    private async switch_load_widgets_prevalidation() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        this.next_update_options.load_widgets_prevalidation = !this.next_update_options.load_widgets_prevalidation;

        this.update_options();
    }

    private get_default_options(): ValidationFiltersWidgetOptions {
        return new ValidationFiltersWidgetOptions(
            false,
        );
    }
}