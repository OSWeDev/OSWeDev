export default class ConversionHandler {
    public static forceNumber(e: string | number): number {
        try {
            return ((e == 0) ? 0 : (e ? parseFloat(e.toString()) : null));
        } catch (e) {
        }
        return null;
    }

    public static forceNumbers(es: string[] | number[]): number[] {
        if ((!es) || (es.length <= 0)) {
            return null;
        }

        let res = [];
        try {
            for (let i in es) {
                let e = es[i];
                res.push(parseFloat(e.toString()));
            }
        } catch (e) {
        }
        return res;
    }
}