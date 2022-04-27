var express = require("express");
var mysql = require("mysql");
const path = require("path");
var bodyParser = require('body-parser')
var app = express();
var connection = require('./database');
var session = require('express-session')

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

app.use('/static', express.static('static'));

//set the template engine as pug
app.set('view engine', 'pug');

// set the views directory
app.set('views', path.join(__dirname, 'views'));

//session
app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));

//global variable
let userid = null;

const isAuthenticated = (req, res, next) => {
	if (req.session.auth) {
		next();
	} else {
		res.redirect('/signin');
	}
};

const isemployee = (req, res, next) => {
	if (req.session.isemployee) {
		next();
	} else {
		res.redirect('/signin');
	}
};

const issupplier = (req, res, next) => {
	if (req.session.issupplier) {
		next();
	} else {
		res.redirect('/signin');
	}
};


//sign up
app.get('/signup', function (req, res) {
	res.render('signup');
});

app.post('/signup', function (req, res) {
	const username = req.body.userid;
	const password1 = req.body.userpasswd1;
	const password2 = req.body.userpasswd2;
	const mail_id = req.body.useremail;	
	const name = req.body.name;
	const phone = req.body.userphone;
	if(mail_id == "" || password1 == "" || password2 == "" || name == "" || phone == "") {
		res.render('signup', {
			message: "Please fill in all the fields"
		});
		return;
	}
	if(password1 != password2) {
		res.render('signup', {
			error : "Passwords do not match"
		});
		return;
	}
	if(username.length < 6) {
		res.render('signup', {
			error : "Username must be at least 6 characters"
		});
		return;
	}
	if(password1.length < 6) {
		res.render('signup', {
			error : "Password must be at least 6 characters"
		});
		return;
	}
	if(phone.toString().length != 10) {
		res.render('signup', {
			error : "Phone must be at of 10 digits"
		});
		return;
	}
	const query2 = "SELECT LoginID FROM Account WHERE LoginID = '" + username + "'";
	connection.query(query2, function (err, rows) {
		if(rows.length != 0) {
			res.render('signup', {
				error : "Username already exists"
			});
			return;
		}
	});
	const query3 = "INSERT INTO Customer (Cutomer_Name, Email_ID) VALUES ('" + name + "', '" + mail_id + "')";
	connection.query(query3, function (err, rows) {
		if(err) {
			res.render('signup', {
				error : "User Email ID already exists"
			});
			return;
		}
		const query4 = "INSERT INTO Account (loginID, Password,CustomerID, account_type, bazaar_coins) VALUES ('" + username + "', '" + password1 + "','" + mail_id + "', 'NP', 500)";
		connection.query(query4, function (err, rows) {
			if(err) {
				res.render('signup', {
					error : "Error occured here"
				});
				return;
			}
			res.render('signin', {
				error : "Sign up successful. Log in now."
			});
		});
	});
});


async function show_user_page(res, req){
    let query = "SELECT * FROM Account WHERE LoginID = '" + req.session.user + "'";
    let account = await get_row(query);
    query = "SELECT * FROM Customer WHERE Email_ID = '" + account[0].CustomerID + "'";
    let customer = await get_row(query);
    
    query = "SELECT * FROM Customer_phone WHERE CustomerID = '" + account[0].CustomerID + "'";
    let customer_phone = await get_row(query);
    
    query = "SELECT * FROM Account_address WHERE LoginID = '" + account[0].LoginID + "'";
    let customer_address = await get_row(query);

    res.render('user', { account, customer, customer_phone, customer_address });
}

//sign in 
app.get('/signin', function (req, res) {
    if (req.session.user != undefined) {
        show_user_page(res, req);
        return;
    }
    res.render('./signin');
});

