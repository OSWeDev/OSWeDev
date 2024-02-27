

import VarDAGNode from '../../../server/modules/Var/vos/VarDAGNode';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import InsertOrDeleteQueryResult from '../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import ModulesManager from '../../../shared/modules/ModulesManager';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import DefaultTranslationVO from '../../../shared/modules/Translation/vos/DefaultTranslationVO';
import ModuleVar from '../../../shared/modules/Var/ModuleVar';
import VarsController from '../../../shared/modules/Var/VarsController';
import VarConfVO from '../../../shared/modules/Var/vos/VarConfVO';
import VarDataBaseVO from '../../../shared/modules/Var/vos/VarDataBaseVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import { field_names } from '../../../shared/tools/ObjectHandler';
import ConfigurationService from '../../env/ConfigurationService';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import VarServerControllerBase from './VarServerControllerBase';
import VarCtrlDAG from './controllerdag/VarCtrlDAG';
import VarCtrlDAGNode from './controllerdag/VarCtrlDAGNode';
import DataSourceControllerBase from './datasource/DataSourceControllerBase';

export default class VarsServerController {

    /**
     * Global application cache - Brocasted CUD - Local R -----
     */

    // NO CUD during run, just init in each thread - no multithreading special handlers needed
    public static varcontrollers_dag: VarCtrlDAG = null;
    public static varcontrollers_dag_depths: { [var_id: number]: number } = null;

    // NO CUD during run, just init in each thread - no multithreading special handlers needed
    public static registered_vars_controller_by_var_id: { [var_id: number]: VarServerControllerBase<any> } = {};
    public static registered_vars_controller: { [name: string]: VarServerControllerBase<any> } = {};
    public static registered_vars_by_datasource: { [datasource_id: string]: Array<VarServerControllerBase<any>> } = {};

    // TODO FIXME est-ce que tout n'est pas en cache à ce stade, si on demande toujours en insérant en base ?
    public static registered_vars_controller_by_api_type_id: { [api_type_id: string]: Array<VarServerControllerBase<any>> } = {};

    public static preloadedVarConfs: boolean = false;
    /**
     * ----- Global application cache - Brocasted CUD - Local R
     */


    /**
     * ATTENTION : Si on est client on doit pas utiliser cette méthode par ce qu'elle ne voit pas les
     *  vardatares or les valeurs sont là bas et pas dans le vardata
     * On considère la valeur valide si elle a une date de calcul ou d'init, une valeur pas undefined et
     *  si on a une conf de cache, pas expirée. Par contre est-ce que les imports expirent ? surement pas
     *  dont il faut aussi indiquer ces var datas valides
     *
     * Si denied ici on dit que c'est valid, mais il faut bien remonter l'info qu'on deny aussi la var qui dépend de ce truc
     */
    public static has_valid_value(param: VarDataBaseVO): boolean {

        if (!param) {
            return false;
        }

        if ((param.value_type === VarDataBaseVO.VALUE_TYPE_IMPORT) ||
            (param.value_type === VarDataBaseVO.VALUE_TYPE_DENIED)) {
            return true;
        }

        if ((typeof param.value !== 'undefined') && (!!param.value_ts)) {
            return true;
        }

        return false;
    }

    public static clear_all_inits() {
        VarsServerController.varcontrollers_dag = null;
        VarsServerController.varcontrollers_dag_depths = null;
        VarsServerController.registered_vars_controller = {};
        VarsServerController.registered_vars_controller_by_var_id = {};
        VarsServerController.registered_vars_by_datasource = {};
        VarsServerController.registered_vars_controller_by_api_type_id = {};
    }

    public static update_registered_varconf(id: number, conf: VarConfVO) {
        VarsController.var_conf_by_id[id] = conf;
        VarsController.var_conf_by_name[conf.name] = conf;

        if (ConfigurationService.node_configuration.DEBUG_VARS) {
            ConsoleHandler.log('update_registered_varconf:UPDATED VARCConf VAR_ID:' + conf.id + ':' + JSON.stringify(conf));
        }
    }

    public static delete_registered_varconf(id: number) {
        const name = VarsController.var_conf_by_id[id].name;
        delete VarsController.var_conf_by_id[id];
        delete VarsController.var_conf_by_name[name];

        if (ConfigurationService.node_configuration.DEBUG_VARS) {
            ConsoleHandler.log('delete_registered_varconf:DELETED VARCConf VAR_ID:' + id + ':' + name);
        }
    }

