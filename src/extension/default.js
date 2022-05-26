
function dice(args){
    return (Math.round(Math.random()*5+1));
}

module.exports = {
    commands:  {
        website: {
            response: 'https://spacejelly.dev'
        },
        dice: {
            response: (args) => dice(args)
        }
    }
};
