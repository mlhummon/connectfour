/*
 * This class is exported as an Object Literal. It's
 * meant to handle all the of construction and management
 * of existing games. An Object Literal is used because their
 * is only one instance needed.
 * 
 * @class GameManager.js
 * 
 * @method methodName
 * @param {String} foo Argument 1
 * @param {Object} config A config object
 * @param {String} config.name The name on the config object
 * @param {Function} config.callback A callback function on the config object
 * @param {Boolean} [extra=false] Do extra, optional work
 * @return {Boolean} Returns true on success
 */

//TODO - Error handeling
//      If game is over, need to clean everything up
//      If invalid gameId is passed, need to handle that
//      
//      Other
//          Need to generate playerId's and track them on the backend
//

var Logger          = require('../utils/Logger');
var TurnResponse    = require('./TurnResponse');
var SetupResponse   = require('./SetupResponse');
var Status          = require('./Status');
var Game            = require('./Game');

var CONST = {
    COMPUTER_ID : "C",
    WAITING_ID  : "-1",
};

module.exports = {

    users       : new Object(),
    games       : new Object(),
    computer    : require('./Computer'),
    logger      : new Logger("GameManager"),

    createOrUpdateMulti: function(playerId){
        var resp = new SetupResponse();
        try{
            this.creationValidation(playerId);
            for(var prop in this.games){
                if(this.games.hasOwnProperty(prop)){
                    var game = this.games[prop];
                    if(game.p2Id === CONST.WAITING_ID){
                        //Need to lock game here, right
                        //now potentially not thread safe. It should be fine in the
                        //case of this application though
                        this.logger.info("Found a multi player (WAITING) game", this.games);
                        game.p2Id   = playerId;
                        resp.status = new Status(true, "Game ready");
                        resp.gameId = prop;
                        return resp;
                    }
                }
            }
            var gameId          = this.createGameId();
            this.games[gameId]  = new Game(gameId, playerId, CONST.WAITING_ID);
            resp.gameId         = gameId;
            resp.status         = new Status(false, "Game created, but waiting on other player");
            this.logger.info("Added a new multi player (WAITING) game", this.games);
        }catch(e){
            this.handleException(e, resp);
        }
        return resp;
    },
    createSingle: function(playerId){
        //Not thread safe. Need to put a lock on games
        //when creatig a new one. It should be fine in the
        //case of this application though
        var resp    = new SetupResponse();
        try{
            this.creationValidation(playerId);
            var gameId          = this.createGameId();
            this.games[gameId]  = new Game(gameId, playerId, CONST.COMPUTER_ID);
            resp.gameId         = gameId;
            resp.status         = new Status(true, "Game created");
            resp.yourTurn       = true;
            resp.yourColor      = "red";
            this.logger.info("Added a new single player game", this.games);
        }catch(e){
            this.handleException(e, resp);
        }
        return resp;

    },
    isPlayerWaiting: function(){
        for(var prop in this.games){
            if(this.games[prop].p2Id === CONST.WAITING_ID){
                return true;
            }
        }
        return false;
    },
    takeTurn: function(gameId, playerId, col){
        this.logger.debug("Taking turn", {gameId:gameId, playerId:playerId, column:col});
        var resp = new TurnResponse();
        try{

            var game    = this.turnValidation(gameId, playerId, col);
            var moves   = [];

            this.logger.debug("Human taking turn");
            moves.push(game.takeSpot(playerId, col));
            if(!moves[0].win && this.isSinglePlayer(game)){
                this.logger.debug("Computer taking turn");
                moves.push(this.computer.takeTurn(game));
            }

            this.logger.info("Game after turn was taken", game);
            resp.status = new Status(true, "Turn was successful")
            resp.moves  = moves;

        }catch(e){
            this.handleException(e, resp);
        }
        return resp;
    },
    /*
     * Utility and helper functions
     */
    getGame: function(gameId){
        this.logger.debug("Retrieved board from this.games", {gameId:gameId, games:this.games});
        return this.games[gameId];
    },
    createUserId: function(){
        var from = 1, to = 1000000;
        var userId = "H" + new String(Math.floor((Math.random()*to)+from));
        while(this.users[userId]){
            this.logger.debug("Generating new gameId");
            userId = "H" + new String(Math.floor((Math.random()*to)+from));
        }
        this.users[userId] = [];
        return userId;
    },
    createGameId: function(){
        var from = 1, to = 1000000;
        var gameId = "G" + new String(Math.floor((Math.random()*to)+from));
        while(this.games[gameId]){
            this.logger.debug("Generating new gameId");
            gameId = "G" + new String(Math.floor((Math.random()*to)+from));
        }
        return gameId;
    },
    isSinglePlayer: function(game){
        return game.p2Id === CONST.COMPUTER_ID;
    },
    /*
     * Validation and error handeling
     */
    creationValidation: function(playerId){
        if(!playerId){
            throw {
                type        : "InvalidDataException",
                description : "Incorrect data passed to creation",
                location    : "GM->creationValidation"
            };
        }
    },
    turnValidation: function(gameId, playerId, col){
        if(!gameId || !playerId || col === null){
            throw {
                type        : "InvalidDataException",
                description : "Incorrect data passed to turn",
                location    : "GM->turnValidation"
            };
        }

        var game = this.getGame(gameId);

        if(!game){
            throw {
                type        : "InvalidDataException",
                description : "Game doesn't exist",
                location    : "GM->turnValidation"
            };            
        }

        if(game.gameOver){
            throw {
                type        : "GameStateException",
                description : "Game is over",
                location    : "GM->turnValidation"
            };
        }
        if(playerId !== game.p1Id && playerId !== game.p2Id){
            throw {
                type        : "GameStateException",
                description : "Player is not associated with this game",
                location    : "GM->turnValidation"
            };
        }
        if(playerId !== game.playersTurn){
            this.logger.info("Player is trying to move out of turn",
                {playerId:playerId, gameId:gameId});
            throw {
                type        : "GameStateException",
                description : "It is not your turn",
                location    : "GM->turnValidation"
            };
        }
        if(!game.isColumnOpen(col)){
            throw {
                type        : "GameStateException",
                description : "Column is full",
                location    : "GM->turnValidation"
            };
        }
        return game;
    },
    handleException: function(e, resp){
        if(e.type==="GameStateException" || e.type ==="InvalidDataException"){
            resp.status = new Status(false, e.description, e.type);
            this.logger.info(e.description, e);
        }else{
            var msg = "Unexpected error occured";
            resp.status = new Status(false, msg, e.type);
            this.logger.severe("Unexpected error occured", e);
        }
    }
};