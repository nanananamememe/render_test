"use strict";
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const path = require("path");
const webPush = require('web-push');
const redis = require('redis');
require('dotenv').config();
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

var redisClinet;

var redisHost = process.env.REDIS_HOST
if (process.env.NODE_ENV == 'local') {
  redisHost = "redis://redis:6379";
}

const rc = redis.createClient({url:redisHost,legacyMode: true});
rc.connect();

app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.json());
app.use(cookieParser());
//app.listen(80);

app.get("/",
  (req,res)=>res.send("GET request to the web-site.")
)
.get('/key', function(req,res){
  const vapidKeys = webPush.generateVAPIDKeys();
  var publicKey = process.env.VAPID_PUBLICK_KEY || vapidKeys.publicKey;
  var privateKey = process.env.VAPID_PRIVATE_KEY || vapidKeys.privateKey;
  rc.set("prk_" + publicKey, privateKey);
  res.cookie('vapidPublicKey', publicKey);
  res.send(publicKey);
})
.post("/adduser",async function(req,res){
  await rc.set("nm_" + req.cookies.vapidPublicKey, req.body.name);
  var msg = [];
  var ks = await rc.v4.keys("nm_*");
  for(let i=0;i<ks.length;i++){
    var name = await rc.v4.get(ks[i]);
    var v = {"name": name,"vapidPublicKey":ks[i].substring(3)}
    msg.push(v);
  }
  io.emit('message', msg);
  res.cookie('handleName', req.body.name);
  res.send("[]");
})
.post("/posttest",function(req,res){
  res.send("Post Test .");
})
.get("/checkendpoint",async function(req,res){
  var flg = "0";
  if (await rc.v4.get("sb_" + req.cookies.vapidPublicKey)) {
    flg = "1";
  }
  res.send(flg);
})
.post("/setendpoint",function(req,res){
  rc.set("sb_" + req.cookies.vapidPublicKey, JSON.stringify(req.body));
  res.send("[]");
})
.post("/webpushtest",async function(req,res){
  try {
    var privateKey = await rc.v4.get("prk_" + req.body.vapidPublicKey);
    var subscription = JSON.parse(await rc.v4.get("sb_" + req.body.vapidPublicKey));
    webPush.setVapidDetails('mailto:' + process.env.VAPID_MAIL_TO, req.body.vapidPublicKey, privateKey);
    setTimeout(async _ => {
      await webPush.sendNotification(subscription, JSON.stringify({
        "title": req.body.pushTitle,
        "body": req.body.pushContents,
        "data": {
          "url": "/hoge.txt"
        },
        "icon": "/bb_logo.png"
      }));
    }, 500);
  } catch (err) {
      console.log(err);
  }
  res.send("[]");
})
;

http.listen(80, function(){
    console.log('server listening. Port:80');
});
