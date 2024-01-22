"use strict";
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const webPush = require('web-push');
require('dotenv').config();
const app = express();

app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.json());
app.listen(80);

var sb="";

app.get("/",
  (req,res)=>res.send("GET request to the web-site.")
)
.get('/key', function(req,res){
// const vapidKeys = webPush.generateVAPIDKeys();
//  var vapidKeys = webPush.generateVAPIDKeys(); //staff_idと共にDBに保存
  var publicKey = process.env.VAPID_PUBLIC_KEY || vapidKeys.publicKey;
//  var privateKey = process.env.VAPID_PRIVATE_KEY || vapidKeys.privateKey;
  res.send(publicKey);
})
.post("/posttest",function(req,res){
  res.send("Post Test .");
})
.post("/setendpoint",function(req,res){
  sb=req.body;
  res.send("[]");
})
.post("/webpushtest",function(req,res){
  try {
    webPush.setVapidDetails('mailto:' + process.env.VAPID_MAIL_TO, process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
    console.log(sb);
    setTimeout(async _ => {
      await webPush.sendNotification(sb, JSON.stringify({
        "title": "あたらしいWeb Pushが送信されました",
        "body": "Web Pushです",
        "data": {
          "url": "/hoge.txt"
        },
        "icon": "/img-wmp.png"
      }));
    }, 500);
  } catch (err) {
      console.log(err);
  }
  res.send("[]");
})
;
