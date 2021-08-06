import ConsoleHandler from './ConsoleHandler';

export default class ConversionHandler {

    /* istanbul ignore next: nothing to test here */
    public static forceNumber(e: string | number): number {
        try {
            let res = ((e == 0) ? 0 : (e ? parseFloat(e.toString()) : null));
            if (isNaN(res)) {
                return null;
            }
            return res;
        } catch (e) {
            ConsoleHandler.getInstance().error(e);
        }
        return null;
    }

    public static forceNumbers(es: Array<(string | number)>): number[] {
        if ((!es) || (es.length <= 0)) {
            return null;
        }

        let res = [];
        try {
            for (let i in es) {
                let e = es[i];
                let resi = ((e == 0) ? 0 : (e ? parseFloat(e.toString()) : null));
                if (isNaN(resi)) {
                    res.push(null);
                    continue;
                }
                res.push(resi);
            }
        } catch (e) {
            ConsoleHandler.getInstance().error(e);
        }
        return res;
    }

    /* istanbul ignore next */
    public static urlBase64ToUint8Array(base64String: string): Uint8Array {

        if (base64String == null) {
            return null;
        }
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }
}