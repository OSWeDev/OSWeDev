import { precacheAndRoute } from 'workbox-precaching/precacheAndRoute';

precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener('push', function (event) {
    let body = '';
    let icon = '';
    let badge = '';
    let title = '';
    let url = '';

    try {
        const data = event.data.json();
        title =data.title;
        body =data.body;
        icon =data.icon;
        badge =data.badge;
        url =data.url;
    } catch (e) {
        const data = event.data.text();
        body = data;
    }

    if (!body?.length) {
        return;
    }

    event.waitUntil(
        self.registration.showNotification(title, {
            body: body,
            icon: icon,
            badge: badge,
            url: url
        })
    );
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});