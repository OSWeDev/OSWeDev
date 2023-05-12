import AccessPolicyTools from '../../tools/AccessPolicyTools';
import NumSegment from '../DataRender/vos/NumSegment';
import TimeSegment from '../DataRender/vos/TimeSegment';
import Module from '../Module';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import VarsInitController from '../Var/VarsInitController';
import VersionedVOController from '../Versioned/VersionedVOController';
import VOsTypesManager from '../VOsTypesManager';
import StatsGroupSecDataRangesVO from './vars/vos/StatsGroupDayDataRangesVO';
import StatsCategoryVO from './vos/StatsCategoryVO';
import StatsEventCacheLinkVO from './vos/StatsEventCacheLinkVO';
import StatsEventVO from './vos/StatsEventVO';
import StatsGroupCacheLinkVO from './vos/StatsGroupCacheLinkVO';
import StatsGroupVO from './vos/StatsGroupVO';
import StatsSubCategoryCacheLinkVO from './vos/StatsSubCategoryCacheLinkVO';
import StatsSubCategoryVO from './vos/StatsSubCategoryVO';
import StatsThreadVO from './vos/StatsThreadVO';
import StatsTypeVO from './vos/StatsTypeVO';
import StatVO from './vos/StatVO';


export default class ModuleStats extends Module {

    public static MODULE_NAME: string = 'Stats';

    public static POLICY_GROUP: string = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleStats.MODULE_NAME;
    public static POLICY_BO_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleStats.MODULE_NAME + '.BO_ACCESS';
    public static POLICY_FO_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleStats.MODULE_NAME + '.FO_ACCESS';

    public static getInstance(): ModuleStats {
        if (!ModuleStats.instance) {
            ModuleStats.instance = new ModuleStats();
        }
        return ModuleStats.instance;
    }

    private static instance: ModuleStats = null;

    private constructor() {

        super("stats", ModuleStats.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    public registerApis() {
    }

    public initialize() {
        this.fields = [];
        this.datatables = [];

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
        this.initializeStatsGroupSecDataRangesVO();
    }

    private initializeStatsGroupSecDataRangesVO() {
        let stats_groupe_id_ranges = new ModuleTableField('stats_groupe_id_ranges', ModuleTableField.FIELD_TYPE_numrange_array, 'Groupe de stats', true).set_segmentation_type(NumSegment.TYPE_INT);

        let datatable_fields = [
            stats_groupe_id_ranges,
            new ModuleTableField('ts_ranges', ModuleTableField.FIELD_TYPE_tstzrange_array, 'Dates').set_segmentation_type(TimeSegment.TYPE_SECOND).set_format_localized_time(false),
        ];

        VarsInitController.getInstance().register_var_data(StatsGroupSecDataRangesVO.API_TYPE_ID, () => new StatsGroupSecDataRangesVO(), datatable_fields, this);
        stats_groupe_id_ranges.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[StatsGroupVO.API_TYPE_ID]);
    }

    private initializeStatVO() {
        let stat_group_id = new ModuleTableField('stat_group_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Groupe de stats', true);

        let fields = [
            stat_group_id,
            new ModuleTableField('value', ModuleTableField.FIELD_TYPE_float, 'Valeur', true, true, 0),
            new ModuleTableField('timestamp_s', ModuleTableField.FIELD_TYPE_tstz, 'Timestamp (sec)', true, true, 0).set_segmentation_type(TimeSegment.TYPE_SECOND).set_format_localized_time(true),
        ];

        let table = new ModuleTable(this, StatVO.API_TYPE_ID, () => new StatVO(), fields, null, 'Stats');
        table.segment_on_field('stat_group_id', NumSegment.TYPE_INT);
        this.datatables.push(table);
        stat_group_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[StatsGroupVO.API_TYPE_ID]);
    }

