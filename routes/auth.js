//express to use its router
const express = require('express')
const {signup, signin, signout, socialLogin, forgotPassword, resetPassword} = require('../controllers/auth')
const {userById} = require('../controllers/user')
const {userSignupValidator, passwordResetValidator} = require('../validator')

//require validator
// const validator = require('../validator')

const router = express.Router();

//route for social-login
router.post("/social-login", socialLogin); 

// import password reset validator
// const { userSignupValidator, passwordResetValidator } = require("../validator");
 
// password forgot and reset routes
router.put("/forgot-password", forgotPassword);
router.put("/reset-password", passwordResetValidator, resetPassword);

//when we get request to '/' we pass that to controller and its methods
router.post('/signup', userSignupValidator, signup)
router.post('/signin', signin);
router.get('/signout', signout);

//looking for param in request url 
//first param is searching for userID parameter
//2nd param is method-> gets user information and appends to req object 
// any routes containing :userId, our app will first execute userById();
router.param("userId", userById)


module.exports = router