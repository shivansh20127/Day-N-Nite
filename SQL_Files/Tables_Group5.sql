create database mid_evaluation_grp5;
use mid_evaluation_grp5;

-- Branch(BranchID, Branch Type, Street, Address Line, District, City, PinCode, Country)
-- done
Create table Branch(
	BranchID integer not null primary key auto_increment,
    Branch_Type varchar(25),
    Street varchar(20),
    Address_Line varchar(60),
    District varchar(30),
    City varchar(30),
    Pincode varchar(10) not null,
    Country varchar(30)
) AUTO_INCREMENT=1;

-- Customer(CustomerID, Name, {Phone No.#}, Email ID)
-- done
Create table Customer(
    Cutomer_Name varchar(50) not null,
    Email_ID varchar(240) not null primary key
) AUTO_INCREMENT=1;


-- Phone table
-- done
Create table Customer_Phone(
	phone_number varchar(10) not null,
    CustomerID varchar(240),
    foreign key(CustomerID) references Customer(Email_ID),
    primary key(CustomerID, phone_number)
);

-- Employee(EmpID, Name, {Phone No.#}, Email ID, Street, Address Line, District, City, PinCode, Country, Date of Joining, Salary, BranchID)
Create table Employee(
	EmployeeID integer not null primary key auto_increment,
    Employee_Name varchar(50) not null,
    Email_ID varchar(240),
    BranchID integer,
    Date_of_join date,
    salary decimal,
    Street varchar(20),
    Address_Line varchar(60),
    District varchar(30),
    City varchar(30),
    Pincode varchar(10) not null,
    Country varchar(30),
    foreign key(BranchID) references Branch(BranchID)
)  AUTO_INCREMENT=1;

-- Phone table
Create table Employee_Phone(
	phone_number varchar(10) not null,
    EmployeeID integer,
    foreign key(EmployeeID) references Employee(EmployeeID),
    primary key(EmployeeID, phone_number)
);

-- Manager(EmpID, BranchID, Date of Appointment)
Create table Manager(
	EmployeeID integer,
    BranchID integer,
    Date_of_Appointment date not null,
    foreign key(EmployeeID) references Employee(EmployeeID),
    foreign key(BranchID) references Branch(BranchID)
);


-- Supplier(SupplierID, Name, Street, Address Line, District, City, PinCode, Country, Email ID, {Phone No.#})
Create table Supplier(
	SupplierID integer not null primary key auto_increment,
    Supplier_Name varchar(50) not null,
    Email_ID varchar(240),
    Street varchar(20),
    Address_Line varchar(60),
    District varchar(30),
    City varchar(30),
    Pincode varchar(10) not null,
    Country varchar(30)
) AUTO_INCREMENT=1;

-- Phone table
Create table Supplier_Phone(
	SupplierID integer,
	phone_number varchar(10) not null,
    foreign key(SupplierID) references Supplier(SupplierID),
    primary key(SupplierID, phone_number)
);

-- Product(BarCode, ProductID, Name, Description, Applicable SGST, Applicable CGST, MRP, Manufacturer)
Create table Product(
	ProductID integer not null primary key auto_increment,
    Product_Name varchar(100) not null,
    Product_type varchar(40) not null,
    Product_Description varchar(1000),
    Applicable_SGST decimal default 0,
    Applicable_CGST decimal default 0,
    Product_MRP decimal not null,
    Product_link varchar(500) not null,
    Manufacturer varchar(100)
) auto_increment=1;

-- Supplies(SupplierID, ProductID, BranchID, SupplyID, Quantity, Date of Supply)
create table Supplies (
	SupplyID integer primary key not null auto_increment,
    SupplierID integer,
    ProductID integer,
    BranchID integer,
    Date_of_Supply date not null,
    foreign key(ProductID) references Product(ProductID),
    foreign key(BranchID) references Branch(BranchID),
    foreign key(SupplierID) references Supplier(SupplierID)
) auto_increment=1;

-- Stock(BranchID, ProductID, Quantity)
Create table Stock(
	barcode varchar(12) not null,
    SupplyID integer not null,
	BranchID integer not null,
    ProductID integer not null,
    Product_Quantity integer default 1,
    primary key(barcode,BranchID),
    foreign key(ProductID) references Product(ProductID),
    foreign key(BranchID) references Branch(BranchID),
    foreign key(SupplyID) references Supplies(SupplyID)
);

-- Expirable Barcodes
create table Expirable_Barcodes(
	barcode varchar(12),
    Expiry_date date,
    ProductID integer,
    foreign key(barcode) references Stock(barcode),
    foreign key(ProductID) references Product(ProductID)
);

-- Coupon(CouponCode, DaysValidFor, Discount Rate, Maximum Discount)
Create table Coupon(
	CouponCode varchar(25) not null primary key,
    Valid_Till date,
    Discount_Rate decimal default 0,
    Maximum_Discount decimal default 0
);




-- Books(BarCode, Author, Publisher)
-- create table Books(
-- 	BarCode integer not null,
--     Author varchar(35) not null,
--     Publisher varchar(35) not null
-- );



-- Account(LoginID, CustomerID, Account Type, Bazaar Coins, {Address})
create table Account(
	LoginID varchar(40) not null primary key,
    Password varchar(20) not null,
    CustomerID varchar(240),
    Account_Type varchar(2) default 'NP',
    Bazaar_Coins integer default 0,
    foreign key(CustomerID) references Customer(Email_ID)
);


-- AvailableCoupon(LoginID, CouponCode, Date of Alotting)
create table Available_coupon(
	LoginID varchar(40),
    CouponCode varchar(25),
    Date_of_allocating date,
    foreign key(LoginID) references Account(LoginID),
    foreign key(CouponCode) references Coupon(CouponCode)
);

-- Account_Address
create table Account_address(
	LoginID varchar(40),
    Street varchar(20),
    Address_Line varchar(60),
    District varchar(30),
    City varchar(30),
    Pincode varchar(10) not null,
    Country varchar(30),
    foreign key(LoginID) references Account(LoginID)
);

-- Payment Options(PaymentID, LoginID, type)
create table Payment_Options(
	PaymentID integer not null primary key auto_increment,
    LoginID varchar(40),
    Payment_type varchar(40) not null,
    foreign key(LoginID) references Account(LoginID)
);

-- Q&A(QuestionID, ProductID, LoginID, Question Statement)
create table QnA(
	QuestionID integer not null primary key auto_increment,
    ProductID integer,
    LoginID varchar(40),
    Question_Statement varchar(2000) not null,
    foreign key(ProductID) references Product(ProductID),
    foreign key(LoginID) references Account(LoginID)
);

-- Answer(EmpID, QuestionID, Answer Statement)
create table Answer(
	QuestionID integer,
    Answer varchar(2000) not null,
    EmployeeID integer,
    foreign key(EmployeeID) references Employee(EmployeeID),
    foreign key(QuestionID) references QnA(QuestionID)
);

-- Order(OrderID, Order Status, delivery_address)
create table Order_Table(
	OrderID integer not null primary key auto_increment,
    PaymentID integer,
    Total_cost integer not null,
    Order_Status varchar(2) default 'ND',
    Street varchar(20),
    Address_Line varchar(60),
    District varchar(30),
    City varchar(30),
    Pincode varchar(10) not null,
    Country varchar(30),
    foreign key(PaymentID) references Payment_Options(PaymentID)
);

-- OnlineOrder(LoginID, OrderID, Date of Ordering)
create table OnlineOrder(
	LoginID varchar(40),
    OrderID integer,
    Date_of_Ordering date not null,
    foreign key(LoginID) references Account(LoginID),
    foreign key(OrderID) references Order_Table(OrderID)
);

-- Order List(OrderID, ProductID, Quantity)
create table Order_List(
	OrderID integer,
    ProductID integer,
    Quantity integer default 1,
    foreign key(ProductID) references Product(ProductID),
    foreign key(OrderID) references Order_Table(OrderID)
);



-- DeliveryService(ServiceID, Street, Address Line, District, City, PinCode, Country, Email ID, {Phone No.#}, EmpID)
create table DeliveryService(
	ServiceID integer not null primary key auto_increment,
    Email_ID varchar(240),
    Street varchar(20),
    Address_Line varchar(60),
    District varchar(30),
    City varchar(30),
    Pincode varchar(10) not null,
    Country varchar(30)
);
-- Phone table
Create table DeliveryService_Phone(
	phone_number varchar(10) not null,
    ServiceID integer,
    foreign key(ServiceID) references DeliveryService(ServiceID),
    primary key(ServiceID, phone_number)
);

-- Deliver(OrderID, ServiceID, Date of Delivery)
create table Deliver(
	OrderID integer,
    ServiceID integer,
    Date_of_Delivery date not null,
    foreign key(ServiceID) references DeliveryService(ServiceID),
    foreign key(OrderID) references OnlineOrder(OrderID)
);

-- Review(LoginID, ProductID, ReviewID, Stars, Description)
create table Review(
	ReviewID integer not null primary key auto_increment,
    LoginID varchar(40),
    ProductID integer,
    Stars integer default 0,
    Product_Preview varchar(2000),
    foreign key(LoginID) references Account(LoginID),
    foreign key(ProductID) references Product(ProductID)
);

-- OnlineReturn(OrderID, LoginID, ServiceID, Reason For Return)
create table OnlineReturn(
	OrderID integer,
    LoginID varchar(40),
    ServiceID integer,
    Reason_for_Return varchar(2000) not null,
    foreign key(ServiceID) references DeliveryService(ServiceID),
    foreign key(LoginID) references Account(LoginID),
    foreign key(OrderID) references OnlineOrder(OrderID)
);

-- Offline Purchase(PurchaseID, BranchID, CustomerID, Date of Purchase, Payment Mode, Total Charge)
create table Offline_Purchase(
	PurchaseID integer not null primary key auto_increment,
    Date_of_purchase date not null,
    Payment_Mode varchar(25) not null,
    Total_Charge decimal not null,
    BranchID integer,
    CustomerID varchar(240),
    foreign key(CustomerID) references Customer(Email_ID),
    foreign key(BranchID) references Branch(BranchID)
);

-- Purchase List(PurchaseID, ProductID, Quantity)
create table Purchase_List(
	PurchaseID integer,
	Quantity integer default 1,
    ProductID integer,
    foreign key(ProductID) references Product(ProductID),
    foreign key(PurchaseID) references Offline_Purchase(PurchaseID)
);

-- DeliveryEmployee(EmpID,  ServiceID, No of Deliveries, PinCode)
create table DeliveryEmployee(
    EmployeeID integer,
    Number_of_Delivery integer default 0,
    Pincode varchar(10) not null,
    ServiceID integer,
    foreign key(ServiceID) references DeliveryService(ServiceID),
    foreign key(EmployeeID) references Employee(EmployeeID)
);

-- Cart(LoginID, ProductID, Quantity)
create table Cart(
	Quantity integer default 1,
    LoginID varchar(40),
	ProductID integer,
    foreign key(ProductID) references Product(ProductID),
    foreign key(LoginID) references Account(LoginID)
);

-- Wishlist(LoginID, ProductID)
create table WishList(
	LoginID varchar(40),
	ProductID integer,
    foreign key(ProductID) references Product(ProductID),
    foreign key(LoginID) references Account(LoginID)
);

-- CreditDebitCard(CardNo., Holder Name, Expiry Date, PaymentID)
create table CreditDebitCard(
	Card_Number BIGINT not null,
    Holder_Name varchar(35) not null,
    Expiry_Date date not null,
	PaymentID integer,
    foreign key(PaymentID) references Payment_Options(PaymentID)
);

-- Net Banking(Account No., Holder Name, Bank Name, IFSC Code, PaymentID)
create table Net_Banking(
	Account_Number BIGINT not null,
	Holder_Name varchar(35) not null,
    Bank_Name varchar(35) not null,
    IFSC_Code varchar(11) not null,
    PaymentID integer,
    foreign key(PaymentID) references Payment_Options(PaymentID)
);

-- UPI(UPI ID, PaymentID)
create table UPI(
	UPI_ID varchar(45) not null,
    PaymentID integer,
    foreign key(PaymentID) references Payment_Options(PaymentID)
);

-- Offline Return(PurchaseID, BranchID, Reason of Return)
create table Offline_Return(
	PurchaseID integer,
	PaymentID integer,
	Reason_for_Return varchar(2000) not null,
    foreign key(PaymentID) references Payment_Options(PaymentID),
    foreign key(PurchaseID) references Offline_Purchase(PurchaseID)
);


-- select * from Customer;
-- select * from Account where CustomerID = "fjkah@gmail.com";

CREATE VIEW ORDER_PAGE AS 
	SELECT Order_Table.OrderID, LoginID, Date_of_Ordering, PaymentID, Total_cost, Order_Status, Street, Address_Line, District, City, Pincode, Country 
    FROM Order_Table
    LEFT JOIN OnlineOrder ON Order_Table.OrderID=OnlineOrder.OrderID;
select * from ORDER_PAGE;
    
SELECT * FROM ORDER_PAGE;

SELECT * FROM Order_Table;
SELECT * FROM OnlineOrder;

drop view ORDER_PAGE;


create view Product_order as
select OrderID, Product_Name, Quantity
from Order_List
left join Product on Order_List.ProductID = Product.ProductID;
select * from Product_order;


create view Question_and_answer as
select QnA.QuestionID, ProductID, LoginID, Question_Statement, Answer, Employee_Name
from QnA 
left join Answer on QnA.QuestionID = Answer.QuestionID 
left join Employee on Answer.EmployeeID = Employee.EmployeeID;

select * from Stock;
















