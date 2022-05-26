console.log("On lance le Chat Oyant");

const tmi = require('tmi.js');
require('dotenv').config();
const env = process.env.CURRENTENV;

const regexpCommand = new RegExp(/^!([a-zA-Z0-9]+)(?:\W+)?(.*)?/);

let activeExtensions = [
    "default",
    "spotify"
];

let extensions = [];

let commands = {}

for (let i = 0; i < activeExtensions.length; i++) {
    extensions.push(require('./src/extension/' + activeExtensions[i]));
    for (const [key, value] of Object.entries(extensions[extensions.length - 1].commands)) {
        commands[key] = value;
    }
}

const client = new tmi.Client({
    connection: {
        reconnect: true
    },
    channels: [
        'icecoptered'
    ],
    identity: {
        username: process.env.TWITCH_BOT_USERNAME,
        password: process.env.TWITCH_OAUTH_TOKEN
    }

});

client.connect();

client.on('message', async (channel, context, message) => {
    const isNotBot = context.username.toLowerCase() !== process.env.TWITCH_BOT_USERNAME.toLowerCase();

    if (isNotBot) {
        let [raw, command, argument] = [undefined, undefined, undefined];
        try {
            [raw, command, argument] = message.match(regexpCommand);
        } catch (e) {
            //console.log("there was an error :" + e);
        }
        if (command) {
            console.log("Command detected");
            const {response} = commands[command] || {};
            let functionResponse;
            if (typeof response === 'function') {
                functionResponse = response(argument);
            } else if (typeof response === 'string') {
                functionResponse = response;
            }
            if (functionResponse !== undefined) {
                if (typeof functionResponse === "object") {
                    if (Array.isArray(functionResponse)) {
                        for (let i = 0; i < functionResponse.length; i++) {
                            client.say(channel, functionResponse[i].toString());
                        }
                    }
                } else {
                    client.say(channel, functionResponse.toString());
                }
            }
        }
    } else {
        if (env === "DEV") {
            console.log('channel', {
                channel,
                user: context.username,
                message,
            });
        }
    }
});
