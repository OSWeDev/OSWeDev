import { cloneDeep } from 'lodash';
import ContextQueryVO from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleTable from '../../../shared/modules/ModuleTable';
import ModuleTableField from '../../../shared/modules/ModuleTableField';
import VOsTypesManager from '../../../shared/modules/VOsTypesManager';
import FieldPathWrapper from './vos/FieldPathWrapper';

export default class ContextFieldPathServerController {

    public static getInstance() {
        if (!ContextFieldPathServerController.instance) {
            ContextFieldPathServerController.instance = new ContextFieldPathServerController();
        }
        return ContextFieldPathServerController.instance;
    }

    private static instance: ContextFieldPathServerController = null;

    private constructor() { }

    public async configure() {
    }

    /**
     * On avance sur tous les fronts en même temps et on veut associer à chaque chemin un poids qui correspond à la distance
     *  Une relation N/N compte pour 1 en poids et non 2 même si on a 2 vo_type_id à passer, on ignore directement la table intermédiaire
     *
     *  En premier lieu, si le type cible est un type from on retourne null, aucun chemin à chercher on a déjà un type connu
     *  Ensuite on cherche à partir du type cible, et à remonter toutes les branches possibles jusqu'à atteindre un type from
     *  On stocke les types rencontrés en chemin car si on retombe sur un type déjà présent dans un autre chemin, alors ce
     *  chemin est inutile (liste_types_chemins_connus)
     *  On avance chemin par chemin, d'un cran à chaque fois, à ceci près que si l'on rencontre un N/N qui n'est ni connu, ni from,
     *  on continue directement à l'autre côté de la relation N/N pour traduire le fait que la distance d'une relation N/N est 1 et pas 2
     *
     *      On liste les champs ManyToOne du type sur lequel on est (au début type cible, ensuite le bout du chemin en cours d'extension)
     *      NB : puisqu'il s'agit d'un manytoone ici on ne peut pas rencontrer de table N/N, au mieux on peut être sur une relation N/N
     *      mais pas en atteindre une
     *          On filtre sur les types actifs
     *          Si on trouve parmi ces field.target_moduletable un type from, on a identifié le chemin => on renvoie
     *          Sinon
     *              Pour chaque field
     *                  si le type field.target_moduletable est dans liste_types_chemins_connus, ce chemin est inutile, on ignore (puisqu'un autre chemin a déjà trouvé un
     *                  moyen de joindre ce type)
     *                  sinon on crée un nouveau chemin avec ce nouveau type cible en bout, et on le stocke pour le prochain passage
     *      On liste par ailleurs les relations OneToMany vers notre type actuel
     *          On filtre sur les types actifs
     *          Si on trouve parmi ces field.moduletable un type from, on a identifié le chemin => on renvoie
     *          Sinon
     *              Pour chaque field
     *                  si le type field.moduletable est dans liste_types_chemins_connus, ce chemin est inutile, on ignore (puisqu'un autre chemin a déjà trouvé un
     *                  moyen de joindre ce type)
     *                  sinon
     *                      on check si le field.moduletable est un N/N, dans ce cas on ajoute au chemin l'autre field pour sortir du N/N rapidement
     *                      on stocke ce nouveau chemin pour le prochain passage
     *
     *      Si on a trouvé aucun nouveau chemin, on quitte sans solution
     *      Sinon on reprend sur la base des nouveaux chemins
     *
     *
     * On peut simplifier l'algo en séparant une fonction intermédiaire qui doit savoir si on traite du manytone ou du onetomany en entrée pour faire varier
     *  entre field.target_moduletable et field.moduletable, et qui dans le cas onetomany check la possible relation N/N
     *
     * Check Injection OK : Aucun risque identifié
     *
     * @param active_api_type_ids liste des types valides pour la recherche. Un chemin qui passe par un autre api_type_id doit être ignoré
     * @param from_types liste des types déjà liés par des jointures, donc dès qu'on en trouve un on peut arrêter la recherche de chemin
     * @param to_type le type ciblé pour lequel on cherche le chemin
     */
    public get_path_between_types(contextQuery: ContextQueryVO, active_api_type_ids: string[], from_types: string[], to_type: string): FieldPathWrapper[] {

        /**
         * Forme opti du from_types et active_api_type_ids
         */
        let from_types_by_name: { [api_type_id: string]: boolean } = {};
        from_types.forEach((type) => from_types_by_name[type] = true);
        let active_api_type_ids_by_name: { [api_type_id: string]: boolean } = {};
        active_api_type_ids.forEach((type) => active_api_type_ids_by_name[type] = true);

        /**
         * pas de cible ou cible connue ou cible pas autorisée
         */
        if ((!to_type) || from_types_by_name[to_type] || !active_api_type_ids_by_name[to_type]) {
            return null;
        }

        /**
         * Marqueur des types rencontrés
         */
        let deployed_deps_from: { [api_type_id: string]: boolean } = {};

        /**
         * Les chemins à étudier à ce tour, et le stockage des chemins à traiter au tour suivant
         *  Le premier tour se fait avec un actual_paths vide, donc on est en train de tester le
         */
        let actual_paths: FieldPathWrapper[][] = [];
        let next_turn_paths: FieldPathWrapper[][] = [];

        /**
         * Le marqueur pour identifier la fin de la balade
         */
        let is_blocked: boolean = false;

        while (!is_blocked) {
            is_blocked = true;

            actual_paths = next_turn_paths;
            next_turn_paths = [];

            /**
             * Le premier tour on demande de générer des chemins sans en fournir un, mais avec un moduletable de départ identifié
             */
            let this_path_next_turn_paths: FieldPathWrapper[][] = [];

            if ((!actual_paths) || (!actual_paths.length)) {
                let valid_path: FieldPathWrapper[] = this.get_paths_from_moduletable(
                    contextQuery,
                    [],
                    this_path_next_turn_paths,
                    to_type,
                    from_types_by_name,
                    active_api_type_ids_by_name,
                    deployed_deps_from);
                if (valid_path) {
                    return this.reverse_path(valid_path);
                }

                if ((!this_path_next_turn_paths) || (!this_path_next_turn_paths.length)) {
                    return null;
                }

                is_blocked = false;
                next_turn_paths = this_path_next_turn_paths;
                continue;
            }

            /**
             * Sur un tour classique, on demande pour chaque chemin à identifier les ramifications possibles pour le prochain tour
             */
            for (let i in actual_paths) {
                let actual_path = actual_paths[i];

                let valid_path: FieldPathWrapper[] = this.get_paths_from_moduletable(
                    contextQuery,
                    actual_path,
                    this_path_next_turn_paths,
                    to_type,
                    from_types_by_name,
                    active_api_type_ids_by_name,
                    deployed_deps_from);
                if (valid_path) {
                    return this.reverse_path(valid_path);
                }

                if ((!this_path_next_turn_paths) || (!this_path_next_turn_paths.length)) {
                    continue;
                }

                is_blocked = false;
                if ((!next_turn_paths) || (!next_turn_paths.length)) {
                    next_turn_paths = this_path_next_turn_paths;
                } else {
                    next_turn_paths.concat(this_path_next_turn_paths);
                }
            }
        }

        return null;
    }

