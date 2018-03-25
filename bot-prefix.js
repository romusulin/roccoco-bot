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
    var checkPrefix = function(sourceMsg) {
        var retObj = { status: false, prefix: "" };

        _.each(AVAILABLE_PREFIXES, function(prefix) {
            if (sourceMsg.startsWith(prefix)) { 
                retObj.status = true;
                retObj.prefix = prefix;
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
                return { status: true, body: "Senpai onii-chan master, here are all the available prefixes: " + AVAILABLE_PREFIXES.join(", ") };
            } else {
                return { status: false, body: FORMAT };
            }
        } else if (noOfArgs === 2) {
            if (cmd === ARGUMENTS.ADD) {
                return addPrefix(arg);
            } else if (cmd === ARGUMENTS.REMOVE) {
                return removePrefix(arg);
            } else {
                return { status: false, body: FORMAT };
            }      
        }
    };

    /* PRIVATE METHODS */
    var removePrefix = function(prefix) {
        var isSuccesfullRemoval = false;
        _.remove(AVAILABLE_PREFIXES, function(pfx) { 
            isSuccesfullRemoval = true;
            return prefix === pfx;
        });
        if (isSuccesfullRemoval) {
            return { status: true, body: "Your call did not go unnoticed. \"" + prefix + "\" is removed from available prefixes, senpai master." };
        } else {
            return { status: true, body: "\"" + prefix + "\" could not be found in available prefixes." };
        }
           
    };

    var addPrefix = function(prefix) {
        if (_.includes(AVAILABLE_PREFIXES, prefix)) {
            return { status: true, body: "\"" + prefix + "\" is already added in available prefixes." };
        } else {
            AVAILABLE_PREFIXES.push(prefix);
            return { status: true, body: "Your call did not go unnoticed. \"" + prefix + "\" is added to available prefixes, senpai master." };
        }
    };

    /* EXPORTS */
    var prefix_module = {
        checkPrefix: checkPrefix,
        parseArgs: parseArgs
    };
    module.exports = prefix_module;
})();