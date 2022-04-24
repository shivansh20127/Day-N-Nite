var mysql = require('mysql');
var connection = mysql.createConnection({
    host: 'localhost',
    database: 'mid_evaluation_grp5',
    user: 'root',
    password: 'anuj'
    // ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'mysql_password';
});
module.exports = connection;