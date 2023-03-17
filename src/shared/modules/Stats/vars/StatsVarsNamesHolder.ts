
export default class StatsVarsNamesHolder {

    public static VarSecStatsGroupeController_VAR_NAME: string = 'VarSecStatsGroupeController';

    public static getInstance(): StatsVarsNamesHolder {
        if (!StatsVarsNamesHolder.instance) {
            StatsVarsNamesHolder.instance = new StatsVarsNamesHolder();
        }
        return StatsVarsNamesHolder.instance;
    }

    private static instance: StatsVarsNamesHolder = null;

    private constructor() { }
}