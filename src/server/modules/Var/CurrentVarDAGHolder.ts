import StatsController from "../../../shared/modules/Stats/StatsController";
import VarDAG from "../../../shared/modules/Var/graph/VarDAG";
import VarDAGNode from "../../../shared/modules/Var/graph/VarDAGNode";

export default class CurrentVarDAGHolder {

    public static current_vardag: VarDAG = null;

    /**
     * On lance un process qui va registerStats sur le VarDAG courant, régulièrement
     */
    public static init_stats_process() {
        setInterval(() => {
            if (!CurrentVarDAGHolder.current_vardag) {
                return;
            }

            CurrentVarDAGHolder.registerStats();
        }, 10000);
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
}