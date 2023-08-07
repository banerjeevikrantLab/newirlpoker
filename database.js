const mysql = require('mysql');

const connection = mysql.createConnection({
    host: 'localhost',
    database: 'pokerdb',
    user: 'root',
    password: 'VB123yoyo1D!'
});

connection.connect(function (error) {
    if (error) {
        throw error;
    }
    else {
        console.log('MySQL Database is connected Successfully');
    }
});

module.exports = connection;
