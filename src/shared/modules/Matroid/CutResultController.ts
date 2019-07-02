import moment = require('moment');

export default class CutResultController {

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