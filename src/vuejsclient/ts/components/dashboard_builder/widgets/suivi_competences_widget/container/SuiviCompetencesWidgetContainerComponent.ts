import { cloneDeep } from 'lodash';
import Component from 'vue-class-component';
import { Inject, Prop, Watch } from 'vue-property-decorator';
import { query } from '../../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import ModuleTableController from '../../../../../../../shared/modules/DAO/ModuleTableController';
import InsertOrDeleteQueryResult from '../../../../../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import SimpleDatatableFieldVO from '../../../../../../../shared/modules/DAO/vos/datatable/SimpleDatatableFieldVO';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import FieldFiltersVO from '../../../../../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO';
import SuiviCompetencesWidgetOptionsVO from '../../../../../../../shared/modules/DashboardBuilder/vos/SuiviCompetencesWidgetOptionsVO';
import DataFilterOption from '../../../../../../../shared/modules/DataRender/vos/DataFilterOption';
import NumSegment from '../../../../../../../shared/modules/DataRender/vos/NumSegment';
import ModuleSuiviCompetences from '../../../../../../../shared/modules/SuiviCompetences/ModuleSuiviCompetences';
import SuiviCompetencesGroupeResult from '../../../../../../../shared/modules/SuiviCompetences/apis/SuiviCompetencesGroupeResult';
import NiveauMaturiteStyle from '../../../../../../../shared/modules/SuiviCompetences/class/NiveauMaturiteStyle';
import SuiviCompetencesIndicateurTableFieldTypeController from '../../../../../../../shared/modules/SuiviCompetences/fields/indicateur/SuiviCompetencesIndicateurTableFieldTypeController';
import SuiviCompetencesIndicateurVO from '../../../../../../../shared/modules/SuiviCompetences/fields/indicateur/vos/SuiviCompetencesIndicateurVO';
import SuiviCompetencesVarsNamesHolder from '../../../../../../../shared/modules/SuiviCompetences/vars/SuiviCompetencesVarsNamesHolder';
import SuiviCompetencesRapportGroupeDataRangesVO from '../../../../../../../shared/modules/SuiviCompetences/vars/vos/SuiviCompetencesRapportGroupeDataRangesVO';
import SuiviCompetencesRapportSousGroupeDataRangesVO from '../../../../../../../shared/modules/SuiviCompetences/vars/vos/SuiviCompetencesRapportSousGroupeDataRangesVO';
import SuiviCompetencesGrilleVO from '../../../../../../../shared/modules/SuiviCompetences/vos/SuiviCompetencesGrilleVO';
import SuiviCompetencesGroupeVO from '../../../../../../../shared/modules/SuiviCompetences/vos/SuiviCompetencesGroupeVO';
import SuiviCompetencesItemRapportVO from '../../../../../../../shared/modules/SuiviCompetences/vos/SuiviCompetencesItemRapportVO';
import SuiviCompetencesItemVO from '../../../../../../../shared/modules/SuiviCompetences/vos/SuiviCompetencesItemVO';
import SuiviCompetencesRapportVO from '../../../../../../../shared/modules/SuiviCompetences/vos/SuiviCompetencesRapportVO';
import VarDataValueResVO from '../../../../../../../shared/modules/Var/vos/VarDataValueResVO';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import ObjectHandler, { field_names, reflect } from '../../../../../../../shared/tools/ObjectHandler';
import { all_promises } from '../../../../../../../shared/tools/PromiseTools';
import RangeHandler from '../../../../../../../shared/tools/RangeHandler';
import VarDataRefComponent from '../../../../Var/components/dataref/VarDataRefComponent';
import VueComponentBase from '../../../../VueComponentBase';
import CRUDCreateModalComponent from '../../table_widget/crud_modals/create/CRUDCreateModalComponent';

@Component({
    template: require('./SuiviCompetencesWidgetContainerComponent.pug'),
    components: {
        Crudcreatemodalcomponent: CRUDCreateModalComponent,
    }
})
export default class SuiviCompetencesWidgetContainerComponent extends VueComponentBase {
    @Inject('storeNamespace') readonly storeNamespace!: string;

