var express = require('express');
var router = express.Router();

var database = require('../database');

/**
 * Handles POST requests to the '/login' endpoint.
 * Authenticates users based on the provided email and password.
 * If authentication is successful, assigns user details to the session and redirects to the root.
 * Otherwise, sends appropriate error messages.
 * 
 * @param {Object} req - The Express request object containing user details.
 * @param {string} req.body.user_email_address - The email address of the user attempting to log in.
 * @param {string} req.body.user_password - The password of the user attempting to log in.
 * 
 * @param {Object} res - The Express response object for sending back the HTTP response.
 * @param {Function} next - The next middleware function in the Express router's stack.
 */

router.post('/login', function (req, res, next) {

    var user_email_address = req.body.user_email_address;
    var user_password = req.body.user_password;

    if (user_email_address && user_password) {
        query = `
        SELECT * FROM user_login 
        WHERE user_email = ?
        `;

        database.query(query, [user_email_address], function (error, data, fields) {

            if (data.length > 0) {
                for (var count = 0; count < data.length; count++) {
                    if (data[count].user_password == user_password) {

                        req.session.user_id = data[count].user_id;
                        if (data[count].user_game_id !== null) {
                            console.log(data);
                            req.session.user_game_id = data[count].user_game_id;
                        }
                        res.redirect("/");
                    } else {
                        res.send('Incorrect Password');
                    }
                }
            }
            else {
                res.send(data);
            }
            res.end();
        });
    }
    else {
        res.send('Please Enter Email Address and Password Details');
        res.end();
    }

});

/**
 * Handles POST requests to the '/signup' endpoint.
 * Registers a new user based on the provided email and password.
 * Before registering, checks if the email address is already in use and validates the provided passwords.
 * If registration is successful, assigns user ID to the session and redirects to the root.
 * 
 * @param {Object} req - The Express request object containing user details.
 * @param {string} req.body.user_email_address - The email address of the user attempting to sign up.
 * @param {string} req.body.user_password - The password of the user attempting to sign up.
 * @param {string} req.body.user_repeat_password - The repeated password for verification.
 * @param {Object} req.session - The session object associated with the client.
 * @param {number} req.session.user_id - (Output) The ID of the newly registered user if signup is successful.
 * 
 * @param {Object} res - The Express response object for sending back the HTTP response.
 * @param {Function} next - The next middleware function in the Express router's stack.
 */

router.post('/signup', function (req, res, next) {

    var user_email_address = req.body.user_email_address;
    var user_password = req.body.user_password;
    var user_repeat_password = req.body.user_repeat_password;

    if (!user_email_address || !user_password || !user_repeat_password) {
        res.send('Please Enter Email Address and Password Details');
        res.end();
        return;
    }

    if (user_password !== user_repeat_password) {
        res.send('Passwords do not match');
        res.end();
        return;
    }

    let checkUserExistsQuery = `
    SELECT * FROM user_login 
    WHERE user_email = ?
    `;
    let insertUserQuery = `
    INSERT INTO user_login (user_email, user_password) VALUES
    (?, ?)
    `;

    database.query(checkUserExistsQuery, [user_email_address], function (error, data) {

        if (error) {
            res.send('Database error');
            res.end();
            return;
        }

        if (data.length > 0) {
            res.send('Email Already Exists');
            res.end();
            return;
        }

        // Store password as plaintext
        database.query(insertUserQuery, [user_email_address, user_password], function (error, data) {
            if (error) {
                res.send('Database error');
                res.end();
                return;
            }

            // If insertion was successful, get the user ID and set the session
            req.session.user_id = data.insertId; // Assuming this is how you get the inserted user's ID
            res.redirect("/");
            res.end();
        });
    });
});

/**
 * Handles GET requests to the '/logout' endpoint.
 * Removes the user ID from the session and redirects to the root.
 * 
 * @param {Object} req - The Express request object.
 * @param {Object} req.session - The session object associated with the client.
 * @param {number} req.session.user_id - (Output) The ID of the user to be removed from the session.
 * 
 * @param {Object} res - The Express response object for sending back the HTTP response.
 * @param {Function} next - The next middleware function in the Express router's stack.
 */

router.get('/logout', function (req, res, next) {
    delete req.session.user_id;
    res.redirect("/");
});

module.exports = router;