    public static init_varcontrollers_dag_depths() {

        if ((!VarsServerController.varcontrollers_dag_depths) && VarsServerController.varcontrollers_dag) {
            VarsServerController.varcontrollers_dag_depths = {};

            let needs_again = true;
            while (needs_again) {
                needs_again = false;

                let did_something = false;
                let last_not_full = null;
                for (const i in VarsServerController.varcontrollers_dag.nodes) {
                    const node: VarCtrlDAGNode = VarsServerController.varcontrollers_dag.nodes[i];

                    if (VarsServerController.varcontrollers_dag_depths[node.var_controller.varConf.id]) {
                        continue;
                    }

                    const depth = VarsServerController.get_max_depth(node, false);
                    if (depth === null) {
                        last_not_full = node;
                        needs_again = true;
                        continue;
                    }

                    VarsServerController.varcontrollers_dag_depths[node.var_controller.varConf.id] = depth;
                    did_something = true;
                }

                if ((!did_something) && needs_again) {
                    if (!last_not_full) {
                        ConsoleHandler.error('!last_not_full on !did_something in init_varcontrollers_dag_depths');
                        throw new Error('!last_not_full on !did_something in init_varcontrollers_dag_depths');
                    }

                    const depth = VarsServerController.get_max_depth(last_not_full, true);
                    if (depth === null) {
                        ConsoleHandler.error('depth===null on !did_something in init_varcontrollers_dag_depths');
                        throw new Error('depth===null on !did_something in init_varcontrollers_dag_depths');
                    }

                    VarsServerController.varcontrollers_dag_depths[last_not_full.var_controller.varConf.id] = depth;
                }
            }
        }
        return VarsServerController.varcontrollers_dag_depths;
    }

    public static getVarConf(var_name: string): VarConfVO {
        return VarsController.var_conf_by_name ? (VarsController.var_conf_by_name[var_name] ? VarsController.var_conf_by_name[var_name] : null) : null;
    }

    public static getVarConfById(var_id: number): VarConfVO {
        return VarsController.var_conf_by_id ? (VarsController.var_conf_by_id[var_id] ? VarsController.var_conf_by_id[var_id] : null) : null;
    }

    public static getVarController(var_name: string): VarServerControllerBase<any> {
        return VarsServerController.registered_vars_controller ? (VarsServerController.registered_vars_controller[var_name] ? VarsServerController.registered_vars_controller[var_name] : null) : null;
    }

    public static getVarControllerById(var_id: number): VarServerControllerBase<any> {
        return VarsServerController.registered_vars_controller_by_var_id ? (VarsServerController.registered_vars_controller_by_var_id[var_id] ? VarsServerController.registered_vars_controller_by_var_id[var_id] : null) : null;
    }

    /**
     * On fait le ménage dans les varconf qui sont pas initialisés
     * Attention évidemment à ne pas supprimer les vars automatiques
     */
    public static async clean_varconfs_without_controller() {
        const db_var_confs: VarConfVO[] = await query(VarConfVO.API_TYPE_ID)
            .filter_is_false(field_names<VarConfVO>().is_auto)
            .exec_as_server()
            .select_vos<VarConfVO>();

        const to_delete_ids: number[] = [];
        for (const i in db_var_confs) {
            const db_var_conf = db_var_confs[i];

            if (!VarsServerController.registered_vars_controller[db_var_conf.name]) {
                to_delete_ids.push(db_var_conf.id);
            }
        }

        if (to_delete_ids.length) {
            ConsoleHandler.warn('clean_varconfs_without_controller:DELETING:' + to_delete_ids.length + ' varconfs from db - no controller exists for these vars in the app:' + JSON.stringify(to_delete_ids));
            await query(VarConfVO.API_TYPE_ID).filter_by_ids(to_delete_ids).exec_as_server().delete_vos();
        }
    }

