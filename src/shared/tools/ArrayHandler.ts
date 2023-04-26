import cloneDeep from 'lodash/cloneDeep';

export default class ArrayHandler {

    public static getInstance(): ArrayHandler {
        if (!ArrayHandler.instance) {
            ArrayHandler.instance = new ArrayHandler();
        }
        return ArrayHandler.instance;
    }

    public static is_same(a: any[], b: any[]): boolean {
        if ((!a) && !!b) {
            return false;
        }
        if ((!b) && !!a) {
            return false;
        }

        if (a == b) {
            return true;
        }

        let c = Array.from(b);
        for (let i in a) {
            let ae = a[i];

            let foundi = null;
            for (let j in c) {
                let ce = c[j];

                if (ce == ae) {
                    foundi = j;
                    break;
                }
            }

            if (!foundi) {
                return false;
            }

            c.splice(foundi, 1);
        }

        return !c.length;
    }

    private static instance: ArrayHandler = null;

    private constructor() { }
}