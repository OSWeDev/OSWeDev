import { debounce } from 'lodash';
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ContextFilterVOManager from '../../../../../../shared/modules/ContextFilter/manager/ContextFilterVOManager';
import ContextFilterVO from '../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import ContextQueryVO, { query } from '../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import SimpleDatatableFieldVO from '../../../../../../shared/modules/DAO/vos/datatable/SimpleDatatableFieldVO';
import FieldFiltersVOManager from '../../../../../../shared/modules/DashboardBuilder/manager/FieldFiltersVOManager';
import FieldValueFilterWidgetManager from '../../../../../../shared/modules/DashboardBuilder/manager/FieldValueFilterWidgetManager';
import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import FieldFiltersVO from '../../../../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO';
import SuiviCompetencesWidgetOptionsVO from '../../../../../../shared/modules/DashboardBuilder/vos/SuiviCompetencesWidgetOptionsVO';
import DataFilterOption from '../../../../../../shared/modules/DataRender/vos/DataFilterOption';
import NumSegment from '../../../../../../shared/modules/DataRender/vos/NumSegment';
import ModuleSuiviCompetences from '../../../../../../shared/modules/SuiviCompetences/ModuleSuiviCompetences';
import SuiviCompetencesGroupeResult from '../../../../../../shared/modules/SuiviCompetences/apis/SuiviCompetencesGroupeResult';
import SuiviCompetencesIndicateurTableFieldTypeController from '../../../../../../shared/modules/SuiviCompetences/fields/indicateur/SuiviCompetencesIndicateurTableFieldTypeController';
import SuiviCompetencesIndicateurVO from '../../../../../../shared/modules/SuiviCompetences/fields/indicateur/vos/SuiviCompetencesIndicateurVO';
import SuiviCompetencesItemRapportVO from '../../../../../../shared/modules/SuiviCompetences/vos/SuiviCompetencesItemRapportVO';
import SuiviCompetencesItemVO from '../../../../../../shared/modules/SuiviCompetences/vos/SuiviCompetencesItemVO';
import SuiviCompetencesRapportVO from '../../../../../../shared/modules/SuiviCompetences/vos/SuiviCompetencesRapportVO';
import VOsTypesManager from '../../../../../../shared/modules/VO/manager/VOsTypesManager';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import ObjectHandler, { field_names } from '../../../../../../shared/tools/ObjectHandler';
import { all_promises } from '../../../../../../shared/tools/PromiseTools';
import RangeHandler from '../../../../../../shared/tools/RangeHandler';
import VueComponentBase from '../../../VueComponentBase';
import { ModuleDashboardPageGetter } from '../../page/DashboardPageStore';
import CRUDCreateModalComponent from '../table_widget/crud_modals/create/CRUDCreateModalComponent';
import './SuiviCompetencesWidgetComponent.scss';
import SuiviCompetencesGroupeVO from '../../../../../../shared/modules/SuiviCompetences/vos/SuiviCompetencesGroupeVO';
import SuiviCompetencesRapportSousGroupeDataRangesVO from '../../../../../../shared/modules/SuiviCompetences/vars/vos/SuiviCompetencesRapportSousGroupeDataRangesVO';
import SuiviCompetencesVarsNamesHolder from '../../../../../../shared/modules/SuiviCompetences/vars/SuiviCompetencesVarsNamesHolder';
import SuiviCompetencesRapportGroupeDataRangesVO from '../../../../../../shared/modules/SuiviCompetences/vars/vos/SuiviCompetencesRapportGroupeDataRangesVO';
import VarDataValueResVO from '../../../../../../shared/modules/Var/vos/VarDataValueResVO';
import VarDataRefComponent from '../../../Var/components/dataref/VarDataRefComponent';
import NiveauMaturiteStyle from '../../../../../../shared/modules/SuiviCompetences/class/NiveauMaturiteStyle';
import Dates from '../../../../../../shared/modules/FormatDatesNombres/Dates/Dates';

