require('dotenv').config({path: `.env.spotify`})
const fs = require('fs');
const open = require('open');
let https = require('follow-redirects').https;
let qs = require('querystring');
const {json} = require("express");

function writeFile(filename, content) {
    fs.writeFile(filename, content, err => {
        if (err !== null) {
            console.log(err);
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

async function completeInit() {
    return new Promise(function (resolve) {
        let client_id = process.env.CLIENT_ID;
        let redirect_url = process.env.REDIRECT_URL;
        let scopes = 'playlist-read-private user-modify-playback-state playlist-modify-private user-read-playback-state user-read-currently-playing playlist-modify-public playlist-modify-private';
        let url = `https://accounts.spotify.com/authorize?response_type=code&client_id=${client_id}&scope=${scopes}&redirect_uri=${redirect_url}`;
        open(url);
        let intervalWaitCreation = setInterval(async function () {
            try {
                let refresh_token = await readFile('src/extension/spotify/refresh_token.txt');
                if(refresh_token !==undefined){
                    resolve("Yessaille");
                    clearInterval(intervalWaitCreation);
                }
            } catch (e) {
                console.log("The refresh token file still doesn't exist");
            }
        }, 2000);
    })
}

async function refreshAccessToken() {
    return new Promise(async function (resolve, reject) {
        let options = {
            'method': 'POST',
            'hostname': 'accounts.spotify.com',
            'path': '/api/token',
            'headers': {
                'Authorization': `Basic ${Buffer.from((process.env.CLIENT_ID + ":" + process.env.CLIENT_SECRET)).toString('base64')}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            'maxRedirects': 20
        };
        let postData = qs.stringify({
            'grant_type': 'refresh_token',
            'refresh_token': await getRefreshToken()
        });
        let rep = await spotiReq(options,true,null,postData);
        if ('access_token' in rep) {
            resolve(rep['access_token']);
        }
    })
}

async function getRefreshToken(){
    return new Promise(async function(resolve){
    try {
        let refresh_token = await readFile('src/extension/spotify/refresh_token.txt');
        if(refresh_token === undefined) {
            throw new Error();
        }else{
            resolve(refresh_token.replace("\n",""));
        }
    } catch (e) {
        let resultFromInit = await completeInit();
        resolve(getRefreshToken());
    }
    })
}

async function getToken(cached = true) {
    return new Promise(async function (resolve, reject) {
        if (!cached) {
            await getRefreshToken();
            let access_token = await refreshAccessToken();
            writeFile('./src/extension/spotify/access_token.txt', access_token);
        }
        try{
            let access_token = await readFile('./src/extension/spotify/access_token.txt');
            if (access_token === undefined) {
                throw new Error();
            }else{
                resolve(access_token.replace("\n",""));
            }
        }catch (e){
            resolve(getToken(false));
        }
    })
}

async function spotiReq(options, cached = true, stackCall = 0,postData=null) {
    if(postData === null){
        options['headers'] = {'Authorization': `Bearer ${await getToken(cached)}`}
    }
    return new Promise(function (resolve, reject) {
        if (stackCall < 5) {
            let req = https.request(options, function (res) {
                let chunks = [];
                res.on("data", function (chunk) {
                    chunks.push(chunk);
                });
                res.on("end", function (chunk) {
                    let body = Buffer.concat(chunks);
                    if (body.toString().length === 0) {
                        resolve(true);
                    } else {
                        let jsonRes = JSON.parse(body.toString());
                        if ("error" in jsonRes) {
                            if (jsonRes['error']['status'] === 403) {
                                console.log("On peut pas faire cette action askip");
                                resolve(false);
                            } else if (jsonRes['error']['status'] === 401) {
                                console.log("Access token expired");
                                resolve(spotiReq(options, false, stackCall + 1));
                            } else if (jsonRes['error']['status'] === 404) {
                                if (jsonRes['error']['reason'] === "NO_ACTIVE_DEVICE") {
                                    console.log("Spotify is not active");
                                }
                            } else {
                                console.error(jsonRes);
                                resolve(spotiReq(options, false, stackCall + 1));
                            }
                        } else {
                            resolve(jsonRes);
                        }
                        resolve(false);
                    }
                });

                res.on("error", function (error) {
                    console.error(error);
                });
            });
            if(postData !== null) {
                req.write(postData);
            }
            req.end();
        } else {
            resolve(false);
        }
    })
}

async function play() {
    let options = {
        'method': 'PUT',
        'hostname': 'api.spotify.com',
        'path': '/v1/me/player/play?=null',
        'maxRedirects': 20
    };
    let resp = await spotiReq(options);
}

async function pause() {
    let options = {
        'method': 'PUT',
        'hostname': 'api.spotify.com',
        'path': '/v1/me/player/pause?=null',
        'maxRedirects': 20
    };
    let resp = await spotiReq(options);
    console.log(resp);
}

async function searchSong(query) {
    return new Promise(async function (resolve) {
        let searchV;
        if (query.includes("https://open.spotify.com/track/")) {
            let uri = query.split("/")[4].split("?")[0];
            let options = {
                'method': 'GET',
                'hostname': 'api.spotify.com',
                'path': '/v1/tracks/' + uri,
                'maxRedirects': 20
            };
            searchV = await spotiReq(options);
        } else if (query.includes('spotify:track:')) {
            let uri = query.split(":")[2];
            let options = {
                'method': 'GET',
                'hostname': 'api.spotify.com',
                'path': '/v1/tracks/' + uri,
                'maxRedirects': 20
            };
            searchV = await spotiReq(options);
        } else {
            let options = {
                'method': 'GET',
                'hostname': 'api.spotify.com',
                'path': '/v1/search?q=' + query.split(" ").join("%20") + '&type=track&limit=1',
                'maxRedirects': 20
            };
            searchV = await spotiReq(options);
        }
        let songItem;
        if ('tracks' in searchV) {
            songItem = searchV['tracks']['items'][0]
        } else {
            songItem = searchV;
        }
        let result = null;
        if ('uri' in songItem) {
            result = [songItem['uri'], songItem['name'], songItem['artists'][0]['name']]
        }
        resolve(result);
    })
}

async function addToQueue(uri) {
    return new Promise(async function (resolve) {
        let options = {
            'method': 'POST',
            'hostname': 'api.spotify.com',
            'path': '/v1/me/player/queue?uri=' + uri,
            'maxRedirects': 20
        };
        resolve(await spotiReq(options));
    })
}

async function songRequest(arg) {
    let searchResults = await searchSong(arg);
    if (searchResults !== null) {
        let wasAddedToQueue = await addToQueue(searchResults[0]);
        if (wasAddedToQueue) {
            return `SingsNote ${searchResults[1]} - ${searchResults[2]} SingsNote`;
        }
    } else {
        return "J'ai pas trouvé déso BibleThump"
    }
}

module.exports = {
    commands: {
        sr: {
            alias: [
                'songrequest',
                'addsong',
                'ajouterchanson',
                'nouvellechanson',
                'jeveuxmettrecettechanson',
                'jvmcc',
                'allezjerajouteencoreunechansonparcequejaimebiencettefonctionnalitecommememe'],
            response: (arg) => songRequest(arg)
        },
        play: {
            alias: [
                'joue',
                'onreprend'
            ],
            permission: 3,
            response: () => play()
        },
        pause: {
            alias: [
                'onfaitpause'
            ],
            permission: 3,
            response: () => pause()
        }
    }
};