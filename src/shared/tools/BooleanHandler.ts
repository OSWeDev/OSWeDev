export default class BooleanHandler {

    public static getInstance(): BooleanHandler {
        if (!BooleanHandler.instance) {
            BooleanHandler.instance = new BooleanHandler();
        }
        return BooleanHandler.instance;
    }

    private static instance: BooleanHandler = null;

    private constructor() {
    }

    public OR(bools: boolean[], empty_value: boolean = false): boolean {

        if ((!bools) || (bools.length <= 0)) {
            return empty_value;
        }

        let res = false;

        for (let i in bools) {
            res = res || bools[i];
        }

        return res;
    }

    public AND(bools: boolean[], empty_value: boolean = false): boolean {

        if ((!bools) || (bools.length <= 0)) {
            return empty_value;
        }

        let res = true;

        for (let i in bools) {
            res = res && bools[i];
        }

        return res;
    }
}