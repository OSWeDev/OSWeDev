import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ModuleAccessPolicy from '../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ModuleDAO from '../../../../../shared/modules/DAO/ModuleDAO';
import ModuleDashboardBuilder from '../../../../../shared/modules/DashboardBuilder/ModuleDashboardBuilder';
import DashboardPageVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import WeightHandler from '../../../../../shared/tools/WeightHandler';
import InlineTranslatableText from '../../InlineTranslatableText/InlineTranslatableText';
import VueComponentBase from '../../VueComponentBase';
import DashboardBuilderBoardComponent from '../board/DashboardBuilderBoardComponent';
import { ModuleDashboardPageAction, ModuleDashboardPageGetter } from '../page/DashboardPageStore';
import './DashboardViewerComponent.scss';

@Component({
    template: require('./DashboardViewerComponent.pug'),
    components: {
        Inlinetranslatabletext: InlineTranslatableText,
        Dashboardbuilderboardcomponent: DashboardBuilderBoardComponent,
    }
})
export default class DashboardViewerComponent extends VueComponentBase {

    @ModuleDashboardPageGetter
    private get_page_history: DashboardPageVO[];

    @ModuleDashboardPageAction
    private add_page_history: (page_history: DashboardPageVO) => void;
    @ModuleDashboardPageAction
    private set_page_history: (page_history: DashboardPageVO[]) => void;
    @ModuleDashboardPageAction
    private pop_page_history: (fk) => void;

    @ModuleDashboardPageAction
    private clear_active_field_filters: () => void;

    @Prop({ default: null })
    private dashboard_id: number;

    private dashboard: DashboardVO = null;
    private loading: boolean = true;

    private pages: DashboardPageVO[] = [];
    private page: DashboardPageVO = null;

    private selected_widget: DashboardPageWidgetVO = null;

    private can_edit: boolean = false;

    private select_widget(page_widget) {
        this.selected_widget = page_widget;
    }

    get has_navigation_history(): boolean {
        return this.get_page_history && (this.get_page_history.length > 0);
    }

    private select_previous_page() {
        this.page = this.get_page_history[this.get_page_history.length - 1];
        this.pop_page_history(null);
    }

    private select_page_clear_navigation(page: DashboardPageVO) {
        this.set_page_history([]);
        this.page = page;
    }

    get visible_pages(): DashboardPageVO[] {

        if (!this.pages) {
            return null;
        }

        let res: DashboardPageVO[] = [];

        for (let i in this.pages) {
            let page = this.pages[i];
            if (!page.hide_navigation) {
                res.push(page);
            }
        }

        return res;
    }

    /**
     * Quand on change de dahsboard, on supprime les filtres contextuels existants (en tout cas par défaut)
     *  on pourrait vouloir garder les filtres communs aussi => non implémenté (il faut un switch et supprimer les filtres non applicables aux widgets du dashboard)
     *  et on pourrait vouloir garder tous les filtres => non implémenté (il faut un switch et simplement ne pas supprimer les filtres)
     */
    @Watch("dashboard_id", { immediate: true })
    private async onchange_dashboard_id() {
        this.loading = true;

        if (!this.dashboard_id) {
            this.can_edit = false;
            this.loading = false;
            return;
        }

        this.dashboard = await ModuleDAO.getInstance().getVoById<DashboardVO>(DashboardVO.API_TYPE_ID, this.dashboard_id);
        if (!this.dashboard) {
            this.can_edit = false;
            this.loading = false;
            return;
        }

        this.clear_active_field_filters();

        this.pages = await ModuleDAO.getInstance().getVosByRefFieldIds<DashboardPageVO>(DashboardPageVO.API_TYPE_ID, 'dashboard_id', [this.dashboard.id]);
        if (!this.pages) {
            this.isLoading = false;
            this.can_edit = false;
            return;
        }
        WeightHandler.getInstance().sortByWeight(this.pages);
        this.page = this.pages[0];

        this.can_edit = await ModuleAccessPolicy.getInstance().checkAccess(ModuleDashboardBuilder.POLICY_BO_ACCESS);
        this.loading = false;
    }

    private select_page(page: DashboardPageVO) {
        this.add_page_history(this.page);
        this.select_widget(null);
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