var express = require("express");
var mysql = require("mysql");
const path = require("path");
var bodyParser = require('body-parser')
var app = express();
var connection = require('./database')

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

app.use('/static', express.static('static'));

//set the template engine as pug
app.set('view engine', 'pug');

// set the views directory
app.set('views', path.join(__dirname, 'views'));



//Endpoint
app.get('/', function (req, res) {
    res.render('index', { products });
    //console.log({products});
});

app.post('/', function (req, res, next) {
    let search = req.body.searchbox;
    connection.query('SELECT * FROM product WHERE Product_Name LIKE ?', ['%' + search + '%'], (err, products) => {
        if (!err) {
        res.render('index', { products });
        } else {
        console.log(err);
        }
    });
});


app.get('/productPage/:ProductID', function (req, res, next) {
    let search = req.params;
    connection.query('SELECT * FROM product WHERE ProductID = ?', [search.ProductID], (err, products) => {
        if (!err) {
        res.render('./productPage', { products });
        } else {
        console.log(err);
        }
    });
});





// app.get('/', function (req, res) { // to display data on the browser
//     let query = "SELECT * FROM book_id";
//     connection.query(query, function (err, rows) {
//         if (err) throw err;
//         res.send(rows);
//     });
// })

function print () {
    let query = "SELECT * FROM book_id";
    connection.query(query, function (err, rows) {
        if (err) throw err;
        console.log(rows);
        return;
    });
}

let products;

function fetch_products () {
    let query = "SELECT * FROM product";
    connection.query(query, function (err, rows) {
        if (err) throw err;
        //console.log(rows, "HELLO");
        products = Object.values(JSON.parse(JSON.stringify(rows)));
        return;
    });
}

app.listen(3000, function () {
    console.log('App listening on port 3000');
    connection.connect(function (err) {
        if (err) throw err;
        console.log('Database Connected!');
    });
    fetch_products();
});