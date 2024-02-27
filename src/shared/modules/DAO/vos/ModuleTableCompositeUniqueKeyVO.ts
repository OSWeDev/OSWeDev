import NumRange from "../../DataRender/vos/NumRange";
import IDistantVOBase from "../../IDistantVOBase";
import ModuleTableCompositeUniqueKeyController from "../ModuleTableCompositeUniqueKeyController";


export default class ModuleTableCompositeUniqueKeyVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "module_table_field";

    public id: number;
    public _type: string = ModuleTableCompositeUniqueKeyVO.API_TYPE_ID;

    public table_id: number;
    public vo_type: string;

    public field_id_num_ranges: NumRange[];
    public field_names: string[];

    private _index: string;

    /**
     * on demande le rebuild au prochain accès au getter
     */
    public rebuild_index() {

        this._index = null;
        Object.defineProperty(this, 'index', {
            get: this.initial_getter_index,
            configurable: true // Permet de reconfigurer ou de supprimer la propriété plus tard
        });
    }

    public do_rebuild_index() {
        this._index = ModuleTableCompositeUniqueKeyController.get_normalized_index(this);
    }

    /**
     * Attention : L'index est initialisé au premier appel au getter, et immuable par la suite. (cf index de VarDataBaseVO)
     */
    get index(): string {
        return this.initial_getter_index();
    }

    private initial_getter_index(): string {

        if (!this._index) {
            this.do_rebuild_index();
        }

        Object.defineProperty(this, 'index', {
            value: this._index,
            writable: true, // Permet de réassigner la valeur plus tard si nécessaire
            configurable: true // Permet de reconfigurer ou de supprimer la propriété plus tard
        });

        return this._index;
    }

    /**
     * On aimerait rajouter l'index en base pour les filtrages exactes mais ça veut dire un index définitivement unique et pour autant
     *  si on ségmente mois janvier ou jour 01/01 au 31/01 c'est la même var mais pas les mêmes ranges donc un index pas réversible.
     *  Est-ce qu'on parle d'un deuxième index dédié uniquement au filtrage en base du coup ?
     */
    get _bdd_only_index(): string {
        return this.index;
    }
}