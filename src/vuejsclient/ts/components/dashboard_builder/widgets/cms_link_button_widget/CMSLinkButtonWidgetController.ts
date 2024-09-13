export default class CMSLinkButtontWidgetController {

    private static instance = null;

    private constructor() { }

    public static getInstance(): CMSLinkButtontWidgetController {
        if (!this.instance) {
            this.instance = new CMSLinkButtontWidgetController();
        }

        return this.instance;
    }

}