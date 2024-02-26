import RoleVO from "../../../shared/modules/AccessPolicy/vos/RoleVO";
import UserVO from "../../../shared/modules/AccessPolicy/vos/UserVO";
import AnonymizationFieldConfVO from "../../../shared/modules/Anonymization/vos/AnonymizationFieldConfVO";
import AnonymizationUserConfVO from "../../../shared/modules/Anonymization/vos/AnonymizationUserConfVO";
import ContextQueryFieldVO from "../../../shared/modules/ContextFilter/vos/ContextQueryFieldVO";
import ContextQueryVO, { query } from "../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import IUserData from "../../../shared/modules/DAO/interface/IUserData";
import IDistantVOBase from "../../../shared/modules/IDistantVOBase";
import ModuleTableVO from "../../../shared/modules/ModuleTableVO";
import DefaultTranslationVO from "../../../shared/modules/Translation/vos/DefaultTranslationVO";
import VarConfVO from "../../../shared/modules/Var/vos/VarConfVO";
import ConsoleHandler from "../../../shared/tools/ConsoleHandler";
import PushDataServerController from "../PushData/PushDataServerController";

export default class ServerAnonymizationController {

    public static registered_anonymization_field_conf_by_vo_type_and_field_id: { [vo_type: string]: { [field_id: string]: AnonymizationFieldConfVO } } = {};
    public static registered_anonymization_field_conf_by_id: { [id: number]: AnonymizationFieldConfVO } = {};

    /**
     * On doit broadcaster la conf, on init les values partout mais elles seront utilisées que sur le main
     */
    public static register_anonymization_field_conf(anonymization_field_conf: AnonymizationFieldConfVO) {
        if (!ServerAnonymizationController.registered_anonymization_field_conf_by_vo_type_and_field_id[anonymization_field_conf.vo_type]) {
            ServerAnonymizationController.registered_anonymization_field_conf_by_vo_type_and_field_id[anonymization_field_conf.vo_type] = {};
            ServerAnonymizationController.registered_anonymization_values[anonymization_field_conf.vo_type] = {};
        }

        ServerAnonymizationController.registered_anonymization_field_conf_by_id[anonymization_field_conf.id] = anonymization_field_conf;
        ServerAnonymizationController.registered_anonymization_values[anonymization_field_conf.vo_type][anonymization_field_conf.field_name] = {};
        ServerAnonymizationController.registered_anonymization_field_conf_by_vo_type_and_field_id[anonymization_field_conf.vo_type][anonymization_field_conf.field_name] = anonymization_field_conf;
    }

    /**
     * On doit broadcaster la conf
     */
    public static register_anonymization_user_conf(anonymization_user_conf: AnonymizationUserConfVO) {
        if (!ServerAnonymizationController.registered_anonymization_user_conf_by_field_conf_id[anonymization_user_conf.anon_field_name]) {
            ServerAnonymizationController.registered_anonymization_user_conf_by_field_conf_id[anonymization_user_conf.anon_field_name] = {};
        }

        let conf = ServerAnonymizationController.registered_anonymization_field_conf_by_id[anonymization_user_conf.anon_field_name];
        if (!ServerAnonymizationController.registered_anonymization_user_conf_by_vo_type[conf.vo_type]) {
            ServerAnonymizationController.registered_anonymization_user_conf_by_vo_type[conf.vo_type] = {};
        }
        if (!ServerAnonymizationController.registered_anonymization_user_conf_by_vo_type[conf.vo_type][anonymization_user_conf.user_id]) {
            ServerAnonymizationController.registered_anonymization_user_conf_by_vo_type[conf.vo_type][anonymization_user_conf.user_id] = [];
        }
        ServerAnonymizationController.registered_anonymization_user_conf_by_vo_type[conf.vo_type][anonymization_user_conf.user_id].push(anonymization_user_conf);
        ServerAnonymizationController.registered_anonymization_user_conf_by_field_conf_id[anonymization_user_conf.anon_field_name][anonymization_user_conf.user_id] = anonymization_user_conf;
    }

