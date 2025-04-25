export default class KelioLightEmployeeAPI {
    public archivedEmployee: string; //	Salarié archivé	boolean (false / true)
    public currentAccessAuthorizationEndDate: string; //	Date de fin de prise en compte en accès pour l'affectation en cours	date (format : yyyy-MM-dd)
    public currentAccessAuthorizationEndTime: string; //	Heure de fin de prise en compte en accès pour l'affectation en cours	time (format : HH:mm:ss)
    public currentAccessAuthorizationStartDate: string; //	Date de début de prise en compte en accès pour l'affectation en cours	date (format : yyyy-MM-dd)
    public currentAccessAuthorizationStartTime: string; //	Heure de début de prise en compte en accès pour l'affectation en cours	time (format : HH:mm:ss)
    public defaultEmployeeBadge: string; //	Badge du salarié par défaut	string (max: 16)
    public defaultEmployeeFirstName: string; //	Prénom du salarié par défaut	string (max: 24)
    public defaultEmployeeIdentificationCode: string; //	Code matricule du salarié par défaut	string (max: 80)
    public defaultEmployeeIdentificationNumber: string; //	Matricule du salarié par défaut	string (max: 16)
    public defaultEmployeeSurname: string; //	Nom du salarié par défaut	string (max: 24)
    public employeeBadgeCode: string; //	Code du badge du salarié	string (max: 16)
    public employeeFirstName: string; //	Prénom du salarié	string (max: 24)
    public employeeIdentificationCode: string; //	Code matricule du salarié	string (max: 80)
    public employeeIdentificationNumber: string; //	Matricule du salarié	string (max: 16)
    public employeeKey: string; //	Clé de salarié	int
    public employeeSurname: string; //	Nom du salarié	string (max: 24)
    public errorMessage: string; //	Message d'erreur	string
    public generateBadge: string; //	Générer le code du badge	boolean (false / true)
    public isAccessModuleEmployee: string; //	Salarié d'accès	boolean (false / true)
    public isTandAModuleEmployee: string; //	Salarié gtp	boolean (false / true)
    public searchUsingBadge: string; //	Recherche par badge	boolean (false / true)
    public searchUsingFirstname: string; //	Recherche par prénom	boolean (false / true)
    public searchUsingIdentificationNumber: string; //	Recherche par matricule	boolean (false / true)
    public searchUsingSurname: string; //	Recherche par nom	boolean (false / true)
    public takenIntoAccountEndDate: string; //	Date de fin de prise en compte	date (format : yyyy-MM-dd)
    public takenIntoAccountPeriodEndDate: string; //	Date de fin de contrat horaire	date (format : yyyy-MM-dd)
    public takenIntoAccountPeriodStartDate: string; //	Date de début de contrat horaire	date (format : yyyy-MM-dd)
    public takenIntoAccountStartDate: string; //	Date de début de prise en compte	date (format : yyyy-MM-dd)
    public technicalString: string; //	Clé technique	string
    public useDefaultModelEmployee: string; //	Utilisation du 'salarié modèle' par défaut	boolean (false / true)
    public userProfileAssignmentWizardDescription: string; //	Libellé du profil exploitant Temps et activité à utiliser pour contrôler la cohérence des dates de la fiche salarié	string
    public userProfileAssignmentWizardKey: string; //	Clé du profil exploitant Temps et activité à utiliser pour contrôler la cohérence des dates de la fiche salarié	int
}