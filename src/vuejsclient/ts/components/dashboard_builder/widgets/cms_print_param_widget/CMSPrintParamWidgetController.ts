export default class CMSPrintParamWidgetController {

    private static instance = null;

    private constructor() { }

    public static getInstance(): CMSPrintParamWidgetController {
        if (!this.instance) {
            this.instance = new CMSPrintParamWidgetController();
        }

        return this.instance;
    }

}