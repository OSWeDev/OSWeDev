import cloneDeep = require('lodash/cloneDeep');
import ConsoleHandler from '../../tools/ConsoleHandler';
import IDataSourceController from '../DataSource/interfaces/IDataSourceController';
import IMatroid from '../Matroid/interfaces/IMatroid';
import VarDAG from './graph/var/VarDAG';
import VarDAGNode from './graph/var/VarDAGNode';
import ISimpleNumberVarMatroidData from './interfaces/ISimpleNumberVarMatroidData';
import IVarDataParamVOBase from './interfaces/IVarDataParamVOBase';
import IVarDataVOBase from './interfaces/IVarDataVOBase';
import ModuleVar from './ModuleVar';
import VarDataParamControllerBase from './VarDataParamControllerBase';
import VarsController from './VarsController';
import VarCacheConfVO from './vos/VarCacheConfVO';
import VarConfVOBase from './vos/VarConfVOBase';
import IVarMatroidDataVO from './interfaces/IVarMatroidDataVO';
const moment = require('moment');

export default abstract class VarControllerBase<TData extends IVarDataVOBase & TDataParam, TDataParam extends IVarDataParamVOBase> {

    /**
     * Used for every segmented data, defaults to day segmentation. Used for cumuls, and refining use of the param.date_index
     */
    public abstract segment_type: number;

    /**
     * Déclarer une var comme calculable côté serveur
     */
    public is_computable_server_side: boolean = true;

    /**
     * Déclarer une var comme calculable côté client
     */
    public is_computable_client_side: boolean = true;

    /**
     * On declare passer par le système de calcul optimisé des imports plutôt que par le système standard.
     *  ça optimise énormément les calculs mais ça nécessite des paramètrages et c'est pas toujours compatible
     */
    public can_use_optimized_imports_calculation: boolean = false;

    /**
     * Permet d'indiquer au système de calcul optimisé des imports entre autre les champs qui sont déclarés par combinaison
     *  (et donc sur lesquels on fait une recherche exacte et pas par inclusion comme pour les champs atomiques)
     * On stocke le segment_type. Cela signifie que le champs est obligatoirement normalisé, et qu'on a un découpage suivant le segment_type
     *  en ordre croissant en base. Très important par ce que ARRAY(a,b) c'est différent de ARRAY(b,a) pour la base. Même si ça couvre les mêmes ensembles
     */
    public datas_fields_type_combinatory: { [matroid_field_id: string]: number } = {};

    /**
     * Déclarer qu'une var n'utilise que des imports et/ou precompiled qui sont dissociés - cardinal 1 (atomiques)
     */
    public has_only_atomique_imports_or_precompiled_datas: boolean = false;

    /**
     * Déclarer une var comme pouvant utiliser des datas precompilées ou importées côté serveur
     */
    public can_load_precompiled_or_imported_datas_server_side: boolean = true;

    /**
     * Déclarer une var comme pouvant utiliser des datas precompilées ou importées côté client
     * ATTENTION si on utilise du cache ou un calcul côté serveur de manière générale, il faut autoriser à envoyer la requête donc c'est true client, false ou true server side
     * O ne met false aux 2 que pour empêcher tout import et tout cache, donc forcer le calcul côté client.
     */
    public can_load_precompiled_or_imported_datas_client_side: boolean = true;

    public var_cache_conf: VarCacheConfVO = null;

    protected constructor(
        public varConf: VarConfVOBase,
        public varDataParamController: VarDataParamControllerBase<TData, TDataParam>) {
    }

    public async initialize() {
        this.varConf = await VarsController.getInstance().registerVar(this.varConf, this);

        let var_cache_conf = this.getVarCacheConf();
        this.var_cache_conf = var_cache_conf ? await ModuleVar.getInstance().configureVarCache(this.varConf, var_cache_conf) : var_cache_conf;
    }

    public getVarCacheConf(): VarCacheConfVO {
        return null;
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

    /**
     * ATTENTION : on ne compute que sur un matroid. Sous entendu si on a un import qui scinde en 2 le param, on doit pouvoir calculer
     *  en faisant import + calculA + calculB sinon on doit absolument interdire les imports sur cette variable => ça veut dire aussi pas de cache partiel,
     *  on doit avoir un cache exact.
     * @param varDAGNode 
     * @param varDAG 
     */
    public computeValue(varDAGNode: VarDAGNode, varDAG: VarDAG) {

        let res: TData = null;

        if ((!!varDAGNode.computed_datas_matroids) && (!!varDAGNode.loaded_datas_matroids)) {

            // Si on est sur des matroids, on doit créer la réponse nous mêmes
            //  en additionnant les imports/précalculs + les res de calcul des computed matroids
            let res_matroid: ISimpleNumberVarMatroidData = Object.assign({}, varDAGNode.param as TDataParam) as any;

            res_matroid.value = varDAGNode.loaded_datas_matroids_sum_value;

            for (let i in varDAGNode.computed_datas_matroids) {
                let data_matroid_to_compute = varDAGNode.computed_datas_matroids[i];

                let computed_datas_matroid_res: ISimpleNumberVarMatroidData = this.updateData(varDAGNode, varDAG, data_matroid_to_compute) as any;

                if ((res_matroid.value === null) || (typeof res_matroid.value === 'undefined')) {
                    res_matroid.value = computed_datas_matroid_res.value;
                } else {
                    res_matroid.value += computed_datas_matroid_res.value;
                }
            }

            res = res_matroid as any;
        } else {
            res = this.updateData(varDAGNode, varDAG);
        }

        if (!res) {
            ConsoleHandler.getInstance().error('updateData should return res anyway');
            res = cloneDeep(varDAGNode.param) as TData;
            res.value_type = VarsController.VALUE_TYPE_COMPUTED;
        }

        VarsController.getInstance().setVarData(res, true);
    }

    /**
     * Get params that intersect with any potential parent params depending on the one in arg
     * WARNING : The param NEEDS to be clean => if resetable var, needs not include the reset date, ...
     * @param param
     */
    public abstract getParamDependents(param: IVarDataParamVOBase): IVarDataParamVOBase[];

    /**
     * WARNING : The param NEEDS to be clean => if resetable var, needs not include the reset date, ...
     * @param varDAGNode
     * @param varDAG
     */
    public abstract getParamDependencies(
        varDAGNode: VarDAGNode,
        varDAG: VarDAG): IVarDataParamVOBase[];

    protected abstract updateData(varDAGNode: VarDAGNode, varDAG: VarDAG, matroid_to_compute?: IMatroid): TData;
}