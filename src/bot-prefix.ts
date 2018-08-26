import { ArgumentPassObject } from "./interfaces";

export class PrefixUtils { 
    private static PREFIX: string = "!";

    static parseMessage(msg): ArgumentPassObject {
        let sourceMsg = msg.content;
        var retObj: ArgumentPassObject = { 
            success: false
        };
        
        if (sourceMsg.startsWith(this.PREFIX)) { 
            var allArgs = sourceMsg.substring(this.PREFIX.length).split(" ");

            retObj.success = true;
            retObj.cmd = allArgs[0];
            retObj.args = allArgs.splice(1);
            retObj.channel = msg.channel;
            retObj.authorId = msg.author.id;
        }

        return retObj;
    }
}