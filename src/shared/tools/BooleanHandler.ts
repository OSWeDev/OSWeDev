export default class BooleanHandler {

    public static OR(bools: boolean[], empty_value: boolean = false): boolean {

        if ((!bools) || (bools.length <= 0)) {
            return empty_value;
        }

        let res = false;

        for (const i in bools) {
            res = res || bools[i];
        }

        return res;
    }

    public static AND(bools: boolean[], empty_value: boolean = false): boolean {

        if ((!bools) || (bools.length <= 0)) {
            return empty_value;
        }

        let res = true;

        for (const i in bools) {
            res = res && bools[i];
        }

        return res;
    }
}