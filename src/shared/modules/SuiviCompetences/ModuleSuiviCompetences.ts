/* istanbul ignore file: WARNING No test on module main file, causes trouble, but NEEDs to externalize any function that can profite a test */

import AccessPolicyTools from '../../tools/AccessPolicyTools';
import { field_names } from '../../tools/ObjectHandler';
import APIControllerWrapper from '../API/APIControllerWrapper';
import PostForGetAPIDefinition from '../API/vos/PostForGetAPIDefinition';
import Number2ParamVO, { Number2ParamVOStatic } from '../API/vos/apis/Number2ParamVO';
import UserVO from '../AccessPolicy/vos/UserVO';
import ModuleDAO from '../DAO/ModuleDAO';
import ModuleTableController from '../DAO/ModuleTableController';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../DAO/vos/ModuleTableFieldVO';
import NumRange from '../DataRender/vos/NumRange';
import NumSegment from '../DataRender/vos/NumSegment';
import TimeSegment from '../DataRender/vos/TimeSegment';
import Module from '../Module';
import TableFieldTypesManager from '../TableFieldTypes/TableFieldTypesManager';
import DefaultTranslationVO from '../Translation/vos/DefaultTranslationVO';
import VarsInitController from '../Var/VarsInitController';
import VersionedVOController from '../Versioned/VersionedVOController';
import APIArrayNumberParamsVO, { APIArrayNumberParamsVOStatic } from './apis/APIArrayNumberParamsVO';
import SuiviCompetencesGroupeResult from './apis/SuiviCompetencesGroupeResult';
import SuiviCompetencesIndicateurTableFieldTypeController from './fields/indicateur/SuiviCompetencesIndicateurTableFieldTypeController';
import SuiviCompetencesIndicateurVO from './fields/indicateur/vos/SuiviCompetencesIndicateurVO';
import SuiviCompetencesRapportGroupeDataRangesVO from './vars/vos/SuiviCompetencesRapportGroupeDataRangesVO';
import SuiviCompetencesRapportSousGroupeDataRangesVO from './vars/vos/SuiviCompetencesRapportSousGroupeDataRangesVO';
import SuiviCompetencesRapportItemDataRangesVO from './vars/vos/SuiviCompetencesRapportItemDataRangesVO';
import SuiviCompetencesUserDataRangesVO from './vars/vos/SuiviCompetencesUserDataRangesVO';
import SuiviCompetencesActiviteVO from './vos/SuiviCompetencesActiviteVO';
import SuiviCompetencesGrilleVO from './vos/SuiviCompetencesGrilleVO';
import SuiviCompetencesGroupeVO from './vos/SuiviCompetencesGroupeVO';
import SuiviCompetencesItemRapportVO from './vos/SuiviCompetencesItemRapportVO';
import SuiviCompetencesItemVO from './vos/SuiviCompetencesItemVO';
import SuiviCompetencesRapportVO from './vos/SuiviCompetencesRapportVO';
import SuiviCompetencesSousGroupeVO from './vos/SuiviCompetencesSousGroupeVO';
import SuiviCompetencesGroupeUserTsRangesDataRangesVO from './vars/vos/SuiviCompetencesGroupeUserTsRangesDataRangesVO';
import SuiviCompetencesSousGroupeUserTsRangesDataRangesVO from './vars/vos/SuiviCompetencesSousGroupeUserTsRangesDataRangesVO';

export default class ModuleSuiviCompetences extends Module {

    public static MODULE_NAME: string = 'SuiviCompetences';

    public static POLICY_GROUP: string = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleSuiviCompetences.MODULE_NAME;
    public static POLICY_BO_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleSuiviCompetences.MODULE_NAME + '.BO_ACCESS';
    public static POLICY_FO_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleSuiviCompetences.MODULE_NAME + '.FO_ACCESS';

    public static APINAME_get_all_suivi_competences_groupe: string = 'get_all_suivi_competences_groupe';
    public static APINAME_duplicate_suivi_competences_rapport: string = 'duplicate_suivi_competences_rapport';

    public static EXPORT_SUIVI_COMPETENCES_RAPPORT: string = "ExportSuiviCompetencesRapport";

    private static instance: ModuleSuiviCompetences = null;

    public get_all_suivi_competences_groupe: (grille_id_ranges: NumRange[]) => Promise<SuiviCompetencesGroupeResult[]> = APIControllerWrapper.sah<APIArrayNumberParamsVO, SuiviCompetencesGroupeResult[]>(
        ModuleSuiviCompetences.APINAME_get_all_suivi_competences_groupe
    );

    public duplicate_suivi_competences_rapport: (new_rapport_id: number, duplicate_rapport_id: number) => Promise<boolean> = APIControllerWrapper.sah<Number2ParamVO, boolean>(
        ModuleSuiviCompetences.APINAME_duplicate_suivi_competences_rapport
    );

    private constructor() {

        super("suivi_competences", ModuleSuiviCompetences.MODULE_NAME);
    }


