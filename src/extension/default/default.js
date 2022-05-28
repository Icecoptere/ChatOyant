
function dice(args){
    let face = 6;
    if(args !== undefined){
        if(!isNaN(parseInt(args.split(" ")[0]))){
            face = parseInt(args.split(" ")[0]);
        }
    }
    return `Tu as lancé un ${(Math.round(Math.random()*(face-1)+1))}`;
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
            response: (args) => dice(args)
        },test: {
            response: "Oh le test qui fonctionne PogChamp"
        }
    }
};
