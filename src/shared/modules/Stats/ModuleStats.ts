import AccessPolicyTools from '../../tools/AccessPolicyTools';
import { field_names } from '../../tools/ObjectHandler';
import APIControllerWrapper from '../API/APIControllerWrapper';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import ModuleTableController from '../DAO/ModuleTableController';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../DAO/vos/ModuleTableFieldVO';
import NumSegment from '../DataRender/vos/NumSegment';
import TimeSegment from '../DataRender/vos/TimeSegment';
import Module from '../Module';
import ModuleParams from '../Params/ModuleParams';
import VarsInitController from '../Var/VarsInitController';
import VersionedVOController from '../Versioned/VersionedVOController';
import StatsController from './StatsController';
import RegisterClientStatsParamVO, { RegisterClientStatsParamVOStatic } from './params/RegisterClientStatsParamVO';
import StatsGroupSecDataRangesVO from './vars/vos/StatsGroupDayDataRangesVO';
import StatClientWrapperVO from './vos/StatClientWrapperVO';
import StatVO from './vos/StatVO';
import StatsCategoryVO from './vos/StatsCategoryVO';
import StatsEventVO from './vos/StatsEventVO';
import StatsGroupVO from './vos/StatsGroupVO';
import StatsSubCategoryVO from './vos/StatsSubCategoryVO';
import StatsThreadVO from './vos/StatsThreadVO';
import StatsTypeVO from './vos/StatsTypeVO';


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


    /* istanbul ignore next: nothing to test here */
    public async hook_module_async_client_admin_initialization(): Promise<any> {
        await this.initializeasync();
        return true;
    }

    /* istanbul ignore next: nothing to test here */
    public async hook_module_configure(): Promise<boolean> {
        await this.initializeasync();
        return true;
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
        const stats_groupe_id_ranges = ModuleTableFieldController.create_new(StatsGroupSecDataRangesVO.API_TYPE_ID, field_names<StatsGroupSecDataRangesVO>().stats_groupe_id_ranges, ModuleTableFieldVO.FIELD_TYPE_numrange_array, 'Groupe de stats', true).set_segmentation_type(NumSegment.TYPE_INT);

        const datatable_fields = [
            stats_groupe_id_ranges,
            ModuleTableFieldController.create_new(StatsGroupSecDataRangesVO.API_TYPE_ID, field_names<StatsGroupSecDataRangesVO>().ts_ranges, ModuleTableFieldVO.FIELD_TYPE_tstzrange_array, 'Dates').set_segmentation_type(TimeSegment.TYPE_SECOND).set_format_localized_time(false),
        ];

        VarsInitController.getInstance().register_var_data(StatsGroupSecDataRangesVO.API_TYPE_ID, StatsGroupSecDataRangesVO, datatable_fields, this);
        stats_groupe_id_ranges.set_many_to_one_target_moduletable_name(StatsGroupVO.API_TYPE_ID);
    }

    private initializeStatVO() {
        const stat_group_id = ModuleTableFieldController.create_new(StatVO.API_TYPE_ID, field_names<StatVO>().stat_group_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Groupe de stats', true);

        const fields = [
            stat_group_id,
            ModuleTableFieldController.create_new(StatVO.API_TYPE_ID, field_names<StatVO>().value, ModuleTableFieldVO.FIELD_TYPE_float, 'Valeur', true, true, 0),
            ModuleTableFieldController.create_new(StatVO.API_TYPE_ID, field_names<StatVO>().timestamp_s, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Timestamp (sec)', true, true, 0).set_segmentation_type(TimeSegment.TYPE_SECOND).set_format_localized_time(true).index(),
        ];

        const table = ModuleTableController.create_new(this.name, StatVO, null, 'Stats');
        table.segment_on_field('stat_group_id', NumSegment.TYPE_INT);
        stat_group_id.set_many_to_one_target_moduletable_name(StatsGroupVO.API_TYPE_ID);
    }

    private initializeStatClientWrapperVO() {

        const fields = [
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

        const table = ModuleTableController.create_new(this.name, StatClientWrapperVO, null, 'Stats - Client side wrapper');
    }

    private initializeStatsGroupVO() {

        const name_field = ModuleTableFieldController.create_new(StatsGroupVO.API_TYPE_ID, field_names<StatsGroupVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom du groupe', true).unique();

        const category_id = ModuleTableFieldController.create_new(StatsGroupVO.API_TYPE_ID, field_names<StatsGroupVO>().category_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Catégorie', false);
        const sub_category_id = ModuleTableFieldController.create_new(StatsGroupVO.API_TYPE_ID, field_names<StatsGroupVO>().sub_category_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Sous-catégorie', false);
        const event_id = ModuleTableFieldController.create_new(StatsGroupVO.API_TYPE_ID, field_names<StatsGroupVO>().event_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Evènement', false);
        const stat_type_id = ModuleTableFieldController.create_new(StatsGroupVO.API_TYPE_ID, field_names<StatsGroupVO>().stat_type_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Type', false);
        const thread_id = ModuleTableFieldController.create_new(StatsGroupVO.API_TYPE_ID, field_names<StatsGroupVO>().thread_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Thread', false);

        const fields = [
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

        const table = ModuleTableController.create_new(this.name, StatsGroupVO, name_field, 'Groupes de stats');
        VersionedVOController.getInstance().registerModuleTable(table);
        category_id.set_many_to_one_target_moduletable_name(StatsCategoryVO.API_TYPE_ID);
        sub_category_id.set_many_to_one_target_moduletable_name(StatsSubCategoryVO.API_TYPE_ID);
        event_id.set_many_to_one_target_moduletable_name(StatsEventVO.API_TYPE_ID);
        stat_type_id.set_many_to_one_target_moduletable_name(StatsTypeVO.API_TYPE_ID);
        thread_id.set_many_to_one_target_moduletable_name(StatsThreadVO.API_TYPE_ID);
    }

    // private initializeStatsGroupCacheLinkVO() {

    //     let name_field = ModuleTableFieldController.create_new(SendInBlueVO.API_TYPE_ID, field_names<SendInBlueVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom du groupe - cache', true).unique();

    //     let fields = [
    //         name_field,

    //         ModuleTableFieldController.create_new(SendInBlueVO.API_TYPE_ID, field_names<SendInBlueVO>().category_name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom de la catégorie', true),
    //         ModuleTableFieldController.create_new(SendInBlueVO.API_TYPE_ID, field_names<SendInBlueVO>().sub_category_name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom de la sous-catégorie', true),
    //         ModuleTableFieldController.create_new(SendInBlueVO.API_TYPE_ID, field_names<SendInBlueVO>().event_name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom de l\'évènement', true),
    //         ModuleTableFieldController.create_new(SendInBlueVO.API_TYPE_ID, field_names<SendInBlueVO>().thread_name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom du thread', true),

    //         ModuleTableFieldController.create_new(SendInBlueVO.API_TYPE_ID, field_names<SendInBlueVO>().stats_aggregator, ModuleTableFieldVO.FIELD_TYPE_enum, 'Aggrégateur', true, true, StatVO.AGGREGATOR_MEAN).setEnumValues(StatVO.AGGREGATOR_LABELS),
    //         ModuleTableFieldController.create_new(SendInBlueVO.API_TYPE_ID, field_names<SendInBlueVO>().stats_aggregator_min_segment_type, ModuleTableFieldVO.FIELD_TYPE_enum, 'Segmentation minimale', true, true, TimeSegment.TYPE_SECOND),
    //     ];

    //     let table = ModuleTableController.create_new(this.name, StatsGroupCacheLinkVO, name_field, 'Groupes de stats - cache');
    //     this.datatables.push(table);
    //     VersionedVOController.getInstance().registerModuleTable(table);
    // }

    private initializeStatsCategoryVO() {

        const name_field = ModuleTableFieldController.create_new(StatsCategoryVO.API_TYPE_ID, field_names<StatsCategoryVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'Catégorie', true).unique();
        const fields = [
            name_field,
        ];

        const table = ModuleTableController.create_new(this.name, StatsCategoryVO, name_field, 'Catégories de stats');
        VersionedVOController.getInstance().registerModuleTable(table);
    }

    private initializeStatsSubCategoryVO() {

        const name_field = ModuleTableFieldController.create_new(StatsSubCategoryVO.API_TYPE_ID, field_names<StatsSubCategoryVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'Sous-catégorie', true).index();
        const category_id = ModuleTableFieldController.create_new(StatsSubCategoryVO.API_TYPE_ID, field_names<StatsSubCategoryVO>().category_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Catégorie', true);
        const fields = [
            name_field,
            category_id,
        ];

        const table = ModuleTableController.create_new(this.name, StatsSubCategoryVO, name_field, 'Sous-catégories de stats');
        VersionedVOController.getInstance().registerModuleTable(table);
        category_id.set_many_to_one_target_moduletable_name(StatsCategoryVO.API_TYPE_ID);
    }

    // private initializeStatsSubCategoryCacheLinkVO() {

    //     let name_field = ModuleTableFieldController.create_new(SendInBlueVO.API_TYPE_ID, field_names<SendInBlueVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'Sous-catégorie - cache', true).index();

    //     let fields = [
    //         name_field,
    //         ModuleTableFieldController.create_new(SendInBlueVO.API_TYPE_ID, field_names<SendInBlueVO>().category_name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom de la catégorie', true),
    //     ];

    //     let table = ModuleTableController.create_new(this.name, StatsSubCategoryCacheLinkVO, name_field, 'Sous-catégories de stats - cache');
    //     this.datatables.push(table);
    //     VersionedVOController.getInstance().registerModuleTable(table);
    // }

    private initializeStatsTypeVO() {

        const name_field = ModuleTableFieldController.create_new(StatsTypeVO.API_TYPE_ID, field_names<StatsTypeVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'Type de stat', true).index();

        const fields = [
            name_field
        ];

        const table = ModuleTableController.create_new(this.name, StatsTypeVO, name_field, 'Types de stats');
        VersionedVOController.getInstance().registerModuleTable(table);
    }

    private initializeStatsEventVO() {

        const name_field = ModuleTableFieldController.create_new(StatsEventVO.API_TYPE_ID, field_names<StatsEventVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'Evènement', true).index();
        const sub_category_id = ModuleTableFieldController.create_new(StatsEventVO.API_TYPE_ID, field_names<StatsEventVO>().sub_category_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Sous-catégorie', true);

        const fields = [
            name_field,
            sub_category_id
        ];

        const table = ModuleTableController.create_new(this.name, StatsEventVO, name_field, 'Evènements de stats');
        VersionedVOController.getInstance().registerModuleTable(table);
        sub_category_id.set_many_to_one_target_moduletable_name(StatsSubCategoryVO.API_TYPE_ID);
    }

    // private initializeStatsEventCacheLinkVO() {

    //     let name_field = ModuleTableFieldController.create_new(SendInBlueVO.API_TYPE_ID, field_names<SendInBlueVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'Evènement - cache', true).index();

    //     let fields = [
    //         name_field,
    //         ModuleTableFieldController.create_new(SendInBlueVO.API_TYPE_ID, field_names<SendInBlueVO>().sub_category_name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom de la sous-catégorie', true),
    //     ];

    //     let table = ModuleTableController.create_new(this.name, StatsEventCacheLinkVO, name_field, 'Evènements de stats - cache');
    //     this.datatables.push(table);
    //     VersionedVOController.getInstance().registerModuleTable(table);
    // }


    private initializeStatsThreadVO() {

        const name_field = ModuleTableFieldController.create_new(StatsThreadVO.API_TYPE_ID, field_names<StatsThreadVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom principal du Thread', true).unique();

        const fields = [
            name_field,
            ModuleTableFieldController.create_new(StatsThreadVO.API_TYPE_ID, field_names<StatsThreadVO>().aliases, ModuleTableFieldVO.FIELD_TYPE_string_array, 'Alias', false)
        ];

        const table = ModuleTableController.create_new(this.name, StatsThreadVO, name_field, 'Threads');
        VersionedVOController.getInstance().registerModuleTable(table);
    }

    /* istanbul ignore next: nothing to test here */
    private async initializeasync() {
        ModuleParams.getInstance().getParamValueAsInt(StatsController.UNSTACK_THROTTLE_PARAM_NAME, 60000, 180000).then((res: number) => {
            StatsController.getInstance().UNSTACK_THROTTLE = res;
        });
    }
}