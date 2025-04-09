
export default class PwaNotification {
    public title: string;
    public body: string;
    public icon: string;
    public badge: string;
    public url: string;

    public static createNew(
        title: string,
        body: string,
        icon: string,
        badge: string,
        url: string,
    ): PwaNotification {
        const res: PwaNotification = new PwaNotification();

        res.title = title;
        res.body = body;
        res.icon = icon;
        res.badge = badge;
        res.url = url;

        return res;
    }
}