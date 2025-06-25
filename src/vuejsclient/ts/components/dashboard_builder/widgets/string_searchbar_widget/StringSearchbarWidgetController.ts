
export default class StringSearchbarWidgetController {

    private static instance = null;

    private constructor() { }

    // istanbul ignore next: nothing to test
    public static getInstance(): StringSearchbarWidgetController {
        if (!this.instance) {
            this.instance = new StringSearchbarWidgetController();
        }

        return this.instance;
    }
}