    @Prop({ default: null })
    private selected_rapport: SuiviCompetencesRapportVO;

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @Prop({ default: false })
    private show_details: boolean;

    private all_groupes: SuiviCompetencesGroupeResult[] = [];
    private grille: SuiviCompetencesGrilleVO = null;
    private filtered_groupes: SuiviCompetencesGroupeResult[] = [];
    private rapport_item_by_ids: { [item_id: number]: SuiviCompetencesItemRapportVO } = {};
    private all_rapport_item_by_ids: { [item_id: number]: SuiviCompetencesItemRapportVO } = {};
    private indicateur_option_rapport_item_by_ids: { [item_id: number]: DataFilterOption } = {};
    private indicateur_options_by_item_ids: { [item_id: number]: DataFilterOption[] } = {};

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

    get get_active_field_filters(): FieldFiltersVO {
        return this.vuexGet<FieldFiltersVO>(reflect<this>().get_active_field_filters);
    }

    get plan_action_editable_field() {
        return SimpleDatatableFieldVO.createNew(field_names<SuiviCompetencesItemRapportVO>().plan_action).setModuleTable(ModuleTableController.module_tables_by_vo_type[SuiviCompetencesItemRapportVO.API_TYPE_ID]);
    }

    get etat_des_lieux_editable_field() {
        return SimpleDatatableFieldVO.createNew(field_names<SuiviCompetencesItemRapportVO>().etat_des_lieux).setModuleTable(ModuleTableController.module_tables_by_vo_type[SuiviCompetencesItemRapportVO.API_TYPE_ID]);
    }

    get delais_editable_field() {
        return SimpleDatatableFieldVO.createNew(field_names<SuiviCompetencesItemRapportVO>().delais).setModuleTable(ModuleTableController.module_tables_by_vo_type[SuiviCompetencesItemRapportVO.API_TYPE_ID]);
    }

    get bilan_precedent_editable_field() {
        return SimpleDatatableFieldVO.createNew(field_names<SuiviCompetencesItemRapportVO>().bilan_precedent).setModuleTable(ModuleTableController.module_tables_by_vo_type[SuiviCompetencesItemRapportVO.API_TYPE_ID]);
    }

    get cible_editable_field() {
        return SimpleDatatableFieldVO.createNew(field_names<SuiviCompetencesItemRapportVO>().cible).setModuleTable(ModuleTableController.module_tables_by_vo_type[SuiviCompetencesItemRapportVO.API_TYPE_ID]);
    }

    get points_cles_editable_field() {
        return SimpleDatatableFieldVO.createNew(field_names<SuiviCompetencesRapportVO>().points_cles).setModuleTable(ModuleTableController.module_tables_by_vo_type[SuiviCompetencesRapportVO.API_TYPE_ID]);
    }

    get objectif_prochaine_visite_editable_field() {
        return SimpleDatatableFieldVO.createNew(field_names<SuiviCompetencesRapportVO>().objectif_prochaine_visite).setModuleTable(ModuleTableController.module_tables_by_vo_type[SuiviCompetencesRapportVO.API_TYPE_ID]);
    }

    get nb_visible_fields(): number {
        let res: number = 0;

        if (this.grille?.show_column_name) {
            res++;
        }
        if (this.grille?.show_column_rapport_plan_action) {
            res++;
        }
        if (this.grille?.show_column_rapport_etat_des_lieux) {
            res++;
        }
        if (this.grille?.show_column_rapport_cible) {
            res++;
        }
        if (this.grille?.show_column_rapport_delais) {
            res++;
        }
        if (this.grille?.show_column_bilan_precedent) {
            res++;
        }
        if (this.grille?.show_column_rapport_indicateur) {
            res++;
        }

        return res;
    }

    get colspan_break_page(): number {
        let res: number = 2 + this.nb_visible_fields;

        if (this.show_details) {
            res += 2;
        }

        return res;
    }

    get colspan_sous_groupe(): number {
        let res: number = this.nb_visible_fields;

        if (this.show_details) {
            res += 2;
        }

        return res;
    }

