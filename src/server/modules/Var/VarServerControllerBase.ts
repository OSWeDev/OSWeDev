import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import IDistantVOBase from '../../../shared/modules/IDistantVOBase';
import StatsController from '../../../shared/modules/Stats/StatsController';
import MainAggregateOperatorsHandlers from '../../../shared/modules/Var/MainAggregateOperatorsHandlers';
import VarDAGNode from '../../modules/Var/vos/VarDAGNode';
import VarConfVO from '../../../shared/modules/Var/vos/VarConfVO';
import VarDataBaseVO from '../../../shared/modules/Var/vos/VarDataBaseVO';
import PromisePipeline from '../../../shared/tools/PromisePipeline/PromisePipeline';
import ConfigurationService from '../../env/ConfigurationService';
import DAOUpdateVOHolder from '../DAO/vos/DAOUpdateVOHolder';
import VarsServerController from './VarsServerController';
import DataSourceControllerBase from './datasource/DataSourceControllerBase';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';

export default abstract class VarServerControllerBase<TData extends VarDataBaseVO> {

    /**
     * DIRTY : workaround pour le typage de this, dans le cadre de l'usage de get_cloned_invalidators_from_dep_controller(this) qui ne comprend pas le typage de this directement, mais de this.self_instance
     */
    public self_instance: VarServerControllerBase<TData> = this;

    // /**
    //  * Permet d'indiquer au système de calcul optimisé des imports entre autre les champs qui sont déclarés par combinaison
    //  *  (et donc sur lesquels on fait une recherche exacte et pas par inclusion comme pour les champs atomiques)
    //  * On stocke le segment_type. Cela signifie que le champs est obligatoirement normalisé, et qu'on a un découpage suivant le segment_type
    //  *  en ordre croissant en base. Très important par ce que ARRAY(a,b) c'est différent de ARRAY(b,a) pour la base. Même si ça couvre les mêmes ensembles
    //  */
    // public datas_fields_type_combinatory: { [matroid_field_id: string]: number } = {};

    protected constructor(
        public varConf: VarConfVO,
        public var_name_default_translations: { [code_lang: string]: string },
        public var_description_default_translations: { [code_lang: string]: string },
        public var_explaination_default_translations: { [code_lang: string]: string },
        public var_deps_names_default_translations: { [dep_id: string]: { [code_lang: string]: string } }
    ) {
    }

    public aggregateValues(values: number[]): number {

        switch (this.varConf.aggregator) {
            case VarConfVO.SUM_AGGREGATOR:
                return MainAggregateOperatorsHandlers.getInstance().aggregateValues_SUM(values);

            case VarConfVO.TIMES_AGGREGATOR:
                return MainAggregateOperatorsHandlers.getInstance().aggregateValues_TIMES(values);

            case VarConfVO.MAX_AGGREGATOR:
                return MainAggregateOperatorsHandlers.getInstance().aggregateValues_MAX(values);

            case VarConfVO.MIN_AGGREGATOR:
                return MainAggregateOperatorsHandlers.getInstance().aggregateValues_MIN(values);

            case VarConfVO.AND_AGGREGATOR:
                return MainAggregateOperatorsHandlers.getInstance().aggregateValues_AND(values);

            case VarConfVO.OR_AGGREGATOR:
                return MainAggregateOperatorsHandlers.getInstance().aggregateValues_OR(values);

            case VarConfVO.XOR_AGGREGATOR:
                return MainAggregateOperatorsHandlers.getInstance().aggregateValues_XOR(values);

            case VarConfVO.AVG_AGGREGATOR:
                return MainAggregateOperatorsHandlers.getInstance().aggregateValues_AVG(values);

            case VarConfVO.NO_AGGREGATOR:
            default:
                throw new Error('VarServerControllerBase: aggregateValues: aggregator not implemented: ' + this.varConf.aggregator);
        }
    }

