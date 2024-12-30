import NumSegment from "../../../../shared/modules/DataRender/vos/NumSegment";
import IDistantVOBase from "../../../../shared/modules/IDistantVOBase";
import VarConfVO from "../../../../shared/modules/Var/vos/VarConfVO";
import VarDataBaseVO from "../../../../shared/modules/Var/vos/VarDataBaseVO";
import RangeHandler from "../../../../shared/tools/RangeHandler";
import DAOUpdateVOHolder from "../../DAO/vos/DAOUpdateVOHolder";
import VarServerControllerBase from "../../Var/VarServerControllerBase";
import DataSourceControllerBase from "../../Var/datasource/DataSourceControllerBase";
import VarDAGNode from "../../Var/vos/VarDAGNode";
import ISupervisedItem from '../../../../shared/modules/Supervision/interfaces/ISupervisedItem';
import SupervisionProbeStateDataRangesVO from "../../../../shared/modules/Supervision/vars/vos/SupervisionProbeStateDataRangesVO";
import SupervisionVarsNamesHolder from "../../../../shared/modules/Supervision/vars/SupervisionVarsNamesHolder";
import SupervisedItemProbeStateRangesDatasourceController from "../datasources/SupervisedItemProbeStateRangesDatasourceController";

export default class VarNbSupervisedItemByProbeStateController extends VarServerControllerBase<SupervisionProbeStateDataRangesVO> {

    protected static instance: VarNbSupervisedItemByProbeStateController = null;

    protected constructor() {
        super(
            new VarConfVO(
                SupervisionVarsNamesHolder.VarNbSupervisedItemByProbeStateController_VAR_NAME,
                SupervisionProbeStateDataRangesVO.API_TYPE_ID,
            ),
            { 'fr-fr': 'DayNbSupervisedItemByProbeState' },
            { 'fr-fr': "Compteur d'item de supervision par état ; sonde" },
            { 'fr-fr': "Compteur d'item de supervision par état ; sonde" },
            {}
        );
    }

    public static getInstance(): VarNbSupervisedItemByProbeStateController {
        if (!VarNbSupervisedItemByProbeStateController.instance) {
            VarNbSupervisedItemByProbeStateController.instance = new VarNbSupervisedItemByProbeStateController();
        }
        return VarNbSupervisedItemByProbeStateController.instance;
    }

    public getDataSourcesDependencies(): DataSourceControllerBase[] {
        return [
            SupervisedItemProbeStateRangesDatasourceController.getInstance(),
        ];
    }

    public getDataSourcesPredepsDependencies(): DataSourceControllerBase[] {
        return [];
    }

    public async get_invalid_params_intersectors_on_POST_C_POST_D(c_or_d_vo: IDistantVOBase): Promise<SupervisionProbeStateDataRangesVO[]> {
        return [
            await this.get_invalid_params_intersectors_from_vo(this.varConf.name, c_or_d_vo)
        ];
    }

    public async get_invalid_params_intersectors_on_POST_U<T extends IDistantVOBase>(u_vo_holder: DAOUpdateVOHolder<T>): Promise<SupervisionProbeStateDataRangesVO[]> {

        /**
         * Si on a pas touché aux champs utiles, on esquive la mise à jour
         */
        if (!this.has_changed_important_field(u_vo_holder as any)) {
            return null;
        }

        return [
            await this.get_invalid_params_intersectors_from_vo(this.varConf.name, u_vo_holder.pre_update_vo as any),
            await this.get_invalid_params_intersectors_from_vo(this.varConf.name, u_vo_holder.post_update_vo as any)
        ];
    }

    public has_changed_important_field<T extends IDistantVOBase>(u_vo_holder: DAOUpdateVOHolder<T>): boolean {

        if (((u_vo_holder.pre_update_vo as any as ISupervisedItem).state != (u_vo_holder.post_update_vo as any as ISupervisedItem).state) ||
            ((u_vo_holder.pre_update_vo as any as ISupervisedItem).probe_id != (u_vo_holder.post_update_vo as any as ISupervisedItem).probe_id)
        ) {
            return true;
        }

        return false;
    }

    public async get_invalid_params_intersectors_from_vo<T extends IDistantVOBase>(var_name: string, vo: IDistantVOBase): Promise<SupervisionProbeStateDataRangesVO> {

        return SupervisionProbeStateDataRangesVO.createNew<SupervisionProbeStateDataRangesVO>(
            var_name,
            false,
            [RangeHandler.create_single_elt_NumRange((vo as any as ISupervisedItem).probe_id, NumSegment.TYPE_INT)],
            [RangeHandler.create_single_elt_NumRange((vo as any as ISupervisedItem).state, NumSegment.TYPE_INT)],
        );

        return null;
    }

    public async get_invalid_params_intersectors_from_dep<T extends VarDataBaseVO>(dep_id: string, intersectors: T[]): Promise<SupervisionProbeStateDataRangesVO[]> {
        return [];
    }

    public getVarControllerDependencies(): { [dep_name: string]: VarServerControllerBase<any> } {
        return {};
    }

    public getParamDependencies(varDAGNode: VarDAGNode): { [dep_id: string]: VarDataBaseVO } {
        return {};
    }

    protected getValue(varDAGNode: VarDAGNode): number {
        const param: SupervisionProbeStateDataRangesVO = varDAGNode.var_data as SupervisionProbeStateDataRangesVO;
        const items_by_probe_and_state: { [probe_id: number]: { [state: number]: ISupervisedItem[] } } = varDAGNode.datasources[SupervisedItemProbeStateRangesDatasourceController.getInstance().name];

        let res: number = 0;

        RangeHandler.foreach_ranges_sync(param.probe_id_ranges, (probe_id: number) => {
            if (!items_by_probe_and_state[probe_id]) {
                return;
            }
            RangeHandler.foreach_ranges_sync(param.state_id_ranges, (state_id: number) => {
                if (!items_by_probe_and_state[probe_id][state_id]?.length) {
                    return;
                }
                res += items_by_probe_and_state[probe_id][state_id].length;
            });
        });

        return res;
    }
}