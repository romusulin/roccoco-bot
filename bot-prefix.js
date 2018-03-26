(function() {
    var _ = require("lodash");

    var ARGUMENTS = {
        REMOVE: "rm",
        ADD: "add",
        LIST: "list"
    }
    
    var FORMAT = "prefix [rm,add] <argument>";
    var AVAILABLE_PREFIXES = ["!"];

    /* PUBLIC METHODS*/
    var checkPrefix = function(msg) {
        let sourceMsg = msg.content;
        var retObj = { status: false, prefix: "", args: "", cmd: "", channel:{}, authorId:""};
        _.each(AVAILABLE_PREFIXES, function(prefix) {
            if (sourceMsg.startsWith(prefix)) { 
                var allArgs = sourceMsg.substring(prefix.length).split(" ");
                retObj.status = true;
                retObj.prefix = prefix;
                retObj.cmd = allArgs[0];
                retObj.args = allArgs.splice(1);
                retObj.channel = msg.channel;
                retObj.authorId = msg.author.id;
            }
        });

        return retObj;
    };

    var parseArgs = function(args) {
        var noOfArgs = args.length;
        var cmd = args[0];
        var arg = args[1];

        
        if (noOfArgs === 1) {
            if (cmd === ARGUMENTS.LIST) {
                return "Here are all the available prefixes: " + AVAILABLE_PREFIXES.join(", ");
            }
        } else if (noOfArgs === 2) {
            if (cmd === ARGUMENTS.ADD) {
                return addPrefix(arg);
            } else if (cmd === ARGUMENTS.REMOVE) {
                return removePrefix(arg);
            }     
        }

        return FORMAT;
    };

    /* PRIVATE METHODS */
    var removePrefix = function(prefix) {
        var isSuccesfullRemoval = false;
        _.remove(AVAILABLE_PREFIXES, function(pfx) { 
            isSuccesfullRemoval = true;
            return prefix === pfx;
        });
        if (isSuccesfullRemoval) {
            return "Your call did not go unnoticed. \"" + prefix + "\" is removed from available prefixes.";
        } else {
            return "\"" + prefix + "\" could not be found in available prefixes.";
        }
           
    };

    var addPrefix = function(prefix) {
        if (_.includes(AVAILABLE_PREFIXES, prefix)) {
            return "\"" + prefix + "\" is already added in available prefixes.";
        } else {
            AVAILABLE_PREFIXES.push(prefix);
            return "Your call did not go unnoticed. \"" + prefix + "\" is added to available prefixes.";
        }
    };

    /* EXPORTS */
    var prefix_module = {
        checkPrefix: checkPrefix,
        parseArgs: parseArgs
    };
    module.exports = prefix_module;
})();