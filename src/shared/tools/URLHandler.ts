export default class URLHandler {

    public static getUrlFromObj(obj): string {
        return Object.keys(obj).map(function (k) {
            return encodeURIComponent(k) + '=' + encodeURIComponent(obj[k]);
        }).join('&');
    }

    public static isValidRoute(str: string): boolean {
        let pattern = new RegExp(
            '^(\/[-a-z\d%_.~+]*)+' + // path
            '([?][;&a-z\d%_.~+=-]*)?' + // query string
            '(\#[-a-z\d_]*)?$', 'i'); // fragment locater
        if (!pattern.test(str)) {
            return false;
        } else {
            return true;
        }
    }
}