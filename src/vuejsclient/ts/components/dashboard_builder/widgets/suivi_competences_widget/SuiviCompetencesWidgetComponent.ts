import { cloneDeep, debounce } from 'lodash';
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import APIControllerWrapper from '../../../../../../shared/modules/API/APIControllerWrapper';
import UserRoleVO from '../../../../../../shared/modules/AccessPolicy/vos/UserRoleVO';
import UserVO from '../../../../../../shared/modules/AccessPolicy/vos/UserVO';
import ContextFilterVOManager from '../../../../../../shared/modules/ContextFilter/manager/ContextFilterVOManager';
import ContextFilterVO, { filter } from '../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import ContextQueryVO, { query } from '../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
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
import ModuleSuiviCompetences from '../../../../../../shared/modules/SuiviCompetences/ModuleSuiviCompetences';
import ExportSuiviCompetencesRapportHandlerParam from '../../../../../../shared/modules/SuiviCompetences/exports/ExportSuiviCompetencesRapportHandlerParam';
import SuiviCompetencesGrilleVO from '../../../../../../shared/modules/SuiviCompetences/vos/SuiviCompetencesGrilleVO';
import SuiviCompetencesRapportVO from '../../../../../../shared/modules/SuiviCompetences/vos/SuiviCompetencesRapportVO';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import { field_names } from '../../../../../../shared/tools/ObjectHandler';
import RangeHandler from '../../../../../../shared/tools/RangeHandler';
import VueComponentBase from '../../../VueComponentBase';
import CRUDComponentManager from '../../../crud/CRUDComponentManager';
import { ModuleDashboardPageGetter } from '../../page/DashboardPageStore';
import CRUDCreateModalComponent from '../table_widget/crud_modals/create/CRUDCreateModalComponent';
import './SuiviCompetencesWidgetComponent.scss';
import SuiviCompetencesWidgetController from './SuiviCompetencesWidgetController';
import ModuleTableController from '../../../../../../shared/modules/DAO/ModuleTableController';
import SuiviCompetencesWidgetContainerComponent from './container/SuiviCompetencesWidgetContainerComponent';
import SimpleDatatableFieldVO from '../../../../../../shared/modules/DAO/vos/datatable/SimpleDatatableFieldVO';
import SuiviCompetencesItemRapportVO from '../../../../../../shared/modules/SuiviCompetences/vos/SuiviCompetencesItemRapportVO';
import DataFilterOption from '../../../../../../shared/modules/DataRender/vos/DataFilterOption';
import SuiviCompetencesItemVO from '../../../../../../shared/modules/SuiviCompetences/vos/SuiviCompetencesItemVO';
import SuiviCompetencesIndicateurVO from '../../../../../../shared/modules/SuiviCompetences/fields/indicateur/vos/SuiviCompetencesIndicateurVO';
import SuiviCompetencesGroupeResult from '../../../../../../shared/modules/SuiviCompetences/apis/SuiviCompetencesGroupeResult';
import NiveauMaturiteStyle from '../../../../../../shared/modules/SuiviCompetences/class/NiveauMaturiteStyle';
import SuiviCompetencesIndicateurTableFieldTypeController from '../../../../../../shared/modules/SuiviCompetences/fields/indicateur/SuiviCompetencesIndicateurTableFieldTypeController';
import SuiviCompetencesVarsNamesHolder from '../../../../../../shared/modules/SuiviCompetences/vars/SuiviCompetencesVarsNamesHolder';
import SuiviCompetencesRapportGroupeDataRangesVO from '../../../../../../shared/modules/SuiviCompetences/vars/vos/SuiviCompetencesRapportGroupeDataRangesVO';
import SuiviCompetencesRapportSousGroupeDataRangesVO from '../../../../../../shared/modules/SuiviCompetences/vars/vos/SuiviCompetencesRapportSousGroupeDataRangesVO';
import SuiviCompetencesGroupeVO from '../../../../../../shared/modules/SuiviCompetences/vos/SuiviCompetencesGroupeVO';
import VarDataValueResVO from '../../../../../../shared/modules/Var/vos/VarDataValueResVO';
import VarDataRefComponent from '../../../Var/components/dataref/VarDataRefComponent';