app.post('/signin',async function (req, res) {
	let username = req.body.userid;
	let password = req.body.userpasswd;
	if(username == "" || password == "") {
		res.render('signin', {
			error : "Please fill in all the fields"
		});
		return;
	}
	if (password == Number(password)) {
		let isemp = "SELECT * FROM Employee WHERE Email_ID = '" + username + "' and EmployeeID = " + password;
		let emp = await get_row(isemp);
		if (emp.length != 0) {
			req.session.isemployee = true;
			req.session.branchid = emp[0].BranchID;
			res.redirect('stock');
			return;
		}

		let issupp = "SELECT * FROM Supplier WHERE Email_ID = '" + username + "' and SupplierID = " + password;
		let supp = await get_row(issupp);
		if(supp.length != 0) {
			req.session.issupplier = true;
			req.session.supplierid = supp[0].SupplierID;
			res.redirect('supplier');
			return;
		}
	}

	userid = username;
	let query = "SELECT * FROM Account WHERE loginID = '" + username + "' AND Password = '" + password + "'";
	connection.query(query, function (err, rows) {
		if (err) throw err;
		if (rows.length > 0) {
			req.session.user = username;
			req.session.auth = true;
			res.redirect('./', 280, {
				userid: username,
				products: products
			});
		} else {
			userid = null;
			res.render('signin', {
				error : "Invalid username or password"
			});
		}
	});
});

app.get('/add_address', isAuthenticated, function (req, res) {
	res.render('add_address', {userid : req.session.user});
});



//stock page
app.get('/stock', isemployee, async function (req, res) {
	var branchid = req.session.branchid;
	let quan = "SELECT * FROM Stock WHERE BranchID = '" + branchid + "'";
	let stock = await get_row(quan);
	for (let i = 0; i < stock.length; i++) {
		let query = "SELECT * FROM Product WHERE ProductID = '" + stock[i].ProductID + "'";
		let product = await get_row(query);
		stock[i].ProductName = product[0].Product_Name;
		stock[i].ProductPrice = product[0].Product_MRP;
	}
	res.render('stock', { stock });
});

// supplier page
app.get('/supplier', issupplier, async function (req, res) {
	res.render('supplier');
});

app.post('/supplier', issupplier, async function (req, res) {
	let branchid = req.body.branchid;
	let productid = req.body.productid;
	let quan = req.body.quantity;
	let barcode = req.body.barcode;
	if(branchid == "" || productid == "" || quan == "" || barcode == "") {
		res.render('supplier', {
			error : "Please fill in all the fields"
		});
		return;
	}
	if(quan<0) {
		res.render('supplier', {
			error : "Quantity cannot be negative"
		});
		return;
	}
	if(barcode.toString().length != 12) {
		res.render('supplier', {
			error : "Barcode must be of 12 digits"
		});
		return;
	}

	let prod = "SELECT * FROM Product WHERE ProductID = '" + productid + "'";
	let product = await get_row(prod);
	if(product.length == 0) {
		res.render('supplier', {
			error : "Product does not exist"
		});
		return;
	}

	let branches = "SELECT * FROM Branch WHERE BranchID = '" + branchid + "'";
	let bran = await get_row(branches);
	if(bran.length == 0) {
		res.render('supplier', {
			error : "Branch ID does not exist"
		});
		return;
	}
	var supplierid = req.session.supplierid;
	let maxid = "SELECT MAX(SupplyID) FROM Supplies";
	maxid = await get_row(maxid);
	let supplyid = maxid[0]['MAX(SupplyID)'] + 1;
	let ins = "INSERT INTO Supplies (SupplyID,SupplierID,ProductID,BranchID,Date_of_Supply) VALUES ('" + supplyid + "', '" + supplierid + "', '" + productid + "', '" + branchid + "', CURDATE())";
	let ans5 = await get_row(ins);


	let query = "SELECT * FROM Stock WHERE BranchID = '" + branchid + "' AND ProductID = '" + productid + "' and barcode = '" + barcode + "'"; 
	let stock = await get_row(query);
	if (stock.length == 0) {
		query = "INSERT INTO Stock (SupplyID, BranchID, ProductID, Product_Quantity, barcode) VALUES ('" + supplyid + "', '" + branchid + "', '" + productid + "', '" + quan + "', '" + barcode + "')";
	}
	else {
		query = "UPDATE Stock SET Product_Quantity = '" + (Number(stock[0].Product_Quantity) + Number(quan)) + "' WHERE BranchID = '" + branchid + "' AND ProductID = '" + productid + "' and barcode = '" + barcode + "'";
	}
	let ans = await get_row(query);
	res.redirect('/supplier');
});