    /**
     * Pour les TUs passer un id au varconf et au varcacheconf
     */
    public async initialize() {
        this.varConf = await VarsServerController.registerVar(this.varConf, this);
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
    public computeValue(varDAGNode: VarDAGNode) {

        StatsController.register_stat_COMPTEUR('VarServerControllerBase', 'computeValue', this.varConf.name);
        const time_in = Dates.now_ms();

        let value: number;
        if (varDAGNode.is_aggregator) {

            const values: number[] = [];

            for (const i in varDAGNode.outgoing_deps) {
                const dep = varDAGNode.outgoing_deps[i];

                values.push((dep.outgoing_node as VarDAGNode).var_data.value);
            }
            value = this.aggregateValues(values);
        } else {

            value = this.getValue(varDAGNode);
        }

        varDAGNode.var_data.value = value;
        varDAGNode.var_data.value_type = VarDataBaseVO.VALUE_TYPE_COMPUTED;
        varDAGNode.var_data.value_ts = Dates.now();
        // await VarsDatasProxy.update_existing_buffered_older_datas([varDAGNode.var_data], 'computeValue');

        const time_out = Dates.now_ms();
        StatsController.register_stat_DUREE('VarServerControllerBase', 'computeValue', this.varConf.name, time_out - time_in);
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

    // /**
    //  * Fonction spécifique aux tests unitaires qui permet de tester la fonction getParamDependencies plus facilement
    //  *  On fabrique un faux arbre pour appeler ensuite la fonction getParamDependencies
    //  * @param param le var data / matroid qui sert à paramétrer le calcul
    //  * @param datasources_values les datas de chaque datasource, par nom du datasource
    //  * @param deps_values les valeurs des deps, par id de dep
    //  */
    // public async UT__getParamDependencies(param: TData, datasources_values: { [ds_name: string]: any }, deps_values: { [dep_id: string]: number } = null): Promise<{ [dep_id: string]: VarDataBaseVO }> {
    //     return this.getParamDependencies(await this.UT__getTestVarDAGNode(param, datasources_values, deps_values));
    // }

    // /**
    //  * Fonction spécifique aux tests unitaires qui permet de tester la fonction getValue plus facilement
    //  *  On fabrique un faux arbre pour appeler ensuite la fonction getValue
    //  * @param param le var data / matroid qui sert à paramétrer le calcul
    //  * @param datasources_values les datas de chaque datasource, par nom du datasource
    //  * @param deps_values les valeurs des deps, par id de dep
    //  */
    // public async UT__getValue(param: TData, datasources_values: { [ds_name: string]: any } = null, deps_values: { [dep_id: string]: number } = null): Promise<number> {
    //     return this.getValue(await this.UT__getTestVarDAGNode(param, datasources_values, deps_values));
    // }

    /**
     * Stats wrapper for get_invalid_params_intersectors_on_POST_C_POST_D_group
     */
    public async get_invalid_params_intersectors_on_POST_C_POST_D_group_stats_wrapper(c_or_d_vos: IDistantVOBase[]): Promise<TData[]> {
        if (!c_or_d_vos || !c_or_d_vos.length) {
            return null;
        }

        StatsController.register_stat_COMPTEUR('VarServerControllerBase', 'get_invalid_params_intersectors_on_POST_C_POST_D_group', this.varConf.name);
        StatsController.register_stat_QUANTITE('VarServerControllerBase', 'get_invalid_params_intersectors_on_POST_C_POST_D_group', this.varConf.name, c_or_d_vos.length);
        const time_in = Dates.now_ms();

        const res = await this.get_invalid_params_intersectors_on_POST_C_POST_D_group(c_or_d_vos);

        const time_out = Dates.now_ms();
        StatsController.register_stat_DUREE('VarServerControllerBase', 'get_invalid_params_intersectors_on_POST_C_POST_D_group', this.varConf.name, time_out - time_in);

        return res;
    }

    /**
     * On ajoute une fonction qui prend toutes les modifs en cours, pour permettre des optis sur les vars sur des grands nombres de modifs concomittentes
     */
    public async get_invalid_params_intersectors_on_POST_C_POST_D_group(c_or_d_vos: IDistantVOBase[]): Promise<TData[]> {
        const intersectors_by_index: { [index: string]: TData } = {};

        /**
         * On peut pas les mettre en // ?
         */
        const limit = ConfigurationService.node_configuration ? ConfigurationService.node_configuration.max_pool / 3 : 10;
        const promise_pipeline = new PromisePipeline(limit, 'VarServerControllerBase.get_invalid_params_intersectors_on_POST_C_POST_D_group');

        for (const k in c_or_d_vos) {
            const vo_create_or_delete = c_or_d_vos[k];

            await promise_pipeline.push(async () => {
                const start_: number = Dates.now_ms();

                if (ConfigurationService.node_configuration.debug_vars_invalidation_param_intersector) {
                    ConsoleHandler.log("VarServerControllerBase.get_invalid_params_intersectors_on_POST_C_POST_D_group:START:" + this.varConf.name + " - " + JSON.stringify(vo_create_or_delete));
                }

                const tmp = await this.get_invalid_params_intersectors_on_POST_C_POST_D(vo_create_or_delete);

                if (ConfigurationService.node_configuration.debug_vars_invalidation_param_intersector) {
                    ConsoleHandler.log("VarServerControllerBase.get_invalid_params_intersectors_on_POST_C_POST_D_group:END_AWAIT:" + this.varConf.name + " - tmp_length:" + tmp?.length + " - " + JSON.stringify(vo_create_or_delete));
                }

                if ((!tmp) || (!tmp.length)) {
                    if (ConfigurationService.node_configuration.debug_vars_invalidation_param_intersector) {
                        ConsoleHandler.log("VarServerControllerBase.get_invalid_params_intersectors_on_POST_C_POST_D_group:END:" + this.varConf.name + " - " + JSON.stringify(vo_create_or_delete));
                        ConsoleHandler.log("VarServerControllerBase.get_invalid_params_intersectors_on_POST_C_POST_D_group:NO_INTERSECTOR:" + this.varConf.name + " - " + (Dates.now_ms() - start_) + "ms");
                    }
                    return;
                }
                tmp.forEach((e) => e ? intersectors_by_index[e.index] = e : null);
                if (ConfigurationService.node_configuration.debug_vars_invalidation_param_intersector) {
                    ConsoleHandler.log("VarServerControllerBase.get_invalid_params_intersectors_on_POST_C_POST_D_group:END:" + this.varConf.name + " - " + JSON.stringify(vo_create_or_delete));
                    ConsoleHandler.log("VarServerControllerBase.get_invalid_params_intersectors_on_POST_C_POST_D_group:HAS_INTERSECTOR:END_TIME:" + this.varConf.name + " - " + (Dates.now_ms() - start_) + "ms");
                }
            });
        }

        await promise_pipeline.end();

        return Object.values(intersectors_by_index);
    }

    /**
     * Stats wrapper for get_invalid_params_intersectors_on_POST_U_group
     */
    public async get_invalid_params_intersectors_on_POST_U_group_stats_wrapper<T extends IDistantVOBase>(u_vo_holders: Array<DAOUpdateVOHolder<T>>): Promise<TData[]> {
        if (!u_vo_holders || !u_vo_holders.length) {
            return null;
        }

        StatsController.register_stat_COMPTEUR('VarServerControllerBase', 'get_invalid_params_intersectors_on_POST_U_group', this.varConf.name);
        StatsController.register_stat_QUANTITE('VarServerControllerBase', 'get_invalid_params_intersectors_on_POST_U_group', this.varConf.name, u_vo_holders.length);
        const time_in = Dates.now_ms();

        const res = await this.get_invalid_params_intersectors_on_POST_U_group(u_vo_holders);

        const time_out = Dates.now_ms();
        StatsController.register_stat_DUREE('VarServerControllerBase', 'get_invalid_params_intersectors_on_POST_U_group', this.varConf.name, time_out - time_in);

        return res;
    }

    /**
     * On ajoute une fonction qui prend toutes les modifs en cours, pour permettre des optis sur les vars sur des grands nombres de modifs concomittentes
     */
    public async get_invalid_params_intersectors_on_POST_U_group<T extends IDistantVOBase>(u_vo_holders: Array<DAOUpdateVOHolder<T>>): Promise<TData[]> {

        const intersectors_by_index: { [index: string]: TData } = {};

        /**
         * On peut pas les mettre en // ?
         */
        const limit = ConfigurationService.node_configuration ? ConfigurationService.node_configuration.max_pool / 3 : 10;
        const promise_pipeline = new PromisePipeline(limit, 'VarServerControllerBase.get_invalid_params_intersectors_on_POST_U_group');

        for (const k in u_vo_holders) {
            const u_vo_holder = u_vo_holders[k];

            await promise_pipeline.push(async () => {
                const start_: number = Dates.now_ms();
                if (ConfigurationService.node_configuration.debug_vars_invalidation_param_intersector) {
                    ConsoleHandler.log("VarServerControllerBase.get_invalid_params_intersectors_on_POST_U_group:START:" + this.varConf.name + " - " + JSON.stringify(u_vo_holder));
                }
                const tmp = await this.get_invalid_params_intersectors_on_POST_U(u_vo_holder);
                if (ConfigurationService.node_configuration.debug_vars_invalidation_param_intersector) {
                    ConsoleHandler.log("VarServerControllerBase.get_invalid_params_intersectors_on_POST_U_group:END_AWAIT:" + this.varConf.name + " - tmp_length:" + tmp?.length + " - " + JSON.stringify(u_vo_holder));
                }
                if ((!tmp) || (!tmp.length)) {
                    if (ConfigurationService.node_configuration.debug_vars_invalidation_param_intersector) {
                        ConsoleHandler.log("VarServerControllerBase.get_invalid_params_intersectors_on_POST_U_group:END:" + this.varConf.name + " - " + JSON.stringify(u_vo_holder));
                        ConsoleHandler.log("VarServerControllerBase.get_invalid_params_intersectors_on_POST_U_group:END_TIME:NO_INTERSECTOR:" + this.varConf.name + " - " + (Dates.now_ms() - start_) + "ms");
                    }
                    return;
                }
                tmp.forEach((e) => e ? intersectors_by_index[e.index] = e : null);
                if (ConfigurationService.node_configuration.debug_vars_invalidation_param_intersector) {
                    ConsoleHandler.log("VarServerControllerBase.get_invalid_params_intersectors_on_POST_U_group:END:" + this.varConf.name + " - " + JSON.stringify(u_vo_holder));
                    ConsoleHandler.log("VarServerControllerBase.get_invalid_params_intersectors_on_POST_U_group:END_TIME:HAS_INTERSECTOR:" + this.varConf.name + " - " + (Dates.now_ms() - start_) + "ms");
                }
            });
        }

        await promise_pipeline.end();

        return Object.values(intersectors_by_index);
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
     * Stats wrapper for get_invalid_params_intersectors_from_dep
     */
    public async get_invalid_params_intersectors_from_dep_stats_wrapper<T extends VarDataBaseVO>(dep_id: string, intersectors: T[]): Promise<TData[]> {
        if (!intersectors || !intersectors.length) {
            return null;
        }

        StatsController.register_stat_COMPTEUR('VarServerControllerBase', 'get_invalid_params_intersectors_from_dep', this.varConf.name);
        StatsController.register_stat_QUANTITE('VarServerControllerBase', 'get_invalid_params_intersectors_from_dep', this.varConf.name, intersectors.length);
        const time_in = Dates.now_ms();

        const res = await this.get_invalid_params_intersectors_from_dep(dep_id, intersectors);

        const time_out = Dates.now_ms();
        StatsController.register_stat_DUREE('VarServerControllerBase', 'get_invalid_params_intersectors_from_dep', this.varConf.name, time_out - time_in);

        return res;
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
}