var express = require('express');
var router = express.Router();

var database = require('../database');

router.post('/login', function (request, response, next) {

    var user_email_address = request.body.user_email_address;
    var user_password = request.body.user_password;

    if (user_email_address && user_password) {
        query = `
        SELECT * FROM user_login 
        WHERE user_email = ?
        `;

        database.query(query, [user_email_address], function (error, data, fields) {

            if (data.length > 0) {
                for (var count = 0; count < data.length; count++) {
                    if (data[count].user_password == user_password) {

                        request.session.user_id = data[count].user_id;
                        if (data[count].user_game_id !== null) {
                            console.log(data);
                            request.session.user_game_id = data[count].user_game_id;
                        }
                        response.redirect("/");
                    } else {
                        response.send('Incorrect Password');
                    }
                }
            }
            else {
                response.send(data);
            }
            response.end();
        });
    }
    else {
        response.send('Please Enter Email Address and Password Details');
        response.end();
    }

});

router.post('/signup', function (request, response, next) {

    var user_email_address = request.body.user_email_address;
    var user_password = request.body.user_password;
    var user_repeat_password = request.body.user_repeat_password;

    if (!user_email_address || !user_password || !user_repeat_password) {
        response.send('Please Enter Email Address and Password Details');
        response.end();
        return;
    }

    if (user_password !== user_repeat_password) {
        response.send('Passwords do not match');
        response.end();
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
            response.send('Database error');
            response.end();
            return;
        }

        if (data.length > 0) {
            response.send('Email Already Exists');
            response.end();
            return;
        }

        // Store password as plaintext
        database.query(insertUserQuery, [user_email_address, user_password], function (error, data) {
            if (error) {
                response.send('Database error');
                response.end();
                return;
            }

            // If insertion was successful, get the user ID and set the session
            request.session.user_id = data.insertId; // Assuming this is how you get the inserted user's ID
            response.redirect("/");
            response.end();
        });
    });
});

router.get('/logout', function (request, response, next) {
    delete request.session.user_id;
    response.redirect("/");
});

module.exports = router;
