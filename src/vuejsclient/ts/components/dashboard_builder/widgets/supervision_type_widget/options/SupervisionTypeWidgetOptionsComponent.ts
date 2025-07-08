import { isEqual } from 'lodash';
import Component from 'vue-class-component';
import { Inject, Prop, Watch } from 'vue-property-decorator';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import SupervisionTypeWidgetManager from '../../../../../../../shared/modules/DashboardBuilder/manager/SupervisionTypeWidgetManager';
import WidgetOptionsVOManager from '../../../../../../../shared/modules/DashboardBuilder/manager/WidgetOptionsVOManager';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import DashboardWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import SupervisionTypeWidgetOptionsVO from '../../../../../../../shared/modules/DashboardBuilder/vos/SupervisionTypeWidgetOptionsVO';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import { reflect } from '../../../../../../../shared/tools/ObjectHandler';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';
import InlineTranslatableText from '../../../../InlineTranslatableText/InlineTranslatableText';
import VueComponentBase from '../../../../VueComponentBase';
import { ModuleDroppableVoFieldsAction } from '../../../droppable_vo_fields/DroppableVoFieldsStore';
import { IDashboardGetters, IDashboardPageActionsMethods, IDashboardPageConsumer } from '../../../page/DashboardPageStore';
import './SupervisionTypeWidgetOptionsComponent.scss';
import Throttle from '../../../../../../../shared/annotations/Throttle';
import EventifyEventListenerConfVO from '../../../../../../../shared/modules/Eventify/vos/EventifyEventListenerConfVO';

@Component({
    template: require('./SupervisionTypeWidgetOptionsComponent.pug'),
    components: {
        Inlinetranslatabletext: InlineTranslatableText,
    }
})
export default class SupervisionTypeWidgetOptionsComponent extends VueComponentBase implements IDashboardPageConsumer {
    @Inject('storeNamespace') readonly storeNamespace!: string;

    @Prop({ default: null })
    public dashboard: DashboardVO;

    @Prop({ default: null })
    public page_widget: DashboardPageWidgetVO;

    @ModuleDroppableVoFieldsAction
    public set_selected_fields: (selected_fields: { [api_type_id: string]: { [field_id: string]: boolean } }) => void;

    public next_update_options: SupervisionTypeWidgetOptionsVO = null;

    public supervision_api_type_ids: string[] = [];
    public supervision_select_options: string[] = [];

    public order_by_categories: boolean = true;
    public show_counter: boolean = true;
    public refresh_button: boolean = true;
    public auto_refresh: boolean = true;
    public auto_refresh_seconds: number = 30;


    get get_all_widgets(): DashboardWidgetVO[] {
        return this.vuexGet(reflect<this>().get_all_widgets);
    }

    get get_widgets_by_id(): { [id: number]: DashboardWidgetVO } {
        return this.vuexGet(reflect<this>().get_widgets_by_id);
    }

    get widget_options(): SupervisionTypeWidgetOptionsVO {
        if (!this.page_widget) {
            return null;
        }

        let options: SupervisionTypeWidgetOptionsVO = null;
        try {
            if (this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as SupervisionTypeWidgetOptionsVO;
                options = options ? new SupervisionTypeWidgetOptionsVO().from(options) : null;
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }

        return options;
    }

    get default_supervision_api_type_ids(): string[] {
        return this.widget_options?.supervision_api_type_ids ?? [];
    }

    get get_dashboard_api_type_ids(): string[] {
        return this.vuexGet(reflect<this>().get_dashboard_api_type_ids);
    }

    // get order_by_categories(): boolean {

    //     if (!this.widget_options) {
    //         return false;
    //     }

    //     return !!this.widget_options.order_by_categories;
    // }

    // get show_counter(): boolean {

    //     if (!this.widget_options) {
    //         return false;
    //     }

    //     return !!this.widget_options.show_counter;
    // }

    @Watch(reflect<SupervisionTypeWidgetOptionsComponent>().page_widget, { immediate: true })
    public async onchange_page_widget() {

        this.supervision_select_options = SupervisionTypeWidgetManager.load_supervision_api_type_ids_by_dashboard(this.get_dashboard_api_type_ids);

        // if ((!this.page_widget) || (!this.widget_options)) {
        //     if (this.supervision_api_type_ids?.length > 0) {
        //         this.supervision_api_type_ids = [];
        //     }
        //     return;
        // }

        this.initialize();
    }

    @Watch(reflect<SupervisionTypeWidgetOptionsComponent>().supervision_api_type_ids)
    public onchange_supervision_api_type_ids() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        if (this.supervision_api_type_ids != this.next_update_options.supervision_api_type_ids) {
            this.next_update_options.supervision_api_type_ids = this.supervision_api_type_ids;

            this.update_options();
        }
    }

