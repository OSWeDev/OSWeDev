export default class URLHandler {
    public static getInstance(): URLHandler {
        if (!URLHandler.instance) {
            URLHandler.instance = new URLHandler();
        }
        return URLHandler.instance;
    }

    private static instance: URLHandler = null;

    private constructor() { }

    public getUrlFromObj(obj): string {
        return Object.keys(obj).map(function (k) {
            return encodeURIComponent(k) + '=' + encodeURIComponent(obj[k])
        }).join('&');
    }
}