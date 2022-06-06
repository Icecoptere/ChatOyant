const fs = require("fs");

const sound = require("sound-play");
let specialGroups = ["protopotes"];
let dictSpecialGroup = {};

for(let i=0; i<specialGroups.length; i++){
    readFile('src/extension/arrivalSound/'+specialGroups[i]+'.txt').then(e=>{
        let groupUsers = e.split("\r").join('').split("\n").filter(name => name.length>0);
        groupUsers.forEach(function(element){
            dictSpecialGroup[element] = "users\\"+specialGroups[i]+".mp3";
        });
    })
}

function rand(a,b){
    return Math.round(Math.random()*(b-a)+a);
}

async function playSound(filename, tryDefaultIfFail = false){
    return new Promise(async function(resolve){
        let pathToFile = __dirname+"\\listSounds\\"+filename;
        let volume = 0.5;
        let isFolder = fs.statSync(pathToFile).isDirectory();
        if(isFolder){
            resolve(true);
            fs.readdir(pathToFile, async function(err, files){
                let soundName = files[rand(0,files.length-1)];
                resolve(await playSound(filename+"\\"+soundName));
            })

        }else{
            let soundExists = fs.existsSync(pathToFile);
            if(soundExists){
                sound.play(pathToFile, volume)
                    .then(function(response){
                        //Do something once the sound is done playing
                        resolve(true);
                    });
            }else{
                if(tryDefaultIfFail){
                    resolve(await playSound("default\\default.mp3"));
                }
            }
        }
    })
}

let currentUsers = [];

function resetList(){
    currentUsers = [];
    writeFile('src/extension/arrivalSound/listUsers.txt', "");
}

function writeFile(filename, content) {
    fs.writeFile(filename, content, er => {
        if (er !== null) {
            console.log(er);
        }
    });
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

function appendToFile(data){
    fs.appendFile('src/extension/arrivalSound/listUsers.txt', data, function (err) {
        if (err) throw err;
    });
}

readFile('src/extension/arrivalSound/listUsers.txt').then(e=>{
    currentUsers = e.split("\r").join('').split("\n").filter(name => name.length>0);
})

async function reactToMessage(username, message, context){
    console.log(username+" : "+message);
    if(!currentUsers.includes(username)){
        currentUsers.push(username);
        appendToFile(username + "\n");
        if (username.toLowerCase() in dictSpecialGroup) {
            await playSound(dictSpecialGroup[username.toLowerCase()]);
        } else if (context['first-msg']) {
            await playSound("default\\firstMessage.mp3")
        } else {
            await playSound("\\users\\"+username.toLowerCase()+".mp3", true);
        }
    }
}

module.exports = {
    commands:  {
        start:{
            response: () => resetList(),
            permission: 4
        }
    },
    reactToMessage:{
        response: (username, message, context) => reactToMessage(username, message, context)
    }
};