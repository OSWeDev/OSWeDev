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
import StatsGroupVO from './vos/StatsGroupVO';
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
        let fields = [
            name_field,

            new ModuleTableField('stats_aggregator', ModuleTableField.FIELD_TYPE_enum, 'Aggrégateur', true, true, StatVO.AGGREGATOR_MEAN).setEnumValues(StatVO.AGGREGATOR_LABELS),
            new ModuleTableField('stats_aggregator_min_segment_type', ModuleTableField.FIELD_TYPE_enum, 'Segmentation minimale', true, true, TimeSegment.TYPE_SECOND),
        ];

        let table = new ModuleTable(this, StatsGroupVO.API_TYPE_ID, () => new StatsGroupVO(), fields, name_field, 'Groupes de stats');
        this.datatables.push(table);
        VersionedVOController.getInstance().registerModuleTable(table);
    }
}