import cloneDeep = require('lodash/cloneDeep');
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import IDistantVOBase from '../../../shared/modules/IDistantVOBase';
import DAG from '../../../shared/modules/Var/graph/dagbase/DAG';
import VarDAG from '../../../shared/modules/Var/graph/VarDAG';
import VarDAGNode from '../../../shared/modules/Var/graph/VarDAGNode';
import MainAggregateOperatorsHandlers from '../../../shared/modules/Var/MainAggregateOperatorsHandlers';
import VarCacheConfVO from '../../../shared/modules/Var/vos/VarCacheConfVO';
import VarConfVO from '../../../shared/modules/Var/vos/VarConfVO';
import VarDataBaseVO from '../../../shared/modules/Var/vos/VarDataBaseVO';
import DAOUpdateVOHolder from '../DAO/vos/DAOUpdateVOHolder';
import PerfMonConfController from '../PerfMon/PerfMonConfController';
import PerfMonServerController from '../PerfMon/PerfMonServerController';
import DataSourceControllerBase from './datasource/DataSourceControllerBase';
import VarsComputeController from './VarsComputeController';
import VarsDatasProxy from './VarsDatasProxy';
import VarsPerfMonServerController from './VarsPerfMonServerController';
import VarsServerController from './VarsServerController';

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
    public aggregateValues: (values: number[]) => number = MainAggregateOperatorsHandlers.getInstance().aggregateValues_SUM;

    protected constructor(
        public varConf: VarConfVO,
        public var_name_default_translations: { [code_lang: string]: string },
        public var_description_default_translations: { [code_lang: string]: string },
        public var_explaination_default_translations: { [code_lang: string]: string },
        public var_deps_names_default_translations: { [dep_id: string]: { [code_lang: string]: string } }
    ) {
    }

    /**
     * Pour les TUs passer un id au varconf et au varcacheconf
     */
    public async initialize() {
        this.varConf = await VarsServerController.getInstance().registerVar(this.varConf, this);
        let var_cache_conf = this.getVarCacheConf();
        this.var_cache_conf = (var_cache_conf && !var_cache_conf.id) ? await VarsServerController.getInstance().configureVarCache(this.varConf, var_cache_conf) : var_cache_conf;
    }

    public getVarCacheConf(): VarCacheConfVO {
        let res: VarCacheConfVO = new VarCacheConfVO();
        res.var_id = this.varConf.id;

        res.estimated_compute_node_1k_card = 1000;
        res.estimated_ctree_ddeps_get_node_deps_1k_card = 1000;
        res.estimated_ctree_ddeps_handle_pixellisation_1k_card = 1000;
        res.estimated_ctree_ddeps_load_imports_and_split_nodes_1k_card = 1000;
        res.estimated_ctree_ddeps_try_load_cache_complet_1k_card = 1000;
        res.estimated_ctree_ddeps_try_load_cache_partiel_1k_card = 1000;
        res.estimated_load_nodes_datas_1k_card = 1000;
        return res;
    }

    /**
     * Returns the datasources this var depends on
     */
    public getDataSourcesDependencies(): DataSourceControllerBase[] {
        return null;
    }

    /**
     * Returns the datasources this var depends on predeps
     */
    public getDataSourcesPredepsDependencies(): DataSourceControllerBase[] {
        return null;
    }

    /**
     * Returns the var_controller we depend upon (or might depend) by dependents name
     */
    public getVarControllerDependencies(): { [dep_name: string]: VarServerControllerBase<any> } {
        return null;
    }

    /**
     * Fonction de calcul de la valeur pour ce param et stockage dans le var_data du noeud
     *  Si on est sur un noeud aggrégé, on calcul via la fonction d'aggrégat, sinon on calcul par la fonction getValue
     * @param varDAGNode
     */
    public async computeValue(varDAGNode: VarDAGNode) {

        await PerfMonServerController.getInstance().monitor_async(
            PerfMonConfController.getInstance().perf_type_by_name[VarsPerfMonServerController.PML__VarServerControllerBase__computeValue],
            async () => {

                let value: number;
                if (varDAGNode.is_aggregator) {

                    let values: number[] = [];

                    for (let i in varDAGNode.outgoing_deps) {
                        let dep = varDAGNode.outgoing_deps[i];

                        values.push((dep.outgoing_node as VarDAGNode).var_data.value);
                    }
                    value = this.aggregateValues(values);
                } else {

                    value = this.getValue(varDAGNode);
                }

                varDAGNode.var_data.value = value;
                varDAGNode.var_data.value_type = VarDataBaseVO.VALUE_TYPE_COMPUTED;
                varDAGNode.var_data.value_ts = Dates.now();
                await VarsDatasProxy.getInstance().update_existing_buffered_older_datas([varDAGNode.var_data]);
            },
            this,
            null,
            VarsPerfMonServerController.getInstance().generate_pmlinfos_from_node(varDAGNode)
        );
    }

    /**
     * WARNING : The param NEEDS to be clean => if resetable var, needs not include the reset date, ...
     * WARNING : the dep_id is UNIQUE amonst ALL varcontrollers
     * @param varDAGNode
     * @param varDAG
     */
    public getParamDependencies(varDAGNode: VarDAGNode): { [dep_id: string]: VarDataBaseVO } {
        return null;
    }

    /**
     * Fonction spécifique aux tests unitaires qui permet de tester la fonction getParamDependencies plus facilement
     *  On fabrique un faux arbre pour appeler ensuite la fonction getParamDependencies
     * @param param le var data / matroid qui sert à paramétrer le calcul
     * @param datasources_values les datas de chaque datasource, par nom du datasource
     * @param deps_values les valeurs des deps, par id de dep
     */
    public UT__getParamDependencies(param: TData, datasources_values: { [ds_name: string]: any }, deps_values: { [dep_id: string]: number } = null): { [dep_id: string]: VarDataBaseVO } {
        return this.getParamDependencies(this.UT__getTestVarDAGNode(param, datasources_values, deps_values));
    }

    /**
     * Fonction spécifique aux tests unitaires qui permet de tester la fonction getValue plus facilement
     *  On fabrique un faux arbre pour appeler ensuite la fonction getValue
     * @param param le var data / matroid qui sert à paramétrer le calcul
     * @param datasources_values les datas de chaque datasource, par nom du datasource
     * @param deps_values les valeurs des deps, par id de dep
     */
    public UT__getValue(param: TData, datasources_values: { [ds_name: string]: any } = null, deps_values: { [dep_id: string]: number } = null): number {
        return this.getValue(this.UT__getTestVarDAGNode(param, datasources_values, deps_values));
    }

    /**
     * ATTENTION à redéfinir si on a des datasources - la valeur par défaut de la fonction est pour le cas d'une var sans datasource
     * Méthode appelée par les triggers de POST Create / POST Delete sur les vos dont cette var dépend (via les déclarations dans les Datasources)
     *  Par défaut si on a pas de Datasources on renvoie null.
     * @param c_or_d_vo le vo créé ou supprimé
     */
    public async get_invalid_params_intersectors_on_POST_C_POST_D(c_or_d_vo: IDistantVOBase): Promise<TData[]> {
        return null;
    }

    /**
     * ATTENTION à redéfinir si on a des datasources - la valeur par défaut de la fonction est pour le cas d'une var sans datasource
     * Méthode appelée par les triggers de POST update sur les vos dont cette var dépend (via les déclarations dans les Datasources)
     * @param c_or_d_vo le vo créé ou supprimé
     */
    public async get_invalid_params_intersectors_on_POST_U<T extends IDistantVOBase>(u_vo_holder: DAOUpdateVOHolder<T>): Promise<TData[]> {
        return null;
    }

    /**
     * ATTENTION à redéfinir si on a des dépendances - la valeur par défaut de la fonction est pour le cas d'une var sans dépendances
     * Méthode appelée par les triggers de POST update sur les vos dont cette var dépend (via les déclarations dans les Datasources)
     *  Async pour permettre de vérifier des datas en base au besoin pour résoudre le plus précisément possible cette demande.
     *      Il vaut mieux une requête que 10 vars invalidées par erreur qui déclencheront probablement plus de 10 requetes en DS
     * @param c_or_d_vo le vo créé ou supprimé
     */
    public async get_invalid_params_intersectors_from_dep<T extends VarDataBaseVO>(dep_id: string, intersectors: T[]): Promise<TData[]> {
        return null;
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
    private UT__getTestVarDAGNode(param: TData, datasources: { [ds_name: string]: any } = null, deps_values: { [dep_id: string]: number } = null): VarDAGNode {
        let dag: VarDAG = new VarDAG(null);
        let varDAGNode: VarDAGNode = VarDAGNode.getInstance(dag, param, VarsComputeController);

        if (!varDAGNode) {
            return null;
        }

        let deps = this.getParamDependencies(varDAGNode);

        for (let i in deps) {
            let dep_value = deps_values ? deps_values[i] : undefined;

            let var_dag_node_dep = VarDAGNode.getInstance(dag, Object.assign(cloneDeep(param), { value: dep_value }), VarsComputeController);
            if (!var_dag_node_dep) {
                return null;
            }

            varDAGNode.addOutgoingDep(i, var_dag_node_dep);
        }

        varDAGNode.datasources = datasources;

        return varDAGNode;
    }
}