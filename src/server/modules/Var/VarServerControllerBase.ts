import cloneDeep = require('lodash/cloneDeep');
import DataSourceControllerBase from '../../../shared/modules/DataSource/DataSourceControllerBase';
import VarDAG from '../../../shared/modules/Var/graph/VarDAG';
import VarDAGNode from '../../../shared/modules/Var/graph/VarDAGNode';
import MainAggregateOperatorsHandlers from '../../../shared/modules/Var/MainAggregateOperatorsHandlers';
import VarCacheConfVO from '../../../shared/modules/Var/vos/VarCacheConfVO';
import VarConfVOBase from '../../../shared/modules/Var/vos/VarConfVOBase';
import VarDataBaseVO from '../../../shared/modules/Var/vos/VarDataBaseVO';
import VarsServerController from './VarsServerController';
const moment = require('moment');

export default abstract class VarServerControllerBase<TData extends VarDataBaseVO> {

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
    protected aggregateValues: (values: number[]) => number = MainAggregateOperatorsHandlers.getInstance().aggregateValues_SUM;

    protected constructor(public varConf: VarConfVOBase) {
    }

    public async initialize() {
        this.varConf = await VarsServerController.getInstance().registerVar(this.varConf, this);
        let var_cache_conf = this.getVarCacheConf();
        this.var_cache_conf = var_cache_conf ? await VarsServerController.getInstance().configureVarCache(this.varConf, var_cache_conf) : var_cache_conf;
    }

    public getVarCacheConf(): VarCacheConfVO {
        return null;
    }

    /**
     * Returns the datasources this var depends on
     */
    public abstract getDataSourcesDependencies(): Array<DataSourceControllerBase<any>>;

    /**
     * Returns the datasources this var depends on predeps
     */
    public getDataSourcesPredepsDependencies(): Array<DataSourceControllerBase<any>> {
        return null;
    }

    /**
     * Returns the var_ids that we depend upon (or might depend)
     */
    public abstract getVarsIdsDependencies(): number[];

    /**
     * Fonction de calcul de la valeur pour ce param et stockage dans le var_data du noeud
     *  Si on est sur un noeud aggrégé, on calcul via la fonction d'aggrégat, sinon on calcul par la fonction getValue
     * @param varDAGNode
     */
    public computeValue(varDAGNode: VarDAGNode) {

        let value: number;
        if (varDAGNode.is_aggregator) {

            let values: number[] = [];

            for (let i in varDAGNode.outgoing_deps) {
                let outgoing_dep = varDAGNode.outgoing_deps[i];

                values.push(outgoing_dep.outgoing_node.var_data.value);
            }
            value = this.aggregateValues(values);
        } else {

            value = this.getValue(varDAGNode);
        }

        varDAGNode.var_data.value = value;
        varDAGNode.var_data.value_type = VarDataBaseVO.VALUE_TYPE_COMPUTED;
        varDAGNode.var_data.value_ts = moment().utc(true);
    }

    /**
     * Get params that intersect with any potential parent params depending on the one in arg
     * WARNING : The param NEEDS to be clean => if resetable var, needs not include the reset date, ...
     * This is the default behaviour, using all refering vars defined in the varscontroller, and cloning the param to match that of the parent
     * @param param
     */
    public getParamDependents(param: TData): VarDataBaseVO[] {
        let res: VarDataBaseVO[] = [];

        if (!param) {
            return res;
        }

        // On fait le tour des vars qui dépendent de ce param
        let parent_controllers: { [parent_var_id: number]: VarServerControllerBase<any> } = VarsServerController.getInstance().parent_vars_by_var_id[param.var_id];

        for (let parent_controlleri in parent_controllers) {
            let parent_controller = parent_controllers[parent_controlleri];

            // On clone le param et au besoin en traduisant vers le type de param cible
            let parent_param: VarDataBaseVO;
            let parent_var_data_vo_type = parent_controller.varConf.var_data_vo_type;
            parent_param = VarDataBaseVO.cloneFieldsFromId(parent_var_data_vo_type, parent_controller.varConf.id, param);
            res.push(parent_param);
        }

        return res;
    }

    /**
     * WARNING : The param NEEDS to be clean => if resetable var, needs not include the reset date, ...
     * @param varDAGNode
     * @param varDAG
     */
    public abstract getParamDependencies(varDAGNode: VarDAGNode);

    /**
     * Fonction spécifique aux tests unitaires qui permet de tester la fonction getParamDependencies plus facilement
     *  On fabrique un faux arbre pour appeler ensuite la fonction getParamDependencies
     * @param param le var data / matroid qui sert à paramétrer le calcul
     * @param datasources les datas de chaque datasource, par nom du datasource
     * @param deps_values les valeurs des deps, par id de dep
     */
    public UT__getParamDependencies(param: TData, datasources: { [ds_name: string]: any }, deps_values: { [dep_id: string]: number }): number {
        return this.getParamDependencies(this.UT__getTestVarDAGNode(param, datasources, deps_values));
    }

    /**
     * Fonction spécifique aux tests unitaires qui permet de tester la fonction getValue plus facilement
     *  On fabrique un faux arbre pour appeler ensuite la fonction getValue
     * @param param le var data / matroid qui sert à paramétrer le calcul
     * @param datasources les datas de chaque datasource, par nom du datasource
     * @param deps_values les valeurs des deps, par id de dep
     */
    public UT__getValue(param: TData, datasources: { [ds_name: string]: any }, deps_values: { [dep_id: string]: number }): number {
        return this.getValue(this.UT__getTestVarDAGNode(param, datasources, deps_values));
    }

    /**
     * La fonction de calcul, qui doit utiliser directement les datasources préchargés disponibles dans le noeud (.datasources)
     *  et les outgoing_deps.var_data.value pour récupérer les valeurs des deps
     * @param varDAGNode Le noeud à calculer
     */
    protected abstract getValue(varDAGNode: VarDAGNode): number;

    /**
     * Fonction spécifique aux tests unitaires qui permet de créer un faux arbre pour avec les paramètres du test pour appeler
     *  la fonction à tester beaucoup plus facilement
     * @param param le var data / matroid qui sert à paramétrer le calcul
     * @param datasources les datas de chaque datasource, par nom du datasource
     * @param deps_values les valeurs des deps, par id de dep
     */
    private UT__getTestVarDAGNode(param: TData, datasources: { [ds_name: string]: any }, deps_values: { [dep_id: string]: number }): VarDAGNode {
        let dag: VarDAG = new VarDAG();
        let varDAGNode: VarDAGNode = VarDAGNode.getInstance(dag, param);

        for (let i in deps_values) {
            let dep_value = deps_values[i];

            varDAGNode.addOutgoingDep(i, VarDAGNode.getInstance(dag, Object.assign(cloneDeep(param), { value: dep_value })));
        }

        varDAGNode.datasources = datasources;

        return varDAGNode;
    }
}