    public static async check_is_anonymise<T extends IDistantVOBase>(datatable: ModuleTableVO<T>, vos: T[], uid: number, user_data: IUserData): Promise<T[]> {
        let res: T[] = [];

        for (let i in vos) {
            let vo = vos[i];

            if (ServerAnonymizationController.registered_anonymization_user_conf_by_vo_type[vo._type] &&
                ServerAnonymizationController.registered_anonymization_user_conf_by_vo_type[vo._type][uid]) {

                await PushDataServerController.getInstance().notifySimpleWARN(uid, null, "check_is_anonymise.failed" + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION, true);
                ConsoleHandler.warn("Refused CUD on anonymized VO:" + vo._type + ":id:" + vo.id + ":uid:" + uid + ":");
                continue;
            }
            res.push(vo);
        }

        return res;
    }

    /**
     * Context access hook pour les modules d'animation qui doivent être liées à un rôle de l'utilisateur. On sélectionne l'id des vos valides
     * @param moduletable La table sur laquelle on fait la demande
     * @param uid L'uid lié à la session qui fait la requête
     * @param user L'utilisateur qui fait la requête
     * @param user_data Les datas de profil de l'utilisateur qui fait la requête
     * @param user_roles Les rôles de l'utilisateur qui fait la requête
     * @returns la query qui permet de filtrer les vos valides
     */
    public static async anonymiseContextAccessHook(moduletable: ModuleTableVO<any>, uid: number, user: UserVO, user_data: IUserData, user_roles: RoleVO[]): Promise<ContextQueryVO> {

        if (ServerAnonymizationController.registered_anonymization_field_conf_by_vo_type_and_field_id[moduletable.vo_type]) {
            // FIXME TODO très chaud ça... comment on peut faire ça sous forme de context filter ... ?
            //  surtout que là on est sensé renvoyer l'id pour dire qu'on valide le champ. c'est pas du tout ce qui est en train d'être fait.
            //  est-ce qu'on doit pas gérer ça dans un defaultNumerics ? => en même temps ça répond pas à la question des datatable rows qui renvoient
            //  directement le contenu de la base... donc faut autre chose encore...
            //  le cache d'anonimization doit être disponible directement en base, ou alors faut anonimiser avec une fonction (traduite facilement en requête)
            //  et qu'on applique directement dans le context query field, pour filtrer le résultat de requête. la fonction doit alors renvoyer toujours le
            //  même résultat pour une entrée identique (donc exit l'aléatoire). pas simple. Pour le moment l'anonimisation n'est pas compatible avec les context
            //  query sur datatable rows du coup
            // throw new Error('Not implemented');
        }

        return null;
    }

    public static anonymise<T extends IDistantVOBase>(datatable: ModuleTableVO<T>, vos: T[], uid: number, user_data: IUserData): T[] {
        let res: T[] = [];

        for (let i in vos) {
            let vo = vos[i];

            if (!vo) {
                continue;
            }

            if (ServerAnonymizationController.registered_anonymization_field_conf_by_vo_type_and_field_id[vo._type]) {
                for (let field_id in ServerAnonymizationController.registered_anonymization_field_conf_by_vo_type_and_field_id[vo._type]) {

                    ServerAnonymizationController.anonymise_row_field(vo, vo._type, field_id, field_id, uid);
                }
            }
            res.push(vo);
        }

        return res;
    }

    public static anonymise_context_filtered_rows<T>(rows: T[], fields: ContextQueryFieldVO[], uid: number): T[] {

        for (let i in rows) {
            let row = rows[i];

            ServerAnonymizationController.anonymise_context_filtered_row(row, fields, uid);
        }

        return rows;
    }

    public static anonymise_context_filtered_row<T>(row: T, fields: ContextQueryFieldVO[], uid: number): T {

        for (let i in fields) {
            let field = fields[i];

            if (field.aggregator != VarConfVO.NO_AGGREGATOR) {
                /**
                 * Si on a déjà aggrégé le résultat, compliqué de l'anonimiser à ce stade
                 *  ou pas, à voir si il faut ?
                 */
                continue;
            }

            let api_type_id = field.api_type_id;
            let field_id = field.field_name;

            if (ServerAnonymizationController.registered_anonymization_field_conf_by_vo_type_and_field_id[api_type_id] &&
                ServerAnonymizationController.registered_anonymization_field_conf_by_vo_type_and_field_id[api_type_id][field_id]) {
                ServerAnonymizationController.anonymise_row_field(row, api_type_id, field_id, field.alias ? field.alias : field.field_name, uid);
            }
        }

        return row;
    }