    /**
     * Fonction qui inverse le chemin pour simplifier l'algo de jointure
     */
    private reverse_path(actual_path: FieldPathWrapper[]): FieldPathWrapper[] {

        let res: FieldPathWrapper[] = [];

        if ((!actual_path) || (!actual_path.length)) {
            return res;
        }

        for (let i = (actual_path.length - 1); i >= 0; i--) {
            let actual_path_i = actual_path[i];
            let res_i = new FieldPathWrapper(actual_path_i.field, !actual_path_i.is_manytoone);
            res.push(res_i);
        }

        return res;
    }

    /**
     * On avance d'un pas sur le chemin proposé en paramètre, et on peut en sortir donc plusieurs nouveaux chemins,
     *  et peut-être une solution pour aller de from_types_by_name => to_type, en sachant que le chemin renvoyé est inversé
     *  (on trace le chemin de to_type => un des from_types_by_name) donc on pourra appeler reverse_path pour le remettre dans le bon sens
     * @see reverse_path
     * @see get_path_between_types for algo
     * @returns solution path if has one
     */
    private get_paths_from_moduletable(
        context_query: ContextQueryVO,
        actual_path: FieldPathWrapper[],
        this_path_next_turn_paths: FieldPathWrapper[][],
        to_type: string,
        from_types_by_name: { [api_type_id: string]: boolean },
        active_api_type_ids_by_name: { [api_type_id: string]: boolean },
        deployed_deps_from: { [api_type_id: string]: boolean }): FieldPathWrapper[] {

        let moduletable: ModuleTable<any> = null;

        /**
         * Si on démarre on part du type cible
         * Sinon on part du dernier type du chemin
         */
        if ((!actual_path) || (!actual_path.length)) {
            moduletable = VOsTypesManager.getInstance().moduleTables_by_voType[to_type];
        } else {
            /**
             * Si on a pris un manytoone => on est parti de field.moduletable vers field.target_moduletable qui est donc le dernier api_type_id du path
             * sinon, on est en onetomany et donc c'est l'inverse, la dernière étape est le field.moduletable
             */
            let last_field_path = actual_path[actual_path.length - 1];
            moduletable = last_field_path.is_manytoone ?
                last_field_path.field.manyToOne_target_moduletable :
                last_field_path.field.module_table;
        }

        if (deployed_deps_from[moduletable.vo_type]) {
            return null;
        }

        /**
         * On charge les manytoone et on filtre sur les types actifs et les recursifs
         */
        let manytoone_fields = VOsTypesManager.getInstance().getManyToOneFields(moduletable.vo_type, Object.keys(deployed_deps_from));
        manytoone_fields = manytoone_fields.filter((field) =>
            (!(context_query.discarded_field_paths && context_query.discarded_field_paths[field.module_table.vo_type] && context_query.discarded_field_paths[field.module_table.vo_type][field.field_id])) &&
            active_api_type_ids_by_name[field.manyToOne_target_moduletable.vo_type] &&
            (field.manyToOne_target_moduletable.vo_type != field.module_table.vo_type));

        /**
         * si on trouve un des point de départ (une des cibles) dans les targets des fields, on a terminé on a un chemin valide on le renvoie
         */
        let manytoone_fields_to_sources: Array<ModuleTableField<any>> = manytoone_fields.filter((field) => from_types_by_name[field.manyToOne_target_moduletable.vo_type]);
        manytoone_fields_to_sources = manytoone_fields_to_sources.filter((field) => !this.filter_technical_field(context_query, field));

        /**
         * On ajoute juste un ordre sur les champs, pour mettre en fin de sélection les champs de type "technique" comme le versioning typiquement
         */
        // manytoone_fields_to_sources.sort((a, b) => {
        //     let weight_a = this.get_field_weight(a);
        //     let weight_b = this.get_field_weight(b);

        //     if (weight_a != weight_b) {
        //         return weight_a - weight_b;
        //     }

        //     if (a.field_id < b.field_id) {
        //         return -1;
        //     }
        //     if (a.field_id > b.field_id) {
        //         return 1;
        //     }

        //     return 0;
        // });

        if (manytoone_fields_to_sources && manytoone_fields_to_sources.length) {
            actual_path.push(new FieldPathWrapper(manytoone_fields_to_sources[0], true));
            return actual_path;
        }

        /**
         * Sinon, (on a déjà filtré les chemins potentiellement déjà connus) pour chaque nouveau field, on crée un nouveau chemin.
         */
        for (let i in manytoone_fields) {
            let manytoone_field = manytoone_fields[i];

            let newpath = cloneDeep(actual_path);
            newpath.push(new FieldPathWrapper(manytoone_field, true));
            this_path_next_turn_paths.push(newpath);
        }

        /**
         * On passe aux onetomany. idem on charge toutes les refs et on filtres les types déjà connus (exclus) et les types actifs (inclus)
         */
        let onetomany_fields: Array<ModuleTableField<any>> = VOsTypesManager.getInstance().get_type_references(moduletable.vo_type);
        onetomany_fields = onetomany_fields.filter((ref) =>
            (!(context_query.discarded_field_paths && context_query.discarded_field_paths[ref.module_table.vo_type] && context_query.discarded_field_paths[ref.module_table.vo_type][ref.field_id])) &&
            active_api_type_ids_by_name[ref.module_table.vo_type] && !deployed_deps_from[ref.module_table.vo_type]);
        onetomany_fields = onetomany_fields.filter((field) => !this.filter_technical_field(context_query, field));

        // onetomany_fields.sort((a, b) => {
        //     let weight_a = this.get_field_weight(a);
        //     let weight_b = this.get_field_weight(b);

        //     if (weight_a != weight_b) {
        //         return weight_a - weight_b;
        //     }

        //     if (a.field_id < b.field_id) {
        //         return -1;
        //     }
        //     if (a.field_id > b.field_id) {
        //         return 1;
        //     }

        //     return 0;
        // });

        /**
         * si on trouve un des point de départ (une des cibles) dans les tables des fields, on a terminé on a un chemin valide on le renvoie
         */
        let onetomany_fields_to_sources: Array<ModuleTableField<any>> = onetomany_fields.filter((field) => from_types_by_name[field.module_table.vo_type]);
        if (onetomany_fields_to_sources && onetomany_fields_to_sources.length) {
            actual_path.push(new FieldPathWrapper(onetomany_fields_to_sources[0], false));
            return actual_path;
        }

        /**
         * Sinon pour chacun,
         *      on check la possibilité d'être sur un N/N.
         *      si c'est le cas
         *          on passe l'autre field aussi en même temps, et on check si c'est pas une source, un !active_api_type_ids_by_name ou une deployed_deps_from
         *          et on réagit en conséquence
         *          sinon on crée le nouveau chemin avec ces 2 fields ajoutés
         *      sinon
         *          on crée un nouveau chemin avec ce field ajouté
         */
        for (let i in onetomany_fields) {
            let onetomany_field = onetomany_fields[i];

            if (VOsTypesManager.getInstance().isManyToManyModuleTable(onetomany_field.module_table)) {
                let second_field = VOsTypesManager.getInstance().getManyToManyOtherField(onetomany_field.module_table, onetomany_field);

                if (context_query.discarded_field_paths && context_query.discarded_field_paths[second_field.module_table.vo_type] && context_query.discarded_field_paths[second_field.module_table.vo_type][second_field.field_id]) {
                    continue;
                }

                if (from_types_by_name[second_field.manyToOne_target_moduletable.vo_type]) {
                    actual_path.push(new FieldPathWrapper(onetomany_field, false));
                    actual_path.push(new FieldPathWrapper(second_field, true));
                    return actual_path;
                }

                if (!active_api_type_ids_by_name[second_field.manyToOne_target_moduletable.vo_type]) {
                    continue;
                }

                if (deployed_deps_from[second_field.manyToOne_target_moduletable.vo_type]) {
                    continue;
                }

                let newpath = cloneDeep(actual_path);
                newpath.push(new FieldPathWrapper(onetomany_field, false));
                newpath.push(new FieldPathWrapper(second_field, true));
                this_path_next_turn_paths.push(newpath);

                // On marque la relation N/N comme déployée aussi du coup
                deployed_deps_from[onetomany_field.module_table.vo_type] = true;
            } else {
                let newpath = cloneDeep(actual_path);
                newpath.push(new FieldPathWrapper(onetomany_field, false));
                this_path_next_turn_paths.push(newpath);
            }
        }

        deployed_deps_from[moduletable.vo_type] = true;

        return null;
    }

