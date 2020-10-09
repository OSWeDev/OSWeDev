import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import MatroidController from '../../../shared/modules/Matroid/MatroidController';
import VarDAG from '../../../shared/modules/Var/graph/VarDAG';
import VarDAGController from '../../../shared/modules/Var/graph/VarDAGController';
import VarDAGNode from '../../../shared/modules/Var/graph/VarDAGNode';
import VarDataBaseVO from '../../../shared/modules/Var/vos/VarDataBaseVO';
import DataSourceControllerBase from './datasource/DataSourceControllerBase';
import DataSourcesController from './datasource/DataSourcesController';
import VarsDatasProxy from './VarsDatasProxy';

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
    private async load_imports_and_split_nodes(node: VarDAGNode, vars_datas: { [index: string]: VarDataBaseVO }, ds_cache: { [ds_name: string]: { [ds_data_index: string]: any } }) {

        let imports: VarDataBaseVO[] = await ModuleDAO.getInstance().getVarImportsByMatroidParams(node.var_data._type, [node.var_data], null);

        if ((!imports) || (!imports.length)) {
            return;
        }

        let cardinal_max = MatroidController.getInstance().get_cardinal(node.var_data);

        imports.sort(this.sort_matroids_per_cardinal_desc);

        cardinal_max -= MatroidController.getInstance().get_cardinal(imports[0]);
        let imports_valides: VarDataBaseVO[] = [imports[0]];


    }
}