    get top_fields(): Array<SimpleDatatableFieldVO<any, any>> {
        let res: Array<SimpleDatatableFieldVO<any, any>> = [];

        if (this.grille?.show_points_cles) {
            res.push(SimpleDatatableFieldVO.createNew(field_names<SuiviCompetencesRapportVO>().points_cles).setModuleTable(ModuleTableController.module_tables_by_vo_type[SuiviCompetencesRapportVO.API_TYPE_ID]));
        }
        if (this.grille?.show_objectif_prochaine_visite) {
            res.push(SimpleDatatableFieldVO.createNew(field_names<SuiviCompetencesRapportVO>().objectif_prochaine_visite).setModuleTable(ModuleTableController.module_tables_by_vo_type[SuiviCompetencesRapportVO.API_TYPE_ID]));
        }

        return res;
    }

    get bottom_fields(): Array<SimpleDatatableFieldVO<any, any>> {
        let res: Array<SimpleDatatableFieldVO<any, any>> = [];

        if (this.grille?.show_commentaire_1) {
            res.push(SimpleDatatableFieldVO.createNew(field_names<SuiviCompetencesRapportVO>().commentaire_1).setModuleTable(ModuleTableController.module_tables_by_vo_type[SuiviCompetencesRapportVO.API_TYPE_ID]));
        }
        if (this.grille?.show_commentaire_2) {
            res.push(SimpleDatatableFieldVO.createNew(field_names<SuiviCompetencesRapportVO>().commentaire_2).setModuleTable(ModuleTableController.module_tables_by_vo_type[SuiviCompetencesRapportVO.API_TYPE_ID]));
        }
        if (this.grille?.show_prochain_suivi) {
            res.push(SimpleDatatableFieldVO.createNew(field_names<SuiviCompetencesRapportVO>().prochain_suivi).setModuleTable(ModuleTableController.module_tables_by_vo_type[SuiviCompetencesRapportVO.API_TYPE_ID]));
        }

        return res;
    }

    @Watch('selected_rapport', { immediate: true })
    @Watch('show_details')
    @Watch('page_widget')
    private async onchange_selected_rapport() {
        if (!this.selected_rapport) {
            return;
        }

        let promises = [];

        promises.push((async () => {
            this.all_groupes = await ModuleSuiviCompetences.getInstance().get_all_suivi_competences_groupe([RangeHandler.create_single_elt_NumRange(this.selected_rapport.suivi_comp_grille_id, NumSegment.TYPE_INT)]);
        })());

        promises.push((async () => {
            this.grille = await query(SuiviCompetencesGrilleVO.API_TYPE_ID)
                .filter_by_id(this.selected_rapport.suivi_comp_grille_id)
                .select_vo();
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

    // Accès dynamiques Vuex
    public vuexGet<T>(getter: string): T {
        return (this.$store.getters as any)[`${this.storeNamespace}/${getter}`];
    }
    public vuexAct<A>(action: string, payload?: A) {
        return this.$store.dispatch(`${this.storeNamespace}/${action}`, payload);
    }

    private async onchange_indicateur(item: SuiviCompetencesItemVO) {
        if (this.indicateur_option_rapport_item_by_ids[item.id] && (this.all_rapport_item_by_ids[item.id].indicateur == this.indicateur_option_rapport_item_by_ids[item.id].id)) {
            return;
        }

        this.all_rapport_item_by_ids[item.id].indicateur = this.indicateur_option_rapport_item_by_ids[item.id] ? this.indicateur_option_rapport_item_by_ids[item.id].id : null;

        let res: InsertOrDeleteQueryResult = await ModuleDAO.instance.insertOrUpdateVO(this.all_rapport_item_by_ids[item.id]);

        if (!res?.id) {
            throw new Error('Erreur lors de la sauvegarde');
        }

        this.all_rapport_item_by_ids[item.id].id = res.id;
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
                            this.selected_rapport.id,
                            null,
                            null,
                            null,
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
        if (!var_value || !this.widget_options?.niveau_maturite_styles?.length || (var_value.value == null)) {
            component.$el['style'].background = '';
            component.$el['style'].color = '';
            return var_value?.value;
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