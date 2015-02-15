var Logger  = require('../utils/Logger');

module.exports = {

    config  : require('../Configuration.json'),
    logger  : new Logger("Computer"),

    takeTurn: function(game){

        //If the computer can win on the next spot
        //take it
        for(var i = 0; i < game.columnHeight.length; i++){
            if(game.columnHeight[i] < this.config.board.rows){
                var l = game.board[game.columnHeight[i]][i];
                game.board[game.columnHeight[i]][i] = game.p2Id;
                if(game.checkWin(game.columnHeight[i], i, game.p2Id, 4)){
                    return game.takeSpot(game.p2Id, i);
                }
                game.board[game.columnHeight[i]][i] = l;
            }
        }

        //If the computer can stop the player 1 from
        //winning, thake that spot
        for(i = 0; i < game.columnHeight.length; i++){
            if(game.columnHeight[i] < this.config.board.rows){
                var l = game.board[game.columnHeight[i]][i];
                game.board[game.columnHeight[i]][i] = game.p1Id;
                if(game.checkWin(game.columnHeight[i], i, game.p1Id, 4)){
                    return game.takeSpot(game.p2Id, i);
                }
                game.board[game.columnHeight[i]][i] = l;
            }
        }

//        for(i = 0; i < height_tracker.length; i++){
//            if(height_tracker[i] < 6){
//                $('#' + height_tracker[i] + '_' + i).attr('src', 'images/red-board.png');
//                if(check_win(height_tracker[i], i, 'red', 3)){
//                    $('#' + height_tracker[i] + '_' + i).attr('src', 'images/empty-board.png');
//                    need_spot = false;
//                    drop_piece(i, height_tracker[i], player_two_complete);
//                    height_tracker[i]++;
//                    break;
//                }
//                $('#' + height_tracker[i] + '_' + i).attr('src', 'images/empty-board.png');
//            }
//        }

        var randIndex = Math.floor(Math.random() * game.columnHeight.length);
        while(game.columnHeight[randIndex] === 6){
            randIndex = Math.floor(Math.random() * game.columnHeight.length);
        }

        return game.takeSpot(game.p2Id, randIndex);

    }

};