    public static init_varcontrollers_dag() {

        const varcontrollers_dag: VarCtrlDAG = new VarCtrlDAG();

        for (const i in VarsServerController.registered_vars_controller) {
            const var_controller: VarServerControllerBase<any> = VarsServerController.registered_vars_controller[i];

            const node = VarCtrlDAGNode.getInstance(varcontrollers_dag, var_controller);

            const var_dependencies: { [dep_name: string]: VarServerControllerBase<any> } = var_controller.getVarControllerDependencies();

            for (const dep_name in var_dependencies) {
                const var_dependency = var_dependencies[dep_name];

                const dependency = VarCtrlDAGNode.getInstance(varcontrollers_dag, var_dependency);

                node.addOutgoingDep(dep_name, dependency);
            }
        }

        VarsServerController.varcontrollers_dag = varcontrollers_dag;
    }

    /**
     * Renvoie les datasources dont la var est une dépendance.
     * @param controller
     */
    public static get_datasource_deps_and_predeps(controller: VarServerControllerBase<any>): DataSourceControllerBase[] {
        let datasource_deps: DataSourceControllerBase[] = controller.getDataSourcesDependencies();
        datasource_deps = (datasource_deps) ? datasource_deps : [];

        const datasource_predeps: DataSourceControllerBase[] = controller.getDataSourcesPredepsDependencies();
        for (const i in datasource_predeps) {
            const ds = datasource_predeps[i];

            if (datasource_deps.indexOf(ds) == -1) {
                datasource_deps.push(ds);
            }
        }

        return datasource_deps;
    }

    /**
     * Renvoie le nom des datasources dont la var est une dépendance.
     * @param controller
     */
    public static get_datasource_deps_and_predeps_names(controller: VarServerControllerBase<any>): string[] {
        const datasource_deps: DataSourceControllerBase[] = VarsServerController.get_datasource_deps_and_predeps(controller);
        const datasource_deps_names: string[] = [];
        for (const i in datasource_deps) {
            const ds = datasource_deps[i];
            datasource_deps_names.push(ds.name);
        }
        return datasource_deps_names;
    }

