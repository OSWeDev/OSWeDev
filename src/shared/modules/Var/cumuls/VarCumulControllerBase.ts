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

    public async begin_batch(BATCH_UID: number, vars_params: { [index: string]: TDataParam }, imported_datas: { [var_id: number]: { [param_index: string]: TData } }) { }

    public async end_batch(BATCH_UID: number, vars_params: { [index: string]: TDataParam }, imported_datas: { [var_id: number]: { [param_index: string]: TData } }) { }

    /**
     * Returns the var_ids that we depend upon (or might depend)
     * @param BATCH_UID
     */
    public async getVarsIdsDependencies(BATCH_UID: number): Promise<number[]> {
        return [this.varConfToCumulate.id];
    }

    /**
     * Returns the dataparam needed to updateData of the given param. Example : Week sum of worked hours needs worked hours of each day of the given week
     * TODO REFONTE SOLDES : On a pas pris en compte les imports pour le moment ici ... c'est ce qui peut éviter de faire un calcul sur 356 jours...
     *  et accessoirement ça peut être intéressant de dire qu'il existe un min ou un supp de dates de validité du cumul (comme par exemple le plannifié
     *  qui est forcément dans le futur et donc inutile de prendre toutes les dates de l'année a priori)
     * On est sur une logique de cumul à date, donc en fait si on demande explicitement le 3/01 en cumul annuel, c'est en fait 01 + 02 + 03 et c'est tout.
     * Si on veut l'année complète (en opposition aux timesegments) on demande le 31/12
     * @param BATCH_UID
     * @param param
     */
    public async getParamsDependencies(
        BATCH_UID: number,
        param: TDataParam, params_by_vars_ids: { [var_id: number]: { [index: string]: TDataParam } },
        imported_datas: { [var_id: number]: { [param_index: string]: TData } }): Promise<TDataParam[]> {
        let res: TDataParam[] = [];

        let start_date: Moment = this.getCADStartDate(param);
        let end_date: Moment = this.getCADEndDate(param);

        let date: Moment = moment(start_date);
        while (date.isSameOrBefore(end_date)) {
            let new_param: TDataParam = Object.assign({}, param);
            let new_cumul_param: TDataParam = Object.assign({}, param);

            new_cumul_param.date_index = DateHandler.getInstance().formatDayForIndex(date);
            new_param.date_index = DateHandler.getInstance().formatDayForIndex(date);
            new_param.var_id = this.varConfToCumulate.id;

            // Si on a un import, on peut ignorer le passé et demander les deps à partir de cette date uniquement
            let cumul_param_index: string = this.varDataParamController.getIndex(new_cumul_param);
            if (imported_datas && imported_datas[this.varConf.id] && imported_datas[this.varConf.id][cumul_param_index]) {
                res = [new_param];
            } else {
                res.push(new_param);
            }

            date.add(1, 'day');
        }

        return res;
    }

    public async updateData(BATCH_UID: number, param: TDataParam, imported_datas: { [var_id: number]: { [param_index: string]: TData } }) {
        let start_date: Moment = this.getCADStartDate(param);
        let end_date: Moment = this.getCADEndDate(param);

        let res: TData = Object.assign(this.varDataConstructor(), param);
        res.typesInfo = [];
        res.var_id = this.varConf.id;
        res.date_index = DateHandler.getInstance().formatDayForIndex(end_date);
        res.value = 0;

        // Si importée, on

        let date: Moment = moment(start_date);
        while (date.isSameOrBefore(end_date)) {
            let new_param: TDataParam = Object.assign({}, param);
            let new_cumul_param: TDataParam = Object.assign({}, param);

            new_param.date_index = DateHandler.getInstance().formatDayForIndex(date);
            new_cumul_param.date_index = DateHandler.getInstance().formatDayForIndex(date);
            new_param.var_id = this.varConfToCumulate.id;

            // Si on a un import pour cette date on remet le cumul à cette valeur et on ignore la var dépendante
            let cumul_param_index: string = this.varDataParamController.getIndex(new_cumul_param);
            if (imported_datas && imported_datas[this.varConf.id] && imported_datas[this.varConf.id][cumul_param_index]) {
                res.value = imported_datas[this.varConf.id][cumul_param_index].value;
            } else {
                let varData: ISimpleNumberVarData = VarsController.getInstance().getVarData(new_param, true) as ISimpleNumberVarData;
                res.value += (varData ? varData.value : 0);
            }

            date.add(1, 'day');
        }

        VarsController.getInstance().setVarData(res, true);
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
        let start_date: Moment = moment(param.date_index);

        switch (this.cumulType) {
            case VarsCumulsController.CUMUL_WEEK_NAME:
                return moment.min(start_date, moment(start_date).endOf('isoWeek'));
            case VarsCumulsController.CUMUL_MONTH_NAME:
                return moment.min(start_date, moment(start_date).endOf('month'));
            case VarsCumulsController.CUMUL_YEAR_NAME:
            default:
                return moment.min(start_date, moment(start_date).endOf('year'));
        }
    }
}