let convertedVapidKey, subscription, cookies={};
var socketio = io();

(()=>{
  var ca = document.cookie.split(';');
  for (i=0;i<ca.length;i++){
    var a = ca[i].split("=");
    cookies[a[0].trim()] = a[1];
  }
  if (cookies.handleName) {
    handleName.value = decodeURI(cookies.handleName);
  }
})();

const checkServieWorker = async _=>{
  var s = navigator.serviceWorker;
  if (!s.controller) {
    _registServiceWorker();
    return;
  }
  var r = s.ready.then(async (serviceWorkerRegistration) => {
    // 既にプッシュメッセージのサブスクリプションがあるか？
    await serviceWorkerRegistration.pushManager.getSubscription().then((subscription) => {
      if (!subscription) {
        _registServiceWorker();
      }
    });
  });
  if (cookies.handleName) {
    let socket = socketio.connect();
    socket.on('connect', function() {
      _setMyName();
    });
  }
};

const _registServiceWorker = async function(){
  try {
      // サービスワーカー登録
      const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      // サーバー側で生成したパブリックキーを取得し、urlBase64ToUint8Array()を使ってUit8Arrayに変換
      const existsEp = await fetch('/checkendpoint',{
        method: 'GET',
      });
      flg = await existsEp.text();
      if (flg == "0") {
        const res = await fetch('/key');
        vapidPublicKey = await res.text();
        convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
        // (変換した)パブリックキーをapplicationServerKeyに設定してsubscribe
        subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertedVapidKey
        });
        fetch('/setendpoint', {
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
      }
  } catch (err) {
      console.log(err);
  }
}

var btnWebPushTest = async function(_that){
  let body = {
    vapidPublicKey  : _that.value,
    pushTitle       : document.getElementById('pushTitle_'+_that.name).value ,
    pushContents    : document.getElementById('pushContents_'+_that.name).value ,
  };
  await fetch('/webpushtest', {
    method: 'POST',
    "body": JSON.stringify(body),
    headers: {
        'Content-Type': 'application/json',
    },
  });
};

var btnDelUser = async function(_that){
  let body = {
    vapidPublicKey  : _that.value,
  };
  await fetch('/deluser', {
    method: 'POST',
    "body": JSON.stringify(body),
    headers: {
        'Content-Type': 'application/json',
    },
  });
};


var _setMyName = async()=>{
  var hn = handleName.value;
  await fetch('/adduser', {
    method: 'POST',
    body: '{"name":"'+ hn +'"}',
    headers: {
        'Content-Type': 'application/json',
    },
  });
}

setMyName.onclick = async evt => {
  _setMyName();
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

socketio.on('message',function(msg){
  let html = "";
  for (let i = 0; i < msg.length; i++) {
    html +=
      "<div>"
      + "<span>"+msg[i].name+"</span>"
      + "<input type='text' id='pushTitle_"+i+"' value=''>"
      + "<input type='text' id='pushContents_"+i+"' value=''>"
      + "<button onclick='btnWebPushTest(this);' name='"+i+"' value='"+msg[i].vapidPublicKey+"'>PUSH</button>"
      + "<button onclick='btnDelUser(this);' name='"+i+"' value='"+msg[i].vapidPublicKey+"'>DEL</button>"
      + "</div>";
  }
  userlist.innerHTML = html;
});

checkServieWorker();
