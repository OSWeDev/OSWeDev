import AnonymizationFieldConfVO from "../../../shared/modules/Anonymization/vos/AnonymizationFieldConfVO";
import AnonymizationUserConfVO from "../../../shared/modules/Anonymization/vos/AnonymizationUserConfVO";
import IUserData from "../../../shared/modules/DAO/interface/IUserData";
import ModuleDAO from "../../../shared/modules/DAO/ModuleDAO";
import IDistantVOBase from "../../../shared/modules/IDistantVOBase";
import ModuleTable from "../../../shared/modules/ModuleTable";
import DefaultTranslation from "../../../shared/modules/Translation/vos/DefaultTranslation";
import ConsoleHandler from "../../../shared/tools/ConsoleHandler";
import PushDataServerController from "../PushData/PushDataServerController";

export default class ServerAnonymizationController {

    public static getInstance(): ServerAnonymizationController {
        if (!ServerAnonymizationController.instance) {
            ServerAnonymizationController.instance = new ServerAnonymizationController();
        }
        return ServerAnonymizationController.instance;
    }

    private static instance: ServerAnonymizationController = null;

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
    private registered_anonymization_values: { [vo_type: string]: { [field_id: string]: { [before_anonymization: string]: string } } } = {};

    private registered_anonymization_field_conf_by_vo_type_and_field_id: { [vo_type: string]: { [field_id: string]: AnonymizationFieldConfVO } } = {};
    private registered_anonymization_field_conf_by_id: { [id: number]: AnonymizationFieldConfVO } = {};

    private registered_anonymization_user_conf_by_field_conf_id: { [anon_field_id: number]: { [user_id: number]: AnonymizationUserConfVO } } = {};
    private registered_anonymization_user_conf_by_vo_type: { [vo_type: string]: { [user_id: number]: AnonymizationUserConfVO[] } } = {};

    private constructor() { }

    /**
     * On doit broadcaster la conf, on init les values partout mais elles seront utilisées que sur le main
     */
    public register_anonymization_field_conf(anonymization_field_conf: AnonymizationFieldConfVO) {
        if (!ServerAnonymizationController.getInstance().registered_anonymization_field_conf_by_vo_type_and_field_id[anonymization_field_conf.vo_type]) {
            ServerAnonymizationController.getInstance().registered_anonymization_field_conf_by_vo_type_and_field_id[anonymization_field_conf.vo_type] = {};
            ServerAnonymizationController.getInstance().registered_anonymization_values[anonymization_field_conf.vo_type] = {};
        }

        ServerAnonymizationController.getInstance().registered_anonymization_field_conf_by_id[anonymization_field_conf.id] = anonymization_field_conf;
        ServerAnonymizationController.getInstance().registered_anonymization_values[anonymization_field_conf.vo_type][anonymization_field_conf.field_id] = {};
        ServerAnonymizationController.getInstance().registered_anonymization_field_conf_by_vo_type_and_field_id[anonymization_field_conf.vo_type][anonymization_field_conf.field_id] = anonymization_field_conf;
    }

    /**
     * On doit broadcaster la conf
     */
    public register_anonymization_user_conf(anonymization_user_conf: AnonymizationUserConfVO) {
        if (!ServerAnonymizationController.getInstance().registered_anonymization_user_conf_by_field_conf_id[anonymization_user_conf.anon_field_id]) {
            ServerAnonymizationController.getInstance().registered_anonymization_user_conf_by_field_conf_id[anonymization_user_conf.anon_field_id] = {};
        }

        let conf = ServerAnonymizationController.getInstance().registered_anonymization_field_conf_by_id[anonymization_user_conf.anon_field_id];
        if (!ServerAnonymizationController.getInstance().registered_anonymization_user_conf_by_vo_type[conf.vo_type]) {
            ServerAnonymizationController.getInstance().registered_anonymization_user_conf_by_vo_type[conf.vo_type] = {};
        }
        if (!ServerAnonymizationController.getInstance().registered_anonymization_user_conf_by_vo_type[conf.vo_type][anonymization_user_conf.user_id]) {
            ServerAnonymizationController.getInstance().registered_anonymization_user_conf_by_vo_type[conf.vo_type][anonymization_user_conf.user_id] = [];
        }
        ServerAnonymizationController.getInstance().registered_anonymization_user_conf_by_vo_type[conf.vo_type][anonymization_user_conf.user_id].push(anonymization_user_conf);
        ServerAnonymizationController.getInstance().registered_anonymization_user_conf_by_field_conf_id[anonymization_user_conf.anon_field_id][anonymization_user_conf.user_id] = anonymization_user_conf;
    }

