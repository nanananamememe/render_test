self.addEventListener('push', evt => {
    const data = evt.data.json();
    console.log(data);
    const title = data.title;
    const options = {
        body: data.body,
        icon: data.icon,
        data: data.data
    }
    evt.waitUntil(self.registration.showNotification(title, options));
});
self.addEventListener('notificationclick', evt => {
  evt.notification.close();
  var url = "/"
  if (evt.notification.data.url) {
    url = evt.notification.data.url
  }
  evt.waitUntil(
    clients.matchAll({type: 'window'}).then(function() {
      if(clients.openWindow) {
        return clients.openWindow(url)
      }
    })
  )
});
