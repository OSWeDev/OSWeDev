import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import MatroidController from '../../../shared/modules/Matroid/MatroidController';
import VarDAGNode from '../../../shared/modules/Var/graph/VarDAGNode';
import VarDataBaseVO from '../../../shared/modules/Var/vos/VarDataBaseVO';

export default class VarsImportsHandler {

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

    private static instance: VarsImportsHandler = null;

    protected constructor() {
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
     * @param ds_cache
     */
    public async load_imports_and_split_nodes(node: VarDAGNode, vars_datas: { [index: string]: VarDataBaseVO }, ds_cache: { [ds_name: string]: { [ds_data_index: string]: any } }, FOR_TU_imports: VarDataBaseVO[] = null) {

        let imports: VarDataBaseVO[] = FOR_TU_imports ? FOR_TU_imports : await ModuleDAO.getInstance().getVarImportsByMatroidParams(node.var_data._type, [node.var_data], null);

        if ((!imports) || (!imports.length)) {
            return;
        }

        imports.sort(this.sort_matroids_per_cardinal_desc);

        let imports_valides: VarDataBaseVO[];

        // Si on a que des imports isolés, on prend toujours tous les imports, inutile de suivre une stratégie
        if (node.var_controller.optimization__has_only_atomic_imports) {
            imports_valides = imports;
        } else {
            imports_valides = this.get_selection_imports(imports, node.var_data);
        }

        if ((!imports_valides) || (!imports_valides.length)) {
            return;
        }

        // on cut par les imports, et pour chaque résultat on crée un noeud fils du noeud actuel, et le noeud actuel devient un aggrégateur
        let cut_result: VarDataBaseVO[] = MatroidController.getInstance().matroids_cut_matroids_get_remainings(imports_valides, [node.var_data]);

        // Pour chaque noeud restant, un fils à calculer, pour chaque noeud importé, un fils avec la valeur de l'import
        this.aggregate_imports_and_remaining_datas(node, imports_valides, cut_result);
    }

    /**
     * Fonction utilisée pour le classement des imports du cardinal le plus élevé au plus faible
     * Public pour TU
     * @param a
     * @param b
     */
    public sort_matroids_per_cardinal_desc(a: VarDataBaseVO, b: VarDataBaseVO): number {
        let card_a = MatroidController.getInstance().get_cardinal(a);
        let card_b = MatroidController.getInstance().get_cardinal(b);

        return card_b - card_a;
    }

    /**
     * Fonction qui retourne la sélection des imports acceptés pour résoudre le vardata en param
     * @param ordered_imports le liste des imports chargés depuis la base ordonnée par cardinal desc
     * @param var_data la cible des imports, qui englobe les imports par définition
     */
    public get_selection_imports(ordered_imports: VarDataBaseVO[], var_data: VarDataBaseVO): VarDataBaseVO[] {

        let cardinal_max = MatroidController.getInstance().get_cardinal(var_data);
        let imports_valides: VarDataBaseVO[] = [];

        let i = 0;

        let tested_import = ordered_imports[i];
        cardinal_max -= MatroidController.getInstance().get_cardinal(tested_import);
        imports_valides.push(tested_import);

        /**
         * On prend tous les imports, qui intersecte pas ceux qu'on a déjà sélectionnés, et dont le cardinal est <= cardinal_max
         */
        i++;
        while ((cardinal_max > 0) && (i < ordered_imports.length)) {

            tested_import = ordered_imports[i];

            let tested_cardinal = MatroidController.getInstance().get_cardinal(tested_import);

            if ((tested_cardinal <= cardinal_max) && (!MatroidController.getInstance().matroid_intersects_any_matroid(tested_import, imports_valides))) {
                cardinal_max -= MatroidController.getInstance().get_cardinal(tested_import);
                imports_valides.push(tested_import);
            }
            i++;
        }

        return imports_valides;
    }

    public aggregate_imports_and_remaining_datas(node: VarDAGNode, imported_datas: VarDataBaseVO[], remaining_computations: VarDataBaseVO[]) {
        let aggregated_nodes: {
            [var_data_index: string]: VarDAGNode;
        } = {};

        for (let i in imported_datas) {
            let imported_data = imported_datas[i];

            aggregated_nodes[imported_data.index] = VarDAGNode.getInstance(node.dag, imported_data);
        }

        for (let i in remaining_computations) {
            let remaining_computation = remaining_computations[i];

            aggregated_nodes[remaining_computation.index] = VarDAGNode.getInstance(node.dag, remaining_computation);
        }

        node.is_aggregator = true;
        node.aggregated_nodes = aggregated_nodes;
    }
}