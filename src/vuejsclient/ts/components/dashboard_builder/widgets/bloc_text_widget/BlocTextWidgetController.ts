export default class BlocTextWidgetController {

    public static getInstance(): BlocTextWidgetController {
        if (!this.instance) {
            this.instance = new BlocTextWidgetController();
        }

        return this.instance;
    }

    private static instance = null;

    private constructor() { }

}