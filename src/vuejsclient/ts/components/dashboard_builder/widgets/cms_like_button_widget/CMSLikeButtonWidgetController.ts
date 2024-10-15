export default class CMSLikeButtontWidgetController {

    private static instance = null;

    private constructor() { }

    public static getInstance(): CMSLikeButtontWidgetController {
        if (!this.instance) {
            this.instance = new CMSLikeButtontWidgetController();
        }

        return this.instance;
    }

}