import IDistantVOBase from '../../IDistantVOBase';


export default class DataImportHistoricVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "dih";

    public static IMPORT_TYPE_NAMES: string[] = ['import.historic.types.EDIT', 'import.historic.types.REPLACE'];
    public static IMPORT_TYPE_EDIT: number = 0;
    public static IMPORT_TYPE_REPLACE: number = 1;

    public static FAILED_HTML_STATUS: number = 500;

    public id: number;
    public _type: string = DataImportHistoricVO.API_TYPE_ID;

    // On stocke un uid puisque le champ id ne doit pas être utilisé directement
    public historic_uid: string;

    // La data que l'on souhaite importer
    public api_type_id: string;

    // On indique le format choisi pour l'import et on peut proposer d'en changer
    public data_import_format_id: number;

    // Heure de création de l'historique
    public start_date: number;
    // Heure de modification de l'historique
    public last_up_date: number;
    // Heure de modification de l'historique vers un status de fin d'import (en erreur ou non)
    public end_date: number;

    // JSON des params (site, boutique, ...)
    public params: string;

    // Le segment_cible.
    public segment_date_index: number;
    public segment_type: number;

    // La liste des états est la même que pour les lignes de la table d'import (ModuleDataImport.IMPORTATION_STATE_*)
    public state: number;

    // Fichier utilisé pour cet import
    public file_id: number;

    // Utilisateur à la source de la demande d'import
    public user_id: number;

    // Import de type remplacement ou à comparer avec l'existant (et qui doit alors avoir un target_id)
    public import_type: number;

    // Les stats lors de la prise de décision sur le formattage
    public nb_row_validated: number;
    public nb_row_unvalidated: number;

    public autovalidate: boolean;

    public status_before_reimport: number;
    public status_of_last_reimport: number;

    public reimport_of_dih_id: number;

    /**
     * Indique un import qu'on ne veut pas mettre entier en BDD (dans la database import ou dans la table import)
     *  (donc sur lequel on aura pas de logs d'imports à part le DIH et DIL, mais pas l'info par ligne des refus par exemple)
     *  et qui soit REJOUABLE à l'infini, c'est à dire que si on reboot le serveur pendant l'import, ça ne doit avoir aucun impact
     *  par ce que le statut de l'import n'est pas modifié pendant l'import (tout simplement par ce qu'on ne peut pas reprendre
     *  un import en milieu de process, tout se passant en mémoire)
     *  On a aussi tout le contenu du fichier en mémoire, donc on doit utiliser ce système uniquement sur des imports de taille
     *  relativement faible
     */
    public use_fast_track: boolean;
}