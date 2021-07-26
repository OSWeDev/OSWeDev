
export default class CheckPointController {

    public static getInstance(): CheckPointController {
        if (!CheckPointController.instance) {
            CheckPointController.instance = new CheckPointController();
        }
        return CheckPointController.instance;
    }

    private static instance: CheckPointController = null;

    public registered_checkpoint_validators: { [checklist_name: string]: { [checkpoint_name: string]: () => {} } };

    private constructor() { }
}