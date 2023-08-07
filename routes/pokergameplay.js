var express = require('express');
var router = express.Router();

var database = require('../database');

/**
 * Handles errors by logging them to the console.
 * 
 * @param {Error} error - The error object to handle.
 * @returns {boolean} - Returns true if an error is present, otherwise false.
 */

function handleError(error) {
    if (error) {
        console.error(error);
        return true;
    }
    return false;
}

/**
 * Initiates a new game by inserting a new record into the 'games' table.
 * After successfully inserting the game, it updates the 'user_login' table 
 * to set the 'user_game_id' field with the newly created game's ID for the current user.
 * Finally, renders the 'dashboard' view passing along the session data.
 *
 * @route GET /game
 * @param {Object} req - Express request object.
 * @param {Object} req.session - Session data associated with the client.
 * @param {number} req.session.user_id - ID of the user making the request.
 * @param {number} [req.session.user_game_id] - ID of the game associated with the user (if any).
 *
 * @param {Object} res - Express res object for sending back the HTTP res.
 * @param {Function} next - Callback argument to the middleware function, optionally called to move execution to the next middleware.
 */

router.get('/game', (req, res, next) => {
    const insertGame = `
        INSERT INTO games 
        (board, player1, player2, player3, player4, player5, player6, player7, player8, 
        player1cards, player2cards, player3cards, player4cards, player5cards, player6cards, player7cards, player8cards) 
        VALUES 
        (NULL, ?, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 
        NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)
    `;

    const updateUserGameIdQuery = "UPDATE user_login SET user_game_id = ? WHERE user_id = ?";

    database.query(insertGame, [req.session.user_id], (error, results) => {
        if (handleError(error)) return;

        const newGameId = results.insertId;
        req.session.user_game_id = newGameId;

        database.query(updateUserGameIdQuery, [newGameId, req.session.user_id], (error) => {
            if (handleError(error)) return;

            delete req.session.user_id;
            res.render('dashboard', { session: req.session });
        });
    });
});

/**
 * Deals cards for a specified game by updating the database.
 * The function generates a shuffled deck and assigns cards to the board and players.
 * Finally, it updates the database with the card data for the game with the provided ID.
 *
 * @param {number} gameId The unique ID of the game for which cards need to be dealt.
 */

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
        if (handleError(error)) return;
        console.log('Cards have been dealt!');
    });
}

/**
 * Handles GET requests to the "/dealcards" endpoint.
 * Calls the dealCards function with the game ID from the session.
 * Sends a confirmation message to the client after the cards have been dealt.
 * 
 * @param {Object} req The Express request object representing the HTTP request.
 * @param {Object} req.session The session data associated with the client.
 * @param {number} req.session.user_game_id The ID of the game associated with the user's session.
 * 
 * @param {Object} res The Express response object for sending back the HTTP response.
 */

router.get("/dealcards", function (req, res) {
    dealCards(req.session.user_game_id);
    res.send("Cards have been dealt successfully!");
});

/**
 * Handles GET requests to the '/get-current-cards' route.
 * If the request's session contains both a user_game_id and user_id, retrieves and sends the player's current cards.
 *
 * @param {Object} req The Express request object representing the HTTP request.
 * @param {Object} req.session The session data associated with the client.
 * @param {number} req.session.user_game_id The ID of the game associated with the user, if any.
 * @param {number} req.session.user_id The ID of the user, if available in the session.
 *
 * @param {Object} res The Express response object for sending back the HTTP response.
 */


router.get('/get-current-cards', function (req, res) {
    if (req.session.user_game_id && req.session.user_id) {
        let query = 'CALL GetPlayerCards(?, ?)';
        database.query(query, [req.session.user_game_id, req.session.user_id], function (error, data, fields) {
            if (handleError(error)) return;

            var cards = data[0][0]['PlayerCards'];
            if (!cards) {
                res.json([]);
            } else {
                var cardsArray = cards.split(',');
                res.json(cardsArray);
            }
        });
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

/**
 * Handles POST requests to the '/leavegame' route.
 * This endpoint allows a user to leave a game using the game ID stored in their session.
 * After successfully leaving the game, the user_game_id from the user's session will be deleted,
 * and the user will be redirected to the root route ('/').
 *
 * @param {Object} req The Express request object representing the HTTP request.
 * @param {Object} req.session The session data associated with the client.
 * @param {number} req.session.user_game_id The ID of the game the user is currently in.
 * @param {number} req.session.user_id The ID of the currently logged-in user.
 *
 * @param {Object} res The Express response object for sending back the HTTP response.
 * @param {function} next The next middleware function in the Express middleware chain.
 */


router.post('/leavegame', function (req, res, next) {
    
    let query = "CALL RemoveUserFromGame(?, ?)";
    database.query(query, [req.session.user_game_id, req.session.user_id], function (error, data, fields) {
        if (handleError(error)) return;
        delete req.session.user_game_id;
        res.redirect("/");
    });
});

/**
 * Handles POST requests to the '/joingame' route.
 * This endpoint allows a user to join a game using a game ID. 
 * If successful, the user's session will be updated with the game ID.
 * Based on the result code from the database procedure:
 * - Redirects to the root route ('/') if the join is successful.
 * - Sends "No Available Positions" if there are no open positions in the game.
 * - Sends "No Game Found" if the specified game does not exist.
 *
 * @param {Object} req The Express request object representing the HTTP request.
 * @param {Object} req.body The data sent by the client, expected to contain user_game_id.
 * @param {number} req.body.user_game_id The ID of the game the user wants to join.
 * @param {Object} req.session The session data associated with the client.
 * @param {number} req.session.user_id The ID of the currently logged-in user.
 *
 * @param {Object} res The Express response object for sending back the HTTP response.
 * @param {function} next The next middleware function in the Express middleware chain.
 */

router.post('/joingame', function (req, res, next) {

    var user_game_id = req.body.user_game_id;

    // First, execute the stored procedure
    database.query('CALL JoinGameByUserGameID(?, ?, @result_code);', [user_game_id, req.session.user_id], function (error, data, fields) {
        if (handleError(error)) return;

        // Then, retrieve the result_code value
        database.query('SELECT @result_code AS result_code;', [], function (error, data, fields) {
            if (handleError(error)) return;

            let resultCode = data[0].result_code;

            switch (resultCode) {
                case 0: // Success
                    req.session.user_game_id = user_game_id;
                    res.redirect("/");
                    break;
                case 1: // No available position
                    res.send("No Available Positions");
                    break;
                case 2: // Game not found
                    res.send("No Game Found");
                    break;
            }
        });
    });
});



module.exports = router;