console.log("On lance le Chat Oyant");

const tmi = require('tmi.js');
require('dotenv').config();

// https://github.com/Durss/TwitchEventSub
let durssEventSub = require("./src/durssEventSub/durssEventSub");

durssEventSub.onEvent = function(json){
    // React to any event here
    console.log("An event just happened");
    console.log(json.subscription);
    console.log(json.event);
}

module.exports = durssEventSub;

const {Worker} = require('worker_threads')

function runService() {
    return new Promise((resolve, reject) => {
        const worker = new Worker('./src/server/httpServer.js', {});
        worker.on('message', resolve);
        worker.on('error', reject);
        worker.on('exit', (code) => {
            if (code !== 0)
                reject(new Error(`Worker stopped with exit code ${code}`));
        })
    })
}

async function runServer() {
    let promise = runService();
}

runServer().catch(err => console.error(err))

const env = process.env.CURRENTENV;
const verbose = process.env.VERBOSE === "true";

let activeExtensions = [
    "default",
];

let extensions = [];
let extIdReceiveAllMessages = [];


let commands = {}

for (let i = 0; i < activeExtensions.length; i++) {
    extensions.push(require('./src/extension/' + activeExtensions[i] + '/' + activeExtensions[i]));
    console.log("Loading extension :"+activeExtensions[i]);
    if(extensions[i].reactToMessage){
        extIdReceiveAllMessages.push(i);
    }
    for (const [key, value] of Object.entries(extensions[extensions.length - 1].commands)) {
        if(key in commands){
            commands[key].push([value.response, value.permission ? value.permission : 1]);
        }else{
            commands[key] = [[value.response, value.permission ? value.permission : 1]];
        }
        if ("alias" in value) {
            for (let j = 0; j < value['alias'].length; j++) {
                if(value['alias'][j] in commands){
                    commands[value['alias'][j]].push([value.response, value.permission ? value.permission : 1]);
                }else{
                    commands[value['alias'][j]] = [[value.response, value.permission ? value.permission : 1]];
                }
            }
        }
    }
}

let channel = 'aufinema';

const client = new tmi.Client({
    connection: {
        reconnect: true
    },
    channels: [
        channel
    ],
    identity: {
        username: process.env.TWITCH_BOT_USERNAME,
        password: process.env.TWITCH_OAUTH_TOKEN
    }

});

function matchMessage(message) {
    let raw = message;
    let command;
    let args;
    let filteredCommand;
    let filteredArgs;
    let messageNoSpace = message.split(" ");
    while (messageNoSpace.length > 0 && messageNoSpace[0].length === 0) {
        messageNoSpace.shift();
    }
    if (messageNoSpace.length > 0) {
        if (messageNoSpace[0][0] === '!') {
            command = messageNoSpace[0].slice(1);
            filteredCommand = filterText(command);
        }
        if (messageNoSpace.length > 1) {
            args = messageNoSpace.slice(1).join(" ");
            filteredArgs = filterText(args);
        }
    }
    return [raw, command, args, filteredCommand, filteredArgs];
}

client.connect();

function filterText(text) {
    text = text.toLowerCase();
    let repl = {
        '??': 'a',
        '??': 'e',
        '??': 'e',
        '??': 'e',
        '??': 'o',
        '??': 'o',
        '??': 'i',
        '??': 'a',
        '??': 'a',
        '??': 'e',
        '??': 'i',
        '??': 'u',
        '??': 'c',
        '\'': ''
    }
    for (const [key, value] of Object.entries(repl)) {
        text = text.split(new RegExp(key, "g")).join(value);
    }
    return text;
}

client.on('message', async (channel, context, message) => {
    /*
    console.log(context);
    console.log(message);
     */
    let username = context.username;
    const isNotBot = username.toLowerCase() !== process.env.TWITCH_BOT_USERNAME.toLowerCase();

    if (isNotBot) {
        let [raw, command, argument, filteredCommand, filteredArguments] = [undefined, undefined, undefined, undefined, undefined];
        try {
            [raw, command, argument, filteredCommand, filteredArguments] = matchMessage(message);
        } catch (e) {
            //console.log("there was an error :" + e);
        }
        for(let i=0; i<extIdReceiveAllMessages.length; i++){
            let response = await extensions[extIdReceiveAllMessages[i]].reactToMessage.response(context['display-name'], message, context, client, channel);
        }
        if (filteredCommand && filteredCommand in commands) {
            for(let p=0; p<commands[filteredCommand].length; p++){
                let functionPermission = commands[filteredCommand][p][1] || null;
                let permissionLevel = 1;
                let badges = context['badges'];
                if (badges !== null) {
                    if ("vip" in badges) {
                        permissionLevel = 2;
                    }
                    if ("moderator" in badges) {
                        permissionLevel = 3;
                    }
                    if ("broadcaster" in badges) {
                        permissionLevel = 4;
                    }
                }
                console.log("[" + permissionLevel.toString() + "] " + context.username + ': ' + filteredCommand + " " + argument);
                if (functionPermission !== null && permissionLevel >= functionPermission) {
                    let response = commands[filteredCommand][p][0] || {};
                    let functionResponse;
                    if (typeof response === 'function') {
                        functionResponse = await response(context,argument, client, channel);
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
            }
        }
    } else {
        if (env === "DEV" && verbose) {
            console.log('channel', {
                channel,
                user: context.username,
                message,
            });
        }
    }
});
