export default class CMSBooleanButtontWidgetController {

    private static instance = null;

    private constructor() { }

    public static getInstance(): CMSBooleanButtontWidgetController {
        if (!this.instance) {
            this.instance = new CMSBooleanButtontWidgetController();
        }

        return this.instance;
    }

}