    public async check_is_anonymise<T extends IDistantVOBase>(datatable: ModuleTable<T>, vos: T[], uid: number, user_data: IUserData): Promise<T[]> {
        let res: T[] = [];

        for (let i in vos) {
            let vo = vos[i];

            if (ServerAnonymizationController.getInstance().registered_anonymization_user_conf_by_vo_type[vo._type] &&
                ServerAnonymizationController.getInstance().registered_anonymization_user_conf_by_vo_type[vo._type][uid]) {

                await PushDataServerController.getInstance().notifySimpleWARN(uid, null, "check_is_anonymise.failed" + DefaultTranslation.DEFAULT_LABEL_EXTENSION, true);
                ConsoleHandler.getInstance().warn("Refused CUD on anonymized VO:" + vo._type + ":id:" + vo.id + ":uid:" + uid + ":");
                continue;
            }
            res.push(vo);
        }

        return res;
    }

    public async anonymise<T extends IDistantVOBase>(datatable: ModuleTable<T>, vos: T[], uid: number, user_data: IUserData): Promise<T[]> {
        let res: T[] = [];

        for (let i in vos) {
            let vo = vos[i];

            if (ServerAnonymizationController.getInstance().registered_anonymization_field_conf_by_vo_type_and_field_id[vo._type]) {
                for (let field_id in ServerAnonymizationController.getInstance().registered_anonymization_field_conf_by_vo_type_and_field_id[vo._type]) {
                    let anonymization_field_conf: AnonymizationFieldConfVO = ServerAnonymizationController.getInstance().registered_anonymization_field_conf_by_vo_type_and_field_id[vo._type][field_id];

                    if ((!vo[field_id]) || (!anonymization_field_conf)) {
                        continue;
                    }

                    /**
                     * On anonymise si le user_id est connecté par la conf à ce field
                     */
                    if ((!ServerAnonymizationController.getInstance().registered_anonymization_user_conf_by_field_conf_id[anonymization_field_conf.id]) ||
                        (!ServerAnonymizationController.getInstance().registered_anonymization_user_conf_by_field_conf_id[anonymization_field_conf.id][uid])) {
                        continue;
                    }

                    /**
                     * on doit chercher sur le mainthread les known values
                     *  et donc  on récupère dans tous les cas du mainthread (qui a la conf aussi) la valeur à mettre dans le champs
                     */
                    let known_values_by_id: { [vo_id: number]: string } = ServerAnonymizationController.getInstance().registered_anonymization_values[vo._type][field_id];

                    if (known_values_by_id && known_values_by_id[vo[field_id]]) {
                        vo[field_id] = known_values_by_id[vo[field_id]];
                        continue;
                    }

                    let before_anonymization = vo[field_id];
                    known_values_by_id[before_anonymization] = ServerAnonymizationController.getInstance().anonymize(vo, anonymization_field_conf);
                    vo[field_id] = known_values_by_id[before_anonymization];
                }
            }
            res.push(vo);
        }

        return res;
    }

