import IDistantVOBase from '../../IDistantVOBase';

export default class DataImportHistoricVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "data_import_historic";

    public static IMPORT_TYPE_NAMES: string[] = ['import.historic.types.EDIT', 'import.historic.types.REPLACE'];
    public static IMPORT_TYPE_EDIT: number = 0;
    public static IMPORT_TYPE_REPLACE: number = 1;

    public static FAILED_HTML_STATUS: number = 500;

    public id: number;
    public _type: string = DataImportHistoricVO.API_TYPE_ID;

    // La data que l'on souhaite importer
    public api_type_id: string;

    // On indique le format choisi pour l'import et on peut proposer d'en changer
    public data_import_format_id: number;

    // Heure de création de l'historique
    public start_date: string;
    // Heure de modification de l'historique
    public last_up_date: string;
    // Heure de modification de l'historique vers un status de fin d'import (en erreur ou non)
    public end_date: string;

    // JSON des params (site, boutique, ...)
    public params: string;

    // Le segment_cible. A priori le type est pas nécessaire ici, on importe pas pour le moment pour des segments différents
    public segment_date_index: string;

    // La liste des états est la même que pour les lignes de la table d'import (ModuleDataImport.IMPORTATION_STATE_*)
    public state: number;

    // Fichier utilisé pour cet import
    public file_id: number;

    // Utilisateur à la source de la demande d'import
    public user_id: number;

    // Import de type remplacement ou à comparer avec l'existant (et qui doit alors avoir un target_id)
    public import_type: number;
}