import IDistantVOBase from "../../IDistantVOBase";

export default class ArchiveFilesConfVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "archive_files_conf";

    public static ARCHIVE_FOLDER: string = "./archives/";

    public static USE_DATE_TYPE_LABELS: string[] = [
        'archive_files_conf.USE_DATE_TYPE.CREATION',
        'archive_files_conf.USE_DATE_TYPE.UPDATE',
        'archive_files_conf.USE_DATE_TYPE.LAST_ACCESS',
    ];
    public static USE_DATE_TYPE_CREATION: number = 0;
    public static USE_DATE_TYPE_UPDATE: number = 1;
    /**
     * Commentaire de GPT sur cette option :
     * Attention :
     *  Sur Windows, il arrive que la date d'accès ne soit pas parfaitement fiable, car elle peut être désactivée pour améliorer les performances. Vérifie bien ce comportement sur ton serveur cible.
     */
    public static USE_DATE_TYPE_LAST_ACCESS: number = 2;

    public id: number;
    public _type: string = ArchiveFilesConfVO.API_TYPE_ID;

    /**
     * Pour garder l'unicité du nom du fichier / répertoire d'archivage, on garde toute l'arbo initiale, y compris files ou sfiles.
     * Par contre on peut choisir de prendre ou nom le name_trans dans l'arbo (par défaut on ne le prend pas, ça sert que pour séparer différentes confs d'archivage sur un meme répertoire)
     * @example /archives/files/clients/archives_clients/2019/12/file.zip pour un fichier initialement dans /files/clients/file.zip et créé en décembre 2019, archivé par la conf "archives_clients"
     * @default false
     */
    public add_name_trans_in_archive_path: boolean;

    /**
     * Est-ce que la conf est actuellement active
     */
    public activated: boolean;

    /**
     * Nom unique de la conf d'archivage
     */
    public name: string;

    /**
     * Version du nom compatible avec les noms de répertoires pour autonommer le répertoire d'archivage
     */
    public name_trans: string;

    /**
     * Les répertoires à checker
     */
    public paths_to_check: string[];

    /**
     * Les regexps des fichiers à archiver au sein du ou des répertoire(s)
     */
    public regexps_of_files_to_archive: string[];

    /**
     * Le type de segment définissant le délai d'archivage
     */
    public type_segment_delai_archivage: number;

    /**
     * Le nombre de segment de type type_segment_delai_archivage avant archivage
     * @default 12
     */
    public nb_segment_delai_archivage: number;

    /**
     * Le nombre max de fichiers à traiter par traitement
     * @default 1000
     */
    public max_files_per_treatement: number;

    /**
     * La date à utiliser pour décider du délai d'archivage :
     *  par défaut on est sur la date de création du fichier
     * @default ArchiveFilesConfVO.USE_DATE_TYPE_CREATION
     */
    public date_fichier_pour_delai: number;

    /**
     * La date a utiliser pour décider du nom du répertoire d'archivage :
     *  par défaut on est sur la date de création du fichier
     * @default ArchiveFilesConfVO.USE_DATE_TYPE_CREATION
     */
    public date_fichier_pour_nommage: number;

    /**
     * Le type de segment pour le nommage des répertoires d'archives
     * @default TimeSegment.TYPE_MONTH
     */
    public type_segment_nommage_archives: number;

    /**
     * Le nombre max de fichiers par répertoire d'archivage
     * @default 100000
     */
    public max_files_per_archive_folder: number;

    /**
     * Le nombre max de tentatives d'archivage avant abandon
     * @default 3
     */
    public max_tentatives: number;
}