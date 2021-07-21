import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ModuleDAO from '../../../../../shared/modules/DAO/ModuleDAO';
import DashboardPageVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import WeightHandler from '../../../../../shared/tools/WeightHandler';
import InlineTranslatableText from '../../InlineTranslatableText/InlineTranslatableText';
import VueComponentBase from '../../VueComponentBase';
import DashboardBuilderBoardComponent from '../board/DashboardBuilderBoardComponent';
import { ModuleDashboardPageAction } from '../page/DashboardPageStore';
import './DashboardViewerComponent.scss';

@Component({
    template: require('./DashboardViewerComponent.pug'),
    components: {
        Inlinetranslatabletext: InlineTranslatableText,
        Dashboardbuilderboardcomponent: DashboardBuilderBoardComponent,
    }
})
export default class DashboardViewerComponent extends VueComponentBase {

    @Prop({ default: null })
    private dashboard_id: number;

    private dashboard: DashboardVO = null;
    private loading: boolean = true;

    private pages: DashboardPageVO[] = [];
    private page: DashboardPageVO = null;

    private selected_widget: DashboardPageWidgetVO = null;

    private select_widget(page_widget) {
        this.selected_widget = page_widget;
    }

    @Watch("dashboard_id", { immediate: true })
    private async onchange_dashboard_id() {
        this.loading = true;

        if (!this.dashboard_id) {
            this.loading = false;
            return;
        }

        this.dashboard = await ModuleDAO.getInstance().getVoById<DashboardVO>(DashboardVO.API_TYPE_ID, this.dashboard_id);
        if (!this.dashboard) {
            this.loading = false;
            return;
        }

        this.pages = await ModuleDAO.getInstance().getVosByRefFieldIds<DashboardPageVO>(DashboardPageVO.API_TYPE_ID, 'dashboard_id', [this.dashboard.id]);
        if (!this.pages) {
            return;
        }
        WeightHandler.getInstance().sortByWeight(this.pages);
        this.page = this.pages[0];

        this.loading = false;
    }

    private select_page(page: DashboardPageVO) {
        this.page = page;
    }

    get dashboard_name_code_text(): string {
        if (!this.dashboard) {
            return null;
        }

        return this.dashboard.translatable_name_code_text ? this.dashboard.translatable_name_code_text : null;
    }

    get pages_name_code_text(): string[] {
        let res: string[] = [];

        if (!this.pages) {
            return res;
        }

        for (let i in this.pages) {
            let page = this.pages[i];

            res.push(page.translatable_name_code_text ? page.translatable_name_code_text : null);
        }

        return res;
    }

    // private mounted() {
    //     let body = document.getElementById('page-top');
    //     body.classList.add("sidenav-toggled");
    // }

    // private beforeDestroy() {
    //     let body = document.getElementById('page-top');
    //     body.classList.remove("sidenav-toggled");
    // }
}