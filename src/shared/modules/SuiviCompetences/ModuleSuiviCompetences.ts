/* istanbul ignore file: WARNING No test on module main file, causes trouble, but NEEDs to externalize any function that can profite a test */

import AccessPolicyTools from '../../tools/AccessPolicyTools';
import { field_names } from '../../tools/ObjectHandler';
import APIControllerWrapper from '../API/APIControllerWrapper';
import PostForGetAPIDefinition from '../API/vos/PostForGetAPIDefinition';
import Number2ParamVO, { Number2ParamVOStatic } from '../API/vos/apis/Number2ParamVO';
import UserVO from '../AccessPolicy/vos/UserVO';
import ModuleDAO from '../DAO/ModuleDAO';
import NumRange from '../DataRender/vos/NumRange';
import NumSegment from '../DataRender/vos/NumSegment';
import TimeSegment from '../DataRender/vos/TimeSegment';
import Module from '../Module';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import TableFieldTypesManager from '../TableFieldTypes/TableFieldTypesManager';
import VOsTypesManager from '../VOsTypesManager';
import VarsInitController from '../Var/VarsInitController';
import VersionedVOController from '../Versioned/VersionedVOController';
import APIArrayNumberParamsVO, { APIArrayNumberParamsVOStatic } from './apis/APIArrayNumberParamsVO';
import SuiviCompetencesGroupeResult from './apis/SuiviCompetencesGroupeResult';
import SuiviCompetencesIndicateurTableFieldTypeController from './fields/indicateur/SuiviCompetencesIndicateurTableFieldTypeController';
import SuiviCompetencesIndicateurVO from './fields/indicateur/vos/SuiviCompetencesIndicateurVO';
import SuiviCompetencesRapportGroupeDataRangesVO from './vars/vos/SuiviCompetencesRapportGroupeDataRangesVO';
import SuiviCompetencesRapportSousGroupeDataRangesVO from './vars/vos/SuiviCompetencesRapportSousGroupeDataRangesVO';
import SuiviCompetencesUserDataRangesVO from './vars/vos/SuiviCompetencesUserDataRangesVO';
import SuiviCompetencesActiviteVO from './vos/SuiviCompetencesActiviteVO';
import SuiviCompetencesGrilleVO from './vos/SuiviCompetencesGrilleVO';
import SuiviCompetencesGroupeVO from './vos/SuiviCompetencesGroupeVO';
import SuiviCompetencesItemRapportVO from './vos/SuiviCompetencesItemRapportVO';
import SuiviCompetencesItemVO from './vos/SuiviCompetencesItemVO';
import SuiviCompetencesRapportVO from './vos/SuiviCompetencesRapportVO';
import SuiviCompetencesSousGroupeVO from './vos/SuiviCompetencesSousGroupeVO';

export default class ModuleSuiviCompetences extends Module {

    public static MODULE_NAME: string = 'SuiviCompetences';

    public static POLICY_GROUP: string = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleSuiviCompetences.MODULE_NAME;
    public static POLICY_BO_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleSuiviCompetences.MODULE_NAME + '.BO_ACCESS';
    public static POLICY_FO_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleSuiviCompetences.MODULE_NAME + '.FO_ACCESS';

    public static APINAME_get_all_suivi_competences_groupe: string = 'get_all_suivi_competences_groupe';
    public static APINAME_duplicate_suivi_competences_rapport: string = 'duplicate_suivi_competences_rapport';

