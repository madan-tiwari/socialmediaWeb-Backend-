//helps communicate with the database and collections
const mongoose = require('mongoose')

const {
    ObjectId
} = mongoose.Schema //destructing ObjectId from mongooseSchema


const postSchema = new mongoose.Schema({
    title: {
        type: String,
        //before express-validator
        // required: "Title is required field",
        // minlength: 4,
        // maxlength: 150
        required: true
    },
    body: {
        type: String,
        //before express-validator
        // required: "Body is required field",
        // minlength: 4,
        // maxlength: 2000
        required: true
    },
    photo: {
        //images are bigger in size goes in req body. 
        //takes time to receive the entire image
        //during the time it is available in buffer => binary data format in database
        data: Buffer, //some sort of space by nodejs package
        contentType: String  //what type of file format
    },
    //building relationship
    postedBy: {
        //with mongoose we can use ObjectId
        type: ObjectId,
        ref: "User"  //referencing to User model
    },
    created: {
        type: Date,
        default: Date.now
    },
    updated: Date,
    likes: [{type: ObjectId, ref :"User"}], //likes refers to the likes and counted
    comments: [
        {
            text: String,
            created: { type: Date, default: Date.now },
            postedBy: { type: ObjectId, ref: "User" }
        }
    ]
})

module.exports = mongoose.model("Post", postSchema)
