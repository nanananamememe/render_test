let convertedVapidKey, subscription;

(async _ => {
    try {
        // サービスワーカー登録
        const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });

        // サーバー側で生成したパブリックキーを取得し、urlBase64ToUint8Array()を使ってUit8Arrayに変換
        const res = await fetch('/key');
        const vapidPublicKey = await res.text();
        convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

        // (変換した)パブリックキーをapplicationServerKeyに設定してsubscribe
        subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertedVapidKey
        });

        console.log(JSON.stringify(subscription));

        await fetch('/setendpoint', {
            method: 'POST',
            body: JSON.stringify(subscription),
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // 通知の許可を求める
        Notification.requestPermission(permission => {
            console.log(permission); // 'default', 'granted', 'denied'
        });
    } catch (err) {
        console.log(err);
    }
})();

btnWebPushTest.onclick = async evt => {
    if (!subscription) return console.log('sbuscription is null');
    await fetch('/webpushtest', {
        method: 'POST',
        body: "[]",
        headers: {
            'Content-Type': 'application/json',
        },
    });
};

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}