@Component({
    template: require('./SuiviCompetencesWidgetComponent.pug'),
    components: {
        Crudcreatemodalcomponent: CRUDCreateModalComponent,
        Suivicompetenceswidgetcontainer: SuiviCompetencesWidgetContainerComponent,
    }
})
export default class SuiviCompetencesWidgetComponent extends VueComponentBase {

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
    private all_groupes: SuiviCompetencesGroupeResult[] = [];
    private filtered_groupes: SuiviCompetencesGroupeResult[] = [];
    private rapport_item_by_ids: { [item_id: number]: SuiviCompetencesItemRapportVO } = {};
    private all_rapport_item_by_ids: { [item_id: number]: SuiviCompetencesItemRapportVO } = {};
    private indicateur_option_rapport_item_by_ids: { [item_id: number]: DataFilterOption } = {};
    private indicateur_options_by_item_ids: { [item_id: number]: DataFilterOption[] } = {};

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

        let context_filters: ContextFilterVO[] = ContextFilterVOManager.get_context_filters_from_active_field_filters(
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

                    let users: UserVO[] = await query(UserVO.API_TYPE_ID)
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

        let rapports: SuiviCompetencesRapportVO[] = await context_query_rapport.select_vos();

        this.rapports = rapports?.length ? rapports : [];
    }

