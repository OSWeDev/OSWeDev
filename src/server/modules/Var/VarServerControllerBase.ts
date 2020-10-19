import cloneDeep = require('lodash/cloneDeep');
import IDistantVOBase from '../../../shared/modules/IDistantVOBase';
import DAG from '../../../shared/modules/Var/graph/dagbase/DAG';
import VarDAGNode from '../../../shared/modules/Var/graph/VarDAGNode';
import MainAggregateOperatorsHandlers from '../../../shared/modules/Var/MainAggregateOperatorsHandlers';
import VarCacheConfVO from '../../../shared/modules/Var/vos/VarCacheConfVO';
import VarConfVOBase from '../../../shared/modules/Var/vos/VarConfVOBase';
import VarDataBaseVO from '../../../shared/modules/Var/vos/VarDataBaseVO';
import DAOUpdateVOHolder from '../DAO/vos/DAOUpdateVOHolder';
import DataSourceControllerBase from './datasource/DataSourceControllerBase';
import VarsServerController from './VarsServerController';
const moment = require('moment');

export default abstract class VarServerControllerBase<TData extends VarDataBaseVO> {

    /**
     * OPTIMISATION qui permet d'éviter complètement les questions de résolution des imports
     *  Par défaut on considère qu'on a aucun import sur les variables, et si jamais on doit en avoir on active cette option explicitement
     *  dans le constructeur de la Var
     */
    public optimization__has_no_imports: boolean = true;

    /**
     * OPTIMISATION qui indique qu'une var ne peut avoir que des imports indépendants, et donc sur lesquels il est inutile
     *  de vérifier lors du chargement des imports qu'ils ne s'intersectent pas (par définition ils n'intersectent pas, donc on prend tous les imports)
     */
    public optimization__has_only_atomic_imports: boolean = false;

    // /**
    //  * Permet d'indiquer au système de calcul optimisé des imports entre autre les champs qui sont déclarés par combinaison
    //  *  (et donc sur lesquels on fait une recherche exacte et pas par inclusion comme pour les champs atomiques)
    //  * On stocke le segment_type. Cela signifie que le champs est obligatoirement normalisé, et qu'on a un découpage suivant le segment_type
    //  *  en ordre croissant en base. Très important par ce que ARRAY(a,b) c'est différent de ARRAY(b,a) pour la base. Même si ça couvre les mêmes ensembles
    //  */
    // public datas_fields_type_combinatory: { [matroid_field_id: string]: number } = {};

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
    public abstract getDataSourcesDependencies(): DataSourceControllerBase[];

    /**
     * Returns the datasources this var depends on predeps
     */
    public getDataSourcesPredepsDependencies(): DataSourceControllerBase[] {
        return null;
    }

    /**
     * Returns the var_controller we depend upon (or might depend) by dependents name
     */
    public abstract getVarControllerDependencies(): { [dep_name: string]: VarServerControllerBase<any> };

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

