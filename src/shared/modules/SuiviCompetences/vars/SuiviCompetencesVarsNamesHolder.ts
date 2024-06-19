
export default class SuiviCompetencesVarsNamesHolder {

    public static VarDaySuiviCompetencesNiveauMaturiteSousGroupeController_VAR_NAME: string = 'VarDaySuiviCompetencesNiveauMaturiteSousGroupeController';
    public static VarDaySuiviCompetencesNiveauMaturiteGroupeController_VAR_NAME: string = 'VarDaySuiviCompetencesNiveauMaturiteGroupeController';
    public static VarDayLastSuiviCompetencesNiveauMaturiteGroupeController_VAR_NAME: string = 'VarDayLastSuiviCompetencesNiveauMaturiteGroupeController';
    public static VarDayLastSuiviCompetencesNiveauMaturiteSousGroupeController_VAR_NAME: string = 'VarDayLastSuiviCompetencesNiveauMaturiteSousGroupeController';

    public static getInstance(): SuiviCompetencesVarsNamesHolder {
        if (!SuiviCompetencesVarsNamesHolder.instance) {
            SuiviCompetencesVarsNamesHolder.instance = new SuiviCompetencesVarsNamesHolder();
        }
        return SuiviCompetencesVarsNamesHolder.instance;
    }

    private static instance: SuiviCompetencesVarsNamesHolder = null;

    private constructor() { }
}