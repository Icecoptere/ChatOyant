console.log("On lance le Chat Oyant");

const tmi = require('tmi.js');
require('dotenv').config();

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
    console.log('channel', {
        channel,
        user: context.username,
        message,
        context: context,
    });
    const isNotBot = context.username.toLowerCase() !== process.env.TWITCH_BOT_USERNAME.toLowerCase();

    if (isNotBot) {
        client.say(channel, `Responding to ${context.username} message: ${message}`);
    }
});