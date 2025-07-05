const http = require("http");
const querystring = require("querystring");
const {
  Client,
  Events,
  GatewayIntentBits,
  Partials,
  Collection,
} = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, //サーバーの取得
    GatewayIntentBits.MessageContent, //メッセージ内容の取得
    GatewayIntentBits.GuildMessages,
  ], //サーバー内メッセージの取得
  partials: [Partials.Channel],
}); //DMの取得

http
  .createServer(function (req, res) {
    if (req.method == "POST") {
      var data = "";
      req.on("data", function (chunk) {
        data += chunk;
      });
      req.on("end", function () {
        if (!data) {
          console.log("No post data");
          res.end();
          return;
        }
        var dataObject = querystring.parse(data);
        console.log("post:" + dataObject.type);
        if (dataObject.type == "wake") {
          console.log("Woke up in post");
          res.end();
          return;
        }
        if (dataObject.type == "finish") {
          console.log("kannkodori:" + dataObject.type);
          if (dataObject.howtoSend == "DM") {
            let userId = dataObject.userID;
            let text = dataObject.comment;
            sendDm(userId, text);
            res.end();
            return;
          }
          if (dataObject.howtoSend == "CHANNEL") {
            let channelId = dataObject.userID;
            let text = dataObject.comment;
            sendMsg(channelId, text);
            res.end();
            return;
          }
          return;
        }
          if (dataObject.type == "finish2") {
          console.log("darumasann:" + dataObject.type);
          let channelId = dataObject.userID;
          if (dataObject.options != null) {
            let options = JSON.parse(dataObject.options);
            if (options.ext == "ext") {
              sendMsgWithFrags(channelId, dataObject.comment, options);
            } else {
              sendMsg(channelId, dataObject.comment);
            }
          } else {
            sendMsg(channelId, dataObject.comment);
          }
          res.end();
          return;
        }
        res.end();
      });
    } else if (req.method == "GET") {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.write(readyIs);
      res.end();
    }
  })
  .listen(process.env.PORT);

let readyIs = "NA";

client.once(Events.ClientReady, (c) => {
  console.log("Bot準備完了～"); readyIs = "Discord Bot is active now\n";
  client.user.setPresence({ activities: [{ name: "時報" }] });
});

client.on(Events.MessageCreate, async (message) => {
  if (message.author.id == client.user.id) {
    return;
  }
  if (message.mentions.has(client.user) && message.content == "<@1168526504129470504>") {
    let time = new Date(), timeword = "こんにちは"; time.setHours(time.getHours() + 9); 
    let hour = time.getHours(); console.log(time, hour);
    if(5 <= Number(hour) && Number(hour) < 11){timeword = "おはよう";}
    else if(18 <= Number(hour) || Number(hour) < 5){timeword = "こんばんは";}
    sendReply(
      message.channel.id,
      "<@" + message.author + ">さん、" + timeword + "～" + "\n"
    );
    return;
  }
  if (message.content.match(/かんこ～|かんこどり～|かんこー/)) {
    let text = "カンコーッ";
    sendMsg(message.channel.id, text);
    return;
  }
  if (message.content.match(/にゃにゃ/)) {
    let userId = message.author.id;
    let text = "にゃにゃにゃ";
    sendDm(userId, text);
    return;
  }
});

if (process.env.OPERAS == undefined) {
  console.log("OPERASが設定されていません。");
  process.exit(0);
}

client.login(process.env.OPERAS);

function sendReply(channelId, text, option = {}) {
  client.channels.cache
    .get(channelId)
    .send(text, option)
    .then(console.log("リプライ送信: " + text + JSON.stringify(option)))
    .catch(console.error);
}

function sendMsg(channelId, text, option = {}) {
  client.channels.cache
    .get(channelId)
    .send(text, option)
    .then(console.log("メッセージ送信: " + text + JSON.stringify(option)))
    .catch(console.error);
}

function sendMsgPassive(channelId, text, option = {}) {
  client.channels
    .fetch(channelId)
    .then((e) => {
      e.send(text, option)
        .then(console.log("メッセージ送信: " + text + JSON.stringify(option)))
        .catch(console.error);
    })
    .catch(console.error);
}

function sendDm(userId, text, option = {}) {
  client.users
    .fetch(userId)
    .then((e) => {
      e.send(text, option)
        .then(console.log("メッセージ送信: " + text + JSON.stringify(option)))
        .catch(console.error); // 1段階目のエラー出力
    })
    .catch(console.error); // 2段階目のエラー出力
}

function sendMsgWithFrags(channelId, text, options) {
  const { AttachmentBuilder } = require("discord.js");
  try {
    let flags = options.flags,
      files = options.files,
      emojis = options.emojis;
    console.log("typeof(files)", typeof(files));
    if(String(files).indexOf("http")==-1){
      let buf = Buffer.from(files, "base64");
      /*files = [new File([new Blob([buf])], "file.png")];*/
      files = [new AttachmentBuilder(buf, { name: 'file.png' })];
    }
    let option = { flags, files };
    console.log("bbbbbbb", channelId, text, options);
    let sentMes = client.channels.cache
      .get(channelId)
      .send({ content: text, flags: flags, files: files })
      .then(console.log("メッセージ送信: " + text + JSON.stringify(option)))
      .catch(console.error);
    if (emojis != null && emojis.length > 0) {
      for (let i = 0; i < emojis.length; i++) {
        if (String(emojis[i]) != "") {
          sentMes.react(String(emojis[i]));
        }
      }
    }
  } catch (e) {
    console.warn(e);
  }
}
