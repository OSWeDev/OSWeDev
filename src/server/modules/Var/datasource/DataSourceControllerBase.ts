import VarDAGNode from '../../../../shared/modules/Var/graph/VarDAGNode';
import VarDataBaseVO from '../../../../shared/modules/Var/vos/VarDataBaseVO';
import DataSourcesController from './DataSourcesController';

export default abstract class DataSourceControllerBase {

    /**
     * Coef de connexion à la DB : par défaut 1
     *  Utilisé pour indiquer qu'une requête se stack (avec d'autres sans préciser spécialement lesquelles)
     *  Du coup on utilisera pas vraiment un slot vers la bdd par load mais moins.
     *  Permet pas d'être précis dans la démarche mais de ne pas se limiter au nombre de connexion à la bdd pour ce data source
     */
    public load_node_data_db_connect_coef: number = 1;

    protected constructor(
        /**
         * Le nom [unique] du Datasource
         */
        public name: string,

        /**
         * Les api_type_ids qui engendrent un refresh potentiel du cache
         */
        public vo_api_type_ids: string[],

        public ds_name_default_translations: { [code_lang: string]: string }
    ) { }

    /**
     * On utilise une clé unique (au sein d'un datasource) pour identifier la data liée à un var data
     *  et on fournit une fonction simple pour traduire le var_data en clé unique de manière à gérer le cache
     *  de façon centralisée.
     */
    public abstract get_data_index(var_data: VarDataBaseVO): any;

    /**
     * Le chargement des données est fait var par var, c'est le moteur de calcul qui vérifie si en fonction de l'index on a vraiment besoin de faire un chargement
     *  de données. Donc pas de cache à gérer dans le datasource, juste répondre à la question posée.
     * ATTENTION : cette fonction a été réemployée mais le fonctionnalité est différente. Initialement utilisée pour charger la donnée depuis le cache
     *  là on veut vraiment charger la data depuis la source de données (base, fichier, ...)
     */
    public abstract get_data(param: VarDataBaseVO): Promise<any>;

    /**
     * Stratégie de chargement des données en fonction du var_data contenu dans le node
     * @param node
     */
    public abstract load_node_data(node: VarDAGNode);

    public registerDataSource() {
        DataSourcesController.getInstance().registerDataSource(this);
    }
}