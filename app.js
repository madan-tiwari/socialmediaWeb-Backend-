const express = require('express')
const app = express()

const mongoose = require('mongoose')

//for keeping logs requests
const morgan = require('morgan')

//body parser => helps to parse request body
const bodyParser = require('body-parser');

//cookie parser => helps to parse request cookie
//client sends req to server -> authorized user onluy 
//sends tokens in header to identify
//npm i cookie-parser
const cookieParser = require('cookie-parser')

const expressValidator = require('express-validator')

const fs = require('fs')

//CORS - Cross Origin Resource Sharing
// frontend and backend can be in seperate domain -> 
// when we make request web browsers in default doesnt allow cross-origin resource sharing (security measures)
const cors = require('cors')


//package to use .env variables
const dotenv = require('dotenv');
dotenv.config() //invoke so that we can access the variables

//database
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true      //as suggested (deprecation warning)
})
.then(() => {
    console.log('DB CONNECTION SUCCESSFUL')
})

//if there is some error
mongoose.connection.on('error', err => {
console.log(`DB CONNECTION ERROR: ${err.message}`)
})


//bringing in the routes => required for calling function
const postRoutes = require("./routes/post");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");

// since nodejs is event loop we need to pass the responsibility to next middleware


//middleware 
app.use(morgan('dev')); //using in development mode
app.use(bodyParser.json())
app.use(cookieParser())

//any request to '/' is handled by postRoutes(middleware)
//that furthers the request to controller
app.use(expressValidator())

//Applying CORS to API
app.use(cors())

app.use("/", postRoutes);
app.use('/', authRoutes);
app.use("/", userRoutes);

//API Documentation
app.get('/', (req, res)=>{
    fs.readFile('APIDocumentation/apiDocs.json', (err, data)=>{
        if(err){
            res.status(400).json({
                error: err
            })
        }
        const docs = JSON.parse(data);
        res.json(docs)
    })
})

//express-jwt error handling (authorization error)
app.use(function (err, req, res, next) {
    if (err.name === 'UnauthorizedError') {
        res.status(401).json({
            error: "UNAUTHORIZED!!!"
        });
    }
    next()
});




const port = process.env.PORT || 8080
app.listen(port, ()=>{
    console.log(`Server Running on Port: ${port}`);
})