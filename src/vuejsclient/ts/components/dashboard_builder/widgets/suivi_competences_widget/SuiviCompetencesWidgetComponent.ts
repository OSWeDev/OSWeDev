import { debounce } from 'lodash';
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import APIControllerWrapper from '../../../../../../shared/modules/API/APIControllerWrapper';
import UserRoleVO from '../../../../../../shared/modules/AccessPolicy/vos/UserRoleVO';
import UserVO from '../../../../../../shared/modules/AccessPolicy/vos/UserVO';
import ContextFilterVOManager from '../../../../../../shared/modules/ContextFilter/manager/ContextFilterVOManager';
import ContextFilterVO, { filter } from '../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import ContextQueryVO, { query } from '../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../../../../shared/modules/DAO/ModuleDAO';
import ModuleTableController from '../../../../../../shared/modules/DAO/ModuleTableController';
import InsertOrDeleteQueryResult from '../../../../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import SimpleDatatableFieldVO from '../../../../../../shared/modules/DAO/vos/datatable/SimpleDatatableFieldVO';
import FieldFiltersVOManager from '../../../../../../shared/modules/DashboardBuilder/manager/FieldFiltersVOManager';
import FieldValueFilterWidgetManager from '../../../../../../shared/modules/DashboardBuilder/manager/FieldValueFilterWidgetManager';
import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import FieldFiltersVO from '../../../../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO';
import SuiviCompetencesWidgetOptionsVO from '../../../../../../shared/modules/DashboardBuilder/vos/SuiviCompetencesWidgetOptionsVO';
import ExportHistoricVO from '../../../../../../shared/modules/DataExport/vos/ExportHistoricVO';
import NumSegment from '../../../../../../shared/modules/DataRender/vos/NumSegment';
import Dates from '../../../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import IDistantVOBase from '../../../../../../shared/modules/IDistantVOBase';
import ModuleSuiviCompetences from '../../../../../../shared/modules/SuiviCompetences/ModuleSuiviCompetences';
import ExportSuiviCompetencesRapportHandlerParam from '../../../../../../shared/modules/SuiviCompetences/exports/ExportSuiviCompetencesRapportHandlerParam';
import SuiviCompetencesGrilleVO from '../../../../../../shared/modules/SuiviCompetences/vos/SuiviCompetencesGrilleVO';
import SuiviCompetencesItemRapportVO from '../../../../../../shared/modules/SuiviCompetences/vos/SuiviCompetencesItemRapportVO';
import SuiviCompetencesRapportVO from '../../../../../../shared/modules/SuiviCompetences/vos/SuiviCompetencesRapportVO';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import { field_names } from '../../../../../../shared/tools/ObjectHandler';
import RangeHandler from '../../../../../../shared/tools/RangeHandler';
import VueComponentBase from '../../../VueComponentBase';
import CRUDComponentManager from '../../../crud/CRUDComponentManager';
import { ModuleDAOAction } from '../../../dao/store/DaoStore';
import { ModuleDashboardPageGetter } from '../../page/DashboardPageStore';
import CRUDCreateModalComponent from '../table_widget/crud_modals/create/CRUDCreateModalComponent';
import './SuiviCompetencesWidgetComponent.scss';
import SuiviCompetencesWidgetController from './SuiviCompetencesWidgetController';
import SuiviCompetencesWidgetContainerComponent from './container/SuiviCompetencesWidgetContainerComponent';

@Component({
    template: require('./SuiviCompetencesWidgetComponent.pug'),
    components: {
        Crudcreatemodalcomponent: CRUDCreateModalComponent,
        Suivicompetenceswidgetcontainer: SuiviCompetencesWidgetContainerComponent,
    }
})
export default class SuiviCompetencesWidgetComponent extends VueComponentBase {

    @ModuleDAOAction
    private storeDatas: (infos: { API_TYPE_ID: string, vos: IDistantVOBase[] }) => void;

    @ModuleDashboardPageGetter
    private get_dashboard_api_type_ids: string[];

