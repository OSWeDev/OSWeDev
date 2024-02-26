import AccessPolicyTools from '../../tools/AccessPolicyTools';
import { field_names } from '../../tools/ObjectHandler';
import APIControllerWrapper from '../API/APIControllerWrapper';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import NumSegment from '../DataRender/vos/NumSegment';
import TimeSegment from '../DataRender/vos/TimeSegment';
import Module from '../Module';
import ModuleTableVO from '../ModuleTableVO';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../ModuleTableFieldVO';
import VarsInitController from '../Var/VarsInitController';
import VersionedVOController from '../Versioned/VersionedVOController';
import VOsTypesManager from '../VO/manager/VOsTypesManager';
import RegisterClientStatsParamVO, { RegisterClientStatsParamVOStatic } from './params/RegisterClientStatsParamVO';
import StatsGroupSecDataRangesVO from './vars/vos/StatsGroupDayDataRangesVO';
import StatClientWrapperVO from './vos/StatClientWrapperVO';
import StatsCategoryVO from './vos/StatsCategoryVO';
import StatsEventVO from './vos/StatsEventVO';
import StatsGroupVO from './vos/StatsGroupVO';
import StatsSubCategoryVO from './vos/StatsSubCategoryVO';
import StatsThreadVO from './vos/StatsThreadVO';
import StatsTypeVO from './vos/StatsTypeVO';
import StatVO from './vos/StatVO';


export default class ModuleStats extends Module {

    public static MODULE_NAME: string = 'Stats';

    public static POLICY_GROUP: string = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleStats.MODULE_NAME;
    public static POLICY_BO_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleStats.MODULE_NAME + '.BO_ACCESS';
    public static POLICY_FO_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleStats.MODULE_NAME + '.FO_ACCESS';

    public static APINAME_register_client_stats: string = "register_client_stats";

    // istanbul ignore next: nothing to test
    public static getInstance(): ModuleStats {
        if (!ModuleStats.instance) {
            ModuleStats.instance = new ModuleStats();
        }
        return ModuleStats.instance;
    }

    private static instance: ModuleStats = null;

    public register_client_stats: (
        stats_client: StatClientWrapperVO[],
        client_timestamp_s: number, // this is the timestamp of the client at the time of calling the API, to be able to compare with the server timestamp
    ) => Promise<any> = APIControllerWrapper.sah(ModuleStats.APINAME_register_client_stats);

