var express = require('express');
var router = express.Router();

var database = require('../database');

router.get('/game', function (request, response, next) {

    var insertQuery = `
	INSERT INTO games 
	(board, player1, player2, player3, player4, player5, player6, player7, player8, 
	player1cards, player2cards, player3cards, player4cards, player5cards, player6cards, player7cards, player8cards) 
	VALUES 
	(NULL, ?, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 
	NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)
`;


    var selectQuery = "SELECT LAST_INSERT_ID() AS id";
    var updateQuery = "UPDATE user_login SET user_game_id = ? WHERE user_id = ?";

    database.query(insertQuery, [request.session.user_id], function (error, results, fields) {
        if (error) {
            console.log(error);
        } else {
            // Once the first query has successfully run, we can run the second one
            database.query(selectQuery, function (error, results, fields) {
                if (error) {
                    console.log(error);
                } else {
                    request.session.user_game_id = results[0].id;
                    database.query(updateQuery, [request.session.user_game_id, request.session.user_id], function (error, results, fields) {
                        if (error) {
                            console.log(error);
                        }
                    });
                    delete request.session.user_id;
                    response.render('dashboard', { session: request.session });
                }
            });
        }
    });

});


function dealCards(gameId) {
    console.log("Deal Cards Function called")
    // Define suits and numbers
    const suits = ['H', 'D', 'C', 'S'];
    const numbers = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

    // Generate deck
    let deck = [];
    for (let suit of suits) {
        for (let number of numbers) {
            deck.push(`${number}${suit}`);
        }
    }

    // Shuffle deck
    deck.sort(() => Math.random() - 0.5);

    // Deal cards to players and board
    let boardCards = deck.splice(0, 5).join(',');
    let playerCards = {};
    for (let i = 1; i <= 8; i++) {
        playerCards[`player${i}cards`] = deck.splice(0, 2).join(',');
    }

    // Create SQL query
    let sql = `UPDATE games SET board = '${boardCards}'`;
    for (let i = 1; i <= 8; i++) {
        sql += `, player${i}cards = '${playerCards[`player${i}cards`]}'`;
    }
    sql += ` WHERE id = ${gameId}`;

    // Execute query
    database.query(sql, function (error, results, fields) {
        if (error) throw error;
        console.log('Cards have been dealt!');
    });
}


router.get("/dealcards", function (req, res) {
    dealCards(req.session.user_game_id);
    res.send("Cards have been dealt successfully!");
});


router.get('/get-current-cards', function (req, res) {
    if (req.session.user_game_id && req.session.user_id) {
        let query = 'CALL GetPlayerCards(?, ?)';
        database.query(query, [req.session.user_game_id, req.session.user_id], function (error, data, fields) {
            if (error) {
                console.log(error);
                res.status(500).send("Error retrieving cards");
            } else {
                var cards = data[0][0]['PlayerCards'];

                // Check for undefined, null or empty cards
                if (!cards) {
                    res.json([]);
                } else {
                    var cardsArray = cards.split(',');
                    res.json(cardsArray);
                }
            }
        });
    } else {
        res.status(403).send("Not authorized");
    }
});

router.get("/flop", function (req, res) {
    let query = "SELECT board FROM games WHERE id = ?";
    database.query(query, [req.session.user_game_id], function (error, data, fields) {
        var cards = data[0].board;
        cardsArray = cards.split(",").slice(0, 3);
        res.json(cardsArray);
    });
});

router.get("/river", function (req, res) {
    let query = "SELECT board FROM games WHERE id = ?";
    database.query(query, [req.session.user_game_id], function (error, data, fields) {
        var cards = data[0].board;
        cardsArray = cards.split(",").slice(3, 4);
        res.json(cardsArray);
    });
});

router.get("/turn", function (req, res) {
    let query = "SELECT board FROM games WHERE id = ?";
    database.query(query, [req.session.user_game_id], function (error, data, fields) {
        var cards = data[0].board;
        cardsArray = cards.split(",").slice(4, 5);
        res.json(cardsArray);
    });
});

router.post('/leavegame', function (request, response, next) {
    
    let query = "CALL RemoveUserFromGame(?, ?)";
    database.query(query, [request.session.user_game_id, request.session.user_id], function (error, data, fields) {
        if (error) {
            console.log(error);
            res.status(500).send("Error retrieving cards");
        } else {
            delete request.session.user_game_id;
            response.redirect("/");
        }
    });
});

router.post('/joingame', function (request, response, next) {

    var user_game_id = request.body.user_game_id;
    
    // Use SET for MySQL variable instead of DECLARE
    let query = `
    SET @result_code = 0;
    CALL JoinGameByUserGameID(?, ?, @result_code);
    SELECT @result_code AS result_code;`;
    
    database.query(query, [user_game_id, request.session.user_id], function (error, data, fields) {
        if (error) {
            console.log(error);
            response.status(500).send("Error retrieving cards");
        } else {
            let resultCode = data[2][0].result_code;
            console.log("Result Code: ", resultCode);

            switch (resultCode) {
                case 0: // Success
                    request.session.user_game_id = user_game_id;
                    response.redirect("/");
                    break;
                case 1: // No available position
                    response.send("No Available Positions");
                    break;
                case 2: // Game not found
                    response.send("No Game Found");
                    break;
            }
        }
    });
});



module.exports = router;