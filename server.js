console.log("On lance le Chat Oyant");

const tmi = require('tmi.js');
require('dotenv').config();
const env = process.env.CURRENTENV;

const regexpCommand = new RegExp(/^!([a-zA-Z0-9]+)(?:\W+)?(.*)?/);

function outsideFunction(args){
    return `Success ${args[0]}`;
}

const commands = {
    website: {
        response: 'https://spacejelly.dev'
    },
    upvote: {
        response: function(args){ outsideFunction(args)}
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
        let [raw, command,argument] = [undefined,undefined,undefined];
        try{
            [raw, command, argument] = message.match(regexpCommand);
            console.log(raw, command, argument);
        }catch (e){
            console.log("there was an error :"+e);
        }
        if ( command ) {
            console.log("Command detected");
            const { response } = commands[command] || {};
            if ( typeof response === 'function' ) {
                client.say(channel, response(argument.split(" ")));
            } else if ( typeof response === 'string' ) {
                client.say(channel, response);
            }
        }else{
            if(env === "DEV"){
                console.log('channel', {
                    channel,
                    user: context.username,
                    message,
                });
            }
        }
    }
});