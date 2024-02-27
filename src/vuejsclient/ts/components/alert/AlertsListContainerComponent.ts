import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import VueComponentBase from '../VueComponentBase';
import './AlertsListContainerComponent.scss';
import { ModuleAlertAction, ModuleAlertGetter } from './AlertStore';
import AlertsListContentComponent from './AlertsListContentComponent';

@Component({
    template: require('./AlertsListContainerComponent.pug'),
    components: {
        Alertslistcontentcomponent: AlertsListContentComponent,
        Draggablewindowcomponent: () => import('../../components/draggable_window/DraggableWindowComponent'),
    }
})
export default class AlertsListContainerComponent extends VueComponentBase {

    @ModuleAlertGetter
    private get_alerts_list: { [path: string]: number };
    @ModuleAlertGetter
    private get_show_alerts_list: boolean;

    @ModuleAlertAction
    private toggle_show_alerts_list: () => void;

    @Prop({ default: true })
    private show_alert_date: boolean;

    @Prop({ default: true })
    private show_alert_icon: boolean;

    @Prop({ default: 'alert.list.title.default' })
    private title_code_trad: string;

    @Prop({ default: null })
    private desc_code_trad: string;

    private mounted(): void {
        // $(this.$refs.alerts_list_header).draggable();
        // let offset = $(this.$el).parent().parent().offset();
        // $(this.$refs.alerts_list_component).css({
        //     top: offset.top - $(window).scrollTop() + 34,
        //     right: 0,
        // });
    }

    private close(): void {
        this.toggle_show_alerts_list();
    }

    get alerts_paths(): string[] {
        if (!this.get_alerts_list) {
            return [];
        }

        const res: string[] = [];
        for (const path in this.get_alerts_list) {
            if (this.get_alerts_list[path]) {
                res.push(path);
            }
        }

        res.sort((a: string, b: string) => {
            if (a < b) {
                return -1;
            }
            if (a > b) {
                return 1;
            }

            return 0;
        });

        return res;
    }
}