    public static async registerVar(varConf: VarConfVO, controller: VarServerControllerBase<any>): Promise<VarConfVO> {
        if ((!varConf) || (!controller)) {
            return null;
        }

        varConf.aggregator = varConf.aggregator ? varConf.aggregator : VarConfVO.SUM_AGGREGATOR;
        if (!ModuleVar.getInstance().initializedasync_VarsController) {
            await ModuleVar.getInstance().initializeasync();
        }

        let daoVarConf: VarConfVO = VarsController.var_conf_by_name ? VarsController.var_conf_by_name[varConf.name] : null;

        // Pour les tests unitaires, on fournit l'id du varconf directement pour éviter cette étape
        if ((!daoVarConf) && (varConf.id != null) && (typeof varConf.id != 'undefined')) {
            daoVarConf = varConf;
        }

        if (!daoVarConf) {
            daoVarConf = await query(VarConfVO.API_TYPE_ID).filter_by_text_eq('name', varConf.name, VarConfVO.API_TYPE_ID, true).exec_as_server(true).select_vo<VarConfVO>();
        }

        if (daoVarConf) {

            /**
             * Checks de cohérence sur le générateur
             */
            if (ModulesManager.isGenerator) {
                /**
                 * Juste pour l'init des segment_types, si on voit en base null et dans le controller autre chose, on update la bdd sur ce champ
                 */
                if ((!daoVarConf.segment_types) && (!!varConf.segment_types)) {

                    ConsoleHandler.warn('On écrase les segment_types de la bdd par ceux de l\'appli pour la varconf:' +
                        daoVarConf.id + ':' + daoVarConf.name +
                        ':daoVarConf.segment_types:' + JSON.stringify(daoVarConf.segment_types) +
                        ':varConf.segment_types:' + JSON.stringify(varConf.segment_types));

                    daoVarConf.segment_types = varConf.segment_types;
                    await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(daoVarConf);
                }

                /**
                 * Si on a changé le type de vo associé, on doit mettre à jour la bdd
                 */
                if (daoVarConf.var_data_vo_type != varConf.var_data_vo_type) {

                    ConsoleHandler.warn('On écrase le var_data_vo_type de la bdd par celui de l\'appli pour la varconf:' +
                        daoVarConf.id + ':' + daoVarConf.name +
                        ':daoVarConf.var_data_vo_type:' + daoVarConf.var_data_vo_type +
                        ':varConf.var_data_vo_type:' + varConf.var_data_vo_type);

                    daoVarConf.var_data_vo_type = varConf.var_data_vo_type;
                    await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(daoVarConf);
                }

                /**
                 * Si la pixellisation a changée, on met à jour la conf en db
                 */
                if ((!!daoVarConf.pixel_activated) != (!!varConf.pixel_activated)) {

                    ConsoleHandler.warn('On écrase le pixel_activated de la bdd par celui de l\'appli pour la varconf:' +
                        daoVarConf.id + ':' + daoVarConf.name +
                        ':daoVarConf.pixel_activated:' + daoVarConf.pixel_activated +
                        ':varConf.pixel_activated:' + varConf.pixel_activated);

                    daoVarConf.pixel_activated = !!varConf.pixel_activated;
                    await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(daoVarConf);
                }

                /**
                 * Si pixel_never_delete a changé, on met à jour la conf en db
                 */
                if ((!!daoVarConf.pixel_never_delete) != (!!varConf.pixel_never_delete)) {

                    ConsoleHandler.warn('On écrase le pixel_never_delete de la bdd par celui de l\'appli pour la varconf:' +
                        daoVarConf.id + ':' + daoVarConf.name +
                        ':daoVarConf.pixel_never_delete:' + daoVarConf.pixel_never_delete +
                        ':varConf.pixel_never_delete:' + varConf.pixel_never_delete);

                    daoVarConf.pixel_never_delete = !!varConf.pixel_never_delete;
                    await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(daoVarConf);
                }


                /**
                 * Si les optimisation diffèrent on met à jour la conf en db
                 */
                if ((!!daoVarConf.optimization__has_no_imports) != (!!varConf.optimization__has_no_imports)) {

                    ConsoleHandler.warn('On écrase le optimization__has_no_imports de la bdd par celui de l\'appli pour la varconf:' +
                        daoVarConf.id + ':' + daoVarConf.name +
                        ':daoVarConf.optimization__has_no_imports:' + daoVarConf.optimization__has_no_imports +
                        ':varConf.optimization__has_no_imports:' + varConf.optimization__has_no_imports);

                    daoVarConf.optimization__has_no_imports = !!varConf.optimization__has_no_imports;
                    await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(daoVarConf);
                }
                if ((!!daoVarConf.optimization__has_only_atomic_imports) != (!!varConf.optimization__has_only_atomic_imports)) {
                    ConsoleHandler.warn('On écrase le optimization__has_only_atomic_imports de la bdd par celui de l\'appli pour la varconf:' +
                        daoVarConf.id + ':' + daoVarConf.name +
                        ':daoVarConf.optimization__has_only_atomic_imports:' + daoVarConf.optimization__has_only_atomic_imports +
                        ':varConf.optimization__has_only_atomic_imports:' + varConf.optimization__has_only_atomic_imports);

                    daoVarConf.optimization__has_only_atomic_imports = !!varConf.optimization__has_only_atomic_imports;
                    await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(daoVarConf);
                }

                /**
                 * Si l'aggrégateur a changé, on met à jour la conf en db
                 */
                if ((!!daoVarConf.pixel_activated) && (daoVarConf.aggregator != varConf.aggregator)) {

                    ConsoleHandler.warn('On écrase le aggregator de la bdd par celui de l\'appli pour la varconf:' +
                        daoVarConf.id + ':' + daoVarConf.name +
                        ':daoVarConf.aggregator:' + daoVarConf.aggregator +
                        ':varConf.aggregator:' + varConf.aggregator);

                    daoVarConf.aggregator = varConf.aggregator;
                    await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(daoVarConf);
                }


                /**
                 * Idem pour les champs de segmentation, si en base on dit qu'on est pixel, mais qu'on a pas de fields et que les fields existent
                 *  côté appli, on modifie en base
                 */
                if ((!!daoVarConf.pixel_activated) && (!daoVarConf.pixel_fields) && (!!varConf.pixel_fields)) {

                    ConsoleHandler.warn('On écrase les pixel_fields de la bdd par ceux de l\'appli pour la varconf:' +
                        daoVarConf.id + ':' + daoVarConf.name +
                        ':daoVarConf.pixel_fields:' + JSON.stringify(daoVarConf.pixel_fields) +
                        ':varConf.pixel_fields:' + JSON.stringify(varConf.pixel_fields));

                    daoVarConf.pixel_fields = varConf.pixel_fields;
                    await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(daoVarConf);
                }

                /**
                 * Si on est pas pixel, on devrait pas avoir de pixel_fields en base
                 */
                if ((!daoVarConf.pixel_activated) && (!!daoVarConf.pixel_fields)) {

                    ConsoleHandler.warn('On écrase les pixel_fields de la bdd par null pour la varconf:' +
                        daoVarConf.id + ':' + daoVarConf.name +
                        ':daoVarConf.pixel_fields:' + JSON.stringify(daoVarConf.pixel_fields) +
                        ':varConf.pixel_fields:' + JSON.stringify(varConf.pixel_fields));

                    daoVarConf.pixel_fields = null;
                    await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(daoVarConf);
                }

                // On checke aussi le contenu des pixel_fields, par ce que des fois c'est invalide, et si la conf est corrigée niveau appli il faut corriger automatiquement la base
                if ((!!daoVarConf.pixel_activated) && (!!daoVarConf.pixel_fields) && (!!varConf.pixel_fields)) {

                    // On ne peut faire ce check que si on a les deux pixel_fields de la même taille
                    if (daoVarConf.pixel_fields.length == varConf.pixel_fields.length) {

                        let overwrite_dao = false;
                        for (const i in daoVarConf.pixel_fields) {
                            const pixel_field = daoVarConf.pixel_fields[i];

                            if ((pixel_field.pixel_param_field_name == null) ||
                                (pixel_field.pixel_vo_api_type_id == null) ||
                                (pixel_field.pixel_vo_field_name == null) ||
                                (pixel_field.pixel_range_type == null) ||
                                (pixel_field.pixel_segmentation_type == null)) {
                                overwrite_dao = true;
                                break;
                            }
                        }

                        if (overwrite_dao) {

                            ConsoleHandler.warn('On écrase les pixel_fields de la bdd par ceux de l\'appli pour la varconf:' +
                                daoVarConf.id + ':' + daoVarConf.name +
                                ':daoVarConf.pixel_fields:' + JSON.stringify(daoVarConf.pixel_fields) +
                                ':varConf.pixel_fields:' + JSON.stringify(varConf.pixel_fields));

                            daoVarConf.pixel_fields = varConf.pixel_fields;
                            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(daoVarConf);
                        }
                    }
                }
            }

            VarsServerController.setVar(daoVarConf, controller);
            return daoVarConf;
        }

        const insertOrDeleteQueryResult: InsertOrDeleteQueryResult = await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(varConf);
        if ((!insertOrDeleteQueryResult) || (!insertOrDeleteQueryResult.id)) {
            return null;
        }

        varConf.id = insertOrDeleteQueryResult.id;

        VarsServerController.setVar(varConf, controller);
        return varConf;
    }

