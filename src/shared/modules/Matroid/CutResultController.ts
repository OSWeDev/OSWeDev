
export default class CutResultController {

    // istanbul ignore next: nothing to test
    public static getInstance(): CutResultController {
        if (!CutResultController.instance) {
            CutResultController.instance = new CutResultController();
        }
        return CutResultController.instance;
    }

    private static instance: CutResultController = null;

    private constructor() { }

    public async initialize() {
    }


}