@Component({
    template: require('./SuiviCompetencesWidgetComponent.pug'),
    components: {
        Crudcreatemodalcomponent: CRUDCreateModalComponent,
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
    private all_groupes: SuiviCompetencesGroupeResult[] = [];
    private filtered_groupes: SuiviCompetencesGroupeResult[] = [];
    private rapport_item_by_ids: { [item_id: number]: SuiviCompetencesItemRapportVO } = {};
    private all_rapport_item_by_ids: { [item_id: number]: SuiviCompetencesItemRapportVO } = {};
    private indicateur_option_rapport_item_by_ids: { [item_id: number]: DataFilterOption } = {};
    private indicateur_options_by_item_ids: { [item_id: number]: DataFilterOption[] } = {};

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
    private async onchange_selected_rapport() {
        if (!this.selected_rapport) {
            return;
        }

        let promises = [];

        promises.push((async () => {
            this.all_groupes = await ModuleSuiviCompetences.getInstance().get_all_suivi_competences_groupe([RangeHandler.create_single_elt_NumRange(this.selected_rapport.suivi_comp_grille_id, NumSegment.TYPE_INT)]);
        })());

        promises.push((async () => {
            this.rapport_item_by_ids = ObjectHandler.mapByNumberFieldFromArray(
                await query(SuiviCompetencesItemRapportVO.API_TYPE_ID)
                    .filter_by_num_eq(field_names<SuiviCompetencesItemRapportVO>().rapport_id, this.selected_rapport.id)
                    .select_vos(),
                field_names<SuiviCompetencesItemRapportVO>().suivi_comp_item_id
            );
        })());

        await all_promises(promises);

        this.reload_indicateur_options_by_item_ids();
        this.reload_all_rapport_item_by_ids();
        this.reload_indicateur_option_rapport_item_by_ids();
        this.reload_filtered_groupes();
    }

    private async mounted() {
        await this.throttle_update_visible_options();
    }

    private async update_visible_options() {

        let context_filters: ContextFilterVO[] = ContextFilterVOManager.get_context_filters_from_active_field_filters(
            FieldFiltersVOManager.clean_field_filters_for_request(this.get_active_field_filters)
        );

        this.has_active_filters = !!context_filters?.length;

        if (
            (!this.get_dashboard_api_type_ids?.length) ||
            (!this.has_active_filters)
        ) {
            this.selected_rapport = null;
            this.rapports = [];
            return;
        }

        const context_query_rapport: ContextQueryVO = query(SuiviCompetencesRapportVO.API_TYPE_ID)
            .using(this.get_dashboard_api_type_ids)
            .add_filters(context_filters);

        FieldValueFilterWidgetManager.add_discarded_field_paths(context_query_rapport, this.get_discarded_field_paths);

        let rapports: SuiviCompetencesRapportVO[] = await context_query_rapport.select_vos();

        this.rapports = rapports?.length ? rapports : [];

        this.reload_filtered_groupes();
    }

    private async open_create() {
        await this.get_Crudcreatemodalcomponent.open_modal(
            SuiviCompetencesRapportVO.API_TYPE_ID,
            this.update_visible_options.bind(this),
            null,
            false
        );
    }

    private async duplicate_rapport() {
        this.snotify.confirm(this.label('confirm_duplicate_rapport.body'), null, {
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
                        );

                        let res: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(new_rapport);

                        if (!res?.id) {
                            throw new Error('Erreur lors de la sauvegarde');
                        }

                        await ModuleSuiviCompetences.getInstance().duplicate_suivi_competences_rapport(res.id, this.selected_rapport.id);

                        this.throttle_update_visible_options();
                        this.selected_rapport = await query(SuiviCompetencesRapportVO.API_TYPE_ID).filter_by_id(res.id).select_vo();

                        this.$snotify.success(this.label('duplicate_rapport.success'));
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

    private async onchange_indicateur(item: SuiviCompetencesItemVO) {
        if (this.indicateur_option_rapport_item_by_ids[item.id] && (this.all_rapport_item_by_ids[item.id].indicateur == this.indicateur_option_rapport_item_by_ids[item.id].id)) {
            return;
        }

        this.all_rapport_item_by_ids[item.id].indicateur = this.indicateur_option_rapport_item_by_ids[item.id] ? this.indicateur_option_rapport_item_by_ids[item.id].id : null;

        let res: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(this.all_rapport_item_by_ids[item.id]);

        if (!res?.id) {
            throw new Error('Erreur lors de la sauvegarde');
        }

        this.all_rapport_item_by_ids[item.id].id = res.id;
    }

    private async delete_selected_rapport() {
        if (!this.selected_rapport) {
            return;
        }

        this.snotify.confirm(this.label('confirm_delete_selected_rapport.body'), null, {
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

    private switch_show_details() {
        this.show_details = !this.show_details;
    }

    private reload_all_rapport_item_by_ids() {
        let res: { [item_id: number]: SuiviCompetencesItemRapportVO } = {};

        for (let i in this.rapport_item_by_ids) {
            res[this.rapport_item_by_ids[i].suivi_comp_item_id] = this.rapport_item_by_ids[i];
        }

        for (let i in this.all_groupes) {
            for (let j in this.all_groupes[i].sous_groupe) {
                for (let k in this.all_groupes[i].sous_groupe[j].items) {
                    let item: SuiviCompetencesItemVO = this.all_groupes[i].sous_groupe[j].items[k];

                    if (!res[item.id]) {
                        res[item.id] = SuiviCompetencesItemRapportVO.createNew(
                            null,
                            null,
                            null,
                            item.id,
                            this.selected_rapport.id
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
            !this.get_active_field_filters[SuiviCompetencesGroupeVO.API_TYPE_ID] ||
            !Object.keys(this.get_active_field_filters[SuiviCompetencesGroupeVO.API_TYPE_ID])?.length
        ) {
            this.filtered_groupes = this.all_groupes;
            return;
        }

        for (let i in this.all_groupes) {
            let groupe: SuiviCompetencesGroupeResult = this.all_groupes[i];

            for (let field_name in this.get_active_field_filters[SuiviCompetencesGroupeVO.API_TYPE_ID]) {
                // Si j'ai un filtrage multiple et que le groupe a la valeur, je rajoute
                if (
                    !!this.get_active_field_filters[SuiviCompetencesGroupeVO.API_TYPE_ID][field_name]?.param_textarray?.length
                ) {
                    if (
                        !!groupe[field_name] &&
                        this.get_active_field_filters[SuiviCompetencesGroupeVO.API_TYPE_ID][field_name].param_textarray.includes(groupe[field_name])
                    ) {
                        res.push(groupe);
                    }

                    continue;
                }

                // Si j'ai un filtrage simple et que le groupe a la valeur, je rajoute
                if (
                    !!this.get_active_field_filters[SuiviCompetencesGroupeVO.API_TYPE_ID][field_name]?.param_text?.length
                ) {
                    if (
                        !!groupe[field_name] &&
                        (this.get_active_field_filters[SuiviCompetencesGroupeVO.API_TYPE_ID][field_name].param_text == groupe[field_name])
                    ) {
                        res.push(groupe);
                    }

                    continue;
                }

                // Si je n'ai pas de filtrage, je rajoute le groupe
                res.push(groupe);
            }
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

    get widget_options(): SuiviCompetencesWidgetOptionsVO {
        if (!this.page_widget) {
            return null;
        }

        let options: SuiviCompetencesWidgetOptionsVO = null;
        try {
            if (!!this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as SuiviCompetencesWidgetOptionsVO;
                options = options ? new SuiviCompetencesWidgetOptionsVO(null).from(options) : null;
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }

        return options;
    }

    get plan_action_editable_field() {
        return SimpleDatatableFieldVO.createNew(field_names<SuiviCompetencesItemRapportVO>().plan_action).setModuleTable(VOsTypesManager.moduleTables_by_voType[SuiviCompetencesItemRapportVO.API_TYPE_ID]);
    }

    get etat_des_lieux_editable_field() {
        return SimpleDatatableFieldVO.createNew(field_names<SuiviCompetencesItemRapportVO>().etat_des_lieux).setModuleTable(VOsTypesManager.moduleTables_by_voType[SuiviCompetencesItemRapportVO.API_TYPE_ID]);
    }

    get points_cles_editable_field() {
        return SimpleDatatableFieldVO.createNew(field_names<SuiviCompetencesRapportVO>().points_cles).setModuleTable(VOsTypesManager.moduleTables_by_voType[SuiviCompetencesRapportVO.API_TYPE_ID]);
    }

    get objectif_prochaine_visite_editable_field() {
        return SimpleDatatableFieldVO.createNew(field_names<SuiviCompetencesRapportVO>().objectif_prochaine_visite).setModuleTable(VOsTypesManager.moduleTables_by_voType[SuiviCompetencesRapportVO.API_TYPE_ID]);
    }
}