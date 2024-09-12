export default class CMSBlocTextWidgetController {

    public static getInstance(): CMSBlocTextWidgetController {
        if (!this.instance) {
            this.instance = new CMSBlocTextWidgetController();
        }

        return this.instance;
    }

    private static instance = null;

    private constructor() { }

}