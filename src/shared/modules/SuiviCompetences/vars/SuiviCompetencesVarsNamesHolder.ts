
export default class SuiviCompetencesVarsNamesHolder {

    public static VarDaySuiviCompetencesNiveauMaturiteSousGroupeController_VAR_NAME: string = 'VarDaySuiviCompetencesNiveauMaturiteSousGroupeController';
    public static VarDaySuiviCompetencesNiveauMaturiteGroupeController_VAR_NAME: string = 'VarDaySuiviCompetencesNiveauMaturiteGroupeController';

    public static getInstance(): SuiviCompetencesVarsNamesHolder {
        if (!SuiviCompetencesVarsNamesHolder.instance) {
            SuiviCompetencesVarsNamesHolder.instance = new SuiviCompetencesVarsNamesHolder();
        }
        return SuiviCompetencesVarsNamesHolder.instance;
    }

    private static instance: SuiviCompetencesVarsNamesHolder = null;

    private constructor() { }
}