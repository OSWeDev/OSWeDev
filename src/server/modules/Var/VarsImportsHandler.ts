import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import MatroidController from '../../../shared/modules/Matroid/MatroidController';
import VarsController from '../../../shared/modules/Var/VarsController';
import VarDataBaseVO from '../../../shared/modules/Var/vos/VarDataBaseVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import { all_promises } from '../../../shared/tools/PromiseTools';
import ConfigurationService from '../../env/ConfigurationService';
import VarDAGNode from '../../modules/Var/vos/VarDAGNode';
import VarsDatasProxy from './VarsDatasProxy';

export default class VarsImportsHandler {

    private static instance: VarsImportsHandler = null;

    protected constructor() {
    }

    /**
     * Multithreading notes :
     *  - There's only one bgthread doing all the computations, and separated from the other threads if the project decides to do so
     *  - Everything in this controller is running in the var calculation bg thread
     */
    public static getInstance(): VarsImportsHandler {
        if (!VarsImportsHandler.instance) {
            VarsImportsHandler.instance = new VarsImportsHandler();
        }
        return VarsImportsHandler.instance;
    }

    /**
     * Fonction qui tente de trouver des datas importées en base qui sont inclus - pas 'intersectent' -  le noeud actuel (on ne peut avoir de noeud identique à ce stade, donc il y aura une coupe à faire)
     *  Si on en trouve pas, rien à faire de particulier on ressort
     *  Si on en trouve :
     *      - il faut utiliser une stratégie pour sélectionner les imports à utiliser (on calcul le cardinal du param - max acceptable pour des découpes) :
     *          - Pour le moment classe les imports du plus gros au plus petit,
     *          - On coupe sur le plus gros, on met à jour le cardinal max acceptable
     *          - Pour chaque élément de la liste ordonnée des imports (après le premier) si cardinal > cardinal acceptable, continue, sinon on verifie que ça intersecte pas
     * @param node
     * @param vars_datas
     */
    public async load_imports_and_split_nodes(
        node: VarDAGNode,
        nodes_to_unlock: { [index: string]: VarDAGNode },
        FOR_TU_imports: VarDataBaseVO[] = null) {

        const imports: VarDataBaseVO[] = FOR_TU_imports ? FOR_TU_imports : (ConfigurationService.IS_UNIT_TEST_MODE ? [] : await ModuleDAO.instance.getVarImportsByMatroidParams(node.var_data._type, [node.var_data], null));

        if ((!imports) || (!imports.length)) {
            return;
        }

        const var_conf = VarsController.var_conf_by_id[node.var_data.var_id];
        await this.split_nodes(node, imports, var_conf.optimization__has_only_atomic_imports, nodes_to_unlock);
    }

    /**
     * Méthode qui fait le découpage du noeud depuis une liste d'imports ou de caches
     * @param node
     * @param imports import ou cache
     * @param optimization__has_only_atomic_imports
     */
    public async split_nodes(
        node: VarDAGNode,
        imports: VarDataBaseVO[],
        optimization__has_only_atomic_imports: boolean,
        nodes_to_unlock: { [index: string]: VarDAGNode },
    ) {

        if ((!imports) || (!imports.length)) {
            return;
        }

        imports.sort(this.sort_matroids_per_cardinal_desc);

        let imports_valides: VarDataBaseVO[];

        // Si on a que des imports isolés, on prend toujours tous les imports, inutile de suivre une stratégie
        if (optimization__has_only_atomic_imports) {
            imports_valides = imports;
        } else {
            imports_valides = this.get_selection_imports(imports, node.var_data);
        }

        if ((!imports_valides) || (!imports_valides.length)) {
            return;
        }

        // on cut par les imports, et pour chaque résultat on crée un noeud fils du noeud actuel, et le noeud actuel devient un aggrégateur
        const cut_result: VarDataBaseVO[] = MatroidController.matroids_cut_matroids_get_remainings(imports_valides, [node.var_data]);

        // Attention le cut_result est mis dans le aggregated_datas, qui est considéré comme déjà testé de load depuis la DB...
        //  donc là faut check le cut_result.
        const params_indexes_by_api_type_id: { [api_type_id: number]: string[] } = {};

        for (const i in cut_result) {
            const param = cut_result[i];

            const var_conf = VarsController.var_conf_by_id[param.var_id];
            if (!var_conf) {
                ConsoleHandler.error('VarsImportsHandler:split_nodes:var_conf not found for param:' + param.index);
                continue;
            }

            if (!params_indexes_by_api_type_id[var_conf.var_data_vo_type]) {
                params_indexes_by_api_type_id[var_conf.var_data_vo_type] = [];
            }

            params_indexes_by_api_type_id[var_conf.var_data_vo_type].push(param.index);
        }

        const found: { [index: string]: VarDataBaseVO } = {};
        const not_found_indexes: string[] = [];
        await VarsDatasProxy.get_exact_params_from_bdd(params_indexes_by_api_type_id, found, not_found_indexes);

        for (const i in cut_result) {
            const param = cut_result[i];

            if (!param) {
                continue;
            }

            if (found[param.index]) {
                param.id = found[param.index].id;
            }
        }

        // Pour chaque noeud restant, un fils à calculer, pour chaque noeud importé, un fils avec la valeur de l'import
        await this.aggregate_imports_and_remaining_datas(node, imports_valides, cut_result, nodes_to_unlock);
    }