    /**
     * broadcaster sur chaque update / create / delete de AnonymizationFieldConfVO et AnonymizationUserConfVO le rechargement de la conf en mémoire
     */
    public async reload_conf() {

        ServerAnonymizationController.getInstance().registered_anonymization_field_conf_by_vo_type_and_field_id = {};
        ServerAnonymizationController.getInstance().registered_anonymization_user_conf_by_field_conf_id = {};
        ServerAnonymizationController.getInstance().registered_anonymization_values = {};

        let fields_confs: AnonymizationFieldConfVO[] = await ModuleDAO.getInstance().getVos<AnonymizationFieldConfVO>(AnonymizationFieldConfVO.API_TYPE_ID);
        let users_confs: AnonymizationUserConfVO[] = await ModuleDAO.getInstance().getVos<AnonymizationUserConfVO>(AnonymizationUserConfVO.API_TYPE_ID);

        // On est déjà sur un broadcast on a pas besoin de broadcast le register
        for (let i in fields_confs) {
            ServerAnonymizationController.getInstance().register_anonymization_field_conf(fields_confs[i]);
        }

        for (let i in users_confs) {
            ServerAnonymizationController.getInstance().register_anonymization_user_conf(users_confs[i]);
        }
    }

    private anonymize(vo: IDistantVOBase, anonymization_field_conf: AnonymizationFieldConfVO) {

        switch (anonymization_field_conf.anonymizer_type) {
            case AnonymizationFieldConfVO.TYPE_ANONYMIZER_ADDRESS:
                return ServerAnonymizationController.getInstance().get_new_anon_TYPE_ANONYMIZER_ADDRESS();
            case AnonymizationFieldConfVO.TYPE_ANONYMIZER_CITY:
                return ServerAnonymizationController.getInstance().get_new_TYPE_ANONYMIZER_CITY();
            case AnonymizationFieldConfVO.TYPE_ANONYMIZER_EMAIL:
                return ServerAnonymizationController.getInstance().get_new_TYPE_ANONYMIZER_EMAIL();
            case AnonymizationFieldConfVO.TYPE_ANONYMIZER_FIRSTNAME:
                return ServerAnonymizationController.getInstance().get_new_TYPE_ANONYMIZER_FIRSTNAME();
            case AnonymizationFieldConfVO.TYPE_ANONYMIZER_FULLNAME:
                return ServerAnonymizationController.getInstance().get_new_TYPE_ANONYMIZER_FULLNAME();
            case AnonymizationFieldConfVO.TYPE_ANONYMIZER_LASTNAME:
                return ServerAnonymizationController.getInstance().get_new_TYPE_ANONYMIZER_LASTNAME();
            case AnonymizationFieldConfVO.TYPE_ANONYMIZER_PHONE:
                return ServerAnonymizationController.getInstance().get_new_TYPE_ANONYMIZER_PHONE();
            case AnonymizationFieldConfVO.TYPE_ANONYMIZER_POSTAL:
                return ServerAnonymizationController.getInstance().get_new_TYPE_ANONYMIZER_POSTAL();
            default:
                return vo[anonymization_field_conf.field_id];
        }
    }

    private get_new_anon_TYPE_ANONYMIZER_ADDRESS(): string {
        return "12 rue de la soie 75001 Paris";
    }

    private get_new_TYPE_ANONYMIZER_CITY(): string {

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

    private get_new_TYPE_ANONYMIZER_EMAIL(): string {
        return ServerAnonymizationController.getInstance().get_new_TYPE_ANONYMIZER_FIRSTNAME() + '.' + ServerAnonymizationController.getInstance().get_new_TYPE_ANONYMIZER_LASTNAME() + '@mail.com';
    }

    private get_new_TYPE_ANONYMIZER_FIRSTNAME(): string {
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

    private get_new_TYPE_ANONYMIZER_FULLNAME(): string {

        return ServerAnonymizationController.getInstance().get_new_TYPE_ANONYMIZER_FIRSTNAME() + ' ' + ServerAnonymizationController.getInstance().get_new_TYPE_ANONYMIZER_LASTNAME();
    }

    private get_new_TYPE_ANONYMIZER_LASTNAME(): string {
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

    private get_new_TYPE_ANONYMIZER_PHONE(): string {

        let numbers = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
        let res: string = "0";
        for (let i = 1; i < 10; i++) {
            res += numbers[Math.floor(Math.random() * 10)];
        }

        return res;
    }

    private get_new_TYPE_ANONYMIZER_POSTAL(): string {
        let numbers = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
        let res: string = "";
        for (let i = 0; i < 4; i++) {
            res += numbers[Math.floor(Math.random() * 10)];
        }

        return res + "0";
    }
}