require('dotenv').config()
const express = require('express'),
      q = require("q"),
      mysql = require('mysql');



// app connection 
const app = express();


// db connection 
var pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: process.env.DB_CONLIMIT
    //debug: true
})


// SQL Queries 

const sqlSeachForBooks = "SELECT title, author_firstname, author_lastname,cover_thumbnail from books WHERE (title LIKE ?) || (author_firstname LIKE ?) order by ? ? limit ? offset ?";

const sqlgetABook = "SELECT * from books WHERE id = ?";


var makeQuery = (sql, pool)=>{
    console.log(sql);
    
    return  (args)=>{
        var defer = q.defer();
        pool.getConnection((err, connection)=>{
            if(err){
                defer.reject(err);
                return;
            }
            console.log(args);
            connection.query(sql, args || [], (err, results)=>{
                connection.release();
                if(err){
                    defer.reject(err);
                    return;
                }
                // console.log(">>> "+ results);
                defer.resolve(results); 
            })
        });
        return defer.promise;
    }
}


var SearchForBook = makeQuery(sqlSeachForBooks, pool);
var GetOneBook = makeQuery(sqlgetABook, pool);


app.get("/filter", (req, res)=>{ 

    var book_id = req.query.book_id;
    GetOneBook([parseInt(book_id)]).then((results)=>{
        res.json(results);
    }).catch((error)=>{
        console.log('error is  :',error);
        res.status(500).json(error);
    });
});


app.get("/books", (req, res)=>{ 

    // I believe the default limit (10) & default sorting can be easly set on the client side. 
    var title = req.query.title;
    var auther = req.query.auther;
    var sort_keyword = req.query.keyword;
    var sort_option = req.query.sort_option;
    var limit =  parseInt(req.query.limit);
    var offset = parseInt(req.query.offset);
    
    finalOffset = (offset -1) * limit; 

    SearchForBook([title,auther,sort_keyword,sort_option,limit,finalOffset]).then((results)=>{
        res.json(results);
    }).catch((error)=>{
        console.log('error is  :',error);
        res.status(500).json(error);
    });
});




const PORT = process.env.PORT || process.env.arg[2] || 3000 ; 

app.listen(PORT, ()=>{
    console.log(`Listening to server at ${PORT}`);
});