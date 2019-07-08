export default class ConversionHandler {

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
            return ((e == 0) ? 0 : (e ? parseFloat(e.toString()) : null));
        } catch (e) {
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
                res.push(parseFloat(e.toString()));
            }
        } catch (e) {
        }
        return res;
    }

    public urlBase64ToUint8Array(base64String: string): Uint8Array {
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