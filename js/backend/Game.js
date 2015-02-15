/*
 * This class is exported as a function object. It's
 * meant to handle everything within a Game context such as players, board,
 * turns and checking for wins. A function object is used because each game
 * needs to be it's own specific instance.
 * 
 * @class Game.js
 * 
 * @method methodName
 * @param {String} foo Argument 1
 * @param {Object} config A config object
 * @param {String} config.name The name on the config object
 * @param {Function} config.callback A callback function on the config object
 * @param {Boolean} [extra=false] Do extra, optional work
 * @return {Boolean} Returns true on success
 */

var Logger          = require('../utils/Logger');
var Move            = require('./Move');

var CONST = {
    RED         : "red",
    BLACK       : "black"
};

module.exports = function Game(gameId, p1Id, p2Id){

    this.config         = require('../Configuration.json');
    this.logger         = new Logger("Game[" +gameId+ "]");
    this.id             = gameId;
    this.p1Id           = p1Id;
    this.p2Id           = p2Id;
    this.board          = [];
    this.columnHeight   = [];
    this.playersTurn    = p1Id;
    this.gameOver       = false;


    this.isColumnOpen = function(col){
        return this.columnHeight[col] < this.config.board.rows;
    };

    this.takeSpot = function(playerId, col){

        this.playersTurn = (playerId === this.p1Id) ? this.p2Id : this.p1Id;
        var isWin = this.checkWin(this.columnHeight[col], col, playerId, 4);
        var move = new Move(
                col,
                this.columnHeight[col],
                isWin,
                (playerId === this.p1Id) ? CONST.RED : CONST.BLACK
            );
        this.gameOver = (isWin);
        this.board[this.columnHeight[col]][col] = playerId;
        this.columnHeight[col]++;
        return move;

    };

    this.getValue = function(r, c){
        return this.board[r][c];
    };

    //Needs to be rewritten or looked at
    this.checkWin = function(row, column, player, num){
        var ret     = false;
        var move    = 1;
        var counter = 1;
        while((row - move) >= 0 && this.getValue(row - move, column) === player){
            counter ++;
            move ++;
        }
        if(counter <  num){
            counter = 1;
            move = 1;
            while((column - move) >= 0 && this.getValue(row, column - move) === player){
                counter ++;
                move += 1;
            }
            move = 1;
            while((column + move) < 7 && this.getValue(row, column + move) === player){
                counter ++;
                move += 1;
            }
            if(counter <  num){
                counter = 1;
                move = 1;
                while((column - move) >= 0 && (row - move) >= 0 && this.getValue((row - move), (column - move)) === player){
                    counter ++;
                    move += 1;
                }
                move = 1;
                while((column + move) < 7 && (row + move) < 6 && this.getValue((row + move), (column + move)) === player){
                    counter ++;
                    move += 1;
                }
                if(counter <  num){
                    counter = 1;
                    move = 1;
                    while((column + move) < 7 && (row - move) >= 0 && this.getValue((row - move), (column + move)) === player){
                        counter ++;
                        move += 1;
                    }
                    move = 1;
                    while((column - move) >= 0 && (row + move) < 6 && this.getValue((row + move), (column - move)) === player){
                        counter ++;
                        move += 1;
                    }
                    if(counter === num){
                        ret = true;
                    }
                }else{
                    ret = true;
                }
            }else{
                ret = true;
            }
        }else{
            ret = true;
        }
        return ret;
    };

    this.getColor = function(id){
        if(id !== this.p1Id && id !== this.p2Id){
            throw {
                type        : "GameStateException",
                description : "Player doesn't exist in game",
                location    : "G->getColor"
            }
        }
        return ((id === this.p1Id) ? CONST.RED : CONST.BLACK);
    };

    this._init = function(){
        this.logger.debug("Using config to initialize board", this.config);
        for(var i = 0; i < this.config.board.rows; i++){
            for(var j = 0; j < this.config.board.columns; j++){
                if(!this.columnHeight[j]){
                    this.columnHeight[j]=0;
                }
                if(!this.board[i]){
                    this.board[i] = [];
                }
                this.board[i][j] = " ";
            }
        }
        this.logger.debug("Board initialized", this.board);
    };

    this._init();
};
