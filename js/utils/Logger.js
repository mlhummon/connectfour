global["DEBUG"]     = 1;
global["INFO"]      = 2;
global["SEVERE"]    = 3;

module.exports = function Logger(caller) {

    this.config = require('../Configuration.json');
    this.caller = caller;

    this.debug = function(msg, obj){
        if(this.getLevel(this.config.logLevel) === global["DEBUG"]){
            var m = this.createMessage("DEBUG ", msg);
            this.logMessage(m, obj);
        }
    };
    this.info = function(msg, obj){
        if(this.getLevel(this.config.logLevel) <= global["INFO"]){
            var m = this.createMessage("INFO  ", msg);
            this.logMessage(m, obj);
        }
    };
    this.severe = function(msg, obj){
        if(this.getLevel(this.config.logLevel) <= global["SEVERE"]){
            var m = this.createMessage("SEVERE", msg);
            this.logMessage(m, obj);
        }
    };
    this.logMessage = function(msg, obj){
        if(obj){
            console.log(msg + ":%j", obj);
        }else{
            console.log(msg);
        }
    };
    this.createMessage = function(level, msg){
        var m = new Date() + " - " + level + ":"; 
        if(this.caller){
            m += " ("+this.caller+") : ";
        }
        m += msg;
        return m;
    };
    this.getLevel = function(str){
        return global[str];
    };
};
