import NumSegment from '../../../../../shared/modules/DataRender/vos/NumSegment';
import TimeSegment from '../../../../../shared/modules/DataRender/vos/TimeSegment';
import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';
import StatsVarsNamesHolder from '../../../../../shared/modules/Stats/vars/StatsVarsNamesHolder';
import StatsGroupSecDataRangesVO from '../../../../../shared/modules/Stats/vars/vos/StatsGroupDayDataRangesVO';
import StatsGroupVO from '../../../../../shared/modules/Stats/vos/StatsGroupVO';
import StatVO from '../../../../../shared/modules/Stats/vos/StatVO';
import VarDAGNode from '../../../../../server/modules/Var/vos/VarDAGNode';
import VarConfVO from '../../../../../shared/modules/Var/vos/VarConfVO';
import VOsTypesManager from '../../../../../shared/modules/VOsTypesManager';
import RangeHandler from '../../../../../shared/tools/RangeHandler';
import DAOUpdateVOHolder from '../../../DAO/vos/DAOUpdateVOHolder';
import DataSourceControllerBase from '../../../Var/datasource/DataSourceControllerBase';
import VarServerControllerBase from '../../../Var/VarServerControllerBase';
import StatDatasourceController from '../datasources/StatDatasourceController';
import StatsGroupeDatasourceController from '../datasources/StatsGroupeDatasourceController';

export default class VarSecStatsGroupeController extends VarServerControllerBase<StatsGroupSecDataRangesVO> {

    // istanbul ignore next: nothing to test
    public static getInstance(): VarSecStatsGroupeController {
        if (!VarSecStatsGroupeController.instance) {
            VarSecStatsGroupeController.instance = new VarSecStatsGroupeController();
        }
        return VarSecStatsGroupeController.instance;
    }

    protected static instance: VarSecStatsGroupeController = null;

    protected constructor() {
        super(
            new VarConfVO(StatsVarsNamesHolder.VarSecStatsGroupeController_VAR_NAME, StatsGroupSecDataRangesVO.API_TYPE_ID, {
                ts_ranges: TimeSegment.TYPE_SECOND,
            }),
            { 'fr-fr': 'Stats' },
            {
                'fr-fr': 'Valeur des stats sur la période demandée'
            },
            {},
            {});
    }

    public getDataSourcesDependencies(): DataSourceControllerBase[] {
        return [
            StatDatasourceController.getInstance(),
            StatsGroupeDatasourceController.getInstance(),
        ];
    }

    /**
     * On optimise en passant par le groupe de modifs, et on regroupe par groupe / minute pour générer ensuite les intersecteurs nécessaires
     * @param c_or_d_vos
     */
    public async get_invalid_params_intersectors_on_POST_C_POST_D_group(c_or_d_vos: StatVO[]): Promise<StatsGroupSecDataRangesVO[]> {
        let groupe_date_to_u_vo_holders: { [stat_group_id: number]: { [timestamp_s: number]: true } } = {};

        for (let i in c_or_d_vos) {
            let c_or_d_vo = c_or_d_vos[i];

            if (!groupe_date_to_u_vo_holders[c_or_d_vo.stat_group_id]) {
                groupe_date_to_u_vo_holders[c_or_d_vo.stat_group_id] = {};
            }

            if (!groupe_date_to_u_vo_holders[c_or_d_vo.stat_group_id][c_or_d_vo.timestamp_s]) {
                groupe_date_to_u_vo_holders[c_or_d_vo.stat_group_id][c_or_d_vo.timestamp_s] = true;
            }
        }

        return this.get_intersecteurs(groupe_date_to_u_vo_holders);
    }

    /**
     * On optimise en passant par le groupe de modifs, et on regroupe par groupe / minute pour générer ensuite les intersecteurs nécessaires
     * @param u_vo_holders
     */
    public async get_invalid_params_intersectors_on_POST_U_group(u_vo_holders: Array<DAOUpdateVOHolder<IDistantVOBase>>): Promise<StatsGroupSecDataRangesVO[]> {
        let groupe_date_to_u_vo_holders: { [stat_group_id: number]: { [timestamp_s: number]: true } } = {};
        let u_vo_holders_typed: Array<DAOUpdateVOHolder<StatVO>> = u_vo_holders as Array<DAOUpdateVOHolder<StatVO>>;

        for (let i in u_vo_holders_typed) {
            let u_vo_holder = u_vo_holders_typed[i];

            if (!!u_vo_holder.pre_update_vo) {
                if (!groupe_date_to_u_vo_holders[u_vo_holder.pre_update_vo.stat_group_id]) {
                    groupe_date_to_u_vo_holders[u_vo_holder.pre_update_vo.stat_group_id] = {};
                }

                if (!groupe_date_to_u_vo_holders[u_vo_holder.pre_update_vo.stat_group_id][u_vo_holder.pre_update_vo.timestamp_s]) {
                    groupe_date_to_u_vo_holders[u_vo_holder.pre_update_vo.stat_group_id][u_vo_holder.pre_update_vo.timestamp_s] = true;
                }
            }
            if (!!u_vo_holder.post_update_vo) {
                if (!groupe_date_to_u_vo_holders[u_vo_holder.post_update_vo.stat_group_id]) {
                    groupe_date_to_u_vo_holders[u_vo_holder.post_update_vo.stat_group_id] = {};
                }

                if (!groupe_date_to_u_vo_holders[u_vo_holder.post_update_vo.stat_group_id][u_vo_holder.post_update_vo.timestamp_s]) {
                    groupe_date_to_u_vo_holders[u_vo_holder.post_update_vo.stat_group_id][u_vo_holder.post_update_vo.timestamp_s] = true;
                }
            }
        }

        return this.get_intersecteurs(groupe_date_to_u_vo_holders);
    }