    public static async get_unanonymised_row_field_value<T>(row_field_value: string, row_field_api_type_id: string, row_field_field_id: string, uid: number): Promise<string> {

        if (!row_field_value) {
            return row_field_value;
        }

        if (ServerAnonymizationController.registered_anonymization_field_conf_by_vo_type_and_field_id[row_field_api_type_id] &&
            ServerAnonymizationController.registered_anonymization_field_conf_by_vo_type_and_field_id[row_field_api_type_id][row_field_field_id]) {

            let anonymization_field_conf = ServerAnonymizationController.registered_anonymization_field_conf_by_vo_type_and_field_id[row_field_api_type_id][row_field_field_id];

            if (!anonymization_field_conf) {
                return row_field_value;
            }

            /**
             * On anonymise si le user_id est connecté par la conf à ce field
             */
            if ((!ServerAnonymizationController.registered_anonymization_user_conf_by_field_conf_id[anonymization_field_conf.id]) ||
                (!ServerAnonymizationController.registered_anonymization_user_conf_by_field_conf_id[anonymization_field_conf.id][uid])) {
                return row_field_value;
            }

            /**
             * on doit chercher sur le mainthread les known values
             *  et donc  on récupère dans tous les cas du mainthread (qui a la conf aussi) la valeur à mettre dans le champs
             */
            let known_values_by_id: { [before_anonymization: string]: string } = ServerAnonymizationController.registered_anonymization_values[row_field_api_type_id][row_field_field_id];

            if (known_values_by_id) {

                for (let i in known_values_by_id) {
                    let known_value = known_values_by_id[i];

                    if (known_value == row_field_value) {
                        return i;
                    }
                }
            }
        }
        return row_field_value;
    }

    public static anonymise_row_field<T>(row: T, row_field_api_type_id: string, row_field_field_id: string, alias: string, uid: number): T {
        if (ServerAnonymizationController.registered_anonymization_field_conf_by_vo_type_and_field_id[row_field_api_type_id] &&
            ServerAnonymizationController.registered_anonymization_field_conf_by_vo_type_and_field_id[row_field_api_type_id][row_field_field_id]) {

            let anonymization_field_conf = ServerAnonymizationController.registered_anonymization_field_conf_by_vo_type_and_field_id[row_field_api_type_id][row_field_field_id];

            if ((!row[alias]) || (!anonymization_field_conf)) {
                return row;
            }

            /**
             * On anonymise si le user_id est connecté par la conf à ce field
             */
            if ((!ServerAnonymizationController.registered_anonymization_user_conf_by_field_conf_id[anonymization_field_conf.id]) ||
                (!ServerAnonymizationController.registered_anonymization_user_conf_by_field_conf_id[anonymization_field_conf.id][uid])) {
                return row;
            }

            /**
             * on doit chercher sur le mainthread les known values
             *  et donc  on récupère dans tous les cas du mainthread (qui a la conf aussi) la valeur à mettre dans le champs
             */
            let known_values_by_id: { [before_anonymization: string]: string } = ServerAnonymizationController.registered_anonymization_values[row_field_api_type_id][row_field_field_id];

            if (known_values_by_id && known_values_by_id[row[alias]]) {
                row[alias] = known_values_by_id[row[alias]];
                return row;
            }

            let before_anonymization = row[alias];
            known_values_by_id[before_anonymization] = ServerAnonymizationController.anonymize(row, anonymization_field_conf);
            row[alias] = known_values_by_id[before_anonymization];
        }
        return row;
    }

    /**
     * broadcaster sur chaque update / create / delete de AnonymizationFieldConfVO et AnonymizationUserConfVO le rechargement de la conf en mémoire
     */
    public static async reload_conf() {

        ServerAnonymizationController.registered_anonymization_field_conf_by_vo_type_and_field_id = {};
        ServerAnonymizationController.registered_anonymization_user_conf_by_field_conf_id = {};
        ServerAnonymizationController.registered_anonymization_values = {};

        let fields_confs: AnonymizationFieldConfVO[] = await query(AnonymizationFieldConfVO.API_TYPE_ID).select_vos<AnonymizationFieldConfVO>();
        let users_confs: AnonymizationUserConfVO[] = await query(AnonymizationUserConfVO.API_TYPE_ID).select_vos<AnonymizationUserConfVO>();

        // On est déjà sur un broadcast on a pas besoin de broadcast le register
        for (let i in fields_confs) {
            ServerAnonymizationController.register_anonymization_field_conf(fields_confs[i]);
        }

        for (let i in users_confs) {
            ServerAnonymizationController.register_anonymization_user_conf(users_confs[i]);
        }
    }

