
export default class DroppableVoFieldsController {

    public static getInstance(): DroppableVoFieldsController {
        if (!DroppableVoFieldsController.instance) {
            DroppableVoFieldsController.instance = new DroppableVoFieldsController();
        }
        return DroppableVoFieldsController.instance;
    }

    private static instance: DroppableVoFieldsController;

    public visible_fields_and_api_type_ids: { [api_type_id: string]: { [field_id: string]: boolean } } = null;

    protected constructor() {
    }
}