    @Watch(reflect<SupervisionTypeWidgetOptionsComponent>().auto_refresh_seconds)
    public async onchange_auto_refresh_seconds() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        if (this.auto_refresh_seconds != this.next_update_options.auto_refresh_seconds) {
            this.next_update_options.auto_refresh_seconds = this.auto_refresh_seconds;

            this.update_options();
        }
    }

    @Throttle({
        param_type: EventifyEventListenerConfVO.PARAM_TYPE_NONE,
        leading: false,
        throttle_ms: 50,
    })
    public async update_options() {
        try {
            this.page_widget.json_options = JSON.stringify(this.next_update_options);
        } catch (error) {
            ConsoleHandler.error(error);
        }

        await ModuleDAO.instance.insertOrUpdateVO(this.page_widget);

        const name = this.get_widgets_by_id[this.page_widget.widget_id].name;
        const get_selected_fields = WidgetOptionsVOManager.widgets_get_selected_fields[name];
        this.set_selected_fields(get_selected_fields ? get_selected_fields(this.page_widget) : {});
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


    public supervision_select_label(api_type_id: string): string {
        return this.label('supervision_widget_component.' + api_type_id);
    }

    public get_default_options(): SupervisionTypeWidgetOptionsVO {
        return new SupervisionTypeWidgetOptionsVO(this.default_supervision_api_type_ids, this.order_by_categories, this.show_counter, true, true, 30);
    }

    public async switch_order_by_categories() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        this.next_update_options.order_by_categories = !this.next_update_options.order_by_categories;

        await this.update_options();
    }

    public async switch_show_counter() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        this.next_update_options.show_counter = !this.next_update_options.show_counter;

        if (!this.next_update_options.show_counter) {
            this.next_update_options.refresh_button = false;
            this.refresh_button = false;
            this.next_update_options.auto_refresh = false;
            this.auto_refresh = false;
        }

        await this.update_options();
    }

    public initialize() {
        if ((!this.page_widget) || (!this.widget_options)) {
            if (!this.supervision_api_type_ids) {
                this.supervision_api_type_ids = [];
            }
            if (!this.order_by_categories) {
                this.order_by_categories = true;
            }
            if (!this.show_counter) {
                this.show_counter = true;
            }
            if (!this.refresh_button) {
                this.refresh_button = true;
            }
            if (!this.auto_refresh) {
                this.auto_refresh = true;
            }
            if (!this.auto_refresh_seconds) {
                this.auto_refresh_seconds = 30;
            }
            return;
        }

        if (!isEqual(this.supervision_api_type_ids, this.default_supervision_api_type_ids)) {
            this.supervision_api_type_ids = this.default_supervision_api_type_ids;
        }
        if (this.order_by_categories != this.widget_options.order_by_categories) {
            this.order_by_categories = this.widget_options.order_by_categories;
        }
        if (this.show_counter != this.widget_options.show_counter) {
            this.show_counter = this.widget_options.show_counter;
        }
        if (this.refresh_button != this.widget_options.refresh_button) {
            this.refresh_button = this.widget_options.refresh_button;
        }
        if (this.auto_refresh != this.widget_options.auto_refresh) {
            this.auto_refresh = this.widget_options.auto_refresh;
        }
        if (!!this.widget_options.auto_refresh_seconds && this.auto_refresh_seconds != this.widget_options.auto_refresh_seconds) {
            this.auto_refresh_seconds = this.widget_options.auto_refresh_seconds;
        }
    }

    public async switch_refresh_button() {
        this.refresh_button = !this.refresh_button;

        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        if (this.next_update_options.refresh_button != this.refresh_button) {
            this.next_update_options.refresh_button = this.refresh_button;
            this.update_options();
        }
    }

    public async switch_auto_refresh() {
        this.auto_refresh = !this.auto_refresh;

        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        if (this.next_update_options.auto_refresh != this.auto_refresh) {
            this.next_update_options.auto_refresh = this.auto_refresh;
            this.update_options();
        }
    }
}