    private async open_create() {
        this.action_rapport = null;
        this.selected_rapport = null;
        this.selected_grille = null;

        await this.get_Crudcreatemodalcomponent.open_modal(
            SuiviCompetencesRapportVO.API_TYPE_ID,
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

                        let new_rapport: SuiviCompetencesRapportVO = SuiviCompetencesRapportVO.createNew(
                            Dates.now(),
                            this.selected_rapport.suivi_comp_grille_id,
                            this.selected_rapport.user_id,
                            this.selected_rapport.points_cles,
                            this.selected_rapport.objectif_prochaine_visite,
                            this.selected_rapport.commentaire_1,
                            this.selected_rapport.commentaire_2,
                            this.selected_rapport.prochain_suivi,
                        );

                        let res: InsertOrDeleteQueryResult = await ModuleDAO.instance.insertOrUpdateVO(new_rapport);

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

                        await ModuleDAO.instance.deleteVOs([this.selected_rapport]);

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

        let exhi: ExportHistoricVO = new ExportHistoricVO();

        exhi.export_file_access_policy_name = ModuleDAO.instance.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_READ, SuiviCompetencesRapportVO.API_TYPE_ID);
        exhi.export_is_secured = true;

        let export_params: ExportSuiviCompetencesRapportHandlerParam = new ExportSuiviCompetencesRapportHandlerParam();
        export_params.rapport_id_ranges = [RangeHandler.create_single_elt_NumRange(this.selected_rapport.id, NumSegment.TYPE_INT)];

        // exhi.export_params_stringified = JSON.stringify(APIControllerWrapper.try_translate_vo_to_api(export_params));
        exhi.export_params_stringified = JSON.stringify(export_params);
        exhi.export_to_uid = this.data_user.id;
        exhi.export_type_id = ModuleSuiviCompetences.EXPORT_SUIVI_COMPETENCES_RAPPORT;

        await ModuleDAO.instance.insertOrUpdateVO(exhi);

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

    private reload_all_rapport_item_by_ids() {
        let res: { [item_id: number]: SuiviCompetencesItemRapportVO } = {};

        for (const i in this.rapport_item_by_ids) {
            res[this.rapport_item_by_ids[i].suivi_comp_item_id] = this.rapport_item_by_ids[i];
        }

        for (const i in this.all_groupes) {
            for (const j in this.all_groupes[i].sous_groupe) {
                for (const k in this.all_groupes[i].sous_groupe[j].items) {
                    const item: SuiviCompetencesItemVO = this.all_groupes[i].sous_groupe[j].items[k];

                    if (!res[item.id]) {
                        res[item.id] = SuiviCompetencesItemRapportVO.createNew(
                            null,
                            null,
                            null,
                            item.id,
                            this.selected_rapport.id,
                            null,
                            null
                        );
                    }
                }
            }
        }

        this.all_rapport_item_by_ids = res;
    }

    private reload_indicateur_option_rapport_item_by_ids() {

        let res: { [item_id: number]: DataFilterOption } = {};

        for (let i in this.rapport_item_by_ids) {
            let item_site: SuiviCompetencesItemRapportVO = this.rapport_item_by_ids[i];

            if (item_site.indicateur != null) {
                res[item_site.suivi_comp_item_id] = this.indicateur_options_by_item_ids[item_site.suivi_comp_item_id].find((indicateur: DataFilterOption) => {
                    return indicateur.id == item_site.indicateur;
                });
            }
        }

        this.indicateur_option_rapport_item_by_ids = res;
    }

    private reload_indicateur_options_by_item_ids() {
        let res: { [item_id: number]: DataFilterOption[] } = {};

        for (let i in this.all_groupes) {
            for (let j in this.all_groupes[i].sous_groupe) {
                for (let k in this.all_groupes[i].sous_groupe[j].items) {
                    let item: SuiviCompetencesItemVO = this.all_groupes[i].sous_groupe[j].items[k];

                    let indicateurs_item: SuiviCompetencesIndicateurVO[] = SuiviCompetencesIndicateurTableFieldTypeController.getInstance().get_value(item);

                    if (!indicateurs_item?.length) {
                        continue;
                    }

                    let indicateurs: DataFilterOption[] = [];

                    for (let i_idx in indicateurs_item) {
                        let indicateur: SuiviCompetencesIndicateurVO = indicateurs_item[i_idx];

                        indicateurs.push(new DataFilterOption(
                            DataFilterOption.STATE_SELECTABLE,
                            indicateur.titre,
                            (parseInt(i_idx) + 1),
                            false,
                            false,
                            false,
                            null,
                            indicateur.description,
                        ));
                    }

                    res[item.id] = indicateurs;
                }
            }
        }

        this.indicateur_options_by_item_ids = res;
    }

    private reload_filtered_groupes() {

        let res: SuiviCompetencesGroupeResult[] = [];

        if (
            !this.get_active_field_filters ||
            (
                !this.get_active_field_filters[SuiviCompetencesGroupeVO.API_TYPE_ID] ||
                !Object.keys(this.get_active_field_filters[SuiviCompetencesGroupeVO.API_TYPE_ID])?.length
            ) &&
            (
                !this.get_active_field_filters[SuiviCompetencesItemRapportVO.API_TYPE_ID] ||
                !Object.keys(this.get_active_field_filters[SuiviCompetencesItemRapportVO.API_TYPE_ID])?.length
            )
        ) {
            this.filtered_groupes = this.all_groupes;
            return;
        }

        for (let i in this.all_groupes) {
            let groupe: SuiviCompetencesGroupeResult = this.all_groupes[i];
            let is_ok_groupe: boolean = true;

            for (let field_name in this.get_active_field_filters[SuiviCompetencesGroupeVO.API_TYPE_ID]) {
                // Si j'ai un filtrage multiple et que le groupe a la valeur, je rajoute
                if (
                    !!this.get_active_field_filters[SuiviCompetencesGroupeVO.API_TYPE_ID][field_name]?.param_textarray?.length
                ) {
                    if (
                        !!groupe[field_name] &&
                        !this.get_active_field_filters[SuiviCompetencesGroupeVO.API_TYPE_ID][field_name].param_textarray.includes(groupe[field_name])
                    ) {
                        is_ok_groupe = false;
                        continue;
                    }
                }

                // Si j'ai un filtrage simple et que le groupe a la valeur, je rajoute
                if (
                    !!this.get_active_field_filters[SuiviCompetencesGroupeVO.API_TYPE_ID][field_name]?.param_text?.length
                ) {
                    if (
                        !!groupe[field_name] &&
                        (this.get_active_field_filters[SuiviCompetencesGroupeVO.API_TYPE_ID][field_name].param_text != groupe[field_name])
                    ) {
                        is_ok_groupe = false;
                        continue;
                    }
                }
            }

            if (!is_ok_groupe) {
                continue;
            }

            if (
                !this.get_active_field_filters[SuiviCompetencesItemRapportVO.API_TYPE_ID] ||
                !Object.keys(this.get_active_field_filters[SuiviCompetencesItemRapportVO.API_TYPE_ID])?.length
            ) {
                res.push(groupe);
                continue;
            }

            let groupe_cloned: SuiviCompetencesGroupeResult = cloneDeep(groupe);
            groupe_cloned.sous_groupe = [];

            for (let j in groupe.sous_groupe) {
                let sous_groupe = groupe.sous_groupe[j];
                let sous_groupe_cloned: { id: number, name: string, items: SuiviCompetencesItemVO[] } = cloneDeep(sous_groupe);
                sous_groupe_cloned.items = [];

                for (let k in sous_groupe.items) {
                    let item: SuiviCompetencesItemVO = sous_groupe.items[k];
                    let item_rapport: SuiviCompetencesItemRapportVO = this.all_rapport_item_by_ids[item.id];

                    if (!item_rapport) {
                        continue;
                    }

                    for (let field_name in this.get_active_field_filters[SuiviCompetencesItemRapportVO.API_TYPE_ID]) {
                        if (
                            !!this.get_active_field_filters[SuiviCompetencesItemRapportVO.API_TYPE_ID][field_name] &&
                            !RangeHandler.elt_intersects_any_range(item_rapport.indicateur, this.get_active_field_filters[SuiviCompetencesItemRapportVO.API_TYPE_ID][field_name].param_numranges)
                        ) {
                            continue;
                        }

                        sous_groupe_cloned.items.push(item);
                    }
                }

                if (!sous_groupe_cloned.items?.length) {
                    continue;
                }

                groupe_cloned.sous_groupe.push(sous_groupe_cloned);
            }

            if (!groupe_cloned.sous_groupe?.length) {
                continue;
            }

            res.push(groupe_cloned);
        }

        this.filtered_groupes = res;
    }

    private var_value_callback(var_value: VarDataValueResVO, component: VarDataRefComponent): number {
        if (!var_value) {
            return null;
        }

        let niveau_maturite_styles: NiveauMaturiteStyle[] = NiveauMaturiteStyle.get_value(this.widget_options?.niveau_maturite_styles);
        let value_base_100: number = var_value.value * 100;

        let niveau_maturite_style: NiveauMaturiteStyle = niveau_maturite_styles.find((e) => {
            if (
                (e.min <= value_base_100) &&
                (e.max >= value_base_100)
            ) {
                return true;
            }

            return false;
        });

        component.$el['style'].background = niveau_maturite_style?.background ?? '';
        component.$el['style'].color = niveau_maturite_style?.color ?? '';

        return var_value.value;
    }

    private get_niveau_maturite_param(tsp_groupe: SuiviCompetencesGroupeResult, sous_groupe_id: number) {
        if (sous_groupe_id) {
            return SuiviCompetencesRapportSousGroupeDataRangesVO.createNew(
                SuiviCompetencesVarsNamesHolder.VarDaySuiviCompetencesNiveauMaturiteSousGroupeController_VAR_NAME,
                false,
                [RangeHandler.create_single_elt_NumRange(this.selected_rapport.id, NumSegment.TYPE_INT)],
                [RangeHandler.create_single_elt_NumRange(tsp_groupe.id, NumSegment.TYPE_INT)],
                [RangeHandler.create_single_elt_NumRange(sous_groupe_id, NumSegment.TYPE_INT)],
            );
        }

        if ((tsp_groupe.sous_groupe?.length > 0) && !!tsp_groupe.sous_groupe[0].id) {
            return SuiviCompetencesRapportSousGroupeDataRangesVO.createNew(
                SuiviCompetencesVarsNamesHolder.VarDaySuiviCompetencesNiveauMaturiteSousGroupeController_VAR_NAME,
                false,
                [RangeHandler.create_single_elt_NumRange(this.selected_rapport.id, NumSegment.TYPE_INT)],
                [RangeHandler.create_single_elt_NumRange(tsp_groupe.id, NumSegment.TYPE_INT)],
                RangeHandler.create_multiple_NumRange_from_ids(tsp_groupe.sous_groupe.map((e) => e.id), NumSegment.TYPE_INT),
            );
        }

        return SuiviCompetencesRapportGroupeDataRangesVO.createNew(
            SuiviCompetencesVarsNamesHolder.VarDaySuiviCompetencesNiveauMaturiteGroupeController_VAR_NAME,
            false,
            [RangeHandler.create_single_elt_NumRange(this.selected_rapport.id, NumSegment.TYPE_INT)],
            [RangeHandler.create_single_elt_NumRange(tsp_groupe.id, NumSegment.TYPE_INT)],
        );
    }
}