    /**
     * Fonction qui retourne la sélection des imports acceptés pour résoudre le vardata en param
     * @param ordered_imports le liste des imports chargés depuis la base ordonnée par cardinal desc
     * @param var_data la cible des imports, qui englobe les imports par définition
     */
    public get_selection_imports(ordered_imports: VarDataBaseVO[], var_data: VarDataBaseVO): VarDataBaseVO[] {

        if (!VarsController.var_conf_by_id[var_data.var_id]) {
            throw new Error('VarsImportsHandler:get_selection_imports:Unknown var_data.var_id:' + var_data.var_id);
        }

        let cardinal_max = MatroidController.get_cardinal(var_data);
        const imports_valides: VarDataBaseVO[] = [];

        let i = 0;

        let tested_import = ordered_imports[i];
        cardinal_max -= MatroidController.get_cardinal(tested_import);
        imports_valides.push(tested_import);

        /**
         * On prend tous les imports, qui intersecte pas ceux qu'on a déjà sélectionnés, et dont le cardinal est <= cardinal_max
         */
        let start_time = Dates.now();
        const real_start_time = start_time;

        i++;
        while ((cardinal_max > 0) && (i < ordered_imports.length)) {

            const actual_time = Dates.now();

            if (actual_time > (start_time + 60)) {
                start_time = actual_time;
                ConsoleHandler.warn('VarsImportsHandler:get_selection_imports:Risque de boucle infinie:' + real_start_time + ':' + actual_time);
            }

            tested_import = ordered_imports[i];
            if (tested_import.var_id != var_data.var_id) {
                throw new Error('VarsImportsHandler:get_selection_imports:Import var_id different from var_data.var_id:' + tested_import.var_id + ':' + var_data.var_id);
            }

            const tested_cardinal = MatroidController.get_cardinal(tested_import);

            if ((tested_cardinal <= cardinal_max) && (!MatroidController.matroid_intersects_any_matroid(tested_import, imports_valides))) {
                cardinal_max -= MatroidController.get_cardinal(tested_import);
                imports_valides.push(tested_import);
            }
            i++;
        }

        return imports_valides;
    }

    public async aggregate_imports_and_remaining_datas(
        node: VarDAGNode,
        imported_datas: VarDataBaseVO[],
        remaining_computations: VarDataBaseVO[],
        nodes_to_unlock: { [index: string]: VarDAGNode },
    ) {

        /**
         * Si on a pas de remaining, et un seul import, on est sur un var_data dont l'import couvre complètement (possible si c'est aussi dans vars_datas)
         *  et donc on agrège pas, juste on met à jour le var_data
         */
        if (imported_datas && (imported_datas.length == 1) && ((!remaining_computations) || (!remaining_computations.length))) {
            node.var_data.id = imported_datas[0].id;
            node.var_data.value = imported_datas[0].value;
            node.var_data.value_ts = imported_datas[0].value_ts;
            node.var_data.value_type = imported_datas[0].value_type;
            return;
        }

        const aggregated_datas: {
            [var_data_index: string]: VarDataBaseVO;
        } = {};

        const promises = [];
        for (const i in imported_datas) {
            const imported_data = imported_datas[i];

            aggregated_datas[imported_data.index] = imported_data;
            /**
             * On indique qu'on a déjà fait un chargement du cache complet
             */
            promises.push((async () => {
                const n = await VarDAGNode.getInstance(node.var_dag, imported_data, true/*, true*/);
                nodes_to_unlock[n.node_name] = n;
            })());
        }

        for (const i in remaining_computations) {
            const remaining_computation = remaining_computations[i];

            aggregated_datas[remaining_computation.index] = remaining_computation;
            /**
             * On indique qu'on a pas encore fait de chargement du cache complet
             */
            promises.push((async () => {
                const n = await VarDAGNode.getInstance(node.var_dag, remaining_computation, false/*, true*/);
                nodes_to_unlock[n.node_name] = n;
            })());
        }
        await all_promises(promises); // Attention Promise[] ne maintient pas le stackcontext a priori de façon systématique, contrairement au PromisePipeline. Ce n'est pas un contexte client donc OSEF ici

        node.is_aggregator = true;
        node.aggregated_datas = aggregated_datas;
    }

    /**
     * Fonction utilisée pour le classement des imports du cardinal le plus élevé au plus faible
     * @param a
     * @param b
     */
    private sort_matroids_per_cardinal_desc(a: VarDataBaseVO, b: VarDataBaseVO): number {
        const card_a = MatroidController.get_cardinal(a);
        const card_b = MatroidController.get_cardinal(b);

        return card_b - card_a;
    }
}