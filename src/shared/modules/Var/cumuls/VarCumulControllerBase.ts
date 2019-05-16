import * as moment from 'moment';
import { Moment } from 'moment';
import DateHandler from '../../../tools/DateHandler';
import IDateIndexedSimpleNumberVarData from '../interfaces/IDateIndexedSimpleNumberVarData';
import IDateIndexedVarDataParam from '../interfaces/IDateIndexedVarDataParam';
import ISimpleNumberVarData from '../interfaces/ISimpleNumberVarData';
import VarControllerBase from '../VarControllerBase';
import VarsController from '../VarsController';
import VarConfVOBase from '../vos/VarConfVOBase';
import VarsCumulsController from './VarsCumulsController';
import IDataSourceController from '../../DataSource/interfaces/IDataSourceController';
import VarDAG from '../graph/var/VarDAG';
import IVarDataParamVOBase from '../interfaces/IVarDataParamVOBase';
import VarDAGNode from '../graph/var/VarDAGNode';
import TimeSegment from '../../DataRender/vos/TimeSegment';

export default class VarCumulControllerBase<TData extends IDateIndexedSimpleNumberVarData, TDataParam extends IDateIndexedVarDataParam> extends VarControllerBase<TData, TDataParam> {

    public constructor(
        protected varConfToCumulate: VarConfVOBase,
        protected cumulType: string,
        protected varDataConstructor: () => TData) {
        super(varConfToCumulate, VarsController.getInstance().getVarControllerById(varConfToCumulate.id).varDataParamController);
    }

    public async initialize() {

        // On part de la conf de la data à cumuler et on en fait un cumul week
        let varConf: VarConfVOBase = Object.assign({}, this.varConf);
        varConf.id = null;
        varConf.name = VarsCumulsController.getInstance().getCumulativeName(varConf.name, this.cumulType);
        this.segment_type = VarsController.getInstance().getVarControllerById(this.varConfToCumulate.id).segment_type;

        this.varConf = await VarsController.getInstance().registerVar(varConf, this);
    }

    /**
     * Returns the datasources this var depends on
     */
    public getDataSourcesDependencies(): Array<IDataSourceController<any, any>> {
        return [];
    }

    /**
     * Returns the var_ids that we depend upon (or might depend)
     */
    public getVarsIdsDependencies(): number[] {
        return [this.varConfToCumulate.id];
    }

    /**
     * Returns the dataparam needed to updateData of the given param. Example : Week sum of worked hours needs worked hours of each day of the given week
     */
    public async getParamDependencies(
        varDAGNode: VarDAGNode,
        varDAG: VarDAG): Promise<IVarDataParamVOBase[]> {

        let res: TDataParam[] = [];
        let param: TDataParam = (varDAGNode.param as TDataParam);

        let param_calc_segment: TDataParam = Object.assign({}, param);
        param_calc_segment.var_id = this.varConfToCumulate.id;
        res.push(param_calc_segment);

        let date_index_cumul_segment_m_1: string = this.getPreviousDateIndexKeepSameSegment(param.date_index);
        if (!!date_index_cumul_segment_m_1) {
            let param_cumul_segment_m_1: TDataParam = Object.assign({}, param);
            param_cumul_segment_m_1.date_index = date_index_cumul_segment_m_1;
            res.push(param_cumul_segment_m_1);
        }

        return res;
    }

    public async updateData(varDAGNode: VarDAGNode, varDAG: VarDAG) {

        let param: TDataParam = varDAGNode.param as TDataParam;
        let index: string = VarsController.getInstance().getIndex(param);

        // Cumul => si importé, on renvoie la valeur importée, sinon veille (si meme segment) + jour*
        if (VarsController.getInstance().varDAG.nodes[index].hasMarker(VarDAG.VARDAG_MARKER_IMPORTED_DATA)) {

            VarsController.getInstance().setVarData(VarsController.getInstance().varDAG.nodes[index].imported, true);
            return;
        }

        let res: TData = Object.assign(this.varDataConstructor(), param);
        res.types_info = [];
        res.var_id = this.varConf.id;
        res.date_index = param.date_index;

        let param_calc_segment: TDataParam = Object.assign({}, param);
        param_calc_segment.var_id = this.varConfToCumulate.id;
        let todayData: ISimpleNumberVarData = VarsController.getInstance().getVarData(param_calc_segment, true);

        let date_index_cumul_segment_m_1: string = this.getPreviousDateIndexKeepSameSegment(param.date_index);
        let yesterdayData: ISimpleNumberVarData = null;
        if (!!date_index_cumul_segment_m_1) {
            let param_cumul_segment_m_1: TDataParam = Object.assign({}, param);
            param_cumul_segment_m_1.date_index = date_index_cumul_segment_m_1;
            yesterdayData = VarsController.getInstance().getVarData(param_cumul_segment_m_1, true);
        }

        res.value = (((!!yesterdayData) && (!!yesterdayData.value)) ? yesterdayData.value : 0) +
            (((!!todayData) && (!!todayData.value)) ? todayData.value : 0);

        VarsController.getInstance().setVarData(res, true);
    }

    private getPreviousDateIndexKeepSameSegment(date_index: string): string {
        let date: Moment = moment(date_index);

        switch (this.cumulType) {
            case VarsCumulsController.CUMUL_WEEK_NAME:
                if (date.isoWeekday() > 1) {
                    return DateHandler.getInstance().formatDayForIndex(date.add(-1, 'day'));
                }
                break;
            case VarsCumulsController.CUMUL_MONTH_NAME:
                if (date.date() > 1) {
                    return DateHandler.getInstance().formatDayForIndex(date.add(-1, 'day'));
                }
                break;
            case VarsCumulsController.CUMUL_YEAR_NAME:
            default:

                switch (this.segment_type) {
                    case TimeSegment.TYPE_MONTH:
                        if (date.dayOfYear() > 1) {
                            return DateHandler.getInstance().formatDayForIndex(date.add(-1, 'month'));
                        }
                        break;

                    case TimeSegment.TYPE_DAY:
                    default:
                        if (date.dayOfYear() > 1) {
                            return DateHandler.getInstance().formatDayForIndex(date.add(-1, 'day'));
                        }
                }
        }

        return null;
    }
}