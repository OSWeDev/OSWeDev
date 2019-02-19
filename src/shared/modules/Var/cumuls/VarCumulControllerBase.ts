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

        this.varConf = await VarsController.getInstance().registerVar(varConf, this);
    }

    public async begin_batch(vars_params: { [index: string]: TDataParam }, imported_datas: { [var_id: number]: { [param_index: string]: TData } }) { }

    public async end_batch(vars_params: { [index: string]: TDataParam }, imported_datas: { [var_id: number]: { [param_index: string]: TData } }) { }

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

    // /**
    //  * Returns the dataparam needed to updateData of the given param. Example : Week sum of worked hours needs worked hours of each day of the given week
    //  * TODO REFONTE SOLDES : On a pas pris en compte les imports pour le moment ici ... c'est ce qui peut éviter de faire un calcul sur 356 jours...
    //  *  et accessoirement ça peut être intéressant de dire qu'il existe un min ou un supp de dates de validité du cumul (comme par exemple le plannifié
    //  *  qui est forcément dans le futur et donc inutile de prendre toutes les dates de l'année a priori)
    //  * On est sur une logique de cumul à date, donc en fait si on demande explicitement le 3/01 en cumul annuel, c'est en fait 01 + 02 + 03 et c'est tout.
    //  * Si on veut l'année complète (en opposition aux timesegments) on demande le 31/12
    //  * @param BATCH_UID
    //  * @param param
    //  */
    // public async getParamsDependencies(
    //     BATCH_UID: number,
    //     param: TDataParam, params_by_vars_ids: { [var_id: number]: { [index: string]: TDataParam } },
    //     imported_datas: { [var_id: number]: { [param_index: string]: TData } }): Promise<TDataParam[]> {
    //     let res: TDataParam[] = [];

    //     let start_date: Moment = this.getCADStartDate(param);
    //     let end_date: Moment = this.getCADEndDate(param);

    //     let date: Moment = moment(start_date);
    //     while (date.isSameOrBefore(end_date)) {
    //         let new_param: TDataParam = Object.assign({}, param);
    //         let new_cumul_param: TDataParam = Object.assign({}, param);

    //         new_cumul_param.date_index = DateHandler.getInstance().formatDayForIndex(date);
    //         new_param.date_index = DateHandler.getInstance().formatDayForIndex(date);
    //         new_param.var_id = this.varConfToCumulate.id;

    //         // Si on a un import, on peut ignorer le passé et demander les deps à partir de cette date uniquement
    //         let cumul_param_index: string = this.varDataParamController.getIndex(new_cumul_param);
    //         if (imported_datas && imported_datas[this.varConf.id] && imported_datas[this.varConf.id][cumul_param_index]) {
    //             res = [new_param];
    //         } else {
    //             res.push(new_param);
    //         }

    //         date.add(1, 'day');
    //     }

    //     return res;
    // }

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

    // /**
    //  * On a pas accès aux imports, mais en fait il sont chargés à cette étape et ça permettrait d'optimiser cette étape. à voir
    //  * @param params
    //  */
    // public getSelfImpacted(params: TDataParam[], registered: { [paramIndex: string]: TDataParam }): TDataParam[] {
    //     let res: TDataParam[] = [];

    //     let min_date: Moment = null;
    //     let max_date: Moment = null;

    //     for (let i in params) {
    //         let param: TDataParam = params[i];

    //         let start_date: Moment = this.getImpactedCADStartDate(param);
    //         let end_date: Moment = this.getImpactedCADEndDate(param);

    //         if (((!min_date) || (start_date && min_date.isAfter(start_date)))) {
    //             min_date = start_date;
    //         }

    //         if (((!max_date) || (end_date && max_date.isBefore(end_date)))) {
    //             max_date = end_date;
    //         }
    //     }

    //     for (let i in registered) {

    //         if (moment(registered[i].date_index).isBetween(min_date, max_date, 'day', "[]")) {
    //             res.push(registered[i]);
    //         }
    //     }

    //     // for (let i in params) {
    //     //     let param: TDataParam = params[i];

    //     //     let start_date: Moment = this.getImpactedCADStartDate(param);
    //     //     let end_date: Moment = this.getImpactedCADEndDate(param);

    //     //     for (let i in )

    //     //     let date: Moment = moment(start_date);
    //     //     while (date.isSameOrBefore(end_date)) {
    //     //         let new_param: TDataParam = Object.assign({}, param);
    //     //         let new_cumul_param: TDataParam = Object.assign({}, param);

    //     //         new_cumul_param.date_index = DateHandler.getInstance().formatDayForIndex(date);
    //     //         new_param.date_index = DateHandler.getInstance().formatDayForIndex(date);
    //     //         new_param.var_id = this.varConfToCumulate.id;

    //     //         // On impact que si on a
    //     //         // TODO FIXME Si on a un import, on peut ignorer le passé et demander les deps à partir de cette date uniquement
    //     //         if (res.indexOf(new_param) < 0) {
    //     //             res.push(new_param);
    //     //         }

    //     //         date.add(1, 'day');
    //     //     }

    //     // }

    //     return res;
    // }

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

    // public async updateData(BATCH_UID: number, param: TDataParam, imported_datas: { [var_id: number]: { [param_index: string]: TData } }) {
    //     let start_date: Moment = this.getCADStartDate(param);
    //     let end_date: Moment = this.getCADEndDate(param);

    //     let res: TData = Object.assign(this.varDataConstructor(), param);
    //     res.types_info = [];
    //     res.var_id = this.varConf.id;
    //     res.date_index = DateHandler.getInstance().formatDayForIndex(end_date);
    //     res.value = 0;

    //     // Si importée, on

    //     let date: Moment = moment(start_date);
    //     while (date.isSameOrBefore(end_date)) {
    //         let new_param: TDataParam = Object.assign({}, param);
    //         let new_cumul_param: TDataParam = Object.assign({}, param);

    //         new_param.date_index = DateHandler.getInstance().formatDayForIndex(date);
    //         new_cumul_param.date_index = DateHandler.getInstance().formatDayForIndex(date);
    //         new_param.var_id = this.varConfToCumulate.id;

    //         // Si on a un import pour cette date on remet le cumul à cette valeur et on ignore la var dépendante
    //         let cumul_param_index: string = this.varDataParamController.getIndex(new_cumul_param);
    //         if (imported_datas && imported_datas[this.varConf.id] && imported_datas[this.varConf.id][cumul_param_index]) {
    //             res.value = imported_datas[this.varConf.id][cumul_param_index].value;
    //         } else {
    //             let varData: ISimpleNumberVarData = VarsController.getInstance().getVarData(new_param, true) as ISimpleNumberVarData;
    //             res.value += (varData ? varData.value : 0);
    //         }

    //         date.add(1, 'day');
    //     }

    //     VarsController.getInstance().setVarData(res, true);
    // }

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
                if (date.dayOfYear() > 1) {
                    return DateHandler.getInstance().formatDayForIndex(date.add(-1, 'day'));
                }
        }

        return null;
    }

    private getCADStartDate(param: TDataParam): Moment {
        let start_date: Moment = moment(param.date_index);

        switch (this.cumulType) {
            case VarsCumulsController.CUMUL_WEEK_NAME:
                return moment(start_date).startOf('isoWeek');
            case VarsCumulsController.CUMUL_MONTH_NAME:
                return moment(start_date).startOf('month');
            case VarsCumulsController.CUMUL_YEAR_NAME:
            default:
                return moment(start_date).startOf('year');
        }
    }


    private getCADEndDate(param: TDataParam): Moment {
        return moment(param.date_index);
    }

    // // TODO UnitTest TestUnit On doit renvoyer la date d'impact minimale si on modifie le param passé
    // // TODO gestion des imports, on devrait pas impacter après-demain si on a un import demain
    // private getImpactedCADStartDate(param: TDataParam): Moment {
    //     let start_date: Moment = moment(param.date_index);
    //     let tomorrow: Moment = moment(param.date_index).add(1, 'days');

    //     switch (this.cumulType) {
    //         case VarsCumulsController.CUMUL_WEEK_NAME:
    //             tomorrow = moment.min(tomorrow, moment(start_date).endOf('isoWeek'));
    //         case VarsCumulsController.CUMUL_MONTH_NAME:
    //             tomorrow = moment.min(tomorrow, moment(start_date).endOf('month'));
    //         case VarsCumulsController.CUMUL_YEAR_NAME:
    //         default:
    //             tomorrow = moment.min(tomorrow, moment(start_date).endOf('year'));
    //     }

    //     if (tomorrow.isSameOrBefore(start_date, 'days')) {
    //         return null;
    //     }
    //     return tomorrow;
    // }


    // // TODO UnitTest TestUnit On doit renvoyer la date d'impact maximale si on modifie le param passé
    // // TODO gestion des imports, on devrait pas impacter après-demain si on a un import demain
    // private getImpactedCADEndDate(param: TDataParam): Moment {
    //     if (!this.getImpactedCADStartDate(param)) {
    //         return null;
    //     }

    //     let start_date: Moment = moment(param.date_index);
    //     let last_impacted_day: Moment = moment(param.date_index).add(1, 'days');

    //     switch (this.cumulType) {
    //         case VarsCumulsController.CUMUL_WEEK_NAME:
    //             last_impacted_day = moment.max(last_impacted_day, moment(start_date).endOf('isoWeek'));
    //         case VarsCumulsController.CUMUL_MONTH_NAME:
    //             last_impacted_day = moment.max(last_impacted_day, moment(start_date).endOf('month'));
    //         case VarsCumulsController.CUMUL_YEAR_NAME:
    //         default:
    //             last_impacted_day = moment.max(last_impacted_day, moment(start_date).endOf('year'));
    //     }

    //     if (last_impacted_day.isSameOrBefore(start_date, 'days')) {
    //         return null;
    //     }
    //     return last_impacted_day;
    // }
}