import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import Alert from '../../../../shared/modules/Alert/vos/Alert';
import VueComponentBase from '../VueComponentBase';
import './AlertComponent.scss';
import { ModuleAlertAction, ModuleAlertGetter } from './AlertStore';
import AlertViewComponent from './AlertViewComponent';
import ThrottleHelper from '../../../../shared/tools/ThrottleHelper';

@Component({
    template: require('./AlertComponent.pug'),
    components: {
        Alertviewcomponent: AlertViewComponent
    }
})
export default class AlertComponent extends VueComponentBase {

    @ModuleAlertGetter
    private get_alerts: { [path: string]: Alert[] };

    @ModuleAlertAction
    private set_title: (params: { alert_path: string, translatable_code: string, translation_params: { [param_name: string]: any } }) => void;
    @ModuleAlertAction
    private register_path_in_alerts_list: (alert_path: string) => void;
    @ModuleAlertAction
    private unregister_path_in_alerts_list: (alert_path: string) => void;

    @Prop({ default: 16 })
    private offset: number;

    @Prop({ default: 'bottom' })
    private tooltip_direction: string;

    @Prop({ default: 'center' })
    private tooltip_align: string;

    @Prop({ default: true })
    private toggle_visible_on_click: boolean;

    @Prop({ default: null })
    private path: string;

    @Prop({ default: true })
    private show_alert_date: boolean;

    @Prop({ default: true })
    private show_alert_content: boolean;

    @Prop({ default: true })
    private show_popover: boolean;

    @Prop({ default: true })
    private is_in_list: boolean;

    @Prop({ default: true })
    private title_translatable_code: string;

    @Prop({ default: true })
    private title_translation_params: { [param_name: string]: any };

    private throttle_update = ThrottleHelper.declare_throttle_without_args(this.update, 100);

    @Watch('path')
    public on_change_path() {
        this.throttle_update();
    }

    public update() {
        if (!this.path) {
            return;
        }
        if (this.is_in_list) {
            if (this.title_translatable_code) {
                this.set_title({ alert_path: this.path, translatable_code: this.title_translatable_code, translation_params: this.title_translation_params });
            }
            // TODO ajouter l'alerte dans le store store
            this.register_path_in_alerts_list(this.path);
        }
    }

    public mounted() {
        this.throttle_update();
    }

    public beforeDestroy() {
        if (!this.path) {
            return;
        }
        if (this.is_in_list) {
            // TODO supprimer l'alerte du store
            this.unregister_path_in_alerts_list(this.path);
        }
    }

    get tooltip_visibility(): string {
        return this.toggle_visible_on_click ? 'focus' : 'hover';
    }

    get alerts(): Alert[] {
        if ((!this.path) || (!this.get_alerts)) {
            return null;
        }

        return this.get_alerts[this.path];
    }

    get is_error(): boolean {
        if (!this.has_alerts) {
            return null;
        }

        return this.alerts[0].type >= Alert.TYPE_ERROR;
    }

    get is_warn(): boolean {
        if (!this.has_alerts) {
            return null;
        }

        if (this.is_error) {
            return false;
        }

        return this.alerts[0].type >= Alert.TYPE_WARN;
    }

    get is_info(): boolean {
        if (!this.has_alerts) {
            return null;
        }

        if (this.is_warn || this.is_error) {
            return false;
        }

        return this.alerts[0].type >= Alert.TYPE_INFO;
    }

    get is_debug(): boolean {
        if (!this.has_alerts) {
            return null;
        }

        if (this.is_warn || this.is_error || this.is_info) {
            return false;
        }

        return this.alerts[0].type >= Alert.TYPE_DEBUG;
    }

    get has_alerts(): boolean {
        return this.alerts && this.alerts.length > 0;
    }
}