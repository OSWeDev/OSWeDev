import 'quill/dist/quill.bubble.css'; // Compliqué à lazy load
import 'quill/dist/quill.core.css'; // Compliqué à lazy load
import 'quill/dist/quill.snow.css'; // Compliqué à lazy load
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import CMSLinkButtonWidgetOptionsVO from '../../../../../../../shared/modules/DashboardBuilder/vos/CMSLinkButtonWidgetOptionsVO';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';
import VueComponentBase from '../../../../VueComponentBase';
import { ModuleDashboardPageAction } from '../../../page/DashboardPageStore';
import './CMSLinkButtonWidgetOptionsComponent.scss';

@Component({
    template: require('./CMSLinkButtonWidgetOptionsComponent.pug')
})
export default class CMSLinkButtonWidgetOptionsComponent extends VueComponentBase {

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @ModuleDashboardPageAction
    private set_page_widget: (page_widget: DashboardPageWidgetVO) => void;

    private url: string = null;
    private title: string = null;
    private color: string = null;
    private text_color: string = null;
    private about_blank: boolean = false;
    private is_text_color_white: boolean = true;
    private radius: number = null;

    private next_update_options: CMSLinkButtonWidgetOptionsVO = null;
    private throttled_update_options = ThrottleHelper.declare_throttle_without_args(this.update_options.bind(this), 50, { leading: false, trailing: true });

    get widget_options(): CMSLinkButtonWidgetOptionsVO {
        if (!this.page_widget) {
            return null;
        }

        let options: CMSLinkButtonWidgetOptionsVO = null;
        try {
            if (this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as CMSLinkButtonWidgetOptionsVO;
                options = options ? new CMSLinkButtonWidgetOptionsVO().from(options) : null;
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }

        return options;
    }

    @Watch('widget_options', { immediate: true, deep: true })
    private async onchange_widget_options() {
        if (!this.widget_options) {
            this.url = null;
            this.title = null;
            this.color = '#003c7d';
            this.text_color = '#ffffff';
            this.about_blank = false;
            this.is_text_color_white = true;
            this.radius = 0;

            return;
        }
        this.url = this.widget_options.url;
        this.title = this.widget_options.title;
        this.color = this.widget_options.color;
        this.text_color = this.widget_options.text_color;
        this.about_blank = this.widget_options.about_blank;
        this.is_text_color_white = (this.widget_options.text_color == '#ffffff');
        this.radius = this.widget_options.radius;
    }

    @Watch('url')
    @Watch('title')
    @Watch('color')
    @Watch('text_color')
    @Watch('about_blank')
    @Watch('radius')
    private async onchange_bloc_text() {
        if (!this.widget_options) {
            return;
        }

        if (this.widget_options.url != this.url ||
            this.widget_options.title != this.title ||
            this.widget_options.about_blank != this.about_blank ||
            this.widget_options.text_color != this.text_color ||
            this.widget_options.radius != this.radius ||
            this.widget_options.color != this.color) {

            this.next_update_options.url = this.url;
            this.next_update_options.title = this.title;
            this.next_update_options.color = this.color;
            this.next_update_options.text_color = this.text_color;
            this.next_update_options.about_blank = this.about_blank;
            this.next_update_options.radius = this.radius;

            this.is_text_color_white = (this.text_color == '#ffffff');

            await this.throttled_update_options();
        }
    }

    private async mounted() {

        if (!this.widget_options) {

            this.next_update_options = this.get_default_options();
        } else {

            this.next_update_options = this.widget_options;
        }

        await this.throttled_update_options();
    }

    private get_default_options(): CMSLinkButtonWidgetOptionsVO {
        this.is_text_color_white = true;

        return CMSLinkButtonWidgetOptionsVO.createNew(
            null,
            null,
            '#003c7d',
            '#ffffff',
            false,
            0,
        );
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

    private async switch_about_blank() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        this.next_update_options.about_blank = !this.next_update_options.about_blank;

        this.throttled_update_options();
    }

    private async switch_text_color() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        this.is_text_color_white = !this.is_text_color_white;

        if (this.is_text_color_white) {
            this.next_update_options.text_color = '#ffffff';
        } else {
            this.next_update_options.text_color = '#000000';
        }

        this.throttled_update_options();
    }

}