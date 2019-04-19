export default class BinaryVarOperatorsController {

    public static OPERATOR_NAME_SEPARATOR: string = "__OP__";

    public static getInstance(): BinaryVarOperatorsController {
        if (!BinaryVarOperatorsController.instance) {
            BinaryVarOperatorsController.instance = new BinaryVarOperatorsController();
        }
        return BinaryVarOperatorsController.instance;
    }

    private static instance: BinaryVarOperatorsController = null;

    public getName(leftVarName: string, operator_name: string, rightVarName: string): string {

        return leftVarName + BinaryVarOperatorsController.OPERATOR_NAME_SEPARATOR + operator_name + BinaryVarOperatorsController.OPERATOR_NAME_SEPARATOR + rightVarName;
    }
}