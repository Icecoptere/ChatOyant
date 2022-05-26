
function testSpot(arg){
    return "Salut";
}

module.exports = {
    commands:  {
        spotify: {
            response: (args) => testSpot(args)
        },
        test: {
            response: "Salut"
        }
    }
};
