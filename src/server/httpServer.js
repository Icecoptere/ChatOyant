const express = require('express');
const app = express();
const path = require('path');
const router = express.Router();
const fs = require('fs');
let https = require('follow-redirects').https;
let qs = require('querystring');
const {json} = require("express");
require('dotenv').config({ path: `.env.spotify` })

let portNb = 8000;

// ajout de socket.io
const server = require('http').Server(app);
const io = require('socket.io')(server);

function writeFile(filename, content){
    fs.writeFile(filename, content, err=>{
        if(err !== null){
            console.log(err);
        }
    });
}

async function getRefreshToken(code){
    return new Promise(function (resolve, reject){
        let options = {
            'method': 'POST',
            'hostname': 'accounts.spotify.com',
            'path': '/api/token',
            'headers': {
                'Authorization': `Basic ${Buffer.from((process.env.CLIENT_ID+":"+process.env.CLIENT_SECRET)).toString('base64')}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            'maxRedirects': 20
        };

        let req = https.request(options, function (res) {
            let chunks = [];

            res.on("data", function (chunk) {
                chunks.push(chunk);
            });

            res.on("end", function () {
                let body = Buffer.concat(chunks);
                let jsonRes = JSON.parse(body.toString());
                console.log(jsonRes);
                if('refresh_token' in jsonRes){
                    resolve(jsonRes['refresh_token']);
                }
            });

            res.on("error", function (error) {
                console.error(error);
            });
        });

        let postData = qs.stringify({
            'code': code,
            'grant_type': 'authorization_code',
            'redirect_uri': process.env.REDIRECT_URL,
            'client_id': process.env.CLIENT_ID
        });

        req.write(postData);

        req.end();
    })
}

app.use(express.static(__dirname + '/public'));

router.get('/spotify',function(req,res){
    res.sendFile(path.join(__dirname+'/public/spotify/spotify.html'));
});

router.get('/giveSpotifyToken',async function(req,res){
   let code = req.url.split("=")[1];
   res.end("ok");
   let refresh_token = await getRefreshToken(code);
   writeFile('./src/extension/spotify/refresh_token.txt', refresh_token);

});

// établissement de la connexion
io.on('connection', (socket) =>{
    console.log(`Connecté au client ${socket.id}`)
})


router.get("/"+process.env.SINGLE_ID+"/overlay", async function(req, res){
    res.sendFile(path.join(__dirname+'/public/overlay/overlay.html'));
})

app.use('/', router);
server.listen(process.env.port || portNb);

console.log(`Running at Port ${portNb}`);

module.exports = {
    server:  {
        server
    }
};