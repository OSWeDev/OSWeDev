export default class VarsDatasourceFieldsController {

    public static CUMUL_NAME_SEPARATOR: string = "__FIELD__";

    // istanbul ignore next: nothing to test
    public static getInstance(): VarsDatasourceFieldsController {
        if (!VarsDatasourceFieldsController.instance) {
            VarsDatasourceFieldsController.instance = new VarsDatasourceFieldsController();
        }
        return VarsDatasourceFieldsController.instance;
    }

    private static instance: VarsDatasourceFieldsController = null;

    public getName(datasource_id: string, field_id: string): string {

        return datasource_id + VarsDatasourceFieldsController.CUMUL_NAME_SEPARATOR + field_id;
    }
}