    // /**
    //  * On tente d'identifier les fields "techniques" comme les fields ajoutés automatiquement pour le versioning
    //  *  et on leur donne un poids suivant la source du field (field "métier" ou field "technique" et peut-être plusieurs niveaux
    //  *  de fields techniques. dans l'idée où les fields de versioning sont apposés sur tous les vos et ne sont donc pas représentatifs)
    //  * @param field
    //  * @returns le poids du champs
    //  */
    // private get_field_weight(field: ModuleTableField<any>): number {
    //     if (!field) {
    //         return 1000;
    //     }

    //     /**
    //      * Le versioning : poids 100
    //      */
    //     if (field.module_table.is_versioned) {

    //         switch (field.field_id) {
    //             case 'parent_id':
    //             case 'trashed':
    //             case 'version_num':
    //             case 'version_author_id':
    //             case 'version_timestamp':
    //             case 'version_edit_author_id':
    //             case 'version_edit_timestamp':
    //                 return 100;
    //         }
    //     }

    //     return 0;
    // }

    /**
     * En // de la désambiguisation des chemins précise par field et filter
     *  on filtre les champs dits "techniques" pour ne garder que les champs "métier"
     *  au global de la requête
     * @param field
     * @returns true si c'est un field technique (versioning, ...) et si la query filtre ce type de champs
     */
    private filter_technical_field(context_query: ContextQueryVO, field: ModuleTableField<any>): boolean {
        if (context_query && context_query.use_technical_field_versioning) {
            return false;
        }

        /**
         * Le versioning : poids 100
         */
        if (field.module_table.is_versioned) {

            switch (field.field_id) {
                case 'parent_id':
                case 'trashed':
                case 'version_num':
                case 'version_author_id':
                case 'version_timestamp':
                case 'version_edit_author_id':
                case 'version_edit_timestamp':
                    return true;
            }
        }

        return false;
    }
}