import Component from "vue-class-component";
import { Prop, Watch } from "vue-property-decorator";
import DashboardPageVO from "../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO";
import DashboardPageWidgetVO from "../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO";
import InlineTranslatableText from "../../../../InlineTranslatableText/InlineTranslatableText";
import VueComponentBase from "../../../../VueComponentBase";
import SingleVoFieldRefHolderComponent from "../../../options_tools/single_vo_field_ref_holder/SingleVoFieldRefHolderComponent";
import { ModuleDashboardPageAction } from "../../../page/DashboardPageStore";
import './OseliaRunGraphWidgetOptionsComponent.scss';

interface OseliaRunGraphWidgetOptions {
    auto_refresh?: boolean;
    auto_refresh_seconds?: number;
}

@Component({
    template: require('./OseliaRunGraphWidgetOptionsComponent.pug'),
    components: {
        Singlevofieldrefholdercomponent: SingleVoFieldRefHolderComponent,
        Inlinetranslatabletext: InlineTranslatableText
    }
})
export default class OseliaRunGraphWidgetOptionsComponent extends VueComponentBase {

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    private dashboard_pages: DashboardPageVO[];

    @Prop({ default: null })
    private dashboard_page: DashboardPageVO;

    @ModuleDashboardPageAction
    private set_page_widget: (page_widget: DashboardPageWidgetVO) => void;

    // Options pour l'auto-refresh
    private auto_refresh: boolean = true;
    private auto_refresh_seconds: number = 5;
    private is_initializing: boolean = true;
    private is_saving: boolean = false; // Nouveau flag pour éviter les boucles pendant la sauvegarde
    private last_save_time: number = 0; // Timestamp de la dernière sauvegarde

    private next_update_options: OseliaRunGraphWidgetOptions = {
        auto_refresh: true,
        auto_refresh_seconds: 5
    };

    get widget_options(): OseliaRunGraphWidgetOptions {
        if (!this.page_widget) {
            return null;
        }

        try {
            return JSON.parse(this.page_widget.json_options) as OseliaRunGraphWidgetOptions;
        } catch (error) {
            return {
                auto_refresh: true,
                auto_refresh_seconds: 5
            };
        }
    }

    @Watch('auto_refresh')
    private async onchange_auto_refresh() {
        if (this.is_initializing || this.is_saving) {
            return;
        }

        if (this.auto_refresh != this.next_update_options.auto_refresh) {
            this.next_update_options.auto_refresh = this.auto_refresh;
            await this.save_options();
        }
    }

    @Watch('auto_refresh_seconds')
    private async onchange_auto_refresh_seconds() {
        if (this.is_initializing || this.is_saving) {
            return;
        }

        if (this.auto_refresh_seconds != this.next_update_options.auto_refresh_seconds) {
            this.next_update_options.auto_refresh_seconds = this.auto_refresh_seconds;
            await this.save_options();
        }
    }

    @Watch('page_widget.json_options')
    private async onchange_page_widget_options() {
        if (this.is_initializing || this.is_saving) {
            return;
        }

        // Si les options JSON changent, on synchronise nos valeurs locales
        if (this.widget_options) {
            const newAutoRefresh = this.widget_options.auto_refresh ?? true;
            const newAutoRefreshSeconds = this.widget_options.auto_refresh_seconds ?? 5;

            // On met à jour sans déclencher les watchers
            if (newAutoRefresh !== this.auto_refresh || newAutoRefreshSeconds !== this.auto_refresh_seconds) {
                this.is_initializing = true;
                this.auto_refresh = newAutoRefresh;
                this.auto_refresh_seconds = newAutoRefreshSeconds;
                this.next_update_options = {
                    auto_refresh: this.auto_refresh,
                    auto_refresh_seconds: this.auto_refresh_seconds
                };
                this.is_initializing = false;
            }
        }
    }

    async mounted() {
        if (this.widget_options) {
            this.auto_refresh = this.widget_options.auto_refresh ?? true;
            this.auto_refresh_seconds = this.widget_options.auto_refresh_seconds ?? 5;

            // Initialiser next_update_options avec les valeurs actuelles
            this.next_update_options = {
                auto_refresh: this.auto_refresh,
                auto_refresh_seconds: this.auto_refresh_seconds
            };
        }

        // Permettre aux watchers de fonctionner normalement après l'initialisation
        this.is_initializing = false;
    }

    private async save_options() {
        if (!this.page_widget || this.is_saving) {
            return;
        }

        // Protection contre les sauvegardes trop fréquentes (debounce)
        const now = Date.now();
        if (now - this.last_save_time < 100) { // 100ms minimum entre les sauvegardes
            return;
        }

        this.is_saving = true;
        this.last_save_time = now;

        try {
            this.page_widget.json_options = JSON.stringify(this.next_update_options);
            this.set_page_widget(this.page_widget);
        } finally {
            this.is_saving = false;
        }
    }

}