import 'quill/dist/quill.bubble.css'; // Compliqué à lazy load
import 'quill/dist/quill.core.css'; // Compliqué à lazy load
import 'quill/dist/quill.snow.css'; // Compliqué à lazy load
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import FieldFiltersVO from '../../../../../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO';
import SuiviCompetencesWidgetOptionsVO from '../../../../../../../shared/modules/DashboardBuilder/vos/SuiviCompetencesWidgetOptionsVO';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';
import NiveauMaturiteStyle from '../../../../../../../shared/modules/SuiviCompetences/class/NiveauMaturiteStyle';
import VueComponentBase from '../../../../VueComponentBase';
import { ModuleDroppableVoFieldsAction } from '../../../droppable_vo_fields/DroppableVoFieldsStore';
import { ModuleDashboardPageAction, ModuleDashboardPageGetter } from '../../../page/DashboardPageStore';
import './SuiviCompetencesWidgetOptionsComponent.scss';
import RoleVO from '../../../../../../../shared/modules/AccessPolicy/vos/RoleVO';
import { query } from '../../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import { isEqual } from 'lodash';
import SuiviCompetencesGrilleVO from '../../../../../../../shared/modules/SuiviCompetences/vos/SuiviCompetencesGrilleVO';
import PromisePipeline from '../../../../../../../shared/tools/PromisePipeline/PromisePipeline';
import EnvHandler from '../../../../../../../shared/tools/EnvHandler';

@Component({
    template: require('./SuiviCompetencesWidgetOptionsComponent.pug')
})
export default class SuiviCompetencesWidgetOptionsComponent extends VueComponentBase {

    @ModuleDashboardPageGetter
    private get_discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } };

    @ModuleDashboardPageGetter
    private get_dashboard_api_type_ids: string[];

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    private dashboard: DashboardVO;

    @ModuleDashboardPageGetter
    private get_active_field_filters: FieldFiltersVO;

    @ModuleDashboardPageGetter
    private get_active_api_type_ids: string[];

    @ModuleDashboardPageGetter
    private get_query_api_type_ids: string[];

    @ModuleDroppableVoFieldsAction
    private set_selected_fields: (selected_fields: { [api_type_id: string]: { [field_id: string]: boolean } }) => void;

    @ModuleDashboardPageAction
    private set_page_widget: (page_widget: DashboardPageWidgetVO) => void;

    private next_update_options: SuiviCompetencesWidgetOptionsVO = null;
    private niveau_maturite_styles: NiveauMaturiteStyle[] = [];
    private filtered_roles: RoleVO[] = [];
    private all_filtered_roles: RoleVO[] = [];
    private filtered_grilles: SuiviCompetencesGrilleVO[] = [];
    private all_filtered_grilles: SuiviCompetencesGrilleVO[] = [];

    private throttled_update_options = ThrottleHelper.declare_throttle_without_args(this.update_options.bind(this), 50, { leading: false, trailing: true });

    @Watch('widget_options', { immediate: true, deep: true })
    private async onchange_widget_options() {
        if (!this.widget_options) {
            return;
        }

        this.niveau_maturite_styles = NiveauMaturiteStyle.get_value(this.widget_options.niveau_maturite_styles);

        let limit = EnvHandler.MAX_POOL / 2;
        let promise_pipeline: PromisePipeline = new PromisePipeline(limit);

        await promise_pipeline.push(async () => {
            this.all_filtered_roles = await query(RoleVO.API_TYPE_ID).select_vos();
        });
        await promise_pipeline.push(async () => {
            this.all_filtered_grilles = await query(SuiviCompetencesGrilleVO.API_TYPE_ID).select_vos();
        });

        await promise_pipeline.end();

        this.filtered_roles = this.widget_options?.filtered_role_ids?.length ? this.all_filtered_roles.filter((e) => this.widget_options.filtered_role_ids.includes(e.id)) : [];
        this.filtered_grilles = this.widget_options?.filtered_grille_ids?.length ? this.all_filtered_grilles.filter((e) => this.widget_options.filtered_grille_ids.includes(e.id)) : [];
    }

    @Watch('filtered_roles')
    private async onchange_filtered_roles() {
        if (!this.widget_options) {
            return;
        }

        this.next_update_options = this.widget_options;

        let filtered_role_ids: number[] = this.filtered_roles?.length ? this.filtered_roles.map((e) => e.id) : null;

        if (isEqual(this.next_update_options.filtered_role_ids, filtered_role_ids)) {
            return;
        }

        this.next_update_options.filtered_role_ids = filtered_role_ids;

        await this.throttled_update_options();
    }

    @Watch('filtered_grilles')
    private async onchange_filtered_grilles() {
        if (!this.widget_options) {
            return;
        }

        this.next_update_options = this.widget_options;

        let filtered_grille_ids: number[] = this.filtered_grilles?.length ? this.filtered_grilles.map((e) => e.id) : null;

        if (isEqual(this.next_update_options.filtered_grille_ids, filtered_grille_ids)) {
            return;
        }

        this.next_update_options.filtered_grille_ids = filtered_grille_ids;

        await this.throttled_update_options();
    }

    private async mounted() {
        if (!this.widget_options) {
            this.next_update_options = this.get_default_options();
        } else {
            this.next_update_options = this.widget_options;
        }

        await this.throttled_update_options();
    }

    private async onchange_niveau_maturite_styles() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        this.next_update_options.niveau_maturite_styles = JSON.stringify(this.niveau_maturite_styles);

        await this.throttled_update_options();
    }

    private async delete_niveau_maturite_style(index: number) {
        this.niveau_maturite_styles.splice(index, 1);

        await this.throttled_update_options();
    }

    private add_niveau_maturite_style() {
        this.niveau_maturite_styles.push(new NiveauMaturiteStyle());
    }

    private get_default_options(): SuiviCompetencesWidgetOptionsVO {
        return new SuiviCompetencesWidgetOptionsVO(null, null, null);
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

    private filtered_roles_label(role: RoleVO): string {
        return this.label(role.translatable_name);
    }

    private filtered_grilles_label(grille: SuiviCompetencesGrilleVO): string {
        return grille.name;
    }

    get widget_options(): SuiviCompetencesWidgetOptionsVO {
        if (!this.page_widget) {
            return null;
        }

        let options: SuiviCompetencesWidgetOptionsVO = null;
        try {
            if (!!this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as SuiviCompetencesWidgetOptionsVO;
                options = options ? new SuiviCompetencesWidgetOptionsVO(null, null, null).from(options) : null;
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }

        return options;
    }

}