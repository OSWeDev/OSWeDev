import ConsoleHandler from './ConsoleHandler';

export default class ConversionHandler {

    /* istanbul ignore next: nothing to test here */
    public static getInstance(): ConversionHandler {
        if (!ConversionHandler.instance) {
            ConversionHandler.instance = new ConversionHandler();
        }
        return ConversionHandler.instance;
    }

    private static instance: ConversionHandler = null;

    private constructor() {
    }

    public forceNumber(e: string | number): number {
        try {
            if (isNaN(parseFloat(e.toString()))) {
                return null;
            }
            return ((e == 0) ? 0 : (e ? parseFloat(e.toString()) : null));
        } catch (e) {
            ConsoleHandler.getInstance().error(e);
        }
        return null;
    }

    public forceNumbers(es: Array<(string | number)>): number[] {
        if ((!es) || (es.length <= 0)) {
            return null;
        }

        let res = [];
        try {
            for (let i in es) {
                let e = es[i];
                if (isNaN(parseFloat(e.toString()))) {
                    return null;
                }
                res.push(parseFloat(e.toString()));
            }
        } catch (e) {
            ConsoleHandler.getInstance().error(e);
        }
        return res;
    }

    /* istanbul ignore next */
    public urlBase64ToUint8Array(base64String: string): Uint8Array {

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