    public static getInstance(): ModuleSuiviCompetences {
        if (!ModuleSuiviCompetences.instance) {
            ModuleSuiviCompetences.instance = new ModuleSuiviCompetences();
        }
        return ModuleSuiviCompetences.instance;
    }

    public registerApis() {
        APIControllerWrapper.registerApi(new PostForGetAPIDefinition<APIArrayNumberParamsVO, SuiviCompetencesGroupeResult[]>(
            ModuleDAO.getInstance().getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_READ, SuiviCompetencesGroupeVO.API_TYPE_ID),
            ModuleSuiviCompetences.APINAME_get_all_suivi_competences_groupe,
            [SuiviCompetencesGroupeVO.API_TYPE_ID, SuiviCompetencesSousGroupeVO.API_TYPE_ID, SuiviCompetencesItemVO.API_TYPE_ID, SuiviCompetencesGrilleVO.API_TYPE_ID],
            APIArrayNumberParamsVOStatic
        ));
        APIControllerWrapper.registerApi(new PostForGetAPIDefinition<Number2ParamVO, boolean>(
            ModuleDAO.getInstance().getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_READ, SuiviCompetencesRapportVO.API_TYPE_ID),
            ModuleSuiviCompetences.APINAME_duplicate_suivi_competences_rapport,
            [SuiviCompetencesRapportVO.API_TYPE_ID, SuiviCompetencesItemRapportVO.API_TYPE_ID],
            Number2ParamVOStatic
        ));
    }

    public initialize() {
        this.initializeSuiviCompetencesActivite();
        this.initializeSuiviCompetencesGroupe();
        this.initializeSuiviCompetencesSousGroupe();
        this.initializeSuiviCompetencesItem();
        this.initializeSuiviCompetencesGrille();
        this.initializeSuiviCompetencesRapport();
        this.initializeSuiviCompetencesItemRapport();

        this.initializeSuiviCompetencesUserDataRangesVO();
        this.initializeSuiviCompetencesRapportGroupeDataRangesVO();
        this.initializeSuiviCompetencesRapportSousGroupeDataRangesVO();
        this.initializeSuiviCompetencesRapportItemDataRangesVO();
        this.initializeSuiviCompetencesGroupeUserTsRangesDataRangesVO();
        this.initializeSuiviCompetencesSousGroupeUserTsRangesDataRangesVO();

        this.initializeSuiviCompetencesIndicateurVO();
    }

    private initializeSuiviCompetencesGroupe() {
        let label_field = ModuleTableFieldController.create_new(SuiviCompetencesGroupeVO.API_TYPE_ID, field_names<SuiviCompetencesGroupeVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom du groupe', true);

        ModuleTableFieldController.create_new(SuiviCompetencesGroupeVO.API_TYPE_ID, field_names<SuiviCompetencesGroupeVO>().short_name, ModuleTableFieldVO.FIELD_TYPE_string, "Nom court");
        ModuleTableFieldController.create_new(SuiviCompetencesGroupeVO.API_TYPE_ID, field_names<SuiviCompetencesGroupeVO>().weight, ModuleTableFieldVO.FIELD_TYPE_int, "Poids");
        ModuleTableFieldController.create_new(SuiviCompetencesGroupeVO.API_TYPE_ID, field_names<SuiviCompetencesGroupeVO>().ponderation, ModuleTableFieldVO.FIELD_TYPE_int, "Pondération", false, true, 1);
        ModuleTableFieldController.create_new(SuiviCompetencesGroupeVO.API_TYPE_ID, field_names<SuiviCompetencesGroupeVO>().active, ModuleTableFieldVO.FIELD_TYPE_boolean, "Actif", true, true, true);
        ModuleTableFieldController.create_new(SuiviCompetencesGroupeVO.API_TYPE_ID, field_names<SuiviCompetencesGroupeVO>().icon, ModuleTableFieldVO.FIELD_TYPE_string, "Icone (font awesome)");

        ModuleTableController.create_new(this.name, SuiviCompetencesGroupeVO, label_field, "Suivi Competences Groupe");
    }

    private initializeSuiviCompetencesActivite() {
        let label_field = ModuleTableFieldController.create_new(SuiviCompetencesActiviteVO.API_TYPE_ID, field_names<SuiviCompetencesActiviteVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'Activité', true);

        ModuleTableController.create_new(this.name, SuiviCompetencesActiviteVO, label_field, "Suivi Compétences Activités");
    }

    private initializeSuiviCompetencesSousGroupe() {
        let label_field = ModuleTableFieldController.create_new(SuiviCompetencesSousGroupeVO.API_TYPE_ID, field_names<SuiviCompetencesSousGroupeVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom du sous groupe', true);
        let groupe_id = ModuleTableFieldController.create_new(SuiviCompetencesSousGroupeVO.API_TYPE_ID, field_names<SuiviCompetencesSousGroupeVO>().groupe_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Groupe', true);

        let datatable_fields = [
            label_field,
            groupe_id,
            ModuleTableFieldController.create_new(SuiviCompetencesSousGroupeVO.API_TYPE_ID, field_names<SuiviCompetencesSousGroupeVO>().weight, ModuleTableFieldVO.FIELD_TYPE_int, "Poids"),
            ModuleTableFieldController.create_new(SuiviCompetencesSousGroupeVO.API_TYPE_ID, field_names<SuiviCompetencesSousGroupeVO>().active, ModuleTableFieldVO.FIELD_TYPE_boolean, "Actif", true, true, true),
            ModuleTableFieldController.create_new(SuiviCompetencesSousGroupeVO.API_TYPE_ID, field_names<SuiviCompetencesSousGroupeVO>().ponderation, ModuleTableFieldVO.FIELD_TYPE_int, "Pondération", false, true, 1),
        ];

        ModuleTableController.create_new(this.name, SuiviCompetencesSousGroupeVO, label_field, "Suivi Competences Sous groupe");

        groupe_id.set_many_to_one_target_moduletable_name(SuiviCompetencesGroupeVO.API_TYPE_ID);
    }

    private initializeSuiviCompetencesItem() {
        let label_field = ModuleTableFieldController.create_new(SuiviCompetencesItemVO.API_TYPE_ID, field_names<SuiviCompetencesItemVO>().label, ModuleTableFieldVO.FIELD_TYPE_string, "Label");
        let groupe_id = ModuleTableFieldController.create_new(SuiviCompetencesItemVO.API_TYPE_ID, field_names<SuiviCompetencesItemVO>().groupe_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Groupe', true);
        let sous_groupe_id = ModuleTableFieldController.create_new(SuiviCompetencesItemVO.API_TYPE_ID, field_names<SuiviCompetencesItemVO>().sous_groupe_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Sous Groupe');
        let suivi_comp_activite_id = ModuleTableFieldController.create_new(SuiviCompetencesItemVO.API_TYPE_ID, field_names<SuiviCompetencesItemVO>().suivi_comp_activite_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Activité');

        let datatable_fields = [
            label_field,
            ModuleTableFieldController.create_new(SuiviCompetencesItemVO.API_TYPE_ID, field_names<SuiviCompetencesItemVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, "Nom de l'item", true),
            ModuleTableFieldController.create_new(SuiviCompetencesItemVO.API_TYPE_ID, field_names<SuiviCompetencesItemVO>().weight, ModuleTableFieldVO.FIELD_TYPE_int, "Poids"),
            ModuleTableFieldController.create_new(SuiviCompetencesItemVO.API_TYPE_ID, field_names<SuiviCompetencesItemVO>().indicateurs, SuiviCompetencesIndicateurVO.API_TYPE_ID, "Indicateurs"),
            ModuleTableFieldController.create_new(SuiviCompetencesItemVO.API_TYPE_ID, field_names<SuiviCompetencesItemVO>().kpis, ModuleTableFieldVO.FIELD_TYPE_string, "KPIS"),
            ModuleTableFieldController.create_new(SuiviCompetencesItemVO.API_TYPE_ID, field_names<SuiviCompetencesItemVO>().popup, ModuleTableFieldVO.FIELD_TYPE_string, "Texte Popup"),
            ModuleTableFieldController.create_new(SuiviCompetencesItemVO.API_TYPE_ID, field_names<SuiviCompetencesItemVO>().active, ModuleTableFieldVO.FIELD_TYPE_boolean, "Actif", true, true, true),
            groupe_id,
            sous_groupe_id,
            suivi_comp_activite_id,
        ];

        ModuleTableController.create_new(this.name, SuiviCompetencesItemVO, label_field, "Suivi Competences Item");

        groupe_id.set_many_to_one_target_moduletable_name(SuiviCompetencesGroupeVO.API_TYPE_ID);
        sous_groupe_id.set_many_to_one_target_moduletable_name(SuiviCompetencesSousGroupeVO.API_TYPE_ID);
        suivi_comp_activite_id.set_many_to_one_target_moduletable_name(SuiviCompetencesActiviteVO.API_TYPE_ID);

        TableFieldTypesManager.getInstance().registerTableFieldTypeController(SuiviCompetencesIndicateurTableFieldTypeController.getInstance());
    }

    private initializeSuiviCompetencesGrille() {
        let name = ModuleTableFieldController.create_new(SuiviCompetencesGrilleVO.API_TYPE_ID, field_names<SuiviCompetencesGrilleVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom', true);
        let suivi_comp_item_id_ranges = ModuleTableFieldController.create_new(SuiviCompetencesGrilleVO.API_TYPE_ID, field_names<SuiviCompetencesGrilleVO>().suivi_comp_item_id_ranges, ModuleTableFieldVO.FIELD_TYPE_refrange_array, 'Items');
        let suivi_comp_activite_id = ModuleTableFieldController.create_new(SuiviCompetencesGrilleVO.API_TYPE_ID, field_names<SuiviCompetencesGrilleVO>().suivi_comp_activite_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Activité');

        let datatable_fields = [
            name,
            suivi_comp_item_id_ranges,
            suivi_comp_activite_id,
            ModuleTableFieldController.create_new(SuiviCompetencesGrilleVO.API_TYPE_ID, field_names<SuiviCompetencesGrilleVO>().calcul_niveau_maturite, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Utilisation du calcul du niveau de maturité ?', true, true, true),
            ModuleTableFieldController.create_new(SuiviCompetencesGrilleVO.API_TYPE_ID, field_names<SuiviCompetencesGrilleVO>().logo, ModuleTableFieldVO.FIELD_TYPE_string, 'URL du logo'),
            ModuleTableFieldController.create_new(SuiviCompetencesGrilleVO.API_TYPE_ID, field_names<SuiviCompetencesGrilleVO>().move_indicateur_to_end, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Déplacer l\'indicateur en fin de tableau ?', true, true, false),
            ModuleTableFieldController.create_new(SuiviCompetencesGrilleVO.API_TYPE_ID, field_names<SuiviCompetencesGrilleVO>().base_export_file_name, ModuleTableFieldVO.FIELD_TYPE_string, 'Base du nom du fichier exporté (sans espace)'),
            ModuleTableFieldController.create_new(SuiviCompetencesGrilleVO.API_TYPE_ID, field_names<SuiviCompetencesGrilleVO>().show_column_rapport_plan_action, ModuleTableFieldVO.FIELD_TYPE_boolean, "Afficher colonne rapport : plan d'action", true, true, true),
            ModuleTableFieldController.create_new(SuiviCompetencesGrilleVO.API_TYPE_ID, field_names<SuiviCompetencesGrilleVO>().show_column_rapport_etat_des_lieux, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Afficher colonne rapport : etat des lieux', true, true, true),
            ModuleTableFieldController.create_new(SuiviCompetencesGrilleVO.API_TYPE_ID, field_names<SuiviCompetencesGrilleVO>().show_column_rapport_cible, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Afficher colonne rapport : cible', true, true, true),
            ModuleTableFieldController.create_new(SuiviCompetencesGrilleVO.API_TYPE_ID, field_names<SuiviCompetencesGrilleVO>().show_column_rapport_delais, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Afficher colonne rapport : delais', true, true, true),
            ModuleTableFieldController.create_new(SuiviCompetencesGrilleVO.API_TYPE_ID, field_names<SuiviCompetencesGrilleVO>().show_column_name, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Afficher colonne : Nom', false, true, true),
            ModuleTableFieldController.create_new(SuiviCompetencesGrilleVO.API_TYPE_ID, field_names<SuiviCompetencesGrilleVO>().show_column_bilan_precedent, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Afficher colonne : Bilan précédent', false, true, false),
            ModuleTableFieldController.create_new(SuiviCompetencesGrilleVO.API_TYPE_ID, field_names<SuiviCompetencesGrilleVO>().show_column_rapport_indicateur, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Afficher colonne rapport : indicateur', true, true, true),
            ModuleTableFieldController.create_new(SuiviCompetencesGrilleVO.API_TYPE_ID, field_names<SuiviCompetencesGrilleVO>().show_commentaire_1, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Afficher champ : commentaire 1', true, true, true),
            ModuleTableFieldController.create_new(SuiviCompetencesGrilleVO.API_TYPE_ID, field_names<SuiviCompetencesGrilleVO>().show_commentaire_2, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Afficher champ : commentaire 2', true, true, true),
            ModuleTableFieldController.create_new(SuiviCompetencesGrilleVO.API_TYPE_ID, field_names<SuiviCompetencesGrilleVO>().show_prochain_suivi, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Afficher champ : prochain suivi', true, true, true),
            ModuleTableFieldController.create_new(SuiviCompetencesGrilleVO.API_TYPE_ID, field_names<SuiviCompetencesGrilleVO>().show_points_cles, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Afficher champ : points clés', true, true, true),
            ModuleTableFieldController.create_new(SuiviCompetencesGrilleVO.API_TYPE_ID, field_names<SuiviCompetencesGrilleVO>().show_objectif_prochaine_visite, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Afficher champ : objectif prochaine visite', true, true, true),
            ModuleTableFieldController.create_new(SuiviCompetencesGrilleVO.API_TYPE_ID, field_names<SuiviCompetencesGrilleVO>().show_btn_details, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Afficher bouton : Détail'),
        ];

        ModuleTableController.create_new(this.name, SuiviCompetencesGrilleVO, name, "Suivi Competences Grille");

        suivi_comp_item_id_ranges.set_many_to_one_target_moduletable_name(SuiviCompetencesItemVO.API_TYPE_ID);
        suivi_comp_activite_id.set_many_to_one_target_moduletable_name(SuiviCompetencesActiviteVO.API_TYPE_ID);

        VersionedVOController.getInstance().registerModuleTable(ModuleTableController.module_tables_by_vo_type[SuiviCompetencesGrilleVO.API_TYPE_ID]);
    }

    private initializeSuiviCompetencesRapport() {
        let user_id = ModuleTableFieldController.create_new(SuiviCompetencesRapportVO.API_TYPE_ID, field_names<SuiviCompetencesRapportVO>().user_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Utilisateur', true);
        let suivi_comp_grille_id = ModuleTableFieldController.create_new(SuiviCompetencesRapportVO.API_TYPE_ID, field_names<SuiviCompetencesRapportVO>().suivi_comp_grille_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Grille', true);
        let name = ModuleTableFieldController.create_new(SuiviCompetencesRapportVO.API_TYPE_ID, field_names<SuiviCompetencesRapportVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom').hide_from_datatable();

        let datatable_fields = [
            name,
            user_id,
            suivi_comp_grille_id,
            ModuleTableFieldController.create_new(SuiviCompetencesRapportVO.API_TYPE_ID, field_names<SuiviCompetencesRapportVO>().date, ModuleTableFieldVO.FIELD_TYPE_tstz, "Date du rapport", true).set_segmentation_type(TimeSegment.TYPE_DAY),
            ModuleTableFieldController.create_new(SuiviCompetencesRapportVO.API_TYPE_ID, field_names<SuiviCompetencesRapportVO>().points_cles, ModuleTableFieldVO.FIELD_TYPE_html, "Points clés").hide_from_datatable(),
            ModuleTableFieldController.create_new(SuiviCompetencesRapportVO.API_TYPE_ID, field_names<SuiviCompetencesRapportVO>().objectif_prochaine_visite, ModuleTableFieldVO.FIELD_TYPE_html, "Objectifs de la prochaine visite").hide_from_datatable(),
            ModuleTableFieldController.create_new(SuiviCompetencesRapportVO.API_TYPE_ID, field_names<SuiviCompetencesRapportVO>().commentaire_1, ModuleTableFieldVO.FIELD_TYPE_html, "Commentaire 1").hide_from_datatable(),
            ModuleTableFieldController.create_new(SuiviCompetencesRapportVO.API_TYPE_ID, field_names<SuiviCompetencesRapportVO>().commentaire_2, ModuleTableFieldVO.FIELD_TYPE_html, "Commentaire 2").hide_from_datatable(),
            ModuleTableFieldController.create_new(SuiviCompetencesRapportVO.API_TYPE_ID, field_names<SuiviCompetencesRapportVO>().prochain_suivi, ModuleTableFieldVO.FIELD_TYPE_html, "Prochain suivi").hide_from_datatable(),
        ];

        ModuleTableController.create_new(this.name, SuiviCompetencesRapportVO, name, "Suivi Competences Rapport");

        VersionedVOController.getInstance().registerModuleTable(ModuleTableController.module_tables_by_vo_type[SuiviCompetencesRapportVO.API_TYPE_ID]);

        user_id.set_many_to_one_target_moduletable_name(UserVO.API_TYPE_ID);
        suivi_comp_grille_id.set_many_to_one_target_moduletable_name(SuiviCompetencesGrilleVO.API_TYPE_ID);
    }

    private initializeSuiviCompetencesItemRapport() {
        let suivi_comp_item_id = ModuleTableFieldController.create_new(SuiviCompetencesItemRapportVO.API_TYPE_ID, field_names<SuiviCompetencesItemRapportVO>().suivi_comp_item_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Suivi Competences Item', true);
        let rapport_id = ModuleTableFieldController.create_new(SuiviCompetencesItemRapportVO.API_TYPE_ID, field_names<SuiviCompetencesItemRapportVO>().rapport_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Rapport', true);

        let datatable_fields = [
            suivi_comp_item_id,
            rapport_id,
            ModuleTableFieldController.create_new(SuiviCompetencesItemRapportVO.API_TYPE_ID, field_names<SuiviCompetencesItemRapportVO>().plan_action, ModuleTableFieldVO.FIELD_TYPE_html, "Plan d'action"),
            ModuleTableFieldController.create_new(SuiviCompetencesItemRapportVO.API_TYPE_ID, field_names<SuiviCompetencesItemRapportVO>().etat_des_lieux, ModuleTableFieldVO.FIELD_TYPE_html, "Etat des lieux"),
            ModuleTableFieldController.create_new(SuiviCompetencesItemRapportVO.API_TYPE_ID, field_names<SuiviCompetencesItemRapportVO>().cible, ModuleTableFieldVO.FIELD_TYPE_html, "Cible"),
            ModuleTableFieldController.create_new(SuiviCompetencesItemRapportVO.API_TYPE_ID, field_names<SuiviCompetencesItemRapportVO>().delais, ModuleTableFieldVO.FIELD_TYPE_html, "Délais"),
            ModuleTableFieldController.create_new(SuiviCompetencesItemRapportVO.API_TYPE_ID, field_names<SuiviCompetencesItemRapportVO>().bilan_precedent, ModuleTableFieldVO.FIELD_TYPE_html, "bilan précédent"),
            ModuleTableFieldController.create_new(SuiviCompetencesItemRapportVO.API_TYPE_ID, field_names<SuiviCompetencesItemRapportVO>().indicateur, ModuleTableFieldVO.FIELD_TYPE_int, "Indicateur"),
        ];

        ModuleTableController.create_new(this.name, SuiviCompetencesItemRapportVO, null, "Suivi Competences Item target");

        VersionedVOController.getInstance().registerModuleTable(ModuleTableController.module_tables_by_vo_type[SuiviCompetencesItemRapportVO.API_TYPE_ID]);

        suivi_comp_item_id.set_many_to_one_target_moduletable_name(SuiviCompetencesItemVO.API_TYPE_ID);
        rapport_id.set_many_to_one_target_moduletable_name(SuiviCompetencesRapportVO.API_TYPE_ID);

        ModuleTableController.unique_fields_by_vo_type[SuiviCompetencesItemRapportVO.API_TYPE_ID] = [
            [suivi_comp_item_id, rapport_id]
        ];
    }

    private initializeSuiviCompetencesUserDataRangesVO() {

        let user_id_ranges = ModuleTableFieldController.create_new(SuiviCompetencesUserDataRangesVO.API_TYPE_ID, field_names<SuiviCompetencesUserDataRangesVO>().user_id_ranges, ModuleTableFieldVO.FIELD_TYPE_numrange_array, 'Utilisateurs', true).set_segmentation_type(NumSegment.TYPE_INT);

        let datatable_fields = [
            user_id_ranges,
        ];

        VarsInitController.getInstance().register_var_data(SuiviCompetencesUserDataRangesVO.API_TYPE_ID, SuiviCompetencesUserDataRangesVO, this);
        user_id_ranges.set_many_to_one_target_moduletable_name(UserVO.API_TYPE_ID);
    }

    private initializeSuiviCompetencesRapportGroupeDataRangesVO() {

        let suivi_comp_rapport_id_ranges = ModuleTableFieldController.create_new(SuiviCompetencesRapportGroupeDataRangesVO.API_TYPE_ID, field_names<SuiviCompetencesRapportGroupeDataRangesVO>().suivi_comp_rapport_id_ranges, ModuleTableFieldVO.FIELD_TYPE_numrange_array, 'Rapports', true).set_segmentation_type(NumSegment.TYPE_INT);
        let suivi_comp_groupe_id_ranges = ModuleTableFieldController.create_new(SuiviCompetencesRapportGroupeDataRangesVO.API_TYPE_ID, field_names<SuiviCompetencesRapportGroupeDataRangesVO>().suivi_comp_groupe_id_ranges, ModuleTableFieldVO.FIELD_TYPE_numrange_array, 'TSP Groupes', true).set_segmentation_type(NumSegment.TYPE_INT);

        let datatable_fields = [
            suivi_comp_rapport_id_ranges,
            suivi_comp_groupe_id_ranges,
        ];

        VarsInitController.getInstance().register_var_data(SuiviCompetencesRapportGroupeDataRangesVO.API_TYPE_ID, SuiviCompetencesRapportGroupeDataRangesVO, this);
        suivi_comp_rapport_id_ranges.set_many_to_one_target_moduletable_name(SuiviCompetencesRapportVO.API_TYPE_ID);
        suivi_comp_groupe_id_ranges.set_many_to_one_target_moduletable_name(SuiviCompetencesGroupeVO.API_TYPE_ID);
    }

    private initializeSuiviCompetencesRapportSousGroupeDataRangesVO() {

        let suivi_comp_rapport_id_ranges = ModuleTableFieldController.create_new(SuiviCompetencesRapportSousGroupeDataRangesVO.API_TYPE_ID, field_names<SuiviCompetencesRapportSousGroupeDataRangesVO>().suivi_comp_rapport_id_ranges, ModuleTableFieldVO.FIELD_TYPE_numrange_array, 'Rapports', true).set_segmentation_type(NumSegment.TYPE_INT);
        let suivi_comp_groupe_id_ranges = ModuleTableFieldController.create_new(SuiviCompetencesRapportSousGroupeDataRangesVO.API_TYPE_ID, field_names<SuiviCompetencesRapportSousGroupeDataRangesVO>().suivi_comp_groupe_id_ranges, ModuleTableFieldVO.FIELD_TYPE_numrange_array, 'TSP Groupes', true).set_segmentation_type(NumSegment.TYPE_INT);
        let suivi_comp_sous_groupe_id_ranges = ModuleTableFieldController.create_new(SuiviCompetencesRapportSousGroupeDataRangesVO.API_TYPE_ID, field_names<SuiviCompetencesRapportSousGroupeDataRangesVO>().suivi_comp_sous_groupe_id_ranges, ModuleTableFieldVO.FIELD_TYPE_numrange_array, 'TSP Sous groupes', true).set_segmentation_type(NumSegment.TYPE_INT);

        let datatable_fields = [
            suivi_comp_rapport_id_ranges,
            suivi_comp_groupe_id_ranges,
            suivi_comp_sous_groupe_id_ranges,
        ];

        VarsInitController.getInstance().register_var_data(SuiviCompetencesRapportSousGroupeDataRangesVO.API_TYPE_ID, SuiviCompetencesRapportSousGroupeDataRangesVO, this);
        suivi_comp_rapport_id_ranges.set_many_to_one_target_moduletable_name(SuiviCompetencesRapportVO.API_TYPE_ID);
        suivi_comp_groupe_id_ranges.set_many_to_one_target_moduletable_name(SuiviCompetencesGroupeVO.API_TYPE_ID);
        suivi_comp_sous_groupe_id_ranges.set_many_to_one_target_moduletable_name(SuiviCompetencesSousGroupeVO.API_TYPE_ID);
    }

    private initializeSuiviCompetencesIndicateurVO() {

        ModuleTableFieldController.create_new(SuiviCompetencesIndicateurVO.API_TYPE_ID, field_names<SuiviCompetencesIndicateurVO>().titre, ModuleTableFieldVO.FIELD_TYPE_string, DefaultTranslationVO.create_new({ 'fr-fr': 'Titre' }));
        ModuleTableFieldController.create_new(SuiviCompetencesIndicateurVO.API_TYPE_ID, field_names<SuiviCompetencesIndicateurVO>().description, ModuleTableFieldVO.FIELD_TYPE_string, DefaultTranslationVO.create_new({ 'fr-fr': 'Description' }));

        ModuleTableController.create_new(this.name, SuiviCompetencesIndicateurVO, null, "Suivi Competences Indicateur");
    }

    private initializeSuiviCompetencesRapportItemDataRangesVO() {

        let suivi_comp_rapport_id_ranges = ModuleTableFieldController.create_new(SuiviCompetencesRapportItemDataRangesVO.API_TYPE_ID, field_names<SuiviCompetencesRapportItemDataRangesVO>().suivi_comp_rapport_id_ranges, ModuleTableFieldVO.FIELD_TYPE_numrange_array, 'Rapports', true).set_segmentation_type(NumSegment.TYPE_INT);
        let suivi_comp_item_id_ranges = ModuleTableFieldController.create_new(SuiviCompetencesRapportItemDataRangesVO.API_TYPE_ID, field_names<SuiviCompetencesRapportItemDataRangesVO>().suivi_comp_item_id_ranges, ModuleTableFieldVO.FIELD_TYPE_numrange_array, 'Items', true).set_segmentation_type(NumSegment.TYPE_INT);

        let datatable_fields = [
            suivi_comp_rapport_id_ranges,
            suivi_comp_item_id_ranges,
            ModuleTableFieldController.create_new(SuiviCompetencesRapportItemDataRangesVO.API_TYPE_ID, field_names<SuiviCompetencesRapportItemDataRangesVO>().ts_ranges, ModuleTableFieldVO.FIELD_TYPE_tstzrange_array, 'Dates').set_segmentation_type(TimeSegment.TYPE_DAY),
        ];

        VarsInitController.getInstance().register_var_data(SuiviCompetencesRapportItemDataRangesVO.API_TYPE_ID, SuiviCompetencesRapportItemDataRangesVO, this);
        suivi_comp_rapport_id_ranges.set_many_to_one_target_moduletable_name(SuiviCompetencesRapportVO.API_TYPE_ID);
        suivi_comp_item_id_ranges.set_many_to_one_target_moduletable_name(SuiviCompetencesItemVO.API_TYPE_ID);
    }

    private initializeSuiviCompetencesGroupeUserTsRangesDataRangesVO() {

        let suivi_comp_groupe_id_ranges = ModuleTableFieldController.create_new(SuiviCompetencesGroupeUserTsRangesDataRangesVO.API_TYPE_ID, field_names<SuiviCompetencesGroupeUserTsRangesDataRangesVO>().suivi_comp_groupe_id_ranges, ModuleTableFieldVO.FIELD_TYPE_numrange_array, 'TSP Groupes', true).set_segmentation_type(NumSegment.TYPE_INT);
        let suivi_comp_grille_id_ranges = ModuleTableFieldController.create_new(SuiviCompetencesGroupeUserTsRangesDataRangesVO.API_TYPE_ID, field_names<SuiviCompetencesGroupeUserTsRangesDataRangesVO>().suivi_comp_grille_id_ranges, ModuleTableFieldVO.FIELD_TYPE_numrange_array, 'Grilles', true).set_segmentation_type(NumSegment.TYPE_INT);
        let user_id_ranges = ModuleTableFieldController.create_new(SuiviCompetencesGroupeUserTsRangesDataRangesVO.API_TYPE_ID, field_names<SuiviCompetencesGroupeUserTsRangesDataRangesVO>().user_id_ranges, ModuleTableFieldVO.FIELD_TYPE_numrange_array, 'Utilisateurs', true).set_segmentation_type(NumSegment.TYPE_INT);
        let ts_ranges = ModuleTableFieldController.create_new(SuiviCompetencesGroupeUserTsRangesDataRangesVO.API_TYPE_ID, field_names<SuiviCompetencesGroupeUserTsRangesDataRangesVO>().ts_ranges, ModuleTableFieldVO.FIELD_TYPE_tstzrange_array, 'Dates', true).set_segmentation_type(TimeSegment.TYPE_DAY);

        let datatable_fields = [
            suivi_comp_groupe_id_ranges,
            suivi_comp_grille_id_ranges,
            user_id_ranges,
            ts_ranges,
        ];

        VarsInitController.getInstance().register_var_data(SuiviCompetencesGroupeUserTsRangesDataRangesVO.API_TYPE_ID, SuiviCompetencesGroupeUserTsRangesDataRangesVO, this);

        suivi_comp_groupe_id_ranges.set_many_to_one_target_moduletable_name(SuiviCompetencesGroupeVO.API_TYPE_ID);
        suivi_comp_grille_id_ranges.set_many_to_one_target_moduletable_name(SuiviCompetencesGrilleVO.API_TYPE_ID);
        user_id_ranges.set_many_to_one_target_moduletable_name(UserVO.API_TYPE_ID);
    }

    private initializeSuiviCompetencesSousGroupeUserTsRangesDataRangesVO() {

        let suivi_comp_groupe_id_ranges = ModuleTableFieldController.create_new(SuiviCompetencesSousGroupeUserTsRangesDataRangesVO.API_TYPE_ID, field_names<SuiviCompetencesSousGroupeUserTsRangesDataRangesVO>().suivi_comp_groupe_id_ranges, ModuleTableFieldVO.FIELD_TYPE_numrange_array, 'TSP Groupes', true).set_segmentation_type(NumSegment.TYPE_INT);
        let suivi_comp_sous_groupe_id_ranges = ModuleTableFieldController.create_new(SuiviCompetencesSousGroupeUserTsRangesDataRangesVO.API_TYPE_ID, field_names<SuiviCompetencesSousGroupeUserTsRangesDataRangesVO>().suivi_comp_sous_groupe_id_ranges, ModuleTableFieldVO.FIELD_TYPE_numrange_array, 'TSP Sous groupes', true).set_segmentation_type(NumSegment.TYPE_INT);
        let suivi_comp_grille_id_ranges = ModuleTableFieldController.create_new(SuiviCompetencesSousGroupeUserTsRangesDataRangesVO.API_TYPE_ID, field_names<SuiviCompetencesSousGroupeUserTsRangesDataRangesVO>().suivi_comp_grille_id_ranges, ModuleTableFieldVO.FIELD_TYPE_numrange_array, 'Grilles', true).set_segmentation_type(NumSegment.TYPE_INT);
        let user_id_ranges = ModuleTableFieldController.create_new(SuiviCompetencesSousGroupeUserTsRangesDataRangesVO.API_TYPE_ID, field_names<SuiviCompetencesSousGroupeUserTsRangesDataRangesVO>().user_id_ranges, ModuleTableFieldVO.FIELD_TYPE_numrange_array, 'Utilisateurs', true).set_segmentation_type(NumSegment.TYPE_INT);
        let ts_ranges = ModuleTableFieldController.create_new(SuiviCompetencesSousGroupeUserTsRangesDataRangesVO.API_TYPE_ID, field_names<SuiviCompetencesSousGroupeUserTsRangesDataRangesVO>().ts_ranges, ModuleTableFieldVO.FIELD_TYPE_tstzrange_array, 'Dates', true).set_segmentation_type(TimeSegment.TYPE_DAY);

        let datatable_fields = [
            suivi_comp_groupe_id_ranges,
            suivi_comp_sous_groupe_id_ranges,
            suivi_comp_grille_id_ranges,
            user_id_ranges,
            ts_ranges,
        ];

        VarsInitController.getInstance().register_var_data(SuiviCompetencesSousGroupeUserTsRangesDataRangesVO.API_TYPE_ID, SuiviCompetencesSousGroupeUserTsRangesDataRangesVO, this);
        suivi_comp_groupe_id_ranges.set_many_to_one_target_moduletable_name(SuiviCompetencesGroupeVO.API_TYPE_ID);
        suivi_comp_sous_groupe_id_ranges.set_many_to_one_target_moduletable_name(SuiviCompetencesSousGroupeVO.API_TYPE_ID);
        suivi_comp_grille_id_ranges.set_many_to_one_target_moduletable_name(SuiviCompetencesGrilleVO.API_TYPE_ID);
        user_id_ranges.set_many_to_one_target_moduletable_name(UserVO.API_TYPE_ID);
    }
}