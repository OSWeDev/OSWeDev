export default class CMSImagetWidgetController {

    private static instance = null;

    private constructor() { }

    public static getInstance(): CMSImagetWidgetController {
        if (!this.instance) {
            this.instance = new CMSImagetWidgetController();
        }

        return this.instance;
    }

}