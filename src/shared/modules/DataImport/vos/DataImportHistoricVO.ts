import IDistantVOBase from '../../IDistantVOBase';
import ConversionHandler from '../../../tools/ConversionHandler';
import DateHandler from '../../../tools/DateHandler';
import * as moment from 'moment';

export default class DataImportHistoricVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "data_import_historic";

    public static FAILED_HTML_STATUS: number = 500;

    public id: number;
    public _type: string = DataImportHistoricVO.API_TYPE_ID;

    // On indique le format choisi pour l'import et on peut proposer d'en changer
    public data_import_file_id: number;

    // Heure de création de l'historique
    public start_date: string;
    // Heure de modification de l'historique
    public last_up_date: string;
    // Heure de modification de l'historique vers un status de fin d'import (en erreur ou non)
    public end_date: string;

    // JSON des params (date cible, site, boutique, ...)
    public params: string;

    // La liste des états est la même que pour les lignes de la table d'import (ModuleDataImport.IMPORTATION_STATE_*)
    public state: number;

    // Fichier utilisé pour cet import
    public file_id: number;

    // Utilisateur à la source de la demande d'import
    public user_id: number;
}