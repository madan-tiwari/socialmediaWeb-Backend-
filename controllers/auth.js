
const _ = require("lodash");
const { sendEmail } = require("../helpers");

//jwt => json web token (npm i jsonwebtoken), help us generate token
const jwt = require('jsonwebtoken')



//we also need .env to use JWT_SECRET in this module
require('dotenv').config()

//express-jwt - help us protect routes. check if requested user is signed in and has valid jsonwebtoken 
const expressJwt = require('express-jwt')

//authentication methods login registration
const User = require('../models/user')

//keyword async (arrow function) and then we wait for the user to be created
exports.signup = async (req, res) => {
    //check if user exists -  using async await function => aysnc, await
    //wait for certain data to come to us so we wait
    const userExists = await User.findOne({
        email: req.body.email  //on the basis of email
    })

    if (userExists) return res.status(403).json({
        error: "Email already exists!!"
    })

    // it has to reach to the database so takes some time to operate
    const user = await new User(req.body)
    await user.save();
    res.status(200).json({
        user,
        message: "REGISTRATION SUCCESSFUL!!"
    });
}


exports.signin = (req, res) => {
    // find the user based on email if it exists
    const {
        email,
        password
    } = req.body;

    User.findOne({
        email
    }, (err, user) => {
        //if error or no user
        if (err || !user) {
            return res.status(401).json({
                error: "User doesn't exist."
            })
        }
        // if user is found, then authenticate
        //=> first create authenticate function in user model and use here
        if (!user.authenticate(password)) {
            return res.status(401).json({
                error: "Invalid Email or Password"
            })
        }
        //and generate a token with user id and secret (JWT_SECRET)
        const token = jwt.sign({  //combination of id and secret key
            _id: user._id, role: user.role  //we find user and its role
        }, process.env.JWT_SECRET);


        //persist the token as 't' in cookie with expiry date
        //gives cookie to the client (client grabs the cookie from response.cookie or json response )
        res.cookie("t", token, {
            expire: new Date() + 9999
        })

        //return response with user and token + role(admin or user) to frontend client to authenticate
        const {_id, name, email, role} = user;
        return res.json({
            token,
            user: {
                _id,
                email,
                name, role
            }
        })
    })
}


exports.signout = (req, res) => {
    //we clear the cookie 't'
    res.clearCookie("t");
    return res.json({
        message: "SIGNED OUT SUCCESSFULLY!"
    })
}

exports.requireSignin = expressJwt({
    
    //when users tries to access some routes we expect client app to send token key
    secret: process.env.JWT_SECRET, //secret key from .env JWT_SECRET
    //if the token is valid, express-jwt appends the 
    //verified users_id in a authkey to request object
    userProperty: "auth"  //we can access auth.id to signed in users id
    // 2nd step - Authorization

})


exports.socialLogin = (req, res) => {
    // try signup by finding user with req.email
    let user = User.findOne({ email: req.body.email }, (err, user) => {
        if (err || !user) {
            // create a new user and login
            user = new User(req.body);
            req.profile = user;
            user.save();
            // generate a token with user id and secret
            const token = jwt.sign(
                { _id: user._id, iss: "NODEAPI" },
                process.env.JWT_SECRET
            );
            res.cookie("t", token, { expire: new Date() + 9999 });
            // return response with user and token to frontend client
            const { _id, name, email } = user;
            return res.json({ token, user: { _id, name, email } });
        } else {
            // update existing user with new social info and login
            req.profile = user;
            user = _.extend(user, req.body);
            user.updated = Date.now();
            user.save();
            // generate a token with user id and secret
            const token = jwt.sign(
                { _id: user._id, iss: "NODEAPI" },
                process.env.JWT_SECRET
            );
            res.cookie("t", token, { expire: new Date() + 9999 });
            // return response with user and token to frontend client
            const { _id, name, email } = user;
            return res.json({ token, user: { _id, name, email } });
        }
    });
};


// add forgotPassword and resetPassword methods
exports.forgotPassword = (req, res) => {
    if (!req.body) return res.status(400).json({ message: "All Fields Required!!" });
    if (!req.body.email)
        return res.status(400).json({ message: "ENTER VALID EMAIL" });
 
    // console.log("forgot password finding user with that email");
    const { email } = req.body;
    console.log("signin req.body", email);
    // find the user based on email
    User.findOne({ email }, (err, user) => {
        // if err or no user
        if (err || !user)
            return res.status("401").json({
                error: "User with that email does not exist!"
            });
 
        // generate a token with user id and secret
        const token = jwt.sign(
            { _id: user._id, iss: "NODEAPI" },
            process.env.JWT_SECRET
        );
 
        // email data
        const emailData = {
            from: "noreply@node-react.com",
            to: email,
            subject: "Password Reset Instructions",
            text: `Please use the following link to reset your password: ${
                process.env.CLIENT_URL
            }/reset-password/${token}`,
            html: `<p>Please use the following link to reset your password:</p> <p>${
                process.env.CLIENT_URL
            }/reset-password/${token}</p>`
        };
 
        return user.updateOne({ resetPasswordLink: token }, (err, success) => {
            if (err) {
                return res.json({ message: err });
            } else {
                sendEmail(emailData);
                return res.status(200).json({
                    message: `Email has been sent to ${email}. Follow the instructions to reset your password.`
                });
            }
        });
    });
};
 
// to allow user to reset password
// first you will find the user in the database with user's resetPasswordLink
// user model's resetPasswordLink's value must match the token
// if the user's resetPasswordLink(token) matches the incoming req.body.resetPasswordLink(token)
// then we got the right user
 
exports.resetPassword = (req, res) => {
    const { resetPasswordLink, newPassword } = req.body;
 
    User.findOne({ resetPasswordLink }, (err, user) => {
        // if err or no user
        if (err || !user)
            return res.status("401").json({
                error: "Invalid Link!"
            });
 
        const updatedFields = {
            password: newPassword,
            resetPasswordLink: ""
        };
 
        user = _.extend(user, updatedFields);
        user.updated = Date.now();
 
        user.save((err, result) => {
            if (err) {
                return res.status(400).json({
                    error: err
                });
            }
            res.json({
                message: `Great! Now you can login with your new password.`
            });
        });
    });
};