    /**
     * TODO ATTENTION : On gère pas les threads pour le moment, par ce que a priori il faut toujours pouvoir identifier le user_id donc toujours
     *  être sur une demande liée au main thread. Idem les conf sont chargées par le main thread et modifiables uniquement par le main thread...
     *  donc a priori on a rien à gérer sur les bg en l'état. Par contre ça pose la question des exports en bg thread... ?
     */

    /**
     * ATTENTION : cache des known_values côté serveur mainthread mais conf accessible partout
     */
    /**
     * On stocke les vos anonymisés par fields / vo avec le nouveau nom, par id du vo
     *  on ne peut anonymiser par ce système que des champs texte
     *  on ne peut anonymiser une valeur null
     *  on anonymise champs par champs et on met en cache en fonction de la valeur initiale du champs et non de l'id de l'objet (pour
     *      concerver le lien sur un champ à valeur non unique, on retrouvera le côté non unique mais anonymisé)
     */
    private static registered_anonymization_values: { [vo_type: string]: { [field_id: string]: { [before_anonymization: string]: string } } } = {};

    private static registered_anonymization_user_conf_by_field_conf_id: { [anon_field_id: number]: { [user_id: number]: AnonymizationUserConfVO } } = {};
    private static registered_anonymization_user_conf_by_vo_type: { [vo_type: string]: { [user_id: number]: AnonymizationUserConfVO[] } } = {};


    private static anonymize<T>(vo: T, anonymization_field_conf: AnonymizationFieldConfVO) {

        switch (anonymization_field_conf.anonymizer_type) {
            case AnonymizationFieldConfVO.TYPE_ANONYMIZER_ADDRESS:
                return ServerAnonymizationController.get_new_anon_TYPE_ANONYMIZER_ADDRESS();
            case AnonymizationFieldConfVO.TYPE_ANONYMIZER_CITY:
                return ServerAnonymizationController.get_new_TYPE_ANONYMIZER_CITY();
            case AnonymizationFieldConfVO.TYPE_ANONYMIZER_EMAIL:
                return ServerAnonymizationController.get_new_TYPE_ANONYMIZER_EMAIL();
            case AnonymizationFieldConfVO.TYPE_ANONYMIZER_FIRSTNAME:
                return ServerAnonymizationController.get_new_TYPE_ANONYMIZER_FIRSTNAME();
            case AnonymizationFieldConfVO.TYPE_ANONYMIZER_FULLNAME:
                return ServerAnonymizationController.get_new_TYPE_ANONYMIZER_FULLNAME();
            case AnonymizationFieldConfVO.TYPE_ANONYMIZER_LASTNAME:
                return ServerAnonymizationController.get_new_TYPE_ANONYMIZER_LASTNAME();
            case AnonymizationFieldConfVO.TYPE_ANONYMIZER_PHONE:
                return ServerAnonymizationController.get_new_TYPE_ANONYMIZER_PHONE();
            case AnonymizationFieldConfVO.TYPE_ANONYMIZER_POSTAL:
                return ServerAnonymizationController.get_new_TYPE_ANONYMIZER_POSTAL();
            default:
                return vo[anonymization_field_conf.field_name];
        }
    }

    private static get_new_anon_TYPE_ANONYMIZER_ADDRESS(): string {
        return "12 rue de la soie 75001 Paris";
    }

