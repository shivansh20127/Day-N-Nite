use mid_evaluation_grp5;
create view Question_and_answer as
select QnA.QuestionID, ProductID, LoginID, Question_Statement, Answer, Employee_Name
from QnA 
left join Answer on QnA.QuestionID = Answer.QuestionID 
left join Employee on Answer.EmployeeID = Employee.EmployeeID;

select * from Question_and_answer;



CREATE VIEW ORDER_PAGE AS 
	SELECT Order_Table.OrderID, LoginID, Date_of_Ordering, PaymentID, Total_cost, Order_Status, Street, Address_Line, District, City, Pincode, Country 
    FROM Order_Table
    LEFT JOIN OnlineOrder ON Order_Table.OrderID=OnlineOrder.OrderID;
select * from ORDER_PAGE;

-- drop view ORDER_PAGE;




create view Product_order as
select OrderID, Product_Name, Quantity
from Order_List
left join Product on Order_List.ProductID = Product.ProductID;
select * from Product_order;


select * from supplier;