    @ModuleDashboardPageGetter
    private get_discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } };

    @ModuleDashboardPageGetter
    private get_active_field_filters: FieldFiltersVO;

    @ModuleDashboardPageGetter
    private get_Crudcreatemodalcomponent: CRUDCreateModalComponent;

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    private all_page_widget: DashboardPageWidgetVO[];

    @Prop({ default: null })
    private dashboard: DashboardVO;

    @Prop({ default: null })
    private dashboard_page: DashboardPageVO;

    private throttle_update_visible_options = debounce(this.update_visible_options.bind(this), 500);

    private rapports: SuiviCompetencesRapportVO[] = [];
    private has_active_filters: boolean = false;
    private show_details: boolean = false;

    private selected_rapport: SuiviCompetencesRapportVO = null;
    private selected_grille: SuiviCompetencesGrilleVO = null;
    private start_export_excel: boolean = false;

    private is_downloading: boolean = false;

    private action_rapport: number = null;
    private create_action_rapport: number = SuiviCompetencesWidgetController.CREATE_ACTION_RAPPORT;
    private duplicate_action_rapport: number = SuiviCompetencesWidgetController.DUPLICATE_ACTION_RAPPORT;
    private edit_action_rapport: number = SuiviCompetencesWidgetController.EDIT_ACTION_RAPPORT;

    get plan_action_editable_field() {
        return SimpleDatatableFieldVO.createNew(field_names<SuiviCompetencesItemRapportVO>().plan_action).setModuleTable(ModuleTableController.module_tables_by_vo_type[SuiviCompetencesItemRapportVO.API_TYPE_ID]);
    }

    get etat_des_lieux_editable_field() {
        return SimpleDatatableFieldVO.createNew(field_names<SuiviCompetencesItemRapportVO>().etat_des_lieux).setModuleTable(ModuleTableController.module_tables_by_vo_type[SuiviCompetencesItemRapportVO.API_TYPE_ID]);
    }

    get points_cles_editable_field() {
        return SimpleDatatableFieldVO.createNew(field_names<SuiviCompetencesRapportVO>().points_cles).setModuleTable(ModuleTableController.module_tables_by_vo_type[SuiviCompetencesRapportVO.API_TYPE_ID]);
    }

    get objectif_prochaine_visite_editable_field() {
        return SimpleDatatableFieldVO.createNew(field_names<SuiviCompetencesRapportVO>().objectif_prochaine_visite).setModuleTable(ModuleTableController.module_tables_by_vo_type[SuiviCompetencesRapportVO.API_TYPE_ID]);
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

    @Watch('get_active_field_filters', { deep: true })
    private async onchange_active_field_filters() {
        await this.throttle_update_visible_options();
    }

    @Watch('widget_options', { immediate: true, deep: true })
    private async onchange_widget_options() {
        if (!this.widget_options) {
            return;
        }
    }

    @Watch('selected_rapport')
    @Watch('action_rapport')
    private async onchange_selected_rapport() {
        if (this.action_rapport == this.create_action_rapport) {
            await this.open_create();
            return;
        }

        if (!this.selected_rapport) {
            return;
        }

        if (this.action_rapport == this.duplicate_action_rapport) {
            await this.duplicate_rapport_action();
            return;
        }

        if (this.selected_rapport?.suivi_comp_grille_id) {
            this.selected_grille = await query(SuiviCompetencesGrilleVO.API_TYPE_ID)
                .filter_by_id(this.selected_rapport.suivi_comp_grille_id)
                .select_vo();
        }
    }

    private async mounted() {
        await this.throttle_update_visible_options();
    }

    private async update_visible_options() {
        if (SuiviCompetencesWidgetController.default_rapport_id) {
            this.selected_rapport = await query(SuiviCompetencesRapportVO.API_TYPE_ID).filter_by_id(SuiviCompetencesWidgetController.default_rapport_id).select_vo();
            SuiviCompetencesWidgetController.default_rapport_id = null;
        }

        if (SuiviCompetencesWidgetController.default_action_rapport) {
            this.action_rapport = SuiviCompetencesWidgetController.default_action_rapport;
            SuiviCompetencesWidgetController.default_action_rapport = null;
        }

        const context_filters: ContextFilterVO[] = ContextFilterVOManager.get_context_filters_from_active_field_filters(
            FieldFiltersVOManager.clean_field_filters_for_request(this.get_active_field_filters)
        );

        this.has_active_filters = !!context_filters?.length;

        if (this.widget_options.filtered_role_ids?.length || this.widget_options.filtered_grille_ids?.length) {
            let crud = CRUDComponentManager.getInstance().cruds_by_api_type_id[SuiviCompetencesRapportVO.API_TYPE_ID];

            if (!crud) {
                await CRUDComponentManager.getInstance().registerCRUD(
                    SuiviCompetencesRapportVO.API_TYPE_ID,
                    null,
                    null,
                    null
                );

                crud = CRUDComponentManager.getInstance().cruds_by_api_type_id[SuiviCompetencesRapportVO.API_TYPE_ID];
            }

            if (crud) {
                // Si on a un filtrage sur le rôle, on va récupérer tous les users qui ont le rôle pour filtrer la liste des users

                if (this.widget_options.filtered_role_ids?.length) {
                    let select_options_enabled: number[] = [];

                    const users: UserVO[] = await query(UserVO.API_TYPE_ID)
                        .field(field_names<UserVO>().id)
                        .filter_by_num_x_ranges(
                            field_names<UserRoleVO>().role_id,
                            RangeHandler.create_multiple_NumRange_from_ids(this.widget_options.filtered_role_ids, NumSegment.TYPE_INT),
                            UserRoleVO.API_TYPE_ID
                        )
                        .select_vos();

                    if (users?.length) {
                        select_options_enabled = users.map((e) => e.id);
                    }

                    await crud.createDatatable.getFieldByDatatableFieldUID(field_names<SuiviCompetencesRapportVO>().user_id).setSelectOptionsEnabled(select_options_enabled);
                } else {
                    await crud.createDatatable.getFieldByDatatableFieldUID(field_names<SuiviCompetencesRapportVO>().user_id).emptySelectOptionsEnabled();
                }

                if (this.widget_options.filtered_grille_ids?.length) {
                    context_filters.push(filter(SuiviCompetencesGrilleVO.API_TYPE_ID).by_ids(this.widget_options.filtered_grille_ids));
                    await crud.createDatatable.getFieldByDatatableFieldUID(field_names<SuiviCompetencesRapportVO>().suivi_comp_grille_id).setSelectOptionsEnabled(this.widget_options.filtered_grille_ids);
                } else {
                    await crud.createDatatable.getFieldByDatatableFieldUID(field_names<SuiviCompetencesRapportVO>().suivi_comp_grille_id).emptySelectOptionsEnabled();
                }
            }
        }

        if (
            (!this.get_dashboard_api_type_ids?.length) ||
            (!this.has_active_filters)
        ) {
            this.selected_rapport = null;
            this.selected_grille = null;
            this.rapports = [];
            return;
        }

        const context_query_rapport: ContextQueryVO = query(SuiviCompetencesRapportVO.API_TYPE_ID)
            .using(this.get_dashboard_api_type_ids)
            .add_filters(context_filters);

        FieldValueFilterWidgetManager.add_discarded_field_paths(context_query_rapport, this.get_discarded_field_paths);

        const rapports: SuiviCompetencesRapportVO[] = await context_query_rapport.select_vos();

        this.rapports = rapports?.length ? rapports : [];
    }

    private async open_create() {
        this.action_rapport = null;
        this.selected_rapport = null;
        this.selected_grille = null;

        await this.get_Crudcreatemodalcomponent.open_modal(
            SuiviCompetencesRapportVO.API_TYPE_ID,
            this.storeDatas,
            this.update_visible_options.bind(this),
            SuiviCompetencesWidgetController.default_vo_init_rapport,
            false,
            this.on_create_rapport.bind(this)
        );
    }

    private async on_create_rapport(rapport: SuiviCompetencesRapportVO) {
        this.selected_rapport = rapport;
        this.action_rapport = this.edit_action_rapport;
    }

    private duplicate_rapport() {
        this.action_rapport = this.duplicate_action_rapport;
        this.selected_rapport = null;
        this.selected_grille = null;
    }

    private edit_rapport() {
        this.action_rapport = this.edit_action_rapport;
    }

    private async duplicate_rapport_action() {
        this.snotify.confirm(this.label('confirm_duplicate_rapport.body.' + this.page_widget.id), null, {
            timeout: 0,
            showProgressBar: true,
            closeOnClick: false,
            pauseOnHover: true,
            buttons: [
                {
                    text: this.t('YES'),
                    action: async (toast) => {
                        this.$snotify.remove(toast.id);

                        const new_rapport: SuiviCompetencesRapportVO = SuiviCompetencesRapportVO.createNew(
                            Dates.now(),
                            this.selected_rapport.suivi_comp_grille_id,
                            this.selected_rapport.user_id,
                            this.selected_rapport.points_cles,
                            this.selected_rapport.objectif_prochaine_visite,
                            this.selected_rapport.commentaire_1,
                            this.selected_rapport.commentaire_2,
                            this.selected_rapport.prochain_suivi,
                        );

                        const res: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(new_rapport);

                        if (!res?.id) {
                            throw new Error('Erreur lors de la sauvegarde');
                        }

                        await ModuleSuiviCompetences.getInstance().duplicate_suivi_competences_rapport(res.id, this.selected_rapport.id);

                        this.action_rapport = this.edit_action_rapport;
                        this.throttle_update_visible_options();
                        this.selected_rapport = await query(SuiviCompetencesRapportVO.API_TYPE_ID).filter_by_id(res.id).select_vo();

                        this.$snotify.success(this.label('duplicate_rapport.success.' + this.page_widget.id));
                    },
                    bold: false
                },
                {
                    text: this.t('NO'),
                    action: (toast) => {
                        this.$snotify.remove(toast.id);
                    }
                }
            ]
        });
    }

    private async delete_selected_rapport() {
        if (!this.selected_rapport) {
            return;
        }

        this.snotify.confirm(this.label('confirm_delete_selected_rapport.body.' + this.page_widget.id), null, {
            timeout: 0,
            showProgressBar: true,
            closeOnClick: false,
            pauseOnHover: true,
            buttons: [
                {
                    text: this.t('YES'),
                    action: async (toast) => {
                        this.$snotify.remove(toast.id);

                        await ModuleDAO.getInstance().deleteVOs([this.selected_rapport]);

                        this.throttle_update_visible_options();
                        this.selected_rapport = null;
                    },
                    bold: false
                },
                {
                    text: this.t('NO'),
                    action: (toast) => {
                        this.$snotify.remove(toast.id);
                    }
                }
            ]
        });
    }

    private async export_selected_rapport() {
        if (!this.selected_rapport || this.start_export_excel) {
            return;
        }

        this.start_export_excel = true;

        const exhi: ExportHistoricVO = new ExportHistoricVO();

        exhi.export_file_access_policy_name = ModuleDAO.getInstance().getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_READ, SuiviCompetencesRapportVO.API_TYPE_ID);
        exhi.export_is_secured = true;

        const export_params: ExportSuiviCompetencesRapportHandlerParam = new ExportSuiviCompetencesRapportHandlerParam();
        export_params.rapport_id_ranges = [RangeHandler.create_single_elt_NumRange(this.selected_rapport.id, NumSegment.TYPE_INT)];

        exhi.export_params_stringified = JSON.stringify(APIControllerWrapper.try_translate_vo_to_api(export_params));
        exhi.export_to_uid = this.data_user.id;
        exhi.export_type_id = ModuleSuiviCompetences.EXPORT_SUIVI_COMPETENCES_RAPPORT;

        await ModuleDAO.getInstance().insertOrUpdateVO(exhi);

        this.start_export_excel = false;

        this.snotify.info(this.label('export_selected_rapport.start.' + this.page_widget.id));
    }

    private async print_selected_rapport() {
        if (this.is_downloading) {
            return;
        }

        this.is_downloading = true;

        this.$snotify.async(this.label('generate_pdf.en_cours'), () => new Promise(async (resolve, reject) => {
            await SuiviCompetencesWidgetController.download_rapport_pdf(
                this.selected_rapport.id
            );

            this.is_downloading = false;

            resolve({
                title: this.label('generate_pdf.success'),
                body: '',
                config: {
                    timeout: 2000,
                }
            });
        }));
    }

    private switch_show_details() {
        this.show_details = !this.show_details;
    }
}