    private static get_new_TYPE_ANONYMIZER_CITY(): string {

        return ["Paris",
            "Marseille",
            "Lyon",
            "Toulouse",
            "Nice",
            "Nantes",
            "Montpellier",
            "Strasbourg",
            "Bordeaux",
            "Lille",
            "Rennes",
            "Reims",
            "Toulon",
            "Saint-Étienne",
            "Le Havre",
            "Grenoble",
            "Dijon",
            "Angers",
            "Villeurbanne",
            "Saint-Denis",
            "Nîmes",
            "Clermont-Ferrand",
            "Le Mans",
            "Aix-en-Provence",
            "Brest",
            "Tours",
            "Amiens",
            "Limoges",
            "Annecy",
            "Boulogne-Billancourt",
            "Perpignan",
            "Besançon",
            "Metz",
            "Orléans",
            "Saint-Denis",
            "Rouen",
            "Argenteuil",
            "Montreuil",
            "Mulhouse",
            "Caen",
            "Nancy",
            "Saint-Paul",
            "Roubaix",
            "Tourcoing",
            "Nanterre",
            "Vitry-sur-Seine",
            "Créteil",
            "Avignon",
            "Poitiers",
            "Aubervilliers",
            "Dunkerque",
            "Aulnay-sous-Bois",
            "Colombes",
            "Asnières-sur-Seine",
            "Versailles",
            "Saint-Pierre",
            "Courbevoie",
            "Le Tampon",
            "Cherbourg-en-Cotentin",
            "Fort-de-France",
            "Rueil-Malmaison",
            "Béziers",
            "Champigny-sur-Marne",
            "Pau",
            "La Rochelle",
            "Saint-Maur-des-Fossés",
            "Cannes",
            "Calais",
            "Antibes",
            "Drancy",
            "Mérignac",
            "Saint-Nazaire",
            "Colmar",
            "Issy-les-Moulineaux",
            "Noisy-le-Grand",
            "Évry-Courcouronnes",
            "Vénissieux",
            "Cergy",
            "Levallois-Perret",
            "Valence",
            "Bourges",
            "Pessac",
            "Cayenne",
            "Ivry-sur-Seine",
            "Quimper",
            "La Seyne-sur-Mer",
            "Antony",
            "Villeneuve-d'Ascq",
            "Clichy",
            "Troyes",
            "Montauban",
            "Neuilly-sur-Seine",
            "Pantin",
            "Niort",
            "Chambéry",
            "Sarcelles",
            "Le Blanc-Mesnil",
            "Lorient",
            "Saint-André",
            "Beauvais",
            "Maisons-Alfort",
            "Meaux",
            "Narbonne",
            "Chelles",
            "Hyères",
            "Villejuif",
            "Épinay-sur-Seine",
            "La Roche-sur-Yon",
            "Bobigny",
            "Cholet",
            "Bondy",
            "Saint-Quentin",
            "Fréjus",
            "Saint-Louis",
            "Vannes",
            "Les Abymes",
            "Clamart",
            "Sartrouville",
            "Fontenay-sous-Bois",
            "Cagnes-sur-Mer",
            "Bayonne",
            "Sevran",
            "Arles",
            "Corbeil-Essonnes",
            "Vaulx-en-Velin",
            "Saint-Ouen-sur-Seine",
            "Massy",
            "Vincennes",
            "Laval",
            "Albi",
            "Grasse",
            "Suresnes",
            "Montrouge",
            "Martigues",
            "Gennevilliers",
            "Aubagne",
            "Belfort",
            "Évreux",
            "Brive-la-Gaillarde",
            "Carcassonne",
            "Saint-Priest",
            "Saint-Malo",
            "Charleville-Mézières",
            "Saint-Herblain",
            "Choisy-le-Roi",
            "Rosny-sous-Bois",
            "Blois",
            "Meudon",
            "Saint-Laurent-du-Maroni",
            "Salon-de-Provence",
            "Livry-Gargan",
            "Puteaux",
            "Chalon-sur-Saône",
            "Saint-Germain-en-Laye",
            "Les Sables-d'Olonne",
            "Alfortville",
            "Châlons-en-Champagne",
            "Mantes-la-Jolie",
            "Noisy-le-Sec",
            "Saint-Brieuc",
            "La Courneuve",
            "Sète",
            "Châteauroux",
            "Istres",
            "Valenciennes",
            "Garges-lès-Gonesse",
            "Caluire-et-Cuire",
            "Talence",
            "Tarbes",
            "Rezé",
            "Bron",
            "Castres",
            "Angoulême",
            "Arras",
            "Le Cannet",
            "Bourg-en-Bresse",
            "Wattrelos",
            "Bagneux",
            "Alès",
            "Boulogne-sur-Mer",
            "Le Lamentin",
            "Gap",
            "Compiègne",
            "Thionville",
            "Melun",
            "Douai",
            "Gagny",
            "Anglet",
            "Montélimar",
            "Draguignan",
            "Colomiers",
            "Stains",
            "Marcq-en-Barœul",
            "Chartres",
            "Saint-Martin-d'Hères",
            "Poissy",
            "Joué-lès-Tours",
            "Pontault-Combault",
            "Saint-Joseph",
            "Villepinte",
            "Saint-Benoît",
            "Châtillon",
            "Franconville",
            "Échirolles",
            "Savigny-sur-Orge",
            "Villefranche-sur-Saône",
            "Annemasse",
            "Tremblay-en-France",
            "Sainte-Geneviève-des-Bois",
            "Creil",
            "Neuilly-sur-Marne",
            "Conflans-Sainte-Honorine",
            "Saint-Raphaël",
            "Palaiseau",
            "Bagnolet",
            "La Ciotat",
            "Villenave-d'Ornon",
            "Thonon-les-Bains",
            "Athis-Mons",
            "Saint-Chamond",
            "Montluçon",
            "Haguenau",
            "Auxerre",
            "Villeneuve-Saint-Georges",
            "Saint-Leu",
            "Châtenay-Malabry",
            "Meyzieu",
            "Saint-Martin",
            "Roanne",
            "Mâcon",
            "Le Perreux-sur-Marne",
            "Six-Fours-les-Plages",
            "Le Port",
            "Nevers",
            "Sainte-Marie",
            "Romans-sur-Isère",
            "Vitrolles",
            "Schiltigheim",
            "Agen",
            "Les Mureaux",
            "Matoury",
            "Nogent-sur-Marne",
            "Marignane",
            "La Possession",
            "Montigny-le-Bretonneux",
            "Cambrai",
            "Houilles",
            "Épinal",
            "Trappes",
            "Châtellerault",
            "Lens",
            "Saint-Médard-en-Jalles",
            "Vigneux-sur-Seine",
            "Pontoise",
            "L'Haÿ-les-Roses",
            "Le Chesnay-Rocquencourt",
            "Baie-Mahault",
            "Plaisir",
            "Cachan",
            "Pierrefitte-sur-Seine",
            "Malakoff",
            "Viry-Châtillon",
            "Dreux",
            "Goussainville",
            "Bezons",
            "Liévin",
            "Rillieux-la-Pape",
            "Chatou",
            "Menton",
            "Herblay-sur-Seine",
            "Périgueux",
            "Charenton-le-Pont",
            "Saint-Cloud",
            "Vandœuvre-lès-Nancy",
            "Villemomble"][Math.floor(Math.random() * 275)];
    }

