const fs = require("fs");

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
        }
    }
};
