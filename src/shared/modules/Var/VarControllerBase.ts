import * as clonedeep from 'lodash/clonedeep';
import TimeSegmentHandler from '../../tools/TimeSegmentHandler';
import TimeSegment from '../DataRender/vos/TimeSegment';
import IDataSourceController from '../DataSource/interfaces/IDataSourceController';
import VarDAG from './graph/var/VarDAG';
import VarDAGNode from './graph/var/VarDAGNode';
import IDateIndexedVarDataParam from './interfaces/IDateIndexedVarDataParam';
import ISimpleNumberVarMatroidData from './interfaces/ISimpleNumberVarMatroidData';
import IVarDataParamVOBase from './interfaces/IVarDataParamVOBase';
import IVarDataVOBase from './interfaces/IVarDataVOBase';
import VarDataParamControllerBase from './VarDataParamControllerBase';
import VarsController from './VarsController';
import VarConfVOBase from './vos/VarConfVOBase';
import moment = require('moment');
import IMatroid from '../Matroid/interfaces/IMatroid';

export default abstract class VarControllerBase<TData extends IVarDataVOBase & TDataParam, TDataParam extends IVarDataParamVOBase> {

    /**
     * Used for every segmented data, defaults to day segmentation. Used for cumuls, and refining use of the param.date_index
     */
    public abstract segment_type: number;

    protected constructor(
        public varConf: VarConfVOBase,
        public varDataParamController: VarDataParamControllerBase<TData, TDataParam>) {
    }

    public async initialize() {
        this.varConf = await VarsController.getInstance().registerVar(this.varConf, this);
    }

    /**
     * Returns the datasources this var depends on
     */
    public abstract getDataSourcesDependencies(): Array<IDataSourceController<any, any>>;

    /**
     * Returns the datasources this var depends on predeps
     */
    public getDataSourcesPredepsDependencies(): Array<IDataSourceController<any, any>> {
        return null;
    }

    /**
     * Returns the var_ids that we depend upon (or might depend)
     */
    public abstract getVarsIdsDependencies(): number[];

    public async computeValue(varDAGNode: VarDAGNode, varDAG: VarDAG) {

        let res: TData = null;

        if ((!!varDAGNode.computed_datas_matroids) && (!!varDAGNode.loaded_datas_matroids)) {

            // Si on est sur des matroids, on doit créer la réponse nous mêmes
            //  en additionnant les imports/précalculs + les res de calcul des computed matroids
            //  le datafound est true si l'un des computed est true
            let res_matroid: ISimpleNumberVarMatroidData = Object.assign({}, varDAGNode.param as TDataParam) as any;

            res_matroid.value = varDAGNode.loaded_datas_matroids_sum_value;

            for (let i in varDAGNode.computed_datas_matroids) {
                let data_matroid_to_compute = varDAGNode.computed_datas_matroids[i];

                let computed_datas_matroid_res: ISimpleNumberVarMatroidData = await this.updateData(varDAGNode, varDAG, data_matroid_to_compute) as any;

                if (res_matroid.value == null) {
                    res_matroid.value = computed_datas_matroid_res.value;
                } else {
                    res_matroid.value += computed_datas_matroid_res.value;
                }
            }

            res = res_matroid as any;
        } else {
            res = await this.updateData(varDAGNode, varDAG);
        }

        if (!res) {
            console.error('updateData should return res anyway');
            res = clonedeep(varDAGNode.param);
            res.value_type = VarsController.VALUE_TYPE_COMPUTED;
        }

        // On aggrège au passage les missing_datas_infos des childs vers ce noeud :
        if ((typeof res.missing_datas_infos === 'undefined') || (!res.missing_datas_infos)) {
            res.missing_datas_infos = [];
        }

        for (let i in varDAGNode.outgoingNames) {
            let outgoing_name = varDAGNode.outgoingNames[i];
            let outgoing_data = VarsController.getInstance().getVarData(varDAGNode.outgoing[outgoing_name].param, true);

            if (outgoing_data && outgoing_data.missing_datas_infos && outgoing_data.missing_datas_infos.length) {

                res.missing_datas_infos = res.missing_datas_infos.concat(outgoing_data.missing_datas_infos);
            }
        }

        VarsController.getInstance().setVarData(res, true);
    }

    public async getSegmentedParamDependencies(
        varDAGNode: VarDAGNode,
        varDAG: VarDAG): Promise<IVarDataParamVOBase[]> {

        let res: IVarDataParamVOBase[] = await this.getParamDependencies(varDAGNode, varDAG);
        let res_: IVarDataParamVOBase[] = [];

        for (let i in res) {

            let param = res[i];

            // TODO FIXME ASAP VARS : On intègre ici et dans le Varscontroller la gestion du reset des compteurs,
            //  puisque [0, 50] sur un reset à 30 ça équivaut strictement à [30,50]

            let check_res: boolean = VarsController.getInstance().check_tsrange_on_resetable_var(param);
            if (!check_res) {
                continue;
            }

            // DIRTY : on fait un peu au pif ici un filtre sur le date_index...

            if (!!(param as IDateIndexedVarDataParam).date_index) {
                (param as IDateIndexedVarDataParam).date_index = VarsController.getInstance().getVarControllerById(param.var_id).getTimeSegment(param).dateIndex;
            }

            res_.push(param);
        }

        return res_;
    }

    /**
     * NEEDS to go protected
     */
    public async abstract getParamDependencies(
        varDAGNode: VarDAGNode,
        varDAG: VarDAG): Promise<IVarDataParamVOBase[]>;

    protected getTimeSegment(param: TDataParam): TimeSegment {
        let date_index: string = ((param as any) as IDateIndexedVarDataParam).date_index;

        return TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(moment(date_index), this.segment_type);
    }

    protected async abstract updateData(varDAGNode: VarDAGNode, varDAG: VarDAG, matroid_to_compute?: IMatroid): Promise<TData>;

    protected push_missing_datas_infos(var_data: TData, translatable_code: string) {
        if (!var_data) {
            return;
        }

        if (!var_data.missing_datas_infos) {
            var_data.missing_datas_infos = [];
        }

        var_data.missing_datas_infos.push(translatable_code);
    }
}