    private static get_new_TYPE_ANONYMIZER_EMAIL(): string {
        return ServerAnonymizationController.get_new_TYPE_ANONYMIZER_FIRSTNAME() + '.' + ServerAnonymizationController.get_new_TYPE_ANONYMIZER_LASTNAME() + '@mail.com';
    }

    private static get_new_TYPE_ANONYMIZER_FIRSTNAME(): string {
        let firstnames = ["LUCIE",
            "ALINA",
            "MILA",
            "LILY",
            "RAPHAËLLE",
            "ELLA",
            "MARIE",
            "JULIETTE",
            "ANDRÉA",
            "KELLIANA",
            "ANNA",
            "CAPUCINE",
            "JULIA",
            "SYBILLE",
            "LYSE",
            "MARGAUX",
            "GABRIELLE",
            "JADE",
            "LOU",
            "KRYSTAL",
            "ÉLISA",
            "ROSE",
            "CLÉA",
            "SOLENN",
            "LYNN",
            "AMANDINE",
            "MAËLYNN",
            "EMY",
            "ROSA",
            "ZÉLIE",
            "OCÉANE",
            "LIZA",
            "ESTELLE",
            "ANAÉ",
            "CONSTANCE",
            "STELLA",
            "LISON",
            "ALIX",
            "LOUISE",
            "LILLY",
            "INAYA",
            "OLYMPE",
            "KELYNE",
            "LILYA",
            "LOUNA",
            "LIANA",
            "ADÈLE",
            "LÉNAËLLE",
            "CAMILLE",
            "LORELEI",
            "LUCAS",
            "SAMUEL",
            "MAYRON",
            "GABRIEL",
            "JULIAN",
            "MAËL",
            "TOM",
            "VICTOR",
            "MILAN",
            "LOUIS",
            "MATHIS",
            "THÉLIO",
            "ALESSIO",
            "ELIO",
            "BAPTISTE",
            "MATHÉO",
            "MELVYN",
            "HUGO",
            "KYLIAN",
            "LIAM",
            "ENZO",
            "LENNY",
            "MALO",
            "MARCELIN",
            "MILHAN",
            "ÉVAN",
            "NOLAN",
            "NOAH",
            "MATÉO",
            "CHARLY",
            "EIDEN",
            "LOHAN",
            "ÉMILE",
            "LINO",
            "ETHAN",
            "KENNY",
            "NATHAN",
            "LANCELOT",
            "LEWIS",
            "MARCEAU",
            "ISAAC",
            "ANTONIN",
            "TIAGO",
            "LÉO",
            "ÉLOUAN",
            "TIMÉO",
            "BASILE",
            "RAPHAËL",
            "DARREN",
            "SIMON"];

        return firstnames[Math.floor(Math.random() * 100)];
    }

