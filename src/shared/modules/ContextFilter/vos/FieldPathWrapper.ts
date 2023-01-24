import ModuleTableField from "../../../../shared/modules/ModuleTableField";

export default class FieldPathWrapper {

    /**
     * Pour simplifier les algos en indiquant directement le type de lien utilisé
     * @param field Le champ qui fait le chemin
     * @param is_manytoone Le sens de la relation (manytoone/true ou onetomany/false)
     */
    public constructor(
        public field: ModuleTableField<any>,
        public is_manytoone: boolean = true
    ) { }
}