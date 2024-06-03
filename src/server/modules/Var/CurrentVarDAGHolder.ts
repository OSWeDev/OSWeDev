import StatsController from "../../../shared/modules/Stats/StatsController";
import VarDAG from "../../../server/modules/Var/vos/VarDAG";
import VarDAGNode from '../../../server/modules/Var/vos/VarDAGNode';
import ThreadHandler from "../../../shared/tools/ThreadHandler";
import ThrottleHelper from "../../../shared/tools/ThrottleHelper";
import VarsProcessInvalidator from "./bgthreads/processes/VarsProcessInvalidator";
import { isEqual } from "lodash";
import ConsoleHandler from "../../../shared/tools/ConsoleHandler";
import ManualTasksController from "../../../shared/modules/Cron/ManualTasksController";
import VarsBGThreadNameHolder from "./VarsBGThreadNameHolder";
import ForkServerController from "../Fork/ForkServerController";
import TeamsAPIServerController from "../TeamsAPI/TeamsAPIServerController";
import ConfigurationService from "../../env/ConfigurationService";

export default class CurrentVarDAGHolder {

    public static previous_vardag_deps: { [dep_name: string]: { tags: string[], outgoing_deps: string[], incoming_deps: string[] } } = null;
    public static current_vardag: VarDAG = null;
    public static has_send_kill_bgthread: boolean = false;
    public static check_current_vardag_throttler = ThrottleHelper.declare_throttle_without_args(this.check_current_vardag.bind(this), 2000);
    public static console_log_throttler = ThrottleHelper.declare_throttle_with_mappable_args(this.console_log, 10000);

    /**
     * On lance un process qui va registerStats sur le VarDAG courant, régulièrement
     */
    public static init_stats_process() {
        ThreadHandler.set_interval(async () => {
            if (!CurrentVarDAGHolder.current_vardag) {
                return;
            }

            CurrentVarDAGHolder.registerStats();
        }, 10000, 'CurrentVarDAGHolder.init_stats_process', true);
    }

    public static registerStats() {
        if (!CurrentVarDAGHolder.current_vardag) {
            return;
        }

        StatsController.register_stat_COMPTEUR('CurrentVarDAGHolder', 'current_vardag', 'registerStats');

        StatsController.register_stat_QUANTITE('CurrentVarDAGHolder', 'current_vardag', 'nb_nodes', CurrentVarDAGHolder.current_vardag.nb_nodes);
        StatsController.register_stat_QUANTITE('CurrentVarDAGHolder', 'current_vardag', 'nb_leafs', CurrentVarDAGHolder.current_vardag.leafs ? Object.keys(CurrentVarDAGHolder.current_vardag.leafs).length : 0);
        StatsController.register_stat_QUANTITE('CurrentVarDAGHolder', 'current_vardag', 'nb_roots', CurrentVarDAGHolder.current_vardag.roots ? Object.keys(CurrentVarDAGHolder.current_vardag.roots).length : 0);

        for (let i in VarDAGNode.ORDERED_STEP_TAGS_NAMES) {
            let step_tag_name = VarDAGNode.ORDERED_STEP_TAGS_NAMES[i];

            StatsController.register_stat_QUANTITE('CurrentVarDAGHolder', 'current_vardag', 'nb_CURRENT_STEP_' + step_tag_name, CurrentVarDAGHolder.current_vardag.current_step_tags[step_tag_name] ? Object.keys(CurrentVarDAGHolder.current_vardag.current_step_tags[step_tag_name]).length : 0);
        }
    }

    // On va regarder si la date de dernière exécution dépasse ou égale au MAX_EXECUTION_TIME prévu
    private static async check_current_vardag() {
        // Si je n'ai pas de nodes, je ne fais rien
        if (!CurrentVarDAGHolder.current_vardag?.nb_nodes) {
            return;
        }

        // On va check le last_registration pour le bgthread VarsProcessInvalidator afin de voir s'il n'est pas HS
        let last_registration_delay: number = VarsProcessInvalidator.getInstance().get_last_registration_delay();

        // Si on est en dessous du warn, on sort car pas de pb pour l'instant
        if (last_registration_delay < VarsProcessInvalidator.WARN_MAX_EXECUTION_TIME_SECOND) {
            this.previous_vardag_deps = null;
            return;
        }

        // On va récupérer current_step_tags pour voir si identique au précédent
        let previous_vardag_deps: { [dep_name: string]: { tags: string[], outgoing_deps: string[], incoming_deps: string[] } } = {};

        for (let n_name in CurrentVarDAGHolder.current_vardag.nodes) {
            let node: VarDAGNode = CurrentVarDAGHolder.current_vardag.nodes[n_name];

            if (!node) {
                continue;
            }

            if (!previous_vardag_deps[n_name]) {
                previous_vardag_deps[n_name] = {
                    incoming_deps: [],
                    outgoing_deps: [],
                    tags: []
                };
            }

            for (let dep_name in node.incoming_deps) {
                previous_vardag_deps[n_name].incoming_deps.push(dep_name);
            }

            for (let dep_name in node.outgoing_deps) {
                previous_vardag_deps[n_name].outgoing_deps.push(dep_name);
            }

            for (let tag_name in node.tags) {
                if (node.tags[tag_name]) {
                    previous_vardag_deps[n_name].tags.push(tag_name);
                }
            }
        }

        // Si pas le même, on va attendre un peu car ça veut dire que le VarDAG est en train de s'exécuter
        if (this.previous_vardag_deps && !isEqual(this.previous_vardag_deps, previous_vardag_deps)) {
            // On sauvegarde la donnée
            this.previous_vardag_deps = previous_vardag_deps;
            return;
        }

        // On sauvegarde la donnée
        this.previous_vardag_deps = previous_vardag_deps;

        this.console_log_throttler({ [0]: previous_vardag_deps, [1]: last_registration_delay });

        // Si on est en dessous de l'alerte, on va juste faire un log
        if (last_registration_delay < VarsProcessInvalidator.ALERT_MAX_EXECUTION_TIME_SECOND) {
            return;
        }

        // Si on est en alerte, on va faire un log et un redémarrage forcé du thread
        if (!this.has_send_kill_bgthread) {
            if (ManualTasksController.getInstance().registered_manual_tasks_by_name["KILL BGTHREAD : " + VarsBGThreadNameHolder.bgthread_name]) {
                this.has_send_kill_bgthread = true;
                await ManualTasksController.getInstance().registered_manual_tasks_by_name["KILL BGTHREAD : " + VarsBGThreadNameHolder.bgthread_name](false);
                TeamsAPIServerController.send_teams_error(
                    '[' + ConfigurationService.node_configuration.APP_TITLE + '] Thread VAR ERROR - On kill le process',
                    'last_registration_delay : ' + last_registration_delay + 'seconds<br/>previous_vardag_deps:' + JSON.stringify(previous_vardag_deps)
                );
            }
        }
    }

    private static console_log(values: { [index_: number]: { [tag: string]: string[] } }) {
        ConsoleHandler.warn('CurrentVarDAGHolder.check_current_vardag:last_registration_delay:' + values[1] + 'seconds:previous_vardag_deps:' + JSON.stringify(values[0]));
        TeamsAPIServerController.send_teams_warn(
            '[' + ConfigurationService.node_configuration.APP_TITLE + '] Thread VAR - WARNING',
            'last_registration_delay : ' + values[1] + 'seconds<br/>previous_vardag_deps:' + JSON.stringify(values[0])
        );
    }
}