    private static get_new_TYPE_ANONYMIZER_FULLNAME(): string {

        return ServerAnonymizationController.get_new_TYPE_ANONYMIZER_FIRSTNAME() + ' ' + ServerAnonymizationController.get_new_TYPE_ANONYMIZER_LASTNAME();
    }

    private static get_new_TYPE_ANONYMIZER_LASTNAME(): string {
        let names = [
            "MARTIN",
            "BERNARD",
            "THOMAS",
            "PETIT",
            "ROBERT",
            "RICHARD",
            "DURAND",
            "DUBOIS",
            "MOREAU",
            "LAURENT",
            "SIMON",
            "MICHEL",
            "LEFEBVRE",
            "LEROY",
            "ROUX",
            "DAVID",
            "BERTRAND",
            "MOREL",
            "FOURNIER",
            "GIRARD",
            "BONNET",
            "DUPONT",
            "LAMBERT",
            "FONTAINE",
            "ROUSSEAU",
            "VINCENT",
            "MULLER",
            "LEFEVRE",
            "FAURE",
            "ANDRE",
            "MERCIER",
            "BLANC",
            "GUERIN",
            "BOYER",
            "GARNIER",
            "CHEVALIER",
            "FRANCOIS",
            "LEGRAND",
            "GAUTHIER",
            "GARCIA",
            "PERRIN",
            "ROBIN",
            "CLEMENT",
            "MORIN",
            "NICOLAS",
            "HENRY",
            "ROUSSEL",
            "MATHIEU",
            "GAUTIER",
            "MASSON",
            "MARCHAND",
            "DUVAL",
            "DENIS",
            "DUMONT",
            "MARIE",
            "LEMAIRE",
            "NOEL",
            "MEYER",
            "DUFOUR",
            "MEUNIER",
            "BRUN",
            "BLANCHARD",
            "GIRAUD",
            "JOLY",
            "RIVIERE",
            "LUCAS",
            "BRUNET",
            "GAILLARD",
            "BARBIER",
            "ARNAUD",
            "MARTINEZ",
            "GERARD",
            "ROCHE",
            "RENARD",
            "SCHMITT",
            "ROY",
            "LEROUX",
            "COLIN",
            "VIDAL",
            "CARON",
            "PICARD",
            "ROGER",
            "FABRE",
            "AUBERT",
            "LEMOINE",
            "RENAUD",
            "DUMAS",
            "LACROIX",
            "OLIVIER",
            "PHILIPPE",
            "BOURGEOIS",
            "PIERRE",
            "BENOIT",
            "REY",
            "LECLERC",
            "PAYET",
            "ROLLAND",
            "LECLERCQ",
            "GUILLAUME",
            "LECOMTE"
        ];

        return names[Math.floor(Math.random() * 100)];
    }

    private static get_new_TYPE_ANONYMIZER_PHONE(): string {

        let numbers = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
        let res: string = "0";
        for (let i = 1; i < 10; i++) {
            res += numbers[Math.floor(Math.random() * 10)];
        }

        return res;
    }

    private static get_new_TYPE_ANONYMIZER_POSTAL(): string {
        let numbers = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
        let res: string = "";
        for (let i = 0; i < 4; i++) {
            res += numbers[Math.floor(Math.random() * 10)];
        }

        return res + "0";
    }
}