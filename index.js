var express = require("express");
var mysql = require("mysql");
const path = require("path");
var bodyParser = require('body-parser')
var app = express();
var connection = require('./database');
var session = require('express-session');

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

const isdiv = (req, res, next) => {
	if (req.session.isdiv) {
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
	let role = req.body.Role;
	if(username == "" || password == "") {
		res.render('signin', {
			error : "Please fill in all the fields"
		});
		return;
	}
	console.log(role);
	if (role == "Employee") {
		
			let isemp = "SELECT * FROM Employee WHERE Email_ID = '" + username + "' and EmployeeID = " + password;
			let emp = await get_row(isemp);
			if (emp.length != 0) {
				req.session.isemployee = true;
				req.session.branchid = emp[0].BranchID;
				res.redirect('/purchase_offline/branch_login');
				return;
			}
			else {
				res.render('signin', {
					error : "Invalid Employee ID/Password"
				});
				return;
			}
	}

	if (role == "Supplier") {
			let issupp = "SELECT * FROM Supplier WHERE Email_ID = '" + username + "' and SupplierID = " + password;
			let supp = await get_row(issupp);
			console.log(supp);
			if(supp.length != 0) {
				req.session.issupplier = true;
				req.session.supplierid = supp[0].SupplierID;
				res.redirect('supplier');
				return;
			}
			else {
				res.render('signin', {
					error : "Invalid Supplier ID/Password"
				});
				return;
			}
		
	}

	if (role == "Delivery Service") {
		let issupp = "SELECT * FROM DeliveryService WHERE Email_ID = '" + username + "' and ServiceID = " + password;
		let supp = await get_row(issupp);
		if(supp.length != 0) {
			req.session.isdiv = true;
			req.session.supplierid = supp[0].SupplierID;
			res.redirect('/delivery_login');
			return;
		}
		else {
			res.render('signin', {
				error : "Invalid Delivery Service ID/Password"
			});
			return;
		}
	}


	if (role == "Customer") {
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
					error: "Invalid username or password"
				});
			}
		});
	}
});

app.get('/add_address', isAuthenticated, function (req, res) {
	res.render('add_address', {userid : req.session.user});
});

app.get('/returnCancel', isAuthenticated, async function (req, res) { 
	res.render('returnCancel', {userid : req.session.user});
});

app.post('/returnCancel', isAuthenticated, async function (req, res) { 
	let option = req.body.Option;
	let ID = req.body.ID;
	if (option == "Return") {
		let query = "SELECT * FROM ORDER_PAGE WHERE LoginID = '" + req.session.user + "' and OrderID = " + ID + " and Order_Status = 'D'";
		let order = await get_row(query);
		console.log(order);
		if (order.length == 0) {
			res.render('returnCancel', {
				error: "Order not found"
			});
			return;
		}
		query = "UPDATE Order_Table SET Order_Status = 'R' WHERE OrderID = " + ID + " and Order_Status = 'D'";
		let ans = await get_row(query);
		query = "select * from Deliver where OrderID = " + ID;
		let deliver = await get_row(query);
		query = "insert into OnlineReturn(OrderID, LoginID, ServiceID, Reason_for_Return) values(" + ID + ", '" + req.session.user + "', " + deliver[0].ServiceID + ", '" + req.body.Reason + "')";
		ans = await get_row(query);
	}
	else if (option == "Cancel") {
		let query = "SELECT * FROM ORDER_PAGE WHERE LoginID = '" + req.session.user + "' and OrderID = " + ID + " and Order_Status = 'ND'";
		let order = await get_row(query);
		if (order.length == 0) {
			res.render('returnCancel', {
				error: "Order not found"
			});
			return;
		}
		query = "UPDATE Order_Table SET Order_Table = 'C' WHERE OrderID = " + ID + " and Order_Status = 'ND'";
		let ans = await update_query(query);
	}
	res.redirect('/signin');
});

app.post('/add_address', isAuthenticated, async function (req, res) {
	let Street = req.body.Street;
	let City = req.body.City;
	let District = req.body.District;
	let Zip = req.body.zip;
	let Country = req.body.Country;
	let Address_Line = req.body.Address_Line;
	if(Street == "" || City == "" || District == "" || Zip == "" || Country == "" || Address_Line == "") {
		res.render('add_address', {
			error : "Please fill in all the fields"
		});
		return;
	}
	console.log(Zip);
	let query = "INSERT INTO Account_address (LoginID, Street, City, District, Pincode, Country, Address_Line) VALUES ('" + req.session.user + "', '" + Street + "', '" + City + "', '" + District + "', '" + Zip + "', '" + Country + "', '" + Address_Line + "')";
	let ans = await get_row(query);
	res.redirect('/signin');
});