    /**
     * On fait la somme des deps dont le nopm débute par le filtre en param.
     * @param varDAGNode Noeud dont on somme les deps
     * @param dep_name_starts_with Le filtre sur le nom des deps (dep_name.startsWith(dep_name_starts_with) ? sum : ignore)
     * @param start_value 0 par défaut, mais peut être null aussi dans certains cas
     */
    public static get_outgoing_deps_sum(varDAGNode: VarDAGNode, dep_name_starts_with: string, start_value: number = 0, debug: boolean = false) {
        let res: number = start_value;

        if (debug) {
            ConsoleHandler.log('get_outgoing_deps_sum:START:' + varDAGNode.var_data.index + ':' + dep_name_starts_with + ':' + start_value + ':');
        }

        for (const i in varDAGNode.outgoing_deps) {
            const outgoing = varDAGNode.outgoing_deps[i];

            if (dep_name_starts_with && !outgoing.dep_name.startsWith(dep_name_starts_with)) {

                if (debug) {
                    ConsoleHandler.log('get_outgoing_deps_sum:SKIP:' + varDAGNode.var_data.index + ':' + outgoing.dep_name + ':' + ((outgoing.outgoing_node as VarDAGNode).var_data?.index));
                }

                continue;
            }

            const var_data = (outgoing.outgoing_node as VarDAGNode).var_data;
            const value = var_data ? var_data.value : null;
            if ((!var_data) || (isNaN(value))) {

                if (debug) {
                    ConsoleHandler.log('get_outgoing_deps_sum:!var_data || isNaN(value):' + varDAGNode.var_data.index + ':' + outgoing.dep_name + ':' + ((outgoing.outgoing_node as VarDAGNode).var_data?.index));
                }

                continue;
            }

            if (value == null) {

                if (debug) {
                    ConsoleHandler.log('get_outgoing_deps_sum:value == null:' + varDAGNode.var_data.index + ':' + outgoing.dep_name + ':' + ((outgoing.outgoing_node as VarDAGNode).var_data?.index));
                }

                continue;
            }

            // 0 ou null ça marche
            if (!res) {
                res = value;

                if (debug) {
                    ConsoleHandler.log('get_outgoing_deps_sum:res = value:' + varDAGNode.var_data.index + ':' + outgoing.dep_name + ':' + ((outgoing.outgoing_node as VarDAGNode).var_data?.index) + ':' + res);
                }

                continue;
            }

            res += value;
            if (debug) {
                ConsoleHandler.log('get_outgoing_deps_sum:res += value:' + varDAGNode.var_data.index + ':' + outgoing.dep_name + ':' + ((outgoing.outgoing_node as VarDAGNode).var_data?.index) + ':' + res + ':' + value);
            }
        }

        if (debug) {
            ConsoleHandler.log('get_outgoing_deps_sum:END:' + varDAGNode.var_data.index + ':' + dep_name_starts_with + ':' + start_value + ':' + res);
        }
        return res;
    }

