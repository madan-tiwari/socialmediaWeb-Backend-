// js utility library, provides lots of methods. here we use extend method
const _ = require('lodash')  //common practice "_"

//for file handling
const formidable = require('formidable')

//importing filesystem to access the FS (core nodejs module)
const fs = require('fs')

const User = require('../models/user')

//step-1 authorization
//id comes from req parameter
exports.userById = (req, res, next, id) => {
    User.findById(id)
    //populate following and followers array
    .populate('following', '_id name') //1st arguement - what to populate and 2nd arguement what fields to populate
    .populate('followers', '_id name')
        .exec((err, user) => {
            if (err || !user) {
                return res.status(400).json({
                    error: "USER NOT FOUND"
                })
            }
            req.profile = user //add profile object in req with user information
            next();
        })
}

//step-3 Authorization
//check if the user is authorized
exports.hasAuthorization = (req, res, next) => {
    let sameUser = req.profile && req.auth && req.profile._id == req.auth._id
    let adminUser = req.profile && req.auth && req.auth.role == "admin"
    
    console.log("req.profile: " , req.profile, "REQUEST AUTH: ", req.auth);
    console.log("Same User " , sameUser, "ADMIN: ", adminUser);

    const authorized = sameUser || adminUser
    if (!authorized) {
        return res.status(403).json({
            error: "User is not authorized"
        })
    }
    next();
}


// getting all users
exports.allUsers = async (req, res) =>{
    // get current page from req.query or use default value of 1
    const currentPage = req.query.page || 1;
    // return 6 posts per page
    const perPage = 6;
    let totalItems;

    const users = await User.find()
        .countDocuments()
        .then(count =>{
            totalItems =count
            return User.find()
                .skip((currentPage - 1) * perPage)
                .select("name email updated created role") //filtering received json
                .limit(perPage)
                // if(err){
                //     return res.status(400).json({
                //         error: err
                //     })     
        })
        .then(users =>{
            res.json(users);
        })
        .catch(err => console.log(err))
}


//get single user
exports.getUser = (req, res) => {
    //removes pass and salt from the response
    req.profile.hashed_password = undefined
    req.profile.salt = undefined

    //returning profile from req 
    return res.json(req.profile);
}


//user profile update
// exports.updateUser = (req, res, next) => {

//     //we take user info from req.profile
//     let user = req.profile

//     //using lodash -> extend function takes 
//     //1st param - (object, apply reqbody.. new info)
//     user = _.extend(user, req.body) //extend - mutates the source object

//     user.updated = Date.now();

//     user.save((err) => {
//         if (err) {
//             return res.status(400).json({
//                 error: "NOT AUTHORIZED TO PERFORM THIS ACTION"
//             })
//         }
//         //to stop sharing to frontend
//         user.hashed_password = undefined
//         user.salt = undefined
//         res.json({
//             user
//         })
//     });

// }

//Update user with profile photo
exports.updateUser = (req, res, next)=>{
    let form = new formidable.IncomingForm()  //handles incoming form request
    form.keepExtensions = true
    form.parse(req, (err, fields, files)=>{
        if(err){
            return res.status(400).json({
                error: "COULDNOT UPLOAD PHOTO"
            })
        }
         //save User
        let user = req.profile //whenever we get the userId the first function is called and the date is saved in the req.profile
        //mutate user -> lodash's extend function
        user = _.extend(user, fields) //updated data is available in the fields -> thats how it mutates
        user.updated = Date.now()

            // file handling
        if(files.photo){  //if the files have photo
            user.photo.data = fs.readFileSync(files.photo.path)
            user.photo.contentType = files.photo.type
        }

        user.save((err, result) => {
            if(err){return res.status(400).json({
                error: err
            })}
            user.hashed_password = undefined
            user.salt = undefined
            res.json(user)
        })
    }) //form data is in req, 2nd arguement - how we handle the data (callback) -> err, fields(name email), files(how many)
}


//route to retrieve photo for efficiency
exports.userPhoto = (req, res, next) =>{
    if(req.profile.photo.data){  //means user has uploaded the image
        res.set("Content-Type", req.profile.photo.contentType)
        return res.send(req.profile.photo.data)
    }
    next();
}


//delete user
exports.deleteUser = (req, res, next) => {
    let user = req.profile;
    user.remove((err, success) => {
        if (err) {
            return res.status(400).json({
                error: err
            })
        }

        user.hashed_password = undefined;
        user.salt = undefined;
        res.json({
            user, //deleted user
            message: "YOUR ACCOUNT HAS BEEN REMOVED"
        })

    })
}

//Follow-UnFollow Users -> middleware to our routes
exports.addFollowing = (req, res, next) => {
    // find user by id and update -> coz we need to update the list
    //1st arguement -> which user is following which user(2nd arguement)> from UI
    User.findByIdAndUpdate(req.body.userId, {$push: {following: req.body.followId}}, (err, result)=>{
        if(err){
            return res.status(400).json({error: err})
        }
        next();
    })
}

exports.addFollower = (req, res) => {
    // find user by id and update -> coz we need to update the list
    //1st arguement -> which user is following which user(2nd arguement)> from UI
    // {new:true} => returns the updated data
    User.findByIdAndUpdate(
        req.body.followId, 
        {$push: {followers: req.body.userId}}, 
        {new: true} 
    )
    //populate following and followers list and response with json
    .populate('following', '_id name')
    .populate('followers', '_id name')
    .exec((err, result) =>{
        if(err){
            return res.status(400).json({error: err})
        }
        result.hashed_password = undefined
        result.salt = undefined
        res.json(result)
    })
}


//UNFOLLOW
exports.removeFollowing = (req, res, next) => {
    // find user by id and update -> coz we need to update the list
    //1st arguement -> which user is following which user(2nd arguement)> from UI
    User.findByIdAndUpdate(req.body.userId, 
        {$pull: {following: req.body.unfollowId}}, (err, result)=>{
        if(err){
            return res.status(400).json({error: err})
        }
        next();
    })
}

exports.removeFollower = (req, res) => {
    // find user by id and update -> coz we need to update the list
    //1st arguement -> which user is following which user(2nd arguement)> from UI
    // {new:true} => returns the updated data
    User.findByIdAndUpdate(
        req.body.unfollowId, //we send this from the frontend
        {$pull: {followers: req.body.userId}}, 
        {new: true} 
    )
    //populate following and followers list and response with json
    .populate('following', '_id name')
    .populate('followers', '_id name')
    .exec((err, result) =>{
        if(err){
            return res.status(400).json({error: err})
        }
        result.hashed_password = undefined
        result.salt = undefined
        res.json(result)
    })
}


//user suggestions except the user and the users already being followed
exports.findPeople = (req, res) => {
    let following = req.profile.following; //people already following
    following.push(req.profile._id);   //get the user and push in the above variable
    User.find({ _id: { $nin: following } }, (err, users) => {   //donot include the people in the varaible
        if (err) {
            return res.status(400).json({
                error: err
            });
        }
        res.json(users);
    }).select("name");  //selecting only name field from the user
};