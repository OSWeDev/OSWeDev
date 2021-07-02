import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import DashboardPageVO from '../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import DefaultTranslation from '../../../../shared/modules/Translation/vos/DefaultTranslation';
import LocaleManager from '../../../../shared/tools/LocaleManager';
import WeightHandler from '../../../../shared/tools/WeightHandler';
import InlineTranslatableText from '../InlineTranslatableText/InlineTranslatableText';
import TranslatableTextController from '../InlineTranslatableText/TranslatableTextController';
import VueComponentBase from '../VueComponentBase';
import './DashboardBuilderComponent.scss';
import DroppableVoFieldsComponent from './droppable_vo_fields/DroppableVoFieldsComponent';
import { ModuleDashboardPageAction } from './page/DashboardPageStore';
import DashboardBuilderWidgetsComponent from './widgets/DashboardBuilderWidgetsComponent';

@Component({
    template: require('./DashboardBuilderComponent.pug'),
    components: {
        Inlinetranslatabletext: InlineTranslatableText,
        Droppablevofieldscomponent: DroppableVoFieldsComponent,
        Dashboardbuilderwidgetscomponent: DashboardBuilderWidgetsComponent
    }
})
export default class DashboardBuilderComponent extends VueComponentBase {

    @Prop({ default: null })
    private dashboard_id: number = null;

    @ModuleDashboardPageAction
    private set_page_widget: (page_widget: DashboardPageWidgetVO) => void;

    private dashboards: DashboardVO[] = [];
    private dashboard: DashboardVO = null;
    private loading: boolean = true;

    private pages: DashboardPageVO[] = [];
    private page: DashboardPageVO = null;

    @Watch("dashboard_id", { immediate: true })
    private async onchange_dashboard_id() {
        this.loading = true;

        if (!this.dashboard_id) {
            await this.init_dashboard();
            this.loading = false;
            return;
        }

        this.dashboard = await ModuleDAO.getInstance().getVoById<DashboardVO>(DashboardVO.API_TYPE_ID, this.dashboard_id);
        if (!this.dashboard) {
            await this.init_dashboard();
            this.loading = false;
            return;
        }

        this.pages = await ModuleDAO.getInstance().getVosByRefFieldIds<DashboardPageVO>(DashboardPageVO.API_TYPE_ID, 'dashboard_id', [this.dashboard.id]);
        if (!this.pages) {
            await this.create_dashboard_page();
        }
        WeightHandler.getInstance().sortByWeight(this.pages);
        this.page = this.pages[0];

        this.loading = false;
    }

    private added_widget_to_page(page_widget: DashboardPageWidgetVO) {
        this.set_page_widget(page_widget);
    }

    private async create_dashboard_page() {

        if (!this.dashboard) {
            return;
        }

        let page = new DashboardPageVO();
        page.dashboard_id = this.dashboard.id;
        page.weight = 0;
        let insertOrDeleteQueryResult: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(page);
        if ((!insertOrDeleteQueryResult) || (!insertOrDeleteQueryResult.id)) {
            this.snotify.error(this.label('DashboardBuilderComponent.create_new_dashboard.ko'));
            this.dashboard = null;
            return;
        }

        this.pages = [page];
        this.page = page;
    }

    private async mounted() {
        this.dashboards = await ModuleDAO.getInstance().getVos<DashboardVO>(DashboardVO.API_TYPE_ID);
    }

    private async init_dashboard() {

        if ((!this.dashboards) || (!this.dashboards.length)) {
            this.dashboards = [];
            await this.create_new_dashboard();
            return;
        }

        this.dashboard = this.dashboards[0];

        this.pages = await ModuleDAO.getInstance().getVosByRefFieldIds<DashboardPageVO>(DashboardPageVO.API_TYPE_ID, 'dashboard_id', [this.dashboard.id]);
        if (!this.pages) {
            await this.create_dashboard_page();
        }
        WeightHandler.getInstance().sortByWeight(this.pages);
        this.page = this.pages[0];
    }

    get dashboard_name_code_text(): string {
        if (!this.dashboard) {
            return null;
        }

        return this.dashboard.translatable_name_code_text + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
    }

    private async create_new_dashboard() {
        this.dashboard = new DashboardVO();
        let insertOrDeleteQueryResult: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(this.dashboard);
        if ((!insertOrDeleteQueryResult) || (!insertOrDeleteQueryResult.id)) {
            this.snotify.error(this.label('DashboardBuilderComponent.create_new_dashboard.ko'));
            this.dashboard = null;
            return;
        }
        this.dashboard.id = insertOrDeleteQueryResult.id;

        // On crée la trad
        let code_lang = LocaleManager.getInstance().getDefaultLocale();
        let code_text = this.dashboard.translatable_name_code_text + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
        let translation = "Dashboard [" + this.dashboard.id + "]";
        await TranslatableTextController.getInstance().save_translation(code_lang, code_text, translation);

        // On crée la première page du dashboard
        await this.create_dashboard_page();
        let page = new DashboardPageVO();
        page.dashboard_id = this.dashboard.id;

        this.dashboards.push(this.dashboard);
    }

    get dashboards_options() {

        if (!this.dashboards) {
            return [];
        }

        return this.dashboards;
    }

    private dashboard_label(dashboard: DashboardVO): string {
        if ((dashboard == null) || (typeof dashboard == 'undefined')) {
            return '';
        }

        return dashboard.id + ' | ' + this.label(dashboard.translatable_name_code_text);
    }

    get pages_name_code_text(): string[] {
        let res: string[] = [];

        if (!this.pages) {
            return res;
        }

        for (let i in this.pages) {
            let page = this.pages[i];

            res.push(page.translatable_name_code_text + DefaultTranslation.DEFAULT_LABEL_EXTENSION);
        }

        return res;
    }

    private async confirm_delete_page(page: DashboardPageVO) {

        if ((!page) || (!this.page) || (!this.dashboard) || (!this.pages) || (!this.pages.length)) {
            return;
        }

        let self = this;
        if (this.pages.length <= 1) {
            self.snotify.error(self.label('DashboardBuilderComponent.delete_page.cannot_delete_master_page'));
            return;
        }

        // On demande confirmation avant toute chose.
        // si on valide, on lance la suppression
        self.snotify.confirm(self.label('DashboardBuilderComponent.delete_page.confirmation.body'), self.label('DashboardBuilderComponent.delete_page.confirmation.title'), {
            timeout: 10000,
            showProgressBar: true,
            closeOnClick: false,
            pauseOnHover: true,
            buttons: [
                {
                    text: self.t('YES'),
                    action: async (toast) => {
                        self.$snotify.remove(toast.id);
                        self.snotify.info(self.label('DashboardBuilderComponent.delete_page.start'));

                        await ModuleDAO.getInstance().deleteVOs([page]);
                        self.pages = self.pages.filter((p) => p.id != page.id);
                        if (self.page.id == page.id) {
                            self.page = self.pages[0];
                        }

                        self.snotify.success(self.label('DashboardBuilderComponent.delete_page.ok'));
                    },
                    bold: false
                },
                {
                    text: self.t('NO'),
                    action: (toast) => {
                        self.$snotify.remove(toast.id);
                    }
                }
            ]
        });
    }
}