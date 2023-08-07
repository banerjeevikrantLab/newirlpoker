var express = require('express');
var router = express.Router();

/**
 * Handles GET requests to the root ('/') route.
 * If the request's session contains a user_game_id and a user_id, redirects to '/gameplay'.
 * If the request's session contains a game_id but not a user_game_id and user_id, redirects to '/dashboard'.
 * Otherwise, renders the 'index' view, passing the session data to the view.
 *
 * @param {Object} req The Express request object representing the HTTP request.
 * @param {Object} req.session The session data associated with the client.
 * @param {number} req.session.user_game_id The ID of the game associated with the user, if any.
 * @param {number} req.session.user_id The ID of the user, if any.
 * @param {number} req.session.game_id The ID of the game, if any.
 *
 * @param {Object} res The Express response object for sending back the HTTP response.
 */

router.get('/', function (req, res) {
    if (req.session.user_game_id && req.session.user_id) {
        res.redirect('/gameplay');
    } else if (req.session.game_id) {
        res.redirect('/dashboard');
    } else {
        res.render('index', { session: req.session });
    }
});

/**
 * Handles GET requests to the '/dashboard' route.
 * If the request's session contains a user_game_id, renders the 'dashboard' view, passing the session data to the view.
 * Otherwise, redirects to the root ('/') route.
 *
 * @param {Object} req The Express request object representing the HTTP request.
 * @param {Object} req.session The session data associated with the client.
 * @param {number} req.session.user_game_id The ID of the game associated with the user, if any.
 *
 * @param {Object} res The Express response object for sending back the HTTP response.
 */

router.get('/dashboard', function (req, res) {
    // Only render this page if a session exists
    if (req.session.user_game_id) {
        res.render('dashboard', { session: req.session });
    } else {
        res.redirect('/');
    }
});

/**
 * Handles GET requests to the '/gameplay' route.
 * If the request's session contains both a user_game_id and a user_id, renders the 'gameplay' view, passing the session data to the view.
 * Otherwise, redirects to the root ('/') route.
 *
 * @param {Object} req The Express request object representing the HTTP request.
 * @param {Object} req.session The session data associated with the client.
 * @param {number} req.session.user_game_id The ID of the game associated with the user, if any.
 * @param {number} req.session.user_id The ID of the user associated with the session, if any.
 *
 * @param {Object} res The Express response object for sending back the HTTP response.
 */

router.get('/gameplay', function (req, res) {
    if (req.session.user_game_id && req.session.user_id) {
        res.render('gameplay', { session: req.session });     
    } else {
        res.redirect('/');
    }
});

module.exports = router;