    /**
     * On fait un && des deps dont le nopm débute par le filtre en param.
     * @param varDAGNode Noeud dont on somme les deps
     * @param dep_name_starts_with Le filtre sur le nom des deps (dep_name.startsWith(dep_name_starts_with) ? and : ignore)
     * @param start_value 1 par défaut, mais peut être null aussi dans certains cas
     * @param do_not_consider_null_as_false Par défaut, si on rencontre null, on renvoie false. Si on active ce param, en rencontrant null on ignore la valeur, donc ne force pas un résultat true, mais ne renvoie pas false.
     */
    public static get_outgoing_deps_and(varDAGNode: VarDAGNode, dep_name_starts_with: string, start_value: number = 1, do_not_consider_null_as_false: boolean = false, debug: boolean = false) {
        let res: number = start_value;

        if (debug) {
            ConsoleHandler.log('get_outgoing_deps_and:START:' + varDAGNode.var_data.index + ':' + dep_name_starts_with + ':' + start_value + ':' + do_not_consider_null_as_false);
        }

        // On peut vouloir commencer à null, et du coup renvoyer null si tous les deps sont null
        if (res === 0) {

            if (debug) {
                ConsoleHandler.log('get_outgoing_deps_and:res === 0:' + varDAGNode.var_data.index + ':' + dep_name_starts_with + ':' + start_value + ':' + do_not_consider_null_as_false);
            }

            return 0;
        }

        for (const i in varDAGNode.outgoing_deps) {
            const outgoing = varDAGNode.outgoing_deps[i];

            if (dep_name_starts_with && !outgoing.dep_name.startsWith(dep_name_starts_with)) {

                if (debug) {
                    ConsoleHandler.log('get_outgoing_deps_and:SKIP:' + varDAGNode.var_data.index + ':' + outgoing.dep_name + ':' + ((outgoing.outgoing_node as VarDAGNode).var_data?.index));
                }

                continue;
            }

            const var_data = (outgoing.outgoing_node as VarDAGNode).var_data;
            const value = var_data ? var_data.value : null;

            if (do_not_consider_null_as_false && (value == null)) {

                if (debug) {
                    ConsoleHandler.log('get_outgoing_deps_and:do_not_consider_null_as_false && (value == null):' + varDAGNode.var_data.index + ':' + outgoing.dep_name + ':' + ((outgoing.outgoing_node as VarDAGNode).var_data?.index));
                }

                continue;
            }

            if ((!var_data) || (isNaN(value))) {

                if (debug) {
                    ConsoleHandler.log('get_outgoing_deps_and:!var_data || isNaN(value):' + varDAGNode.var_data.index + ':' + outgoing.dep_name + ':' + ((outgoing.outgoing_node as VarDAGNode).var_data?.index));
                }

                return 0;
            }

            if (!value) {

                if (debug) {
                    ConsoleHandler.log('get_outgoing_deps_and:!value:' + varDAGNode.var_data.index + ':' + outgoing.dep_name + ':' + ((outgoing.outgoing_node as VarDAGNode).var_data?.index));
                }

                return 0;
            }

            // Si on avait pas encore vu de true, on force le résultat à true
            if (res == null) {

                if (debug) {
                    ConsoleHandler.log('get_outgoing_deps_and:res == null:' + varDAGNode.var_data.index + ':' + outgoing.dep_name + ':' + ((outgoing.outgoing_node as VarDAGNode).var_data?.index));
                }

                res = 1;
            }
        }

        if (debug) {
            ConsoleHandler.log('get_outgoing_deps_and:END:' + varDAGNode.var_data.index + ':' + dep_name_starts_with + ':' + start_value + ':' + do_not_consider_null_as_false + ':' + res);
        }

        return res;
    }

