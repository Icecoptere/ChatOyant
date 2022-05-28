console.log("S");

var requestOptions = {
    method: 'GET',
    redirect: 'follow'
};

console.log(document.location.href.split("=")[1]);

fetch(`http://localhost:8000/giveSpotifyToken?token=${document.location.href.split("=")[1]}`, requestOptions)
    .then(response => response.text())
    .then(function(result){
        window.close();
    })
    .catch(error => console.log('error', error));