                values.push((outgoing_dep.outgoing_node as VarDAGNode).var_data.value);
            }
            value = this.aggregateValues(values);
        } else {

            value = this.getValue(varDAGNode);
        }

        varDAGNode.var_data.value = value;
        varDAGNode.var_data.value_type = VarDataBaseVO.VALUE_TYPE_COMPUTED;
        varDAGNode.var_data.value_ts = moment().utc(true);
    }

    // TODO FIXME PEUT etre plus utile ?
    // /**
    //  * Get params that intersect with any potential parent params depending on the one in arg
    //  * WARNING : The param NEEDS to be clean => if resetable var, needs not include the reset date, ...
    //  * This is the default behaviour, using all refering vars defined in the varscontroller, and cloning the param to match that of the parent
    //  * @param param
    //  */
    // public getParamDependents(param: TData): VarDataBaseVO[] {
    //     let res: VarDataBaseVO[] = [];

    //     if (!param) {
    //         return res;
    //     }

    //     // On fait le tour des vars qui dépendent de ce param
    //     let parent_controllers: { [parent_var_id: number]: VarServerControllerBase<any> } = VarsServerController.getInstance().parent_vars_by_var_id[param.var_id];

    //     for (let parent_controlleri in parent_controllers) {
    //         let parent_controller = parent_controllers[parent_controlleri];

    //         // On clone le param et au besoin en traduisant vers le type de param cible
    //         let parent_param: VarDataBaseVO;
    //         let parent_var_data_vo_type = parent_controller.varConf.var_data_vo_type;
    //         parent_param = VarDataBaseVO.cloneFieldsFromId(parent_var_data_vo_type, parent_controller.varConf.id, param);
    //         res.push(parent_param);
    //     }

    //     return res;
    // }

    /**
     * WARNING : The param NEEDS to be clean => if resetable var, needs not include the reset date, ...
     * @param varDAGNode
     * @param varDAG
     */
    public abstract getParamDependencies(varDAGNode: VarDAGNode): { [dep_id: string]: VarDataBaseVO };

    /**
     * Fonction spécifique aux tests unitaires qui permet de tester la fonction getParamDependencies plus facilement
     *  On fabrique un faux arbre pour appeler ensuite la fonction getParamDependencies
     * @param param le var data / matroid qui sert à paramétrer le calcul
     * @param datasources_values les datas de chaque datasource, par nom du datasource
     * @param deps_values les valeurs des deps, par id de dep
     */
    public UT__getParamDependencies(param: TData, datasources_values: { [ds_name: string]: any }, deps_values: { [dep_id: string]: number }): { [dep_id: string]: VarDataBaseVO } {
        return this.getParamDependencies(this.UT__getTestVarDAGNode(param, datasources_values, deps_values));
    }

    /**
     * Fonction spécifique aux tests unitaires qui permet de tester la fonction getValue plus facilement
     *  On fabrique un faux arbre pour appeler ensuite la fonction getValue
     * @param param le var data / matroid qui sert à paramétrer le calcul
     * @param datasources_values les datas de chaque datasource, par nom du datasource
     * @param deps_values les valeurs des deps, par id de dep
     */
    public UT__getValue(param: TData, datasources_values: { [ds_name: string]: any }, deps_values: { [dep_id: string]: number }): number {
        return this.getValue(this.UT__getTestVarDAGNode(param, datasources_values, deps_values));
    }

    /**
     * Méthode appelée par les triggers de POST Create / POST Delete sur les vos dont cette var dépend (via les déclarations dans les Datasources)
     * @param c_or_d_vo le vo créé ou supprimé
     */
    public abstract get_invalid_params_intersectors_on_POST_C_POST_D(c_or_d_vo: IDistantVOBase): TData[];

    /**
     * Méthode appelée par les triggers de POST update sur les vos dont cette var dépend (via les déclarations dans les Datasources)
     * @param c_or_d_vo le vo créé ou supprimé
     */
    public abstract get_invalid_params_intersectors_on_POST_U<T extends IDistantVOBase>(u_vo_holder: DAOUpdateVOHolder<T>): TData[];

    /**
     * Méthode appelée par les triggers de POST update sur les vos dont cette var dépend (via les déclarations dans les Datasources)
     * @param c_or_d_vo le vo créé ou supprimé
     */
    public abstract get_invalid_params_intersectors_from_dep<T extends VarDataBaseVO>(dep_id: string, intersectors: T[]): TData[];

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
        let dag: DAG<VarDAGNode> = new DAG();
        let varDAGNode: VarDAGNode = VarDAGNode.getInstance(dag, param);

        for (let i in deps_values) {
            let dep_value = deps_values[i];

            varDAGNode.addOutgoingDep(i, VarDAGNode.getInstance(dag, Object.assign(cloneDeep(param), { value: dep_value })));
        }

        varDAGNode.datasources = datasources;

        return varDAGNode;
    }
}