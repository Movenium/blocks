/**

 send messages to slack

 you must install slack client library (npm install @slack/client)

 simple example:

 - slack:
     auth: <slack_token>
     send_message: <true | false> #you can skip sending message
     msg_channel: <channel_name | channel_id>
     msg_text: <message>

 use attachments in options:

 - slack:
     auth: <slack_token>
     send_message: <true | false> #you can skip sending message
     msg_channel: <channel_name | channel_id>
     msg_text: <message>
     msg_opts:
       attachments:
       - text: <title text>
         fields:
         - title: <title for field>
           value: <text for field>
           short: <true | false>
       color: <color e.g. "#F35A00">
 *
 */
'use strict';
const block = require('./block');
const { WebClient } = require('@slack/client');

class _block extends block {
    run(settings, state, callback) {
        const token = settings.auth;
        const web = new WebClient(token);

        if(settings.send_message) {
            web.chat.postMessage(settings.msg_channel, settings.msg_text, settings.msg_opts).then((res) => {
                // `res` contains information about the posted message
                console.log('Message sent: ', res.ts);
            })
                .catch(console.error);
        }

        callback(null, settings.message);

    }
}

module.exports = _block;