    private constructor() {

        super("stats", ModuleStats.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    public initialize() {

        this.initializeStatsThreadVO();
        this.initializeStatsCategoryVO();
        this.initializeStatsSubCategoryVO();
        this.initializeStatsEventVO();
        this.initializeStatsTypeVO();

        // this.initializeStatsGroupCacheLinkVO();
        // this.initializeStatsSubCategoryCacheLinkVO();
        // this.initializeStatsEventCacheLinkVO();
        this.initializeStatsGroupVO();
        this.initializeStatVO();
        this.initializeStatClientWrapperVO();
        this.initializeStatsGroupSecDataRangesVO();
    }

    public registerApis() {

        APIControllerWrapper.registerApi(new PostAPIDefinition<RegisterClientStatsParamVO, any>(
            null,
            ModuleStats.APINAME_register_client_stats,
            [], // FIXME : toute la limite de ce système est là : on ne peut pas indiquer les modifs en base quand tout est throttle derrière, donc on invalide rien pourtant ça crée des stats...
            RegisterClientStatsParamVOStatic
        ));
    }

    private initializeStatsGroupSecDataRangesVO() {
        let stats_groupe_id_ranges = ModuleTableFieldController.create_new(StatsGroupSecDataRangesVO.API_TYPE_ID, field_names<StatsGroupSecDataRangesVO>().stats_groupe_id_ranges, ModuleTableFieldVO.FIELD_TYPE_numrange_array, 'Groupe de stats', true).set_segmentation_type(NumSegment.TYPE_INT);

        let datatable_fields = [
            stats_groupe_id_ranges,
            ModuleTableFieldController.create_new(StatsGroupSecDataRangesVO.API_TYPE_ID, field_names<StatsGroupSecDataRangesVO>().ts_ranges, ModuleTableFieldVO.FIELD_TYPE_tstzrange_array, 'Dates').set_segmentation_type(TimeSegment.TYPE_SECOND).set_format_localized_time(false),
        ];

        VarsInitController.getInstance().register_var_data(StatsGroupSecDataRangesVO.API_TYPE_ID, () => new StatsGroupSecDataRangesVO(), datatable_fields, this);
        stats_groupe_id_ranges.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[StatsGroupVO.API_TYPE_ID]);
    }

    private initializeStatVO() {
        let stat_group_id = ModuleTableFieldController.create_new(StatVO.API_TYPE_ID, field_names<StatVO>().stat_group_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Groupe de stats', true);

        let fields = [
            stat_group_id,
            ModuleTableFieldController.create_new(StatVO.API_TYPE_ID, field_names<StatVO>().value, ModuleTableFieldVO.FIELD_TYPE_float, 'Valeur', true, true, 0),
            ModuleTableFieldController.create_new(StatVO.API_TYPE_ID, field_names<StatVO>().timestamp_s, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Timestamp (sec)', true, true, 0).set_segmentation_type(TimeSegment.TYPE_SECOND).set_format_localized_time(true).index(),
        ];

        let table = new ModuleTableVO(this, StatVO.API_TYPE_ID, () => new StatVO(), fields, null, 'Stats');
        table.segment_on_field('stat_group_id', NumSegment.TYPE_INT);
        this.datatables.push(table);
        stat_group_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[StatsGroupVO.API_TYPE_ID]);
    }

    private initializeStatClientWrapperVO() {

        let fields = [
            ModuleTableFieldController.create_new(StatClientWrapperVO.API_TYPE_ID, field_names<StatClientWrapperVO>().value, ModuleTableFieldVO.FIELD_TYPE_float, 'Valeur', true, true, 0),
            ModuleTableFieldController.create_new(StatClientWrapperVO.API_TYPE_ID, field_names<StatClientWrapperVO>().timestamp_s, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Timestamp (sec)', true, true, 0).set_segmentation_type(TimeSegment.TYPE_SECOND).set_format_localized_time(true).index(),

            ModuleTableFieldController.create_new(StatClientWrapperVO.API_TYPE_ID, field_names<StatClientWrapperVO>().tmp_category_name, ModuleTableFieldVO.FIELD_TYPE_string, 'Catégorie - temp', false),
            ModuleTableFieldController.create_new(StatClientWrapperVO.API_TYPE_ID, field_names<StatClientWrapperVO>().tmp_sub_category_name, ModuleTableFieldVO.FIELD_TYPE_string, 'Sous-catégorie - temp', false),
            ModuleTableFieldController.create_new(StatClientWrapperVO.API_TYPE_ID, field_names<StatClientWrapperVO>().tmp_event_name, ModuleTableFieldVO.FIELD_TYPE_string, 'Evènement - temp', false),
            ModuleTableFieldController.create_new(StatClientWrapperVO.API_TYPE_ID, field_names<StatClientWrapperVO>().tmp_stat_type_name, ModuleTableFieldVO.FIELD_TYPE_string, 'Type - temp', false),
            ModuleTableFieldController.create_new(StatClientWrapperVO.API_TYPE_ID, field_names<StatClientWrapperVO>().tmp_thread_name, ModuleTableFieldVO.FIELD_TYPE_string, 'Thread - temp', false),

            ModuleTableFieldController.create_new(StatClientWrapperVO.API_TYPE_ID, field_names<StatClientWrapperVO>().stats_aggregator, ModuleTableFieldVO.FIELD_TYPE_enum, 'Aggrégateur', true, true, StatVO.AGGREGATOR_MEAN).setEnumValues(StatVO.AGGREGATOR_LABELS),
            ModuleTableFieldController.create_new(StatClientWrapperVO.API_TYPE_ID, field_names<StatClientWrapperVO>().stats_aggregator_min_segment_type, ModuleTableFieldVO.FIELD_TYPE_enum, 'Segmentation minimale', true, true, TimeSegment.TYPE_SECOND).setEnumValues(TimeSegment.TYPE_NAMES_ENUM),
        ];

        let table = new ModuleTableVO(this, StatClientWrapperVO.API_TYPE_ID, () => new StatClientWrapperVO(), fields, null, 'Stats - Client side wrapper');
        this.datatables.push(table);
    }

    private initializeStatsGroupVO() {

        let name_field = ModuleTableFieldController.create_new(StatsGroupVO.API_TYPE_ID, field_names<StatsGroupVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom du groupe', true).unique(true);

        let category_id = ModuleTableFieldController.create_new(StatsGroupVO.API_TYPE_ID, field_names<StatsGroupVO>().category_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Catégorie', false);
        let sub_category_id = ModuleTableFieldController.create_new(StatsGroupVO.API_TYPE_ID, field_names<StatsGroupVO>().sub_category_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Sous-catégorie', false);
        let event_id = ModuleTableFieldController.create_new(StatsGroupVO.API_TYPE_ID, field_names<StatsGroupVO>().event_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Evènement', false);
        let stat_type_id = ModuleTableFieldController.create_new(StatsGroupVO.API_TYPE_ID, field_names<StatsGroupVO>().stat_type_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Type', false);
        let thread_id = ModuleTableFieldController.create_new(StatsGroupVO.API_TYPE_ID, field_names<StatsGroupVO>().thread_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Thread', false);

        let fields = [
            name_field,

            category_id,
            sub_category_id,
            event_id,
            stat_type_id,
            thread_id,

            ModuleTableFieldController.create_new(StatsGroupVO.API_TYPE_ID, field_names<StatsGroupVO>().category_name, ModuleTableFieldVO.FIELD_TYPE_string, 'Catégorie', false),
            ModuleTableFieldController.create_new(StatsGroupVO.API_TYPE_ID, field_names<StatsGroupVO>().sub_category_name, ModuleTableFieldVO.FIELD_TYPE_string, 'Sous-catégorie', false),
            ModuleTableFieldController.create_new(StatsGroupVO.API_TYPE_ID, field_names<StatsGroupVO>().event_name, ModuleTableFieldVO.FIELD_TYPE_string, 'Evènement', false),
            ModuleTableFieldController.create_new(StatsGroupVO.API_TYPE_ID, field_names<StatsGroupVO>().stat_type_name, ModuleTableFieldVO.FIELD_TYPE_string, 'Type', false),
            ModuleTableFieldController.create_new(StatsGroupVO.API_TYPE_ID, field_names<StatsGroupVO>().thread_name, ModuleTableFieldVO.FIELD_TYPE_string, 'Thread', false),

            ModuleTableFieldController.create_new(StatsGroupVO.API_TYPE_ID, field_names<StatsGroupVO>().stats_aggregator, ModuleTableFieldVO.FIELD_TYPE_enum, 'Aggrégateur', true, true, StatVO.AGGREGATOR_MEAN).setEnumValues(StatVO.AGGREGATOR_LABELS).index(),
            ModuleTableFieldController.create_new(StatsGroupVO.API_TYPE_ID, field_names<StatsGroupVO>().stats_aggregator_min_segment_type, ModuleTableFieldVO.FIELD_TYPE_enum, 'Segmentation minimale', true, true, TimeSegment.TYPE_SECOND),
        ];

        let table = new ModuleTableVO(this, StatsGroupVO.API_TYPE_ID, () => new StatsGroupVO(), fields, name_field, 'Groupes de stats');
        this.datatables.push(table);
        VersionedVOController.getInstance().registerModuleTable(table);
        category_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[StatsCategoryVO.API_TYPE_ID]);
        sub_category_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[StatsSubCategoryVO.API_TYPE_ID]);
        event_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[StatsEventVO.API_TYPE_ID]);
        stat_type_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[StatsTypeVO.API_TYPE_ID]);
        thread_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[StatsThreadVO.API_TYPE_ID]);
    }

    // private initializeStatsGroupCacheLinkVO() {

    //     let name_field = ModuleTableFieldController.create_new(SendInBlueVO.API_TYPE_ID, field_names<SendInBlueVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom du groupe - cache', true).unique(true);

    //     let fields = [
    //         name_field,

    //         ModuleTableFieldController.create_new(SendInBlueVO.API_TYPE_ID, field_names<SendInBlueVO>().category_name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom de la catégorie', true),
    //         ModuleTableFieldController.create_new(SendInBlueVO.API_TYPE_ID, field_names<SendInBlueVO>().sub_category_name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom de la sous-catégorie', true),
    //         ModuleTableFieldController.create_new(SendInBlueVO.API_TYPE_ID, field_names<SendInBlueVO>().event_name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom de l\'évènement', true),
    //         ModuleTableFieldController.create_new(SendInBlueVO.API_TYPE_ID, field_names<SendInBlueVO>().thread_name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom du thread', true),

    //         ModuleTableFieldController.create_new(SendInBlueVO.API_TYPE_ID, field_names<SendInBlueVO>().stats_aggregator, ModuleTableFieldVO.FIELD_TYPE_enum, 'Aggrégateur', true, true, StatVO.AGGREGATOR_MEAN).setEnumValues(StatVO.AGGREGATOR_LABELS),
    //         ModuleTableFieldController.create_new(SendInBlueVO.API_TYPE_ID, field_names<SendInBlueVO>().stats_aggregator_min_segment_type, ModuleTableFieldVO.FIELD_TYPE_enum, 'Segmentation minimale', true, true, TimeSegment.TYPE_SECOND),
    //     ];

    //     let table = new ModuleTableVO(this, StatsGroupCacheLinkVO.API_TYPE_ID, () => new StatsGroupCacheLinkVO(), fields, name_field, 'Groupes de stats - cache');
    //     this.datatables.push(table);
    //     VersionedVOController.getInstance().registerModuleTable(table);
    // }

    private initializeStatsCategoryVO() {

        let name_field = ModuleTableFieldController.create_new(StatsCategoryVO.API_TYPE_ID, field_names<StatsCategoryVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'Catégorie', true).unique(true);
        let fields = [
            name_field,
        ];

        let table = new ModuleTableVO(this, StatsCategoryVO.API_TYPE_ID, () => new StatsCategoryVO(), fields, name_field, 'Catégories de stats');
        this.datatables.push(table);
        VersionedVOController.getInstance().registerModuleTable(table);
    }

    private initializeStatsSubCategoryVO() {

        let name_field = ModuleTableFieldController.create_new(StatsSubCategoryVO.API_TYPE_ID, field_names<StatsSubCategoryVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'Sous-catégorie', true).index();
        let category_id = ModuleTableFieldController.create_new(StatsSubCategoryVO.API_TYPE_ID, field_names<StatsSubCategoryVO>().category_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Catégorie', true);
        let fields = [
            name_field,
            category_id,
        ];

        let table = new ModuleTableVO(this, StatsSubCategoryVO.API_TYPE_ID, () => new StatsSubCategoryVO(), fields, name_field, 'Sous-catégories de stats');
        this.datatables.push(table);
        VersionedVOController.getInstance().registerModuleTable(table);
        category_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[StatsCategoryVO.API_TYPE_ID]);
    }

    // private initializeStatsSubCategoryCacheLinkVO() {

    //     let name_field = ModuleTableFieldController.create_new(SendInBlueVO.API_TYPE_ID, field_names<SendInBlueVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'Sous-catégorie - cache', true).index();

    //     let fields = [
    //         name_field,
    //         ModuleTableFieldController.create_new(SendInBlueVO.API_TYPE_ID, field_names<SendInBlueVO>().category_name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom de la catégorie', true),
    //     ];

    //     let table = new ModuleTableVO(this, StatsSubCategoryCacheLinkVO.API_TYPE_ID, () => new StatsSubCategoryCacheLinkVO(), fields, name_field, 'Sous-catégories de stats - cache');
    //     this.datatables.push(table);
    //     VersionedVOController.getInstance().registerModuleTable(table);
    // }

    private initializeStatsTypeVO() {

        let name_field = ModuleTableFieldController.create_new(StatsTypeVO.API_TYPE_ID, field_names<StatsTypeVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'Type de stat', true).index();

        let fields = [
            name_field
        ];

        let table = new ModuleTableVO(this, StatsTypeVO.API_TYPE_ID, () => new StatsTypeVO(), fields, name_field, 'Types de stats');
        this.datatables.push(table);
        VersionedVOController.getInstance().registerModuleTable(table);
    }

    private initializeStatsEventVO() {

        let name_field = ModuleTableFieldController.create_new(StatsEventVO.API_TYPE_ID, field_names<StatsEventVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'Evènement', true).index();
        let sub_category_id = ModuleTableFieldController.create_new(StatsEventVO.API_TYPE_ID, field_names<StatsEventVO>().sub_category_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Sous-catégorie', true);

        let fields = [
            name_field,
            sub_category_id
        ];

        let table = new ModuleTableVO(this, StatsEventVO.API_TYPE_ID, () => new StatsEventVO(), fields, name_field, 'Evènements de stats');
        this.datatables.push(table);
        VersionedVOController.getInstance().registerModuleTable(table);
        sub_category_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[StatsSubCategoryVO.API_TYPE_ID]);
    }

    // private initializeStatsEventCacheLinkVO() {

    //     let name_field = ModuleTableFieldController.create_new(SendInBlueVO.API_TYPE_ID, field_names<SendInBlueVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'Evènement - cache', true).index();

    //     let fields = [
    //         name_field,
    //         ModuleTableFieldController.create_new(SendInBlueVO.API_TYPE_ID, field_names<SendInBlueVO>().sub_category_name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom de la sous-catégorie', true),
    //     ];

    //     let table = new ModuleTableVO(this, StatsEventCacheLinkVO.API_TYPE_ID, () => new StatsEventCacheLinkVO(), fields, name_field, 'Evènements de stats - cache');
    //     this.datatables.push(table);
    //     VersionedVOController.getInstance().registerModuleTable(table);
    // }


    private initializeStatsThreadVO() {

        let name_field = ModuleTableFieldController.create_new(StatsThreadVO.API_TYPE_ID, field_names<StatsThreadVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom principal du Thread', true).unique(true);

        let fields = [
            name_field,
            ModuleTableFieldController.create_new(StatsThreadVO.API_TYPE_ID, field_names<StatsThreadVO>().aliases, ModuleTableFieldVO.FIELD_TYPE_string_array, 'Alias', false)
        ];

        let table = new ModuleTableVO(this, StatsThreadVO.API_TYPE_ID, () => new StatsThreadVO(), fields, name_field, 'Threads');
        this.datatables.push(table);
        VersionedVOController.getInstance().registerModuleTable(table);
    }

}