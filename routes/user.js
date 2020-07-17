//express to use its router
const express = require('express')
const {userById, allUsers, getUser, hasAuthorization, updateUser,deleteUser, userPhoto, addFollowing, addFollower, removeFollowing,removeFollower, findPeople } = require('../controllers/user')

const {
    requireSignin
} = require('../controllers/auth')

//require validator
// const validator = require('../validator')

const router = express.Router();

//everytime we follow and unfollow we handle 2 methods
//when one user follows another -> one is follower and another is following
router.put('/user/follow', requireSignin, addFollowing, addFollower )
router.put('/user/unfollow', requireSignin, removeFollowing, removeFollower )

//when we get request to '/' we pass that to controller and its methods
router.get('/users', allUsers);
router.get('/user/:userId', requireSignin, getUser);
router.put('/user/:userId', requireSignin, hasAuthorization, updateUser);
router.delete('/user/:userId', requireSignin, hasAuthorization, deleteUser);

//route for photo
router.get("/user/photo/:userId", userPhoto);

//follower suggestions except the user and already following users
router.get("/user/findpeople/:userId", requireSignin, findPeople);
//looking for param in request url 
//first param is searching for userID parameter
//2nd param is method-> gets user information and appends to req object 
// any routes containing :userId, our app will first execute userById();
router.param("userId", userById)


module.exports = router