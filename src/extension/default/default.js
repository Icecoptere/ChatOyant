const fs = require("fs");

let banMode = false;
let banLetter = "";
let alphabetIndex = 0;

function dice(context, args){
    let face = 6;
    if(args !== undefined){
        if(!isNaN(parseInt(args.split(" ")[0]))){
            face = parseInt(args.split(" ")[0]);
        }
    }
    return `Tu as lancé un ${(Math.round(Math.random()*(face-1)+1))}`;
}

async function readFile(filename) {
    return new Promise(function (resolve) {
        fs.readFile(filename, 'utf8', function read(err, data) {
            if (err !== null) {
                console.log(err);
            }
            resolve(data);
        });
    })
}

function rand(a,b){
    return Math.round(Math.random()*(b-a)+a);
}

async function banLetterMode(ctx, args,  client, channel){
    let listArgs = args.split(" ");
    if(listArgs.length >= 0){
        let letterChoice = listArgs[0][0].toLowerCase();
        let alphabet = "abcdefghijklmnopqrstuvwxyz";
        if(alphabet.includes(letterChoice)){
            banMode = true;
            banLetter = letterChoice;
            client.say(channel, "Hop là c'est parti pour 3 minutes de ban de la lettre "+banLetter.toUpperCase()+". Attention je vous ai à l'oeil MrDestructoid");
            alphabetIndex = alphabet.indexOf(banLetter)+1;
            setTimeout(_=>{
                client.say(channel,"C'est bon vous pouvez redire la lettre "+banLetter.toUpperCase()+" lol");
                banMode = false;
            }, 3*60*1000);
        }
    }
}

async function reactToMessage(username, message, context, client, channel){
    console.log(username+" : "+message);
    if(banMode){
        if(message.toLowerCase().includes(banLetter)){
            let reasons = [
                "Interdiction de prononcer cette lettre @"+username+", c'est pas contre toi",
                "@"+username+", la lettre en position "+alphabetIndex.toString()+" de l'alphabet est bannie temporairement",
                "Je suis désolé @"+username+" mais une des lettres de ton message n'est pas autorisée dans ce chat pour le moment"
            ]
            let reason = reasons[rand(0,reasons.length-1)]
            while(reason.includes(banLetter) || reason.includes(banLetter.toUpperCase())){
                reason = reason.replace(banLetter,"").replace(banLetter.toUpperCase(),"");
            }
            deleteMessage(context, client, channel, reason);
        }
    }
}

async function deleteMessage(ctx, client, channel, reason=null){
    client.deletemessage(channel,ctx.id)
    if(reason != null){
        client.say(channel, reason)
    }
}

async function banSomeone(ctx, args, client, channel){
    let listArgs = args.split(" ");
    if(listArgs.length >= 0){
        return "/timeout "+listArgs[0]+" 0.1 a+";
    }
}

async function ticket(context, args, forceNewTicket=false){
    let username = context['display-name'];
    let alphabet = "ABCDEFGHJKLMNPQSTUVWXYZ";
    let ticketCode = alphabet[rand(0,alphabet.length-1)] + rand(1,99).toString();
    let ticketFilename = 'src/extension/default/ticketsList.txt';
    let fileInfos = await readFile(ticketFilename);
    fileInfos = fileInfos.split("\n");
    let usersTickets = {}
    for(let i=0; i<fileInfos.length; i++){
        if(fileInfos[i].length >0){
            let userTicket = fileInfos[i].split(";");
            usersTickets[userTicket[1]] = userTicket[0];
        }
    }
    if(!(username in usersTickets) || forceNewTicket){
        appendToFile(ticketFilename, ticketCode+";"+username+"\n");
        return "@"+username+" tu as désormais le ticket de la place "+ticketCode;
    }else{
        return "@"+username+" tu as déjà le ticket de la place "+usersTickets[username];
    }
}

function appendToFile(filename, data){
    fs.appendFile(filename, data, function (err) {
        if (err) throw err;
    });
}

async function getFlims(ctx, args){
    return "En premier : "+await readFile("C:\\Users\\c521\\Documents\\Stream2\\Code\\getMovieDuration\\movieName1.txt") +"  |  Enfuite : "+await readFile("C:\\Users\\c521\\Documents\\Stream2\\Code\\getMovieDuration\\movieName2.txt")
}

async function getCurrentFlim(ctx, args){
    return "On regarde actuellement : "+await readFile("C:\\Users\\c521\\Documents\\Stream2\\Code\\getMovieDuration\\flimActuel.txt")
}

module.exports = {
    commands:  {
        website: {
            alias: ['site','siteweb','siteinternet','lesiteinternet'],
            response: 'https://amaurygolo.com',
        },
        dice: {
            alias: ['de'],
            permission: 2,
            response: (context, args) => dice(context, args)
        },
        test: {
            response: "Oh le test qui fonctionne PogChamp"
        },
        flim: {
            alias: ['film','films','questcequonregardeaujourdhuiaufinemasvp'],
            response: (context, args) => getCurrentFlim()
        },
        programme: {
            alias: ['onregardequoicesoir'],
          response: (context, args) => getFlims()
        },
        flim1: {
            response: (context,args) => readFile("C:\\Users\\c521\\Documents\\Stream2\\Code\\getMovieDuration\\descFlim1.txt")
        },
        flim2:{
            response: (context,args) =>  readFile("C:\\Users\\c521\\Documents\\Stream2\\Code\\getMovieDuration\\descFlim2.txt")
        },
        ticket:{
            alias: ['place'],
            response: (context, args) => ticket(context, args, false)
        },
        newticket:{
            alias: ['changerdeplace','jepeuxchangerdeplacesvp','nouveauticket'],
            response: (context, args) => ticket(context, args, true)
        },
        testban:{
            response: (ctx, args, client, channel) => banSomeone(ctx, args, client, channel)
        },
        banletter:{
            permission: 2,
            response: (ctx, args, client, channel) => banLetterMode(ctx, args, client, channel)
        },
        deletemessage:{
            response: (ctx, args, client, channel) => deleteMessage(ctx, client, channel)
        }
    },
    reactToMessage:{
        response: (username, message, context, client, channel) => reactToMessage(username, message, context, client, channel)
    }
};