app.get('/claim_coupons', isAuthenticated, async function (req, res) {
	let query = "select * from Coupon where Valid_Till >= CURDATE()";
	let Coupons = await get_row(query);
	query = "Select Bazaar_Coins from Account where LoginID = '" + req.session.user + "'";
	let Coins = await get_row(query);
	query = "Select Available_coupon.CouponCode, Valid_Till, Date_of_allocating, Date_of_allocating, Discount_Rate, Maximum_Discount from Available_coupon left join Coupon on Available_coupon.CouponCode = Coupon.CouponCode where LoginID = '" + req.session.user + "'";
	let Available = await get_row(query);
	let error = req.session.error;
	req.session.error = null;
	res.render('claim_coupons', {userid : req.session.user, Coupons : Coupons, Coins : Coins, Available : Available, error : error});
});

app.post('/claim_coupons', isAuthenticated, async function (req, res) { 
	let CouponID = req.body.Coupon;
	let query = "select * from Coupon where CouponCode = '" + CouponID + "';";
	let Coupon = await get_row(query);
	if (Coupon.length == 0) {
		req.session.error = "Coupon not found";
		res.redirect('claim_coupons');
		return;
	}
	query = "Select Bazaar_Coins from Account where LoginID = '" + req.session.user + "'";
	let Coins = await get_row(query);
	if (Coins[0].Bazaar_Coins < 500) {
		req.session.error = "Insufficient Bazaar Coins";
		res.redirect('claim_coupons');
		return;
	}
	query = "update Account set Bazaar_Coins = Bazaar_Coins - 500 where LoginID = '" + req.session.user + "'";
	let ans = await get_row(query);
	query = "insert into Available_coupon(LoginID, CouponCode, Date_of_allocating) values('" + req.session.user + "', '" + Coupon[0].CouponCode + "', CURDATE())";
	ans = await get_row(query);
	res.redirect('/signin');
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
	console.log(stock, branchid);
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
	console.log('reached');
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

app.get('/Delete_address/:index', isAuthenticated, async function (req, res, next) { 
	let address_index = req.params.index;
	console.log(address_index);
	let query = "DELETE FROM Account_address WHERE AddressId = " + [address_index] + ";";
	let ans = await get_row(query);
	res.redirect('/signin');
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
	console.log(order);
	res.render('my_order', { order, products, userid : req.session.user });
});

app.get('/logout', isAuthenticated, async function (req, res, next) {
	userid = null;
	req.session.auth = false;
	req.session.isemployee = false;
	req.session.issupplier = false;
	req.session.isdil = false;
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


app.get('/cart', isAuthenticated, async function (req, res, next) {
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
	res.render('cart', { userid : req.session.user, cart_products, pro_total, total, pro_q_total });

});

app.get('/wishlist', isAuthenticated, async function (req, res, next) {
	let query = "SELECT WishList.LoginID, WishList.ProductID, Product.Product_Name, Product.Product_MRP, Product.Applicable_SGST, Product.Applicable_CGST, Product.Product_link FROM WishList, Product WHERE WishList.LoginID = '"+req.session.user+"' AND WishList.ProductID = Product.ProductID";
	let wish_products = await get_row(query);
	console.log(wish_products);
	res.render('wishlist', { userid : req.session.user, wish_products });

});

app.get('/wcartAdd/:ProductID', async function (req, res, next) {
	let search = req.params;
	let ans;
	console.log(search.ProductID);
	let query = "SELECT MAX(Product_Quantity) AS PQ FROM Stock WHERE ProductID =" + search.ProductID +";";
	ans = await get_row(query);
	if(ans[0].PQ < 1){
		res.redirect('/wishlist');
		return;
	}
	query = "SELECT * FROM Cart WHERE LoginID='"+req.session.user +"' AND ProductID=" + search.ProductID +";";
	ans = await get_row(query);
	if(ans.length == 0){
		query = "INSERT INTO Cart(LoginID, ProductID) VALUES ('"+req.session.user +"'," + search.ProductID +");"
		ans = await get_row(query);
		query = "DELETE FROM WishList WHERE LoginID = '"+req.session.user +"' AND ProductID = "+ search.ProductID +";";
		ans = await get_row(query);
		console.log("added");
	}
	
	res.redirect('/wishlist');
});


app.get('/wRemove/:ProductID', async function (req, res, next) {
	let search = req.params;
	let query;
	let ans;
	console.log(search.ProductID);
	query = "DELETE FROM WishList WHERE LoginID = '"+req.session.user +"' AND ProductID = "+ search.ProductID +";";
	ans = await get_row(query);
	res.redirect('/wishlist');
});


app.get('/AddCart/:ProductID', async function (req, res, next) {
	let search = req.params;
	let ans;
	console.log(search.ProductID);
	let query = "SELECT MAX(Product_Quantity) AS PQ FROM Stock WHERE ProductID =" + search.ProductID +";";
	ans = await get_row(query);
	if(ans[0].PQ < 1){
		res.redirect('/productPage/' + search.ProductID);
		return;
	}
	query = "SELECT * FROM Cart WHERE LoginID='"+req.session.user +"' AND ProductID=" + search.ProductID +";";
	ans = await get_row(query);
	if(ans.length == 0){
		query = "INSERT INTO Cart(LoginID, ProductID) VALUES ('"+req.session.user +"'," + search.ProductID +");"
		ans = await get_row(query);
		console.log("added")
	}
	console.log(search.ProductID);
	res.redirect('/productPage/' + search.ProductID);
});

app.get('/AddWish/:ProductID', async function (req, res, next) {
	let search = req.params;
	let ans;
	let query = "SELECT * FROM WishList WHERE LoginID='"+req.session.user +"' AND ProductID=" + search.ProductID +";";
	ans = await get_row(query);
	if(ans.length == 0){
		query = "INSERT INTO WishList(LoginID, ProductID) VALUES ('"+req.session.user +"'," + search.ProductID +");"
		ans = await get_row(query);
		console.log("added");
	}
	console.log(search.ProductID);
	
	res.redirect('/productPage/' + search.ProductID);
});


app.get('/checkout', isAuthenticated, async function (req, res, next) {
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
	query = "SELECT * FROM Payment_Options WHERE LoginID = '"+ req.session.user +"'";
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
	console.log(creditDebit, Net_Banking, UPI);
	query = "SELECT AC.CouponCode, AC.Date_of_allocating, C.Valid_Till, C.Discount_Rate, C.Maximum_Discount FROM Available_coupon AC, Coupon C WHERE AC.LoginID = '"+userid+"' AND AC.CouponCode = C.CouponCode AND C.Valid_Till >= CURDATE()";
	ans = await get_row(query);
	console.log(ans);
	let coupon = ans;

	query = "SELECT * FROM Account_address WHERE LoginID = '" + req.session.user + "'";
    let customer_address = await get_row(query);
	console.log(customer_address);
	code_coupon = 'false';
	res.render('checkout', { userid : req.session.user, cart_products, pro_total, code_coupon, coupon, total, pro_q_total, paymentO, creditDebit, Net_Banking, UPI, customer_address });

});

app.post('/checkout', isAuthenticated, async function (req, res, next) {
	const couponUsed = req.body.couponC;
	let c_used = true;
	if(couponUsed === 'Select Coupon'){
		c_used = false;
	}
	if(req.body.payC === "Select Payment Option"){
		res.redirect('checkout');
	}
	if(req.body.deliveryAddC === "Select Delivery Address"){
		res.redirect('checkout');
	}
	let query;
	let ans;
	let discount = 0;
	let max_discount = 0;
	if(c_used === true){
		let couponCode = couponUsed.split(" ");
		couponCode = couponCode[0];
		console.log(couponCode);
		query = "SELECT Discount_Rate, Maximum_Discount FROM Coupon WHERE CouponCode='"+ couponCode +"'";
		ans = await get_row(query);
		console.log(ans);
		discount = ans[0].Discount_Rate;
		max_discount = ans[0].Maximum_Discount;
		console.log(discount, max_discount);
		// query =  "DELETE FROM Available_coupon WHERE LoginID='"+ req.session.user + "'AND CouponCode='"+ couponCode +"'";
		// ans = await get_row(query);
	}
	let address = req.body.deliveryAddC.split("");
	address = address[0];
	console.log(address);

	let payment = req.body.payC.split("");
	payment = payment[0];
	console.log(payment);

	query = "SELECT AddressId, Street, Address_Line, District, City, Pincode, Country FROM Account_address WHERE AddressId="+ address;
	ans = await get_row(query);
	let order_add = ans;
	console.log(ans[0].Street);

	let last_order_id = "SELECT MAX(OrderID) AS MOID FROM Order_Table";
	last_order_id = await get_row(last_order_id);
	console.log(last_order_id);
	last_order_id = last_order_id[0].MOID;
	last_order_id += 1;


	let total = 0;
	query = "SELECT Cart.Quantity, Cart.LoginID, Cart.ProductID, Product.ProductID, Product.Product_Name, Product.Product_MRP, Product.Applicable_SGST, Product.Applicable_CGST, Product.Product_link FROM Cart, Product WHERE Cart.LoginID = '"+userid+"' AND Cart.ProductID = Product.ProductID";
	let cart_products = await get_row(query);
	console.log(cart_products);
	for (let i = 0; i < cart_products.length; i++) {
		let ct = (cart_products[i].Product_MRP+((cart_products[i].Applicable_SGST*cart_products[i].Product_MRP)/100)+ ((cart_products[i].Applicable_CGST*cart_products[i].Product_MRP)/100));
		total += Math.floor((ct * cart_products[i].Quantity) * 100) / 100;
	}
	total = Math.floor(total * 100) / 100;

	let dis_amount = total*discount/100;
	dis_amount = Math.max(dis_amount, max_discount);
	total = total - dis_amount;



	//stock deletion
	//if order is for 7 but in stock 1 barcode is 6 and other is 8 then make 6 =0 and 8 -1 = 7
	query = ""
	let i = 0;
	let ans2 = 0;
	while(i < cart_products.length){
		query = "SELECT Product_Quantity, barcode FROM Stock WHERE ProductID = "+ cart_products[i].ProductID +";";
		ans = await get_row(query);
		ans = JSON.parse(JSON.stringify(ans));
		console.log(ans);
		let quant = cart_products[i].Quantity;
		let j = 0;
		while(quant > 0){
			console.log(j, quant);
			if(ans[j].Product_Quantity >= quant){
				ans[j].Product_Quantity = ans[j].Product_Quantity - quant;
				quant = 0;
				query = "UPDATE Stock SET Product_Quantity = "+ans[j].Product_Quantity+" WHERE ProductID = "+ cart_products[i].ProductID +" AND barcode = '"+ cart_products[i].barcode +"';";
				ans2 = await get_row(query);
			}
			else if(ans[j].Product_Quantity < quant){
				quant = quant - ans[j].Product_Quantity;
				query = "UPDATE Stock SET Product_Quantity = "+0+" WHERE ProductID = "+ cart_products[i].ProductID +" AND barcode = '"+ cart_products[i].barcode +"';";
				ans2 = await get_row(query);
			}
			j++;
		}
		i++;
	}

	ans = order_add;
	query = "INSERT INTO Order_Table(OrderID, PaymentID, Total_cost, Street, Address_Line, District, City, Pincode, Country) VALUES ("+ last_order_id +"," + payment +","+ total+",'"+ans[0].Street+"','"+ans[0].Address_Line +"','"+ans[0].District+"','"+ ans[0].City+"','"+ans[0].Pincode+"','"+ans[0].Country+"');"
	ans = await get_row(query);
	query = "INSERT INTO OnlineOrder(OrderID, LoginID, Date_of_Ordering) VALUES ("+ last_order_id +",'" + req.session.user +"',CURDATE());"
	ans = await get_row(query);
	query = "SELECT * FROM Cart WHERE LoginID = '"+req.session.user +"'";
	ans = await get_row(query);

	for (let i = 0; i < ans.length; i++) {
		query = "INSERT INTO Order_List(OrderID, ProductID, Quantity) VALUES ("+ last_order_id +"," + ans[i].ProductID +","+ ans[i].Quantity+");"
		ans2 = await get_row(query);
		query = "DELETE FROM Cart WHERE LoginID = '"+req.session.user +"' AND ProductID = "+ ans[i].ProductID +";";
		ans2 = await get_row(query);
	}

	res.redirect('my_order');

});

	
app.get('/Delete_Payment/:ID', isAuthenticated, async function (req, res, next) {
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
		case 'M': query = "SELECT Quantity FROM Cart WHERE ProductID = " + req.params.ID.substring(1) + " AND LoginID = '"+ req.session.user +"'";
					ans = await get_row(query);
					let quant = JSON.parse(JSON.stringify(ans));
					quant = quant[0].Quantity;
					// console.log(quant[0].Quantity);
					query = "UPDATE Cart SET Quantity = Quantity - 1 WHERE ProductID = " + req.params.ID.substring(1) + " AND LoginID = '"+req.session.user+"'";
					ans = await get_row(query);
					quant = quant - 1;
					if(quant === 1){
						query = "DELETE FROM Cart WHERE ProductID = " + req.params.ID.substring(1) + " AND LoginID = '"+req.session.user+"'";
						ans = await get_row(query);
					}
					res.redirect('/cart');
					break;
		case 'P': query = "SELECT Quantity FROM Cart WHERE ProductID = " + req.params.ID.substring(1) + " AND LoginID = '"+req.session.user+"'";
					ans = await get_row(query);
					let quant1 = JSON.parse(JSON.stringify(ans));
					quant1 = quant1[0].Quantity;
					query = "SELECT SUM(Product_Quantity) AS Quantity FROM Stock WHERE ProductID = "+ req.params.ID.substring(1);
					ans = await get_row(query);
					let pc = JSON.parse(JSON.stringify(ans));
					pc = pc[0].Quantity;
					if(pc > quant1){
						query = "UPDATE Cart SET Quantity = Quantity + 1 WHERE ProductID = " + req.params.ID.substring(1) + " AND LoginID = '"+req.session.user+"'";
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


app.get('/add_number', isAuthenticated, async function (req, res, next) { 
	res.render('add_number', { userid : req.session.user, error : req.session.error});
})

app.post('/add_number', isAuthenticated, async function (req, res, next) { 
	if (req.body.number.length != 10) {
		req.session.error = "Phone number must be 10 digits";
		res.redirect('/add_number');
	}
	else {
		let query = "select CustomerID from Account where LoginID = '" + req.session.user + "'";
		let id = await get_row(query);
		if (true) {
			query = "select * from Customer_Phone where phone_number = '" + req.body.number + "' and CustomerID = '" + id[0].CustomerID + "'";
			let ans = await get_row(query);
			if (ans.length > 0) {
				req.session.error = "Phone number already exists";
				res.redirect('/add_number');
				return;
			}
		}
		query = "INSERT INTO Customer_Phone(CustomerID, phone_number) VALUES ('" + id[0].CustomerID + "','" + req.body.number + "');";
		let ans = await get_row(query);
		res.redirect('/signin');
	}
});

app.get('/Delete_Number/:number', isAuthenticated, async function (req, res, next) { 
	let number = req.params.number;
	let query = "select CustomerID from Account where LoginID = '" + req.session.user + "'";
	let id = await get_row(query);
	query = "Delete from Customer_Phone where CustomerID = '" + id[0].CustomerID + "' AND phone_number = '" + number + "';";
	let ans = await get_row(query);
	res.redirect('/signin');
});

app.get('/add_payment_option', isAuthenticated, async function (req, res, next) { 
	res.render('add_payment_option', { userid : req.session.user, error : req.session.error, error2 : req.session.error2, error3 : req.session.error3});
});

app.post('/add_debitCredit_option', isAuthenticated, async function (req, res, next) { 
	let name = req.body.card_name;
	let number = req.body.card_number;
	let date = req.body.card_date;
	if (number === '' || name === '' || date === '') {
		req.session.error = "All fields are required";
		res.redirect('/add_payment_option');
		return;
	}
	if (number.length != 16) {
		req.session.error = "Card number must be 16 digits";
		res.redirect('/add_payment_option');
		return;
	}
	let query = "select * from CreditDebitCard where card_number = '" + number + "'";
	let ans = await get_row(query);
	if (ans.length > 0) {
		req.session.error = "Card number already exists";
		res.redirect('/add_payment_option');
		return;
	}
	query = "select max(PaymentID) as max from Payment_Options";
	ans = await get_row(query);
	let id = JSON.parse(JSON.stringify(ans));
	id = id[0].max;
	id = id + 1;
	query = "Insert into Payment_Options (PaymentID, LoginID, Payment_type) values (" + id + ",'" + req.session.user + "','CreditDebitCard');";
	ans = await get_row(query);
	query = "insert into CreditDebitCard (Holder_Name, Card_Number, Expiry_Date, PaymentID) values ('" + name + "','" + number + "','" + date + "-01'," + id + ");";
	ans = await get_row(query);
	res.redirect('/signin');
});


app.post('/add_Net_Banking_option', isAuthenticated, async function (req, res, next) { 
	let name = req.body.account_name;
	let number = req.body.account_number;
	let bank = req.body.bank_name;
	let IFSC_code = req.body.IFSC_code;
	if (number === '' || name === '' || bank === '' || IFSC_code === '') {
		req.session.error2 = "All fields are required";
		res.redirect('/add_payment_option');
		return;
	}
	if (number.length != 16) {
		req.session.error2 = "Account number must be 16 digits";
		res.redirect('/add_payment_option');
		return;
	}
	let query = "select * from Net_Banking where Account_Number = '" + number + "'";
	let ans = await get_row(query);
	if (ans.length > 0) {
		req.session.error2 = "Account number already added";
		res.redirect('/add_payment_option');
		return;
	}
	query = "select max(PaymentID) as max from Payment_Options";
	ans = await get_row(query);
	let id = JSON.parse(JSON.stringify(ans));
	id = id[0].max;
	id = id + 1;
	query = "Insert into Payment_Options (PaymentID, LoginID, Payment_type) values (" + id + ",'" + req.session.user + "','NetBanking');";
	ans = await get_row(query);
	query = "insert into Net_Banking (account_number, holder_name, bank_name, ifsc_code, paymentid) values ('" + number + "','" + name + "','" + bank + "','" + IFSC_code + "'," + id + ");";
	ans = await get_row(query);
	res.redirect('/signin');
});


app.post('/add_UPI_option', isAuthenticated, async function (req, res, next) { 
	let upi_id = req.body.ID;
	if (upi_id.length == 0) {
		req.session.error3 = "UPI ID is required";
		res.redirect('/add_payment_option');
		return;
	}
	let query = "select * from UPI where upi_id = '" + upi_id + "'";
	let ans = await get_row(query);
	if (ans.length > 0) {
		req.session.error3 = "UPI already exists";
		res.redirect('/add_payment_option');
		return;
	}
	query = "select max(PaymentID) as max from Payment_Options";
	ans = await get_row(query);
	let id = JSON.parse(JSON.stringify(ans));
	id = id[0].max;
	id = id + 1;
	query = "Insert into Payment_Options (PaymentID, LoginID, Payment_type) values (" + id + ",'" + req.session.user + "','UPI');";
	ans = await get_row(query);
	query = "insert into UPI (upi_id, paymentid) values ('" + upi_id + "'," + id + ");";
	ans = await get_row(query);
	res.redirect('/signin');
});


app.get('/purchase_offline/branch_login', isemployee, function(req, res, next)
{
    console.log("Branch login....");

    let html = `
    <h3>Employee Login</h3>
    <form action="/purchase_offline/branch_login_verify" method="post">
        Employee ID:
        <input type="text" name="employee_id_field">
        <br>
        Date of Birth:
        <input type="date" name="employee_dob_field">
        <br>
        <input type="submit" value="SUBMIT">
    </form>
    `
    res.setHeader("Content-Type", "text/html");
    res.send(html);
});


app.post('/purchase_offline/branch_login_verify', isemployee, function(req, res, next)
{
    console.log("Verifying Branch login....");

    var employee_id = req.body.employee_id_field;
    var employee_dob = req.body.employee_dob_field;

    // let sql = `SELECT COUNT(*) AS 'count'
    // FROM Manager M
    // WHERE M.BranchID = ${branch_id} AND M.EmployeeID = ${manager_id};`;
    let sql = `SELECT E.BranchID
    FROM Employee E
    WHERE E.EmployeeID = ${employee_id} AND E.Date_of_join = '${employee_dob}';`;

    // List of items selected and their quantities (initially empty)
    var item_list = [0];
    var quantity_list = [0];

    connection.query(sql, (err, result) => {
        if(err)
        {
            throw err;
            res.redirect('..');
            return;
        }
        if(result.length > 0)
        {
            console.log("VERIFIED");
            res.redirect(`../purchase_offline/?branch_id=${result[0].BranchID}&item_list=${item_list}&quantity_list=${quantity_list}`);
        }
        else
        {
            console.log("INVALID LOGIN");
            res.redirect('..');
        }
    });
});

app.get('/purchase_offline', isemployee, function(req, res, next)
{
    console.log(`Purchasing from Branch ${req.query.branch_id}...`);
    var quantity_list = req.query.quantity_list.split(",").map(Number);
    console.log(quantity_list);
    // console.log(test_array[1]+14);
    let html = `
    <h3>Make Offline Purchase (Branch ${req.query.branch_id})</h3>
    <form action="/purchase_offline/add_item/?branch_id=${req.query.branch_id}&item_list=${req.query.item_list}&quantity_list=${req.query.quantity_list}" method="post">
        Barcode:
        <input type="text" name="barcode_field">
        <input type="submit" value="ADD ITEM">
    </form>
    <br>
    `
    let sql = `
    SELECT *
    FROM Stock S
    WHERE S.BranchID = ${req.query.branch_id};`;

    connection.query(sql, (err, result) => {
        if(err) throw err;

        html += `<br><b>Bar Code | Product ID | Stock Quantity</b><br><br>`
        for(let i = 0; i < result.length; i++)
        {
            html += `${result[i].barcode} | ${result[i].ProductID} | ${result[i].Product_Quantity}<br>`;
        }
        html += `
        <form action="/purchase_offline/checkout/?branch_id=${req.query.branch_id}&item_list=${req.query.item_list}&quantity_list=${req.query.quantity_list}" method="post">
            <input type="submit" value="CHECKOUT">
        </form>
        `
        res.setHeader("Content-Type", "text/html");
        res.send(html);
    });
});

app.post('/purchase_offline/add_item', isemployee, function(req, res, next)
{
    var new_barcode = req.body.barcode_field;
    var item_list = req.query.item_list.split(",");
    var quantity_list = req.query.quantity_list.split(",").map(Number);
    console.log(item_list);
    console.log(quantity_list);

    var index = item_list.indexOf(new_barcode);
    if(index == -1)
    {
        item_list.push(new_barcode);
        quantity_list.push(1);
    }
    else
    {
        quantity_list[index] += 1;
    }

    res.redirect(`../?branch_id=${req.query.branch_id}&item_list=${item_list}&quantity_list=${quantity_list}`);
});

app.post('/purchase_offline/checkout', isemployee, function(req, res, next)
{
	var item_list = req.query.item_list.split(",");
	var quantity_list = req.query.quantity_list.split(",").map(Number);
	console.log(new Array(item_list.length).fill('0'));
	var productID_list = new Array(item_list.length).fill(0);
	var productName_list = new Array(item_list.length).fill(0);
	var cost_list = new Array(item_list.length).fill(0);
	for(let i = 0; i < item_list.length; i++)
	{
		if(quantity_list[i] > 0)
		{
			let sql = `
			SELECT S.ProductID
			FROM Stock S
			WHERE S.BranchID = ${req.query.branch_id} AND S.barcode = '${item_list[i]}';`;
			connection.query(sql, (err, result) => {
				if(err) throw err;
				productID_list[i] = result[0].ProductID;
				let sql2 = `
				SELECT P.Product_Name AS ProductName, (P.Product_MRP + P.Applicable_CGST + P.Applicable_SGST) * ${quantity_list[i]} AS Cost
				FROM Product P
				WHERE P.ProductID = ${result[0].ProductID};`;
				connection.query(sql2, (err2, result2) => {
					if(err2) throw err2;
					productName_list[i] = result2[0].ProductName;
					cost_list[i] = result2[0].Cost;
				});
			});
		}
	}
	setTimeout(function() {
		let html = `
		<h3>Purchased Items:</h3>
		<b>Barcode || ProductID || Product Name || Qty || Total Cost (Incl. taxes)</b><br><br>
		`
		var total_cost = 0;
		for(let i = 0; i < item_list.length; i++)
		{
			if(quantity_list[i] > 0)
			{
				html += `${item_list[i]} || ${productID_list[i]} || ${productName_list[i]} || ${quantity_list[i]} 
				|| ${cost_list[i]}<br>`;
				total_cost += cost_list[i];
			}
		}
		html += `<br>Total Cost: <b>${total_cost}</b><br><br>`;
		html += `
		<form action="/purchase_offline/register_purchase/?branch_id=${req.query.branch_id}&item_list=${req.query.item_list}&quantity_list=${req.query.quantity_list}&total_charge=${total_cost}
		&productID_list=${productID_list}" method="post">
			Customer ID:
			<input type="text" name="customer_id_field">
			<br>
			Payment Mode:
			<input type="text" name="payment_mode_field">
			<br>
			<input type="submit" value="CONFIRM PURCHASE">
		</form>`
		res.setHeader("Content-Type", "text/html");
		res.send(html);
	}, 1000);
});
app.post("/purchase_offline/register_purchase", isemployee, function(req, res, next)
{
	let sql = `INSERT INTO Offline_Purchase (date_of_purchase, payment_mode, total_charge, branchid, customerid) 
	VALUES (CURDATE(), '${req.body.payment_mode_field}', ${req.query.total_charge}, ${req.query.branch_id}, '${req.body.customer_id_field}');`;


	connection.query(sql, (err, result) => {
		if(err) throw err;

		let sql2 = `
		SELECT MAX(OP.PurchaseID) AS PurchaseID
		FROM Offline_Purchase OP;`;
		connection.query(sql2, (err2, result2) => {
			if(err2) throw err2;
			var purchaseID = result2[0].PurchaseID;

			if(req.body.payment_mode_field != "Cash")
			{
				let sql_trans = `INSERT INTO Offline_Transaction (PurchaseID) VALUES (${purchaseID});`;
				connection.query(sql_trans, (err3, result3) => {
					if(err3) throw err3;
				});
			}

			var item_list = req.query.item_list.split(",");
			var quantity_list = req.query.quantity_list.split(",").map(Number);
			var productID_list = req.query.productID_list.split(",");
			for(let i = 0; i < item_list.length; i++)
			{
				if(quantity_list[i] > 0)
				{
					let sql3 = `INSERT INTO Purchase_List (purchaseid, quantity, productid)
                    VALUES (${purchaseID}, ${quantity_list[i]}, ${productID_list[i]});`;
					connection.query(sql3, (err3, result3) => {
						if(err3) throw err3;
					});
				}
			}
		});
	});
	
	let html = `
	<h1>Purchase Successful.</h1>
	Thank you for shopping with us :)<br><br>
	<form action="/" method=get>
		<input type="submit" value="Back To HOME">
	</form>`
	res.setHeader("Content-Type", "text/html");
	res.send(html);
});

/*
 ************************************************************************
 DELIVERY PAGES
 ************************************************************************
 */

// Login Page for Delivery Service
app.get("/delivery_login", isdiv, function(req, res, next)
{
    console.log("Delivery Person Login...");
    // res.sendFile(__dirname + '/delivery_login_screen.html');

    let html = 
    `<h3>Delivery Service Login</h3><form action="/delivery_login_verify/" method="post">
        Enter Service ID:
        <input type="text" name="service_id_field">
        <br>
        Enter Email ID:
        <input type="text" name="email_id_field">
        <br>
        <input type="submit" value="Check Deliveries">
    </form>`
    res.setHeader("Content-Type", "text/html");
    res.send(html);
});

// Verifying Delivery Service Login
app.post("/delivery_login_verify", isdiv, function(req, res, next)
{
    var service_id = req.body.service_id_field;
    var email_id = req.body.email_id_field;

    let sql = `SELECT COUNT(*) AS 'count'
    FROM DeliveryService D
    WHERE D.ServiceID = '${service_id}' AND D.Email_ID = '${email_id}'`;
    let verified = true;
    connection.query(sql, (err, result) => {
        if(err) throw err;
        if(result[0].count == 1)
        {
            console.log("VERIFIED");
            res.redirect(`../delivery_status/?service_id=${service_id}`);
        }
        else
        {
            console.log("INVALID LOGIN");
            res.redirect('..');
        }
    });
});

// Printing order status of all items
app.get("/delivery_status", isdiv, function(req, res, next)
{
    console.log(`Logged in with service id ${req.query.service_id}`);
    
    let sql1 = `SELECT D.City FROM DeliveryService D WHERE D.ServiceID = ${req.query.service_id}`
    var city = 'kkkkk';
    connection.query(sql1, (err, result) => {
        if(err) throw err;
        city = result[0].City;
        console.log(city);

        let sql2 = 
        `SELECT OT.OrderID, OT.Total_cost, OO.Date_of_Ordering, OT.Order_Status, OT.Street, OT.Address_Line, OT.District, OT.City, OT.PinCode
        FROM Order_Table OT, OnlineOrder OO
        WHERE OT.OrderID = OO.OrderID AND OT.City = '${city}'`
        connection.query(sql2, (err2, result2) => {
            if(err2) throw err2;

            let html = `<h3>Online Orders from City: ${city}</h3>
            D: Delivered
            <br>ND: Not Delivered
            <br>NR: Not Returned (Applied for Return)
            <br>R: Returned
            <br><br>`;
            for(let i = 0; i < result2.length; i++)
            {
                html += `${result2[i].OrderID} | ${result2[i].Order_Status} | ${result2[i].Date_of_Ordering} | ${result2[i].Street} | ${result2[i].Address_Line}
                 | ${result2[i].District} | ${result2[i].City} | ${result2[i].PinCode} | Cost: ${result2[i].Total_cost}<br>`;
            }
            html +=
            `<br>
            <form action="/delivery_status/update/?service_id=${req.query.service_id}" method="post">
                Enter Order ID:
                <input type="text" name="order_id_field">
                <br>
                Update Order Status (D/ND/R):
                <input type="text" name="order_status_field">
                <br>
                <input type="submit" value="UPDATE">
            </form>
            <br><br>
            <form action="/delivery_status/returns" method="get">
                <input type="submit" value="Show Returned Orders">
            </form>`
            res.setHeader("Content-Type", "text/html");
            res.send(html);
        });
    });
});

// Update delivery status of a product
app.post("/delivery_status/update", isdiv, function(req, res, next) 
{
    console.log(`Updating deliver status for order ID ${req.body.order_id_field}`);

    // Change delivery status to new status and updatet related tables
    if(req.body.order_status_field.localeCompare('D') == 0)
    {
        // res.send("Set to Delivered");
        let sql = `
        UPDATE Order_Table
        SET Order_Status = 'D'
        WHERE OrderID = ${req.body.order_id_field};`
        connection.query(sql, (err, result) => {
            if(err) throw err;
            // res.redirect(`../?service_id=${req.query.service_id}`);
        });
        let html = `
        <form action="/delivery_status/update/delivered/?order_id=${req.body.order_id_field}&service_id=${req.query.service_id}" method="post">
            Enter Delivery Date<br>
            <input type="date" name="delivery_date_field">
            <input type="submit" value="Set Delivered Status">
        </form>`
        res.setHeader("Content-Type", "text/html");
        res.send(html);
    }
    else if(req.body.order_status_field.localeCompare('ND') == 0)
    {
        // res.send("Set to Not Delivered");
        
        // Removing previous delivery status
        let sql_del = `
        DELETE FROM Deliver
        WHERE OrderID = ${req.body.order_id_field};`;
        connection.query(sql_del, (err, result) => {
            if(err) throw err;
        });
        let sql_del2 = `
        DELETE FROM OnlineReturn
        WHERE OrderID = ${req.body.order_id_field};`;
        connection.query(sql_del2, (err, result) => {
            if(err) throw err;
        });
        
        let sql = `
        UPDATE Order_Table
        SET Order_Status = 'ND'
        WHERE OrderID = ${req.body.order_id_field};`
        connection.query(sql, (err, result) => {
            if(err) throw err;
            res.redirect(`../?service_id=${req.query.service_id}`);
        });
    }
    else if(req.body.order_status_field.localeCompare('NR') == 0)
    {
        let sql_del = `
        DELETE FROM OnlineReturn
        WHERE OrderID = ${req.body.order_id_field};`;
        connection.query(sql_del, (err, result) => {
            if(err) throw err;
        });
        
        let sql = `
        UPDATE Order_Table
        SET Order_Status = 'NR'
        WHERE OrderID = ${req.body.order_id_field};`
        connection.query(sql, (err, result) => {
            if(err) throw err;
            res.redirect(`../?service_id=${req.query.service_id}`);
        });
    }
    else if(req.body.order_status_field.localeCompare('R') == 0)
    {
        let sql = `
        UPDATE Order_Table
        SET Order_Status = 'R'
        WHERE OrderID = ${req.body.order_id_field};`
        connection.query(sql, (err, result) => {
            if(err) throw err;
        });
        
        let html = `
        <form action="/delivery_status/update/returned/?order_id=${req.body.order_id_field}&service_id=${req.query.service_id}" method="post">
            Reason for Return<br>
            <input type="text" name="reason_field">
            <input type="submit" value="Submit">
        </form>`;
        res.setHeader("Content-Type", "text/html");
        res.send(html);
    }
});

app.post("/delivery_status/update/delivered", isdiv, function(req, res, next) 
{
    console.log(req.body.delivery_date_field);
    let sql = `INSERT INTO Deliver (orderid, serviceid, date_of_delivery) VALUES (${req.query.order_id}, ${req.query.service_id}, '${req.body.delivery_date_field}')`
    connection.query(sql, (err, result) => {
        if(err) throw err;
        res.redirect(`../../?service_id=${req.query.service_id}`);
    });
});

app.post("/delivery_status/update/returned", isdiv, function(req, res, next) 
{
    let sql_loginID = `SELECT OO.LoginID FROM OnlineOrder OO WHERE OO.OrderID = ${req.query.order_id};`;

    connection.query(sql_loginID, (err_login, result_login) => {
        if(err_login) throw err_login;
        
        let loginID = result_login[0].LoginID;
        let sql = `
        INSERT INTO OnlineReturn (orderid, loginid, serviceid, reason_for_return) 
        VALUES (${req.query.order_id}, '${loginID}', ${req.query.service_id}, '${req.body.reason_field}')`;
        connection.query(sql, (err, result) => {
            if(err) throw err;
            res.redirect(`../../?service_id=${req.query.service_id}`);
        });
    });
});