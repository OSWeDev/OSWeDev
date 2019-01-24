import IVarDataVOBase from '../interfaces/IVarDataVOBase';
import IVarDataParamVOBase from '../interfaces/IVarDataParamVOBase';
import VarCacheBase from '../VarCacheBase';
import VarsController from '../VarsController';
import VarDataParamControllerBase from '../VarDataParamControllerBase';
import VarsCumulsController from './VarsCumulsController';
import ISimpleNumberVarData from '../interfaces/ISimpleNumberVarData';
import IDateIndexedVarDataParam from '../interfaces/IDateIndexedVarDataParam';
import VarConfVOBase from '../vos/VarConfVOBase';
import VarControllerBase from '../VarControllerBase';
import { Moment } from 'moment';
import * as moment from 'moment';
import { unitOfTime } from 'moment';
import DateHandler from '../../../tools/DateHandler';

export default class VarCumulControllerBase<TData extends ISimpleNumberVarData, TDataParam extends IDateIndexedVarDataParam> extends VarControllerBase<TData, TDataParam> {

    protected constructor(
        protected varConfToCumulate: VarConfVOBase,
        protected cumulType: string,
        varDataParamController: VarDataParamControllerBase<TDataParam>) {
        super(varConfToCumulate, varDataParamController);
    }

    public async initialize() {

        // On part de la conf de la data à cumuler et on en fait un cumul week
        let varConf: VarConfVOBase = Object.assign({}, this.varConf);
        varConf.id = null;
        varConf.name = VarsCumulsController.getInstance().getCumulaticName(varConf.name, this.cumulType);

        // TODO VARS : il faut déclarer les vos correspondants en base sur les modules serveurs, là c'est juste de la nommenclature....
        varConf.var_data_vo_type = VarsCumulsController.getInstance().getCumulaticName(varConf.var_data_vo_type, this.cumulType);
        varConf.var_imported_data_vo_type = VarsCumulsController.getInstance().getCumulaticName(varConf.var_imported_data_vo_type, this.cumulType);

        this.varConf = await VarsController.getInstance().registerVar(varConf, this);
    }

    public async begin_batch(BATCH_UID: number, vars_params: TDataParam[]) { }

    public async end_batch(BATCH_UID: number, vars_params: TDataParam[]) { }

    /**
     * Returns the dataparam needed to updateData of the given param. Example : Week sum of worked hours needs worked hours of each day of the given week
     * TODO REFONTE SOLDES : On a pas pris en compte les imports pour le moment ici ... c'est ce qui peut éviter de faire un calcul sur 356 jours...
     *  et accessoirement ça peut être intéressant de dire qu'il existe un min ou un supp de dates de validité du cumul (comme par exemple le plannifié
     *  qui est forcément dans le futur et donc inutile de prendre toutes les dates de l'année a priori)
     * @param BATCH_UID
     * @param param
     */
    public async getDependencies(BATCH_UID: number, param: TDataParam): Promise<TDataParam[]> {
        let res: TDataParam[] = [];

        let start_date: Moment = moment(param.date_index);
        let end_date: Moment = moment(param.date_index);

        switch (this.cumulType) {
            case VarsCumulsController.CUMUL_WEEK_NAME:
                start_date = start_date.startOf('isoWeek');
                end_date = start_date.endOf('isoWeek');
                break;
            case VarsCumulsController.CUMUL_MONTH_NAME:
                start_date = start_date.startOf('month');
                end_date = start_date.endOf('month');
                break;
            case VarsCumulsController.CUMUL_YEAR_NAME:
            default:
                start_date = start_date.startOf('year');
                end_date = start_date.endOf('year');
                break;
        }

        let date: Moment = moment(start_date);
        while (date.isSameOrBefore(end_date)) {
            let new_param: TDataParam = Object.assign({}, param);

            new_param.date_index = DateHandler.getInstance().formatDayForIndex(date);
            new_param.var_id = this.varConfToCumulate.id;
            res.push(new_param);
            date.add(1, 'day');
        }

        return res;
    }

    public async updateData(BATCH_UID: number, param: TDataParam) {
        let res: number = 0;

        let start_date: Moment = moment(param.date_index);
        let end_date: Moment = moment(param.date_index);

        switch (this.cumulType) {
            case VarsCumulsController.CUMUL_WEEK_NAME:
                start_date = start_date.startOf('isoWeek');
                end_date = start_date.endOf('isoWeek');
                break;
            case VarsCumulsController.CUMUL_MONTH_NAME:
                start_date = start_date.startOf('month');
                end_date = start_date.endOf('month');
                break;
            case VarsCumulsController.CUMUL_YEAR_NAME:
            default:
                start_date = start_date.startOf('year');
                end_date = start_date.endOf('year');
                break;
        }

        let date: Moment = moment(start_date);
        while (date.isSameOrBefore(end_date)) {
            let new_param: TDataParam = Object.assign({}, param);

            new_param.date_index = DateHandler.getInstance().formatDayForIndex(date);
            new_param.var_id = this.varConfToCumulate.id;
            let varData: ISimpleNumberVarData = VarsController.getInstance().getVarData(new_param, BATCH_UID) as ISimpleNumberVarData;
            res += (varData ? varData.value : 0);
            date.add(1, 'day');
        }

        return res;
    }
}