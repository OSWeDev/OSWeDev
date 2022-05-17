
export default class FieldValueFilterWidgetController {

    public static getInstance(): FieldValueFilterWidgetController {
        if (!this.instance) {
            this.instance = new FieldValueFilterWidgetController();
        }

        return this.instance;
    }

    private static instance = null;

    private constructor() { }

}