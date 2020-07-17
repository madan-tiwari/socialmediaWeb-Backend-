const mongoose = require('mongoose')
const uuid = require('uuid/v5')

//default nodejs package
const crypto = require('crypto')

//objectId is th part of mongoose.Schema
const {ObjectId} = mongoose.Schema



const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true
    },
    //we save hashed password in database not the user input password
    //though we take password from user
    //so we create a virtual field and encrypt password
    hashed_password: {
        type: String,
        required: true,
    },
    //randomly generated String
    salt: String,
    created: {
        type: Date,
        default: Date.now
    },
    updated: Date,
    photo: {
        //images are bigger in size goes in req body. 
        //takes time to receive the entire image
        //during the time it is available in buffer => binary data format in database
        data: Buffer, //some sort of space by nodejs package
        contentType: String  //what type of file format
    },
    about:{
        type: String,
        trim: true
    },
    //array of users 
    following: [{type: ObjectId, ref :"User"}],
    followers: [{type: ObjectId, ref :"User"}],
    resetPasswordLink: {
        data: String,
        default: ""
    },
    //SUPERADMIN
    role: {
        type: String,
        default: "user"
    }

})


//virtual fields are additional fields for a given model
//values can be set manually with defined functionality
//virtual properties exist logically and don't get persisted in database
//virtual method takes password as virtual field
userSchema.virtual('password')
//two methods .get and .set
    .set(function (password) {
        //temporary variable called _password
        //its part of the userSchema
        this._password = password;
        //using salt generating time stamp
        //using uuid package to fast generate UUIDs => npm install uuid
        this.salt = uuid
        //encryption password
        this.hashed_password = this.encryptPassword(password)
    })
    .get(() => {
        return this._password;
    })

//we can add methods to the schema as many as we like
//creating encryptPassword method => node js package crypto
userSchema.methods = {

    //function that takes plain text(from user input) to encrypt to authenticate
    authenticate: function (plainText) {
        //take plaintext encrypt and match with the hashedpassword in database
        //that means the user is valid and returns true
        return this.encryptPassword(plainText) == this.hashed_password
    },
    
    //function for hashing
    encryptPassword: function (password) {
        if (!password) return "";
        try {
            //we can use sha1, sha 256
            return crypto
                .createHmac('sha1', this.salt) //sha1 encryption with key (salt)
                .update(password) //password from the arguement
                .digest('hex');
        } catch (err) {
            return "";
        }
    }
}

//based on given schema user model works
module.exports = mongoose.model("User", userSchema)