//Endpoint
app.get('/', function (req, res) {
	if(req.session.user == undefined) {
		userid = "Sign in";
		res.render('index', { products, userid });
		userid = null;
	}
	else {
		res.render('index', { products, userid : req.session.user });
	}
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


app.get('/productPage/:ProductID', async function (req, res, next) {
	let search = req.params;
	let query = "SELECT * FROM product WHERE ProductID = " + [search.ProductID] + ";";
	let product = await get_row(query);
	query = "SELECT * FROM Question_and_answer WHERE ProductID = " + [search.ProductID] + ";";
	let Questions = await get_row(query);
	query = "SELECT * FROM Review WHERE ProductID = " + [search.ProductID] + ";";
	let reviews = await get_row(query);
	if(req.session.user == undefined) {
		userid = "Sign in";
		res.render('./productPage', { product, userid, Questions, reviews });
		userid = null;
	}
	else {
		res.render('./productPage', { product, userid : req.session.user, Questions, reviews });
	}
});



app.post('/productPage/:ProductID', async function (req, res, next) {
	let question = req.body.question;
	let Review = req.body.review;
	let rating = req.body.rating;
	let search = req.params;
	let query;
	if (question == undefined) {
		if(Review == undefined) {
			res.redirect('/productPage/' + req.params.ProductID);
			return;
		}
		query = "Insert into Review (ProductID, LoginID, Product_Preview, Stars) VALUES (" + [search.ProductID] + ", '" + req.session.user + "', '" + Review + "', " + rating + ");";
		let ans = await get_row(query);
		res.redirect('/productPage/' + req.params.ProductID);
		return;
	}
	query = "Insert into QnA (ProductID, LoginID, Question_Statement) VALUES (" + [search.ProductID] + ", '" + req.session.user + "', '" + question + "');";
	let ans = await get_row(query);
	res.redirect('/productPage/' + req.params.ProductID);
});


function get_row (query) {
    return new Promise((resolve, reject) => {
        connection.query(query, function (err, rows) {
            if (err) reject(err);
            resolve(rows);
        });
    })
}


function print () {
    let query = "SELECT * FROM book_id";
    connection.query(query, function (err, rows) {
        if (err) throw err;
        return;
    });
}

let products;

function fetch_products () {
    let query = "SELECT * FROM product";
    connection.query(query, function (err, rows) {
        if (err) throw err;
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


app.get('/my_order', isAuthenticated, async function (req, res, next) {
	let query = "SELECT * FROM ORDER_PAGE WHERE LoginID = '" + req.session.user + "'";
	let order = await get_row(query);
	let products = [];
	for (let i = 0; i < order.length; i++) {
		query = "SELECT * FROM Product_order WHERE OrderID = " + order[i].OrderID + ";";
		products.push(await get_row(query));
	}
	res.render('my_order', { order, products, userid : req.session.user });
});

app.get('/logout', isAuthenticated, async function (req, res, next) {
	userid = null;
	req.session.auth = false;
	req.session.isemployee = false;
	req.session.issupplier = false;
	req.session.user = undefined;
	res.redirect('/');
});

app.get('/paymentsO', isAuthenticated, async function (req, res, next) {
	let query = "SELECT * FROM Payment_Options WHERE LoginID = '"+ req.session.user +"'";
	let paymentO = await get_row(query);
	let creditDebit = [];
	let Net_Banking = [];
	let UPI = [];
	for (let i = 0; i < paymentO.length; i++) {
		if(paymentO[i].Payment_type === 'CreditDebitCard'){
			query = "SELECT * FROM CreditDebitCard WHERE PaymentID = " + paymentO[i].PaymentID + ";";
			let ans = await get_row(query);
				if (ans.length != 0)
					creditDebit.push(ans);
		}
		if(paymentO[i].Payment_type === 'NetBanking'){
			query = "SELECT * FROM Net_Banking WHERE PaymentID = " + paymentO[i].PaymentID + ";";
			let ans = await get_row(query);
			if (ans.length != 0)
				Net_Banking.push(ans);
		}
		if(paymentO[i].Payment_type === 'UPI'){
			query = "SELECT * FROM UPI WHERE PaymentID = " + paymentO[i].PaymentID + ";";
			let ans = await get_row(query);
			if (ans.length != 0) {
				UPI.push(ans);
			}
		}
	}
	res.render('paymentsO', { userid : req.session.user, paymentO, creditDebit, Net_Banking, UPI });

});


app.get('/cart', async function (req, res, next) {
	let query = "SELECT Cart.Quantity, Cart.LoginID, Cart.ProductID, Product.ProductID, Product.Product_Name, Product.Product_MRP, Product.Applicable_SGST, Product.Applicable_CGST, Product.Product_link FROM Cart, Product WHERE Cart.LoginID = '"+userid+"' AND Cart.ProductID = Product.ProductID";
	let cart_products = await get_row(query);
	console.log(cart_products);
	let total = 0;
	let pro_total = [];
	let pro_q_total = [];
	for (let i = 0; i < cart_products.length; i++) {
		let ct = (cart_products[i].Product_MRP+((cart_products[i].Applicable_SGST*cart_products[i].Product_MRP)/100)+ ((cart_products[i].Applicable_CGST*cart_products[i].Product_MRP)/100));
		pro_total.push(Math.floor(ct * 100) / 100);
		pro_q_total.push(Math.floor((ct * cart_products[i].Quantity) * 100) / 100);
		total += Math.floor((ct * cart_products[i].Quantity) * 100) / 100;
	}
	total = Math.floor(total * 100) / 100;
	console.log(total,pro_total);
	res.render('cart', { userid, cart_products, pro_total, total, pro_q_total });

});

	
app.get('/:ID', async function (req, res, next) {
	console.log(req.params.ID);
	let type = req.params.ID[0];
	let table;
	let query;
	let ans;
	switch (type) {
		case 'U': table = 'UPI';
					query = 'Delete from ' + table + ' where PaymentID = ' + req.params.ID.substring(1);
					ans = await get_row(query);
					res.redirect('/paymentsO'); 
					break;
		case 'D': table = 'CreditDebitCard'; 
					query = 'Delete from ' + table + ' where PaymentID = ' + req.params.ID.substring(1);
					ans = await get_row(query);
					res.redirect('/paymentsO');
					break; 
		case 'N': table = 'Net_Banking';
					query = 'Delete from ' + table + ' where PaymentID = ' + req.params.ID.substring(1);
					ans = await get_row(query);
					res.redirect('/paymentsO');
					break; 
		case 'M': query = "SELECT Quantity FROM Cart WHERE ProductID = " + req.params.ID.substring(1) + " AND LoginID = '"+userid+"'";
					ans = await get_row(query);
					let quant = JSON.parse(JSON.stringify(ans));
					quant = quant[0].Quantity;
					// console.log(quant[0].Quantity);
					query = "UPDATE Cart SET Quantity = Quantity - 1 WHERE ProductID = " + req.params.ID.substring(1) + " AND LoginID = '"+userid+"'";
					ans = await get_row(query);
					quant = quant - 1;
					if(quant === 0){
						query = "DELETE FROM Cart WHERE ProductID = " + req.params.ID.substring(1) + " AND LoginID = '"+userid+"'";
						ans = await get_row(query);
					}
					res.redirect('/cart');
					break;
		case 'P': query = "SELECT Quantity FROM Cart WHERE ProductID = " + req.params.ID.substring(1) + " AND LoginID = '"+userid+"'";
					ans = await get_row(query);
					let quant1 = JSON.parse(JSON.stringify(ans));
					quant1 = quant1[0].Quantity;
					query = "SELECT SUM(Product_Quantity) AS Quantity FROM Stock WHERE ProductID = "+ req.params.ID.substring(1);
					ans = await get_row(query);
					let pc = JSON.parse(JSON.stringify(ans));
					pc = pc[0].Quantity;
					if(pc > quant1){
						query = "UPDATE Cart SET Quantity = Quantity + 1 WHERE ProductID = " + req.params.ID.substring(1) + " AND LoginID = '"+userid+"'";
						ans = await get_row(query);
						res.redirect('/cart');
					}
					else{
						res.redirect('/cart');
					}

					// console.log(quant[0].Quantity);
					
					break; 
	}
	
});
