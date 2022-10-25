import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import Alert from '../../../../shared/modules/Alert/vos/Alert';
import VueComponentBase from '../VueComponentBase';
import { ModuleAlertAction, ModuleAlertGetter } from './AlertStore';
import AlertViewComponent from './AlertViewComponent';

@Component({
    template: require('./AlertsListContentComponent.pug'),
    components: {
        Alertviewcomponent: AlertViewComponent
    }
})
export default class AlertsListContentComponent extends VueComponentBase {

    @ModuleAlertGetter
    private get_alerts: { [path: string]: Alert[] };
    @ModuleAlertGetter
    private get_titles: { [path: string]: { translatable_code: string, translation_params: { [param_name: string]: any } } };
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

    @Prop({ default: true })
    private alerts_path: string;

    private alerts_in_list_by_path: { [path: string]: Alert[] } = {};
    private has_alerts_in_list_by_path: { [path: string]: Alert[] } = {};

    private mounted(): void {
    }

    get alerts(): Alert[] {
        if (!this.alerts_path) {
            return [];
        }

        let res: Alert[] = [];
        if (!this.get_alerts[this.alerts_path] || !this.get_alerts[this.alerts_path].length) {
            return [];
        }

        for (let j in this.get_alerts[this.alerts_path]) {
            if (this.get_alerts[this.alerts_path][j].not_in_list) {
                continue;
            }
            res.push(this.get_alerts[this.alerts_path][j]);
        }

        return res;
    }

    get has_alert(): boolean {
        return !!this.alerts && !!this.alerts.length;
    }

    get has_title(): boolean {
        if (!this.alerts_path || !this.get_titles) {
            return false;
        }

        return (!!this.get_titles[this.alerts_path] && !!this.get_titles[this.alerts_path]);
    }

    get title_translatable_code(): string {
        if (!this.has_title) {
            return null;
        }

        return this.get_titles[this.alerts_path].translatable_code;
    }

    get title_translation_params(): { [param_name: string]: any } {
        if (!this.has_title) {
            return null;
        }
        return this.get_titles[this.alerts_path].translation_params;
    }

    // get is_error(): boolean {
    //     if (!this.has_alerts) {
    //         return null;
    //     }

    //     return this.alerts[0].type >= Alert.TYPE_ERROR;
    // }

    // get is_warn(): boolean {
    //     if (!this.has_alerts) {
    //         return null;
    //     }

    //     if (this.is_error) {
    //         return false;
    //     }

    //     return this.alerts[0].type >= Alert.TYPE_WARN;
    // }

    // get is_info(): boolean {
    //     if (!this.has_alerts) {
    //         return null;
    //     }

    //     if (this.is_warn || this.is_error) {
    //         return false;
    //     }

    //     return this.alerts[0].type >= Alert.TYPE_INFO;
    // }

    // get is_debug(): boolean {
    //     if (!this.has_alerts) {
    //         return null;
    //     }

    //     if (this.is_warn || this.is_error || this.is_info) {
    //         return false;
    //     }

    //     return this.alerts[0].type >= Alert.TYPE_DEBUG;
    // }


}