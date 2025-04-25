export default class ListObjectWidgetController {

    public static getInstance(): ListObjectWidgetController {
        if (!this.instance) {
            this.instance = new ListObjectWidgetController();
        }

        return this.instance;
    }

    private static instance = null;

    private constructor() { }

}