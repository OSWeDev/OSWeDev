import { isEqual } from 'lodash';
import 'quill/dist/quill.bubble.css'; // Compliqué à lazy load
import 'quill/dist/quill.core.css'; // Compliqué à lazy load
import 'quill/dist/quill.snow.css'; // Compliqué à lazy load
import Component from 'vue-class-component';
import { Inject, Prop, Watch } from 'vue-property-decorator';
import Throttle from '../../../../../../../shared/annotations/Throttle';
import RoleVO from '../../../../../../../shared/modules/AccessPolicy/vos/RoleVO';
import { query } from '../../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import FieldFiltersVO from '../../../../../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO';
import SuiviCompetencesWidgetOptionsVO from '../../../../../../../shared/modules/DashboardBuilder/vos/SuiviCompetencesWidgetOptionsVO';
import EventifyEventListenerConfVO from '../../../../../../../shared/modules/Eventify/vos/EventifyEventListenerConfVO';
import NiveauMaturiteStyle from '../../../../../../../shared/modules/SuiviCompetences/class/NiveauMaturiteStyle';
import SuiviCompetencesGrilleVO from '../../../../../../../shared/modules/SuiviCompetences/vos/SuiviCompetencesGrilleVO';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import EnvHandler from '../../../../../../../shared/tools/EnvHandler';
import { reflect } from '../../../../../../../shared/tools/ObjectHandler';
import PromisePipeline from '../../../../../../../shared/tools/PromisePipeline/PromisePipeline';
import VueComponentBase from '../../../../VueComponentBase';
import { ModuleDroppableVoFieldsAction } from '../../../droppable_vo_fields/DroppableVoFieldsStore';
import { IDashboardGetters, IDashboardPageActionsMethods, IDashboardPageConsumer } from '../../../page/DashboardPageStore';
import './SuiviCompetencesWidgetOptionsComponent.scss';

@Component({
    template: require('./SuiviCompetencesWidgetOptionsComponent.pug')
})
export default class SuiviCompetencesWidgetOptionsComponent extends VueComponentBase implements IDashboardPageConsumer {
    @Inject('storeNamespace') readonly storeNamespace!: string;

    @Prop({ default: null })
    public page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    public dashboard: DashboardVO;

    @ModuleDroppableVoFieldsAction
    public set_selected_fields: (selected_fields: { [api_type_id: string]: { [field_id: string]: boolean } }) => void;

    public next_update_options: SuiviCompetencesWidgetOptionsVO = null;
    public niveau_maturite_styles: NiveauMaturiteStyle[] = [];
    public filtered_roles: RoleVO[] = [];
    public all_filtered_roles: RoleVO[] = [];
    public filtered_grilles: SuiviCompetencesGrilleVO[] = [];
    public all_filtered_grilles: SuiviCompetencesGrilleVO[] = [];


    get get_active_field_filters(): FieldFiltersVO {
        return this.vuexGet(reflect<this>().get_active_field_filters);
    }

    get get_dashboard_discarded_field_paths(): { [vo_type: string]: { [field_id: string]: boolean } } {
        return this.vuexGet(reflect<this>().get_dashboard_discarded_field_paths);
    }

    get get_dashboard_api_type_ids(): string[] {
        return this.vuexGet(reflect<this>().get_dashboard_api_type_ids);
    }

    get get_active_api_type_ids(): string[] {
        return this.vuexGet(reflect<this>().get_active_api_type_ids);
    }

    get get_query_api_type_ids(): string[] {
        return this.vuexGet(reflect<this>().get_query_api_type_ids);
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

    @Watch('widget_options', { immediate: true, deep: true })
    public async onchange_widget_options() {
        if (!this.widget_options) {
            return;
        }

        this.niveau_maturite_styles = NiveauMaturiteStyle.get_value(this.widget_options.niveau_maturite_styles);

        let limit = EnvHandler.max_pool / 2;
        let promise_pipeline: PromisePipeline = new PromisePipeline(limit, 'SuiviCompetencesWidgetOptionsComponent.onchange_widget_options');

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
    }

    @Watch('filtered_roles')
    public async onchange_filtered_roles() {
        if (!this.widget_options) {
            return;
        }

        this.next_update_options = this.widget_options;

        let filtered_role_ids: number[] = this.filtered_roles?.length ? this.filtered_roles.map((e) => e.id) : null;

        if (isEqual(this.next_update_options.filtered_role_ids, filtered_role_ids)) {
            return;
        }

        this.next_update_options.filtered_role_ids = filtered_role_ids;

        await this.update_options();
    }

    @Watch('filtered_grilles')
    public async onchange_filtered_grilles() {
        if (!this.widget_options) {
            return;
        }

        this.next_update_options = this.widget_options;

        let filtered_grille_ids: number[] = this.filtered_grilles?.length ? this.filtered_grilles.map((e) => e.id) : null;

        if (isEqual(this.next_update_options.filtered_grille_ids, filtered_grille_ids)) {
            return;
        }

        this.next_update_options.filtered_grille_ids = filtered_grille_ids;

        await this.update_options();
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

    public async mounted() {
        if (!this.widget_options) {
            this.next_update_options = this.get_default_options();
        } else {
            this.next_update_options = this.widget_options;
        }

        await this.update_options();
    }

    public async onchange_niveau_maturite_styles() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        this.next_update_options.niveau_maturite_styles = JSON.stringify(this.niveau_maturite_styles);

        await this.update_options();
    }

    public async delete_niveau_maturite_style(index: number) {
        this.niveau_maturite_styles.splice(index, 1);

        await this.update_options();
    }

    public add_niveau_maturite_style() {
        this.niveau_maturite_styles.push(new NiveauMaturiteStyle());
    }

    public get_default_options(): SuiviCompetencesWidgetOptionsVO {
        return new SuiviCompetencesWidgetOptionsVO(null, null, null);
    }

    public filtered_roles_label(role: RoleVO): string {
        return this.label(role.translatable_name);
    }

    public filtered_grilles_label(grille: SuiviCompetencesGrilleVO): string {
        return grille.name;
    }

}