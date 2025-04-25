export default class CMSBlocTextWidgetController {

    private static instance = null;

    private constructor() { }

    public static getInstance(): CMSBlocTextWidgetController {
        if (!this.instance) {
            this.instance = new CMSBlocTextWidgetController();
        }

        return this.instance;
    }

}