    private static setVar(varConf: VarConfVO, controller: VarServerControllerBase<any>) {
        VarsController.var_conf_by_name[varConf.name] = varConf;
        VarsServerController.registered_vars_controller[varConf.name] = controller;
        VarsServerController.registered_vars_controller_by_var_id[varConf.id] = controller;
        VarsController.var_conf_by_id[varConf.id] = varConf;

        let dss: DataSourceControllerBase[] = VarsServerController.get_datasource_deps_and_predeps(controller);
        dss = (dss) ? dss : [];
        if (dss && dss.length) {
            dss.forEach((datasource_dep) => {
                datasource_dep.registerDataSource();
            });
        }

        // On enregistre le lien entre DS et VAR
        for (const i in dss) {
            const ds = dss[i];

            if (!VarsServerController.registered_vars_by_datasource[ds.name]) {
                VarsServerController.registered_vars_by_datasource[ds.name] = [];
            }
            VarsServerController.registered_vars_by_datasource[ds.name].push(controller);

            for (const j in ds.vo_api_type_ids) {
                const vo_api_type_id = ds.vo_api_type_ids[j];

                if (!VarsServerController.registered_vars_controller_by_api_type_id[vo_api_type_id]) {
                    VarsServerController.registered_vars_controller_by_api_type_id[vo_api_type_id] = [];
                }
                VarsServerController.registered_vars_controller_by_api_type_id[vo_api_type_id].push(controller);
            }
        }

        // On enregistre les defaults translations
        VarsServerController.register_var_default_translations(varConf.name, controller);
    }

    private static register_var_default_translations(varConf_name: string, controller: VarServerControllerBase<any>) {
        if (controller.var_name_default_translations) {
            DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
                controller.var_name_default_translations,
                VarsController.get_translatable_name_code(varConf_name)));
        }

        if (controller.var_description_default_translations) {
            DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
                controller.var_description_default_translations,
                VarsController.get_translatable_description_code(varConf_name)));
        }

        if (controller.var_explaination_default_translations) {
            DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
                controller.var_explaination_default_translations,
                VarsController.get_translatable_explaination(varConf_name)));
        }

        if (controller.var_deps_names_default_translations) {

            const deps: { [dep_name: string]: VarServerControllerBase<any> } = controller.getVarControllerDependencies();
            for (const i in deps) {
                const dep = deps[i];

                if (!controller.var_deps_names_default_translations[i]) {
                    continue;
                }
                DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
                    controller.var_deps_names_default_translations[i],
                    VarsController.get_translatable_dep_name(i)));
            }
        }
    }

    private static get_max_depth(node: VarCtrlDAGNode, ignore_incomplete: boolean) {
        let is_complete = true;
        let depth = 1;

        for (const j in node.outgoing_deps) {
            const dep = node.outgoing_deps[j];

            if ((dep.outgoing_node as VarCtrlDAGNode).var_controller.varConf.id == node.var_controller.varConf.id) {
                continue;
            }

            if (!VarsServerController.varcontrollers_dag_depths[(dep.outgoing_node as VarCtrlDAGNode).var_controller.varConf.id]) {
                is_complete = false;
                break;
            }
            depth = Math.max(depth, VarsServerController.varcontrollers_dag_depths[(dep.outgoing_node as VarCtrlDAGNode).var_controller.varConf.id] + 1);
        }

        if ((!is_complete) && (!ignore_incomplete)) {
            return null;
        }

        return depth;
    }

    protected constructor() {
    }
}