    public static getInstance(): ModuleSuiviCompetences {
        if (!ModuleSuiviCompetences.instance) {
            ModuleSuiviCompetences.instance = new ModuleSuiviCompetences();
        }
        return ModuleSuiviCompetences.instance;
    }

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
        this.fields = [];
        this.datatables = [];

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
    }

    private initializeSuiviCompetencesGroupe() {
        let label_field = new ModuleTableField(field_names<SuiviCompetencesGroupeVO>().name, ModuleTableField.FIELD_TYPE_string, 'Nom du groupe', true);

        let datatable_fields = [
            label_field,
            new ModuleTableField(field_names<SuiviCompetencesGroupeVO>().weight, ModuleTableField.FIELD_TYPE_int, "Poids"),
            new ModuleTableField(field_names<SuiviCompetencesGroupeVO>().ponderation, ModuleTableField.FIELD_TYPE_int, "Pondération"),
            new ModuleTableField(field_names<SuiviCompetencesGroupeVO>().active, ModuleTableField.FIELD_TYPE_boolean, "Actif", false, true, true),
            new ModuleTableField(field_names<SuiviCompetencesGroupeVO>().icon, ModuleTableField.FIELD_TYPE_string, "Icone (font awesome)"),
        ];

        let datatable = new ModuleTable(this, SuiviCompetencesGroupeVO.API_TYPE_ID, () => new SuiviCompetencesGroupeVO(), datatable_fields, label_field, "Suivi Competences Groupe");
        this.datatables.push(datatable);
    }

    private initializeSuiviCompetencesActivite() {
        let label_field = new ModuleTableField(field_names<SuiviCompetencesActiviteVO>().name, ModuleTableField.FIELD_TYPE_string, 'Activité', true);

        let datatable_fields = [
            label_field,
        ];

        let datatable = new ModuleTable(this, SuiviCompetencesActiviteVO.API_TYPE_ID, () => new SuiviCompetencesActiviteVO(), datatable_fields, label_field, "Suivi Compétences Activités");
        this.datatables.push(datatable);
    }

    private initializeSuiviCompetencesSousGroupe() {
        let label_field = new ModuleTableField(field_names<SuiviCompetencesSousGroupeVO>().name, ModuleTableField.FIELD_TYPE_string, 'Nom du sous groupe', true);
        let groupe_id = new ModuleTableField(field_names<SuiviCompetencesSousGroupeVO>().groupe_id, ModuleTableField.FIELD_TYPE_foreign_key, 'Groupe', true);

        let datatable_fields = [
            label_field,
            groupe_id,
            new ModuleTableField(field_names<SuiviCompetencesSousGroupeVO>().weight, ModuleTableField.FIELD_TYPE_int, "Poids"),
            new ModuleTableField(field_names<SuiviCompetencesSousGroupeVO>().active, ModuleTableField.FIELD_TYPE_boolean, "Actif", false, true, true),
            new ModuleTableField(field_names<SuiviCompetencesSousGroupeVO>().ponderation, ModuleTableField.FIELD_TYPE_int, "Pondération"),
        ];

        let datatable = new ModuleTable(this, SuiviCompetencesSousGroupeVO.API_TYPE_ID, () => new SuiviCompetencesSousGroupeVO(), datatable_fields, label_field, "Suivi Competences Sous groupe");
        this.datatables.push(datatable);

        groupe_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[SuiviCompetencesGroupeVO.API_TYPE_ID]);
    }

    private initializeSuiviCompetencesItem() {
        let label_field = new ModuleTableField(field_names<SuiviCompetencesItemVO>().name, ModuleTableField.FIELD_TYPE_string, "Nom de l'item", true);
        let groupe_id = new ModuleTableField(field_names<SuiviCompetencesItemVO>().groupe_id, ModuleTableField.FIELD_TYPE_foreign_key, 'Groupe', true);
        let sous_groupe_id = new ModuleTableField(field_names<SuiviCompetencesItemVO>().sous_groupe_id, ModuleTableField.FIELD_TYPE_foreign_key, 'Sous Groupe');
        let suivi_comp_activite_id = new ModuleTableField(field_names<SuiviCompetencesItemVO>().suivi_comp_activite_id, ModuleTableField.FIELD_TYPE_foreign_key, 'Activité');

        let datatable_fields = [
            label_field,
            new ModuleTableField(field_names<SuiviCompetencesItemVO>().weight, ModuleTableField.FIELD_TYPE_int, "Poids"),
            new ModuleTableField(field_names<SuiviCompetencesItemVO>().indicateurs, SuiviCompetencesIndicateurVO.API_TYPE_ID, "Indicateurs"),
            new ModuleTableField(field_names<SuiviCompetencesItemVO>().kpis, ModuleTableField.FIELD_TYPE_string, "KPIS"),
            new ModuleTableField(field_names<SuiviCompetencesItemVO>().popup, ModuleTableField.FIELD_TYPE_string, "Texte Popup"),
            new ModuleTableField(field_names<SuiviCompetencesItemVO>().active, ModuleTableField.FIELD_TYPE_boolean, "Actif", false, true, true),
            groupe_id,
            sous_groupe_id,
            suivi_comp_activite_id,
        ];

        let datatable = new ModuleTable(this, SuiviCompetencesItemVO.API_TYPE_ID, () => new SuiviCompetencesItemVO(), datatable_fields, label_field, "Suivi Competences Item");
        this.datatables.push(datatable);

        groupe_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[SuiviCompetencesGroupeVO.API_TYPE_ID]);
        sous_groupe_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[SuiviCompetencesSousGroupeVO.API_TYPE_ID]);
        suivi_comp_activite_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[SuiviCompetencesActiviteVO.API_TYPE_ID]);

        TableFieldTypesManager.getInstance().registerTableFieldTypeController(SuiviCompetencesIndicateurTableFieldTypeController.getInstance());
    }

    private initializeSuiviCompetencesGrille() {
        let name = new ModuleTableField(field_names<SuiviCompetencesGrilleVO>().name, ModuleTableField.FIELD_TYPE_string, 'Nom', true);
        let suivi_comp_item_id_ranges = new ModuleTableField(field_names<SuiviCompetencesGrilleVO>().suivi_comp_item_id_ranges, ModuleTableField.FIELD_TYPE_refrange_array, 'Items');
        let suivi_comp_activite_id = new ModuleTableField(field_names<SuiviCompetencesGrilleVO>().suivi_comp_activite_id, ModuleTableField.FIELD_TYPE_foreign_key, 'Activité');

        let datatable_fields = [
            name,
            suivi_comp_item_id_ranges,
            suivi_comp_activite_id,
        ];

        let datatable = new ModuleTable(this, SuiviCompetencesGrilleVO.API_TYPE_ID, () => new SuiviCompetencesGrilleVO(), datatable_fields, name, "Suivi Competences Grille");
        this.datatables.push(datatable);

        suivi_comp_item_id_ranges.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[SuiviCompetencesItemVO.API_TYPE_ID]);
        suivi_comp_activite_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[SuiviCompetencesActiviteVO.API_TYPE_ID]);

        VersionedVOController.getInstance().registerModuleTable(VOsTypesManager.moduleTables_by_voType[SuiviCompetencesGrilleVO.API_TYPE_ID]);
    }

    private initializeSuiviCompetencesRapport() {
        let user_id = new ModuleTableField(field_names<SuiviCompetencesRapportVO>().user_id, ModuleTableField.FIELD_TYPE_foreign_key, 'Utilisateur', true);
        let suivi_comp_grille_id = new ModuleTableField(field_names<SuiviCompetencesRapportVO>().suivi_comp_grille_id, ModuleTableField.FIELD_TYPE_foreign_key, 'Grille', true);
        let name = new ModuleTableField(field_names<SuiviCompetencesRapportVO>().name, ModuleTableField.FIELD_TYPE_string, 'Nom').hide_from_datatable();

        let datatable_fields = [
            name,
            user_id,
            suivi_comp_grille_id,
            new ModuleTableField(field_names<SuiviCompetencesRapportVO>().date, ModuleTableField.FIELD_TYPE_tstz, "Date du rapport", true).set_segmentation_type(TimeSegment.TYPE_DAY),
            new ModuleTableField(field_names<SuiviCompetencesRapportVO>().points_cles, ModuleTableField.FIELD_TYPE_html, "Points clés").hide_from_datatable(),
            new ModuleTableField(field_names<SuiviCompetencesRapportVO>().objectif_prochaine_visite, ModuleTableField.FIELD_TYPE_html, "Objectifs de la prochaine visite").hide_from_datatable(),
        ];

        let datatable = new ModuleTable(this, SuiviCompetencesRapportVO.API_TYPE_ID, () => new SuiviCompetencesRapportVO(), datatable_fields, name, "Suivi Competences Rapport");
        this.datatables.push(datatable);

        VersionedVOController.getInstance().registerModuleTable(VOsTypesManager.moduleTables_by_voType[SuiviCompetencesRapportVO.API_TYPE_ID]);

        user_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[UserVO.API_TYPE_ID]);
        suivi_comp_grille_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[SuiviCompetencesGrilleVO.API_TYPE_ID]);
    }

    private initializeSuiviCompetencesItemRapport() {
        let suivi_comp_item_id = new ModuleTableField(field_names<SuiviCompetencesItemRapportVO>().suivi_comp_item_id, ModuleTableField.FIELD_TYPE_foreign_key, 'Suivi Competences Item', true);
        let rapport_id = new ModuleTableField(field_names<SuiviCompetencesItemRapportVO>().rapport_id, ModuleTableField.FIELD_TYPE_foreign_key, 'Rapport', true);

        let datatable_fields = [
            suivi_comp_item_id,
            rapport_id,
            new ModuleTableField(field_names<SuiviCompetencesItemRapportVO>().plan_action, ModuleTableField.FIELD_TYPE_html, "Plan d'action"),
            new ModuleTableField(field_names<SuiviCompetencesItemRapportVO>().etat_des_lieux, ModuleTableField.FIELD_TYPE_html, "Etat des lieux"),
            new ModuleTableField(field_names<SuiviCompetencesItemRapportVO>().indicateur, ModuleTableField.FIELD_TYPE_int, "Indicateur"),
        ];

        let datatable = new ModuleTable(this, SuiviCompetencesItemRapportVO.API_TYPE_ID, () => new SuiviCompetencesItemRapportVO(), datatable_fields, null, "Suivi Competences Item target");
        this.datatables.push(datatable);

        VersionedVOController.getInstance().registerModuleTable(VOsTypesManager.moduleTables_by_voType[SuiviCompetencesItemRapportVO.API_TYPE_ID]);

        suivi_comp_item_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[SuiviCompetencesItemVO.API_TYPE_ID]);
        rapport_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[SuiviCompetencesRapportVO.API_TYPE_ID]);

        datatable.uniq_indexes.push([
            suivi_comp_item_id,
            rapport_id
        ]);
    }

    private initializeSuiviCompetencesUserDataRangesVO() {

        let user_id_ranges = new ModuleTableField(field_names<SuiviCompetencesUserDataRangesVO>().user_id_ranges, ModuleTableField.FIELD_TYPE_numrange_array, 'Utilisateurs', true).set_segmentation_type(NumSegment.TYPE_INT);

        let datatable_fields = [
            user_id_ranges,
        ];

        let datatable: ModuleTable<any> = VarsInitController.getInstance().register_var_data(SuiviCompetencesUserDataRangesVO.API_TYPE_ID, () => new SuiviCompetencesUserDataRangesVO(), datatable_fields, this);
        user_id_ranges.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[UserVO.API_TYPE_ID]);
    }

    private initializeSuiviCompetencesRapportGroupeDataRangesVO() {

        let suivi_comp_rapport_id_ranges = new ModuleTableField(field_names<SuiviCompetencesRapportGroupeDataRangesVO>().suivi_comp_rapport_id_ranges, ModuleTableField.FIELD_TYPE_numrange_array, 'Rapports', true).set_segmentation_type(NumSegment.TYPE_INT);
        let suivi_comp_groupe_id_ranges = new ModuleTableField(field_names<SuiviCompetencesRapportGroupeDataRangesVO>().suivi_comp_groupe_id_ranges, ModuleTableField.FIELD_TYPE_numrange_array, 'TSP Groupes', true).set_segmentation_type(NumSegment.TYPE_INT);

        let datatable_fields = [
            suivi_comp_rapport_id_ranges,
            suivi_comp_groupe_id_ranges,
        ];

        let datatable: ModuleTable<any> = VarsInitController.getInstance().register_var_data(SuiviCompetencesRapportGroupeDataRangesVO.API_TYPE_ID, () => new SuiviCompetencesRapportGroupeDataRangesVO(), datatable_fields, this);
        suivi_comp_rapport_id_ranges.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[SuiviCompetencesRapportVO.API_TYPE_ID]);
        suivi_comp_groupe_id_ranges.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[SuiviCompetencesGroupeVO.API_TYPE_ID]);
    }

    private initializeSuiviCompetencesRapportSousGroupeDataRangesVO() {

        let suivi_comp_rapport_id_ranges = new ModuleTableField(field_names<SuiviCompetencesRapportSousGroupeDataRangesVO>().suivi_comp_rapport_id_ranges, ModuleTableField.FIELD_TYPE_numrange_array, 'Rapports', true).set_segmentation_type(NumSegment.TYPE_INT);
        let suivi_comp_groupe_id_ranges = new ModuleTableField(field_names<SuiviCompetencesRapportSousGroupeDataRangesVO>().suivi_comp_groupe_id_ranges, ModuleTableField.FIELD_TYPE_numrange_array, 'TSP Groupes', true).set_segmentation_type(NumSegment.TYPE_INT);
        let suivi_comp_sous_groupe_id_ranges = new ModuleTableField(field_names<SuiviCompetencesRapportSousGroupeDataRangesVO>().suivi_comp_sous_groupe_id_ranges, ModuleTableField.FIELD_TYPE_numrange_array, 'TSP Sous groupes', true).set_segmentation_type(NumSegment.TYPE_INT);

        let datatable_fields = [
            suivi_comp_rapport_id_ranges,
            suivi_comp_groupe_id_ranges,
            suivi_comp_sous_groupe_id_ranges,
        ];

        let datatable: ModuleTable<any> = VarsInitController.getInstance().register_var_data(SuiviCompetencesRapportSousGroupeDataRangesVO.API_TYPE_ID, () => new SuiviCompetencesRapportSousGroupeDataRangesVO(), datatable_fields, this);
        suivi_comp_rapport_id_ranges.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[SuiviCompetencesRapportVO.API_TYPE_ID]);
        suivi_comp_groupe_id_ranges.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[SuiviCompetencesGroupeVO.API_TYPE_ID]);
        suivi_comp_sous_groupe_id_ranges.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[SuiviCompetencesSousGroupeVO.API_TYPE_ID]);
    }
}