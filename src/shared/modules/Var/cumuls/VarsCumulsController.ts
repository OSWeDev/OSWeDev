export default class VarsCumulsController {

    public static CUMUL_NAME_SEPARATOR: string = "__C_";
    public static CUMUL_WEEK_NAME: string = "W";
    public static CUMUL_MONTH_NAME: string = "M";
    public static CUMUL_YEAR_NAME: string = "Y";
    public static CUMUL_RESET_NAME: string = "R";

    public static getInstance(): VarsCumulsController {
        if (!VarsCumulsController.instance) {
            VarsCumulsController.instance = new VarsCumulsController();
        }
        return VarsCumulsController.instance;
    }

    private static instance: VarsCumulsController = null;

    public getCumulativeName(initialName: string, cumulType: string): string {

        let cumulName: string = null;

        // On filtre sur les types connus pour sécu et contrôle
        switch (cumulType) {
            case VarsCumulsController.CUMUL_MONTH_NAME:
                cumulName = VarsCumulsController.CUMUL_MONTH_NAME;
                break;
            case VarsCumulsController.CUMUL_WEEK_NAME:
                cumulName = VarsCumulsController.CUMUL_WEEK_NAME;
                break;
            case VarsCumulsController.CUMUL_YEAR_NAME:
                cumulName = VarsCumulsController.CUMUL_YEAR_NAME;
                break;
            case VarsCumulsController.CUMUL_RESET_NAME:
                cumulName = VarsCumulsController.CUMUL_RESET_NAME;
                break;
        }

        if (!cumulName) {
            return null;
        }

        return initialName + VarsCumulsController.CUMUL_NAME_SEPARATOR + cumulName;
    }
}