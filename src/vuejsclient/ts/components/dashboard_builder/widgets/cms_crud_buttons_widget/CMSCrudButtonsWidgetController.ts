export default class CMSCrudButtonsWidgetController {

    private static instance = null;

    private constructor() { }

    public static getInstance(): CMSCrudButtonsWidgetController {
        if (!this.instance) {
            this.instance = new CMSCrudButtonsWidgetController();
        }

        return this.instance;
    }

}