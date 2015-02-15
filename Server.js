var config          = require('./js/Configuration.json');
var http            = require('http');
var parser          = require('url');
var fs              = require('fs');
var io              = require('socket.io');
var path            = require('path');
var gameManager     = require('./js/backend/GameManager');

var Logger          = require('./js/utils/Logger');
var logger          = new Logger("Server");

logger.debug("Setting up server");
var httpServer = http.createServer(function (request, response){

    var q    = parser.parse(request.url, true);
    logger.debug("Parsed url", q);

    if(q.pathname === "/init/single"){

        var resp = gameManager.createSingle(q.query.playerId);
        logger.info("Responded with", resp);
        response.writeHead(200, { 'Content-Type': 'text/json' });
        response.end(JSON.stringify(resp), 'utf-8');

    }else if(q.pathname === "/info"){

        var ret = {
            playerWaiting: gameManager.isPlayerWaiting(),
            userId: gameManager.createUserId()
        };

        logger.info("Retrieved game info", ret);
        response.writeHead(200, { 'Content-Type': 'text/json' });
        response.end(JSON.stringify(ret), 'utf-8');

    }else if(q.pathname === "/takeTurn"){

        var resp = gameManager.takeTurn(q.query.gameId, q.query.playerId, parseInt(q.query.column));
        logger.info("Responded with", resp);
        response.writeHead(200, { 'Content-Type': 'text/json' });
        response.end(JSON.stringify(resp), 'utf-8');

    }else{

        var filePath = '.' + request.url;
        if (filePath === './' || filePath === '/')
            filePath = './index.htm';

        var extname = path.extname(filePath);
        var contentType = 'text/html';
        switch (extname) {
            case '.js':
                contentType = 'text/javascript';
                break;
            case '.css':
                contentType = 'text/css';
                break;
            case '.jpg':
                contentType = 'image/jpeg';
                break;
            case '.png':
                contentType = 'image/png';
                break;
        }
        fs.exists(filePath, function(exists) {
            if (exists) {
                fs.readFile(filePath, function(error, content) {
                    if (error) {
                        response.writeHead(500);
                        response.end();
                    }
                    else {
                        response.writeHead(200, { 'Content-Type': contentType });
                        response.end(content, 'utf-8');
                    }
                });
            }
            else {
                response.writeHead(404);
                response.end();
            }
        });
    }

}).listen(config.port);

var sockets = new Object();
io.listen(httpServer, { log: false }).sockets.on('connection', function (socket) {

    logger.debug("Connection to socket detected");
    socket.on('initMulti', function (data) {

        logger.debug("Initializing Multi Game");
        var resp = gameManager.createOrUpdateMulti(data.playerId);
        sockets[data.playerId] = socket;
        if(resp.status.proceed){

            logger.info("Player joined a waiting player. Game ready", {playerId:data.playerId, game:game});
            var game        = gameManager.getGame(resp.gameId);

            resp.yourTurn   = true;
            resp.yourColor  = game.getColor(game.p1Id);
            sockets[game.p1Id].emit(game.p1Id, resp);
            sockets[game.p1Id].on("takeTurn", multiTakeTurn);

            resp.yourTurn   = false;
            resp.yourColor  = game.getColor(game.p2Id);
            sockets[game.p2Id].emit(game.p2Id, resp);
            sockets[game.p2Id].on("takeTurn", multiTakeTurn);

        }else{
            logger.info("Player created game and is waiting", {playerId:data.playerId, game:game});
            sockets[data.playerId].emit(data.playerId, resp);
        }

    });
    socket.emit('ready');
});

function multiTakeTurn(data){
    var resp = gameManager.takeTurn(data.gameId, data.playerId, data.column);
    if(resp.status.proceed){
        var game = gameManager.getGame(data.gameId);
        resp.yours      = (data.playerId === game.p1Id);
        resp.yourTurn   = !resp.yours;

        sockets[game.p1Id].emit(data.gameId, resp);
        resp.yours      = !resp.yours;
        resp.yourTurn   = !resp.yours;
        sockets[game.p2Id].emit(data.gameId, resp);
    }else{
        sockets[data.playerId].emit(data.gameId, resp);
    }
}

logger.info('Server running at http://localhost:'+config.port+'/');