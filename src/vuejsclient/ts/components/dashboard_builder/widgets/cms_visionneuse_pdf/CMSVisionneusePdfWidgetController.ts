export default class CMSVisionneusePdfWidgetController {

    private static instance = null;

    private constructor() { }

    public static getInstance(): CMSVisionneusePdfWidgetController {
        if (!this.instance) {
            this.instance = new CMSVisionneusePdfWidgetController();
        }

        return this.instance;
    }

}