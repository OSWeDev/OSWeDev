import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import CMSLinkButtonWidgetOptionsVO from '../../../../../../shared/modules/DashboardBuilder/vos/CMSLinkButtonWidgetOptionsVO';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import VueComponentBase from '../../../VueComponentBase';
import './CMSLinkButtonWidgetComponent.scss';

@Component({
    template: require('./CMSLinkButtonWidgetComponent.pug'),
    components: {}
})
export default class CMSLinkButtonWidgetComponent extends VueComponentBase {

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    private url: string = null;
    private title: string = null;
    private color: string = null;
    private text_color: string = null;
    private about_blank: boolean = null;
    private radius: number = null;
    private start_update: boolean = false;

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

    get style(): string {
        return 'background-color: ' + this.color + '; color: ' + this.text_color + ';' + (this.radius ? 'border-radius: ' + this.radius + 'px;' : '');
    }

    @Watch('widget_options', { immediate: true, deep: true })
    private async onchange_widget_options() {
        if (!this.widget_options) {
            this.url = null;
            this.title = null;
            this.color = '#003c7d';
            this.text_color = '#ffffff';
            this.about_blank = false;
            this.radius = null;

            return;
        }
        this.url = this.widget_options.url;
        this.title = this.widget_options.title;
        this.color = this.widget_options.color;
        this.text_color = this.widget_options.text_color;
        this.about_blank = this.widget_options.about_blank;
        this.radius = this.widget_options.radius;
    }

    private async mounted() {
        this.onchange_widget_options();
    }

    private go_to_link() {
        if (this.start_update) {
            return;
        }

        this.start_update = true;

        if (this.about_blank) {

            window.open(this.url, '_blank');
        } else {

            window.open(this.url, '_self');
        }

        this.start_update = false;
    }
}