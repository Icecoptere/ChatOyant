
console.log("Overlay is working normally nothing to be worried about, chill man Jesus");

let isConnected = false;
const socket = io();

function setState(newState){
    isConnected = newState;
    document.getElementById("socketConnected").textContent = isConnected ? "Connecté" : "Déconnecté";
}

socket.on("connect", () => {
    setState(true);
    console.log(socket.id);
});

socket.on('close', (reason) =>{
    setState(false);
    console.log("Disconnect");
    console.log(reason);
})

socket.on("disconnect", () => {
    setState(false);
    socket.connect();
});