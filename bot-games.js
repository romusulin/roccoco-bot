(function() {
    var _ = require("lodash");

    var ARGUMENTS = {
        RPC: "rpc"
    }
    

    /* PUBLIC METHODS*/
    var rpc = function(argObj) {
        let AVAILABLE_OPTIONS = ["r","p","s","rock","paper","scissors"];
        if (argObj.args[0] !== "rpc" || !AVAILABLE_OPTIONS.includes(argObj.args[1])) {
            return;
        }
        
        let userChoice = argObj.args[1];

        if(userChoice === 'r') {
            userChoice = 'rock';
          } else if(userChoice === 'p') {
            userChoice = 'paper';
          } else if(userChoice === 's') {
            userChoice = 'scissors';
          }

        let computerChoice = Math.random();
        let computer;

        if(computerChoice >=0 && computerChoice <= 0.33){
            computer = "rock";
        } else if (computerChoice >= 0.34 && computerChoice<=0.66){
            computer = "paper";
        } else {
            computer = "scissors";
        };

        var pcWins = "PC",
            playerWins = "player";
        
        var result;
        var choice1 = userChoice;
        var choice2 = computer;
        
        if(choice1 === choice2){
            result = "tie";
        } else if (choice1==="rock"){
            if(choice2==="scissors"){
                result = playerWins;
            } else {
                result = pcWins;
            }
        } else if(choice1==="paper"){
            if(choice2==="rock"){
                result = playerWins;
            } else{
                result = pcWins;
            }
        } else if(choice1==="scissors"){
            if(choice2==="paper"){
                result = playerWins;
            } else{
                result = pcWins;
            }
        }

        if (result === "tie") {
            argObj.channel.send("I drew " + computer + ", we both lose!");
        } else {
            argObj.channel.send(result === pcWins ? "I drew " + computer + ", you lost!" : "I drew " + computer + ". You win!");
        }
    }

    /* PRIVATE METHODS */

    /* EXPORTS */
    var prefix_module = {
        rpc: rpc
    };
    module.exports = prefix_module;
})();