    /**
     * Pour faire le calcul, on charge les groupes, et on ne garde que les groupes qui ont des stats avec un aggrégateur compatible
     *  donc si on a que des MAX on fait le MAX global mais si on a MAX et MIN on refuse de répondre
     * @param varDAGNode
     * @returns
     */
    protected getValue(varDAGNode: VarDAGNode): number {

        let stats: StatVO[] = varDAGNode.datasources[StatDatasourceController.getInstance().name];
        let groupes: StatsGroupVO[] = varDAGNode.datasources[StatsGroupeDatasourceController.getInstance().name];
        let groupes_by_id: { [id: number]: StatsGroupVO } = VOsTypesManager.vosArray_to_vosByIds(groupes);

        let stats_by_groupe: { [stat_group_id: number]: StatVO[] } = {};
        let stats_aggregator: number = null;
        for (let i in stats) {
            let stat = stats[i];
            if (!stats_by_groupe[stat.stat_group_id]) {
                stats_by_groupe[stat.stat_group_id] = [];
            }
            stats_by_groupe[stat.stat_group_id].push(stat);

            let groupe = groupes_by_id[stat.stat_group_id];
            if (stats_aggregator == null) {
                stats_aggregator = groupe.stats_aggregator;
            } else {
                if (stats_aggregator != groupe.stats_aggregator) {
                    return null;
                }
            }
        }

        let res = null;
        let nb_stats_for_mean = 0;
        for (let group_id_str in stats_by_groupe) {
            let group_id = parseInt(group_id_str);
            let groupe = groupes_by_id[group_id];
            stats = stats_by_groupe[group_id];

            switch (groupe.stats_aggregator) {
                case StatVO.AGGREGATOR_SUM:
                case StatVO.AGGREGATOR_MEAN:
                    stats.forEach((stat) => {
                        res = ((res == null) ? stat.value : res + stat.value);
                    });
                    nb_stats_for_mean += stats.length;
                    break;

                case StatVO.AGGREGATOR_MAX:
                    stats.forEach((stat) => {
                        res = ((res == null) ? stat.value : Math.max(res, stat.value));
                    });
                    break;

                case StatVO.AGGREGATOR_MIN:
                    stats.forEach((stat) => {
                        res = ((res == null) ? stat.value : Math.min(res, stat.value));
                    });
                    break;

                default:
                    throw new Error('Unknown stats aggregator: ' + groupe.stats_aggregator);
            }
        }

        // Si on a plusieurs groupes, on fait une moyenne
        if (stats_aggregator == StatVO.AGGREGATOR_MEAN) {
            return res / nb_stats_for_mean;
        }
        return res;
    }

    private get_intersecteurs(groupe_date_to_u_vo_holders: { [stat_group_id: number]: { [timestamp_s: number]: true } }): StatsGroupSecDataRangesVO[] {
        let res: StatsGroupSecDataRangesVO[] = [];

        for (let stat_group_id_s in groupe_date_to_u_vo_holders) {
            let stat_group_id = parseInt(stat_group_id_s);
            let holders = groupe_date_to_u_vo_holders[stat_group_id_s];

            for (let timestamp_s_s in holders) {
                let timestamp_s = parseInt(timestamp_s_s);
                res.push(StatsGroupSecDataRangesVO.createNew<StatsGroupSecDataRangesVO>(
                    this.varConf.name,
                    false,
                    [RangeHandler.create_single_elt_NumRange(stat_group_id, NumSegment.TYPE_INT)],
                    [RangeHandler.create_single_elt_TSRange(timestamp_s, TimeSegment.TYPE_SECOND)]
                ));
            }
        }

        return res;
    }
}