    private initializeStatsGroupVO() {

        let name_field = new ModuleTableField('name', ModuleTableField.FIELD_TYPE_string, 'Nom du groupe', true).unique(true);

        let category_id = new ModuleTableField('category_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Catégorie', false);
        let sub_category_id = new ModuleTableField('sub_category_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Sous-catégorie', false);
        let event_id = new ModuleTableField('event_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Evènement', false);
        let stat_type_id = new ModuleTableField('stat_type_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Type', false);
        let thread_id = new ModuleTableField('thread_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Thread', false);

        let fields = [
            name_field,

            category_id,
            sub_category_id,
            event_id,
            stat_type_id,
            thread_id,

            new ModuleTableField('tmp_category_name', ModuleTableField.FIELD_TYPE_string, 'Catégorie - temp', false),
            new ModuleTableField('tmp_sub_category_name', ModuleTableField.FIELD_TYPE_string, 'Sous-catégorie - temp', false),
            new ModuleTableField('tmp_event_name', ModuleTableField.FIELD_TYPE_string, 'Evènement - temp', false),
            new ModuleTableField('tmp_stat_type_name', ModuleTableField.FIELD_TYPE_string, 'Type - temp', false),
            new ModuleTableField('tmp_thread_name', ModuleTableField.FIELD_TYPE_string, 'Thread - temp', false),

            new ModuleTableField('stats_aggregator', ModuleTableField.FIELD_TYPE_enum, 'Aggrégateur', true, true, StatVO.AGGREGATOR_MEAN).setEnumValues(StatVO.AGGREGATOR_LABELS),
            new ModuleTableField('stats_aggregator_min_segment_type', ModuleTableField.FIELD_TYPE_enum, 'Segmentation minimale', true, true, TimeSegment.TYPE_SECOND),
        ];

        let table = new ModuleTable(this, StatsGroupVO.API_TYPE_ID, () => new StatsGroupVO(), fields, name_field, 'Groupes de stats');
        this.datatables.push(table);
        VersionedVOController.getInstance().registerModuleTable(table);
        category_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[StatsCategoryVO.API_TYPE_ID]);
        sub_category_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[StatsSubCategoryVO.API_TYPE_ID]);
        event_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[StatsEventVO.API_TYPE_ID]);
        stat_type_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[StatsTypeVO.API_TYPE_ID]);
        thread_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[StatsThreadVO.API_TYPE_ID]);
    }

    // private initializeStatsGroupCacheLinkVO() {

    //     let name_field = new ModuleTableField('name', ModuleTableField.FIELD_TYPE_string, 'Nom du groupe - cache', true).unique(true);

    //     let fields = [
    //         name_field,

    //         new ModuleTableField('category_name', ModuleTableField.FIELD_TYPE_string, 'Nom de la catégorie', true),
    //         new ModuleTableField('sub_category_name', ModuleTableField.FIELD_TYPE_string, 'Nom de la sous-catégorie', true),
    //         new ModuleTableField('event_name', ModuleTableField.FIELD_TYPE_string, 'Nom de l\'évènement', true),
    //         new ModuleTableField('thread_name', ModuleTableField.FIELD_TYPE_string, 'Nom du thread', true),

    //         new ModuleTableField('stats_aggregator', ModuleTableField.FIELD_TYPE_enum, 'Aggrégateur', true, true, StatVO.AGGREGATOR_MEAN).setEnumValues(StatVO.AGGREGATOR_LABELS),
    //         new ModuleTableField('stats_aggregator_min_segment_type', ModuleTableField.FIELD_TYPE_enum, 'Segmentation minimale', true, true, TimeSegment.TYPE_SECOND),
    //     ];

    //     let table = new ModuleTable(this, StatsGroupCacheLinkVO.API_TYPE_ID, () => new StatsGroupCacheLinkVO(), fields, name_field, 'Groupes de stats - cache');
    //     this.datatables.push(table);
    //     VersionedVOController.getInstance().registerModuleTable(table);
    // }

    private initializeStatsCategoryVO() {

        let name_field = new ModuleTableField('name', ModuleTableField.FIELD_TYPE_string, 'Catégorie', true).unique(true);
        let fields = [
            name_field,
        ];

        let table = new ModuleTable(this, StatsCategoryVO.API_TYPE_ID, () => new StatsCategoryVO(), fields, name_field, 'Catégories de stats');
        this.datatables.push(table);
        VersionedVOController.getInstance().registerModuleTable(table);
    }

    private initializeStatsSubCategoryVO() {

        let name_field = new ModuleTableField('name', ModuleTableField.FIELD_TYPE_string, 'Sous-catégorie', true).unique(true);
        let category_id = new ModuleTableField('category_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Catégorie', true);
        let fields = [
            name_field,
            category_id,
        ];

        let table = new ModuleTable(this, StatsSubCategoryVO.API_TYPE_ID, () => new StatsSubCategoryVO(), fields, name_field, 'Sous-catégories de stats');
        this.datatables.push(table);
        VersionedVOController.getInstance().registerModuleTable(table);
        category_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[StatsCategoryVO.API_TYPE_ID]);
    }

    // private initializeStatsSubCategoryCacheLinkVO() {

    //     let name_field = new ModuleTableField('name', ModuleTableField.FIELD_TYPE_string, 'Sous-catégorie - cache', true).unique(true);

    //     let fields = [
    //         name_field,
    //         new ModuleTableField('category_name', ModuleTableField.FIELD_TYPE_string, 'Nom de la catégorie', true),
    //     ];

    //     let table = new ModuleTable(this, StatsSubCategoryCacheLinkVO.API_TYPE_ID, () => new StatsSubCategoryCacheLinkVO(), fields, name_field, 'Sous-catégories de stats - cache');
    //     this.datatables.push(table);
    //     VersionedVOController.getInstance().registerModuleTable(table);
    // }

    private initializeStatsTypeVO() {

        let name_field = new ModuleTableField('name', ModuleTableField.FIELD_TYPE_string, 'Type de stat', true).unique(true);

        let fields = [
            name_field
        ];

        let table = new ModuleTable(this, StatsTypeVO.API_TYPE_ID, () => new StatsTypeVO(), fields, name_field, 'Types de stats');
        this.datatables.push(table);
        VersionedVOController.getInstance().registerModuleTable(table);
    }

    private initializeStatsEventVO() {

        let name_field = new ModuleTableField('name', ModuleTableField.FIELD_TYPE_string, 'Evènement', true).unique(true);
        let sub_category_id = new ModuleTableField('sub_category_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Sous-catégorie', true);

        let fields = [
            name_field,
            sub_category_id
        ];

        let table = new ModuleTable(this, StatsEventVO.API_TYPE_ID, () => new StatsEventVO(), fields, name_field, 'Evènements de stats');
        this.datatables.push(table);
        VersionedVOController.getInstance().registerModuleTable(table);
        sub_category_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[StatsSubCategoryVO.API_TYPE_ID]);
    }

    // private initializeStatsEventCacheLinkVO() {

    //     let name_field = new ModuleTableField('name', ModuleTableField.FIELD_TYPE_string, 'Evènement - cache', true).unique(true);

    //     let fields = [
    //         name_field,
    //         new ModuleTableField('sub_category_name', ModuleTableField.FIELD_TYPE_string, 'Nom de la sous-catégorie', true),
    //     ];

    //     let table = new ModuleTable(this, StatsEventCacheLinkVO.API_TYPE_ID, () => new StatsEventCacheLinkVO(), fields, name_field, 'Evènements de stats - cache');
    //     this.datatables.push(table);
    //     VersionedVOController.getInstance().registerModuleTable(table);
    // }


    private initializeStatsThreadVO() {

        let name_field = new ModuleTableField('name', ModuleTableField.FIELD_TYPE_string, 'Nom principal du Thread', true).unique(true);

        let fields = [
            name_field,
            new ModuleTableField('aliases', ModuleTableField.FIELD_TYPE_string_array, 'Alias', false)
        ];

        let table = new ModuleTable(this, StatsThreadVO.API_TYPE_ID, () => new StatsThreadVO(), fields, name_field, 'Threads');
        this.datatables.push(table);
        VersionedVOController.getInstance().registerModuleTable(table);
    }

}