//express to use its router
const express = require('express')



const {getPosts, createPost, postsByUser, postById, isPoster, deletePost, updatePost, postPhoto, singlePost, like, unlike, comment, uncomment} = require('../controllers/post')

const {
    requireSignin
} = require('../controllers/auth')

const {userById} = require('../controllers/user')


//require validator
const {createPostValidator} = require('../validator')

const router = express.Router();

//when we get request to '/' we pass that to controller and its methods
//requireSignin is a middleware to protect routes
router.get('/posts', getPosts)
// router.post('/post', requireSignin, createPostValidator, createPost)

//like-unlike -> we are updating existing posts with likes
router.put('/post/like', requireSignin, like);
router.put('/post/unlike', requireSignin, unlike);


//comments
router.put('/post/comment', requireSignin, comment);
router.put('/post/uncomment', requireSignin, uncomment);


//sequence is important validation is changed to last so that the createPost is not interfered
router.post('/post/new/:userId', requireSignin, createPost, createPostValidator);

//Get Posts by a user
router.get("/posts/by/:userId", requireSignin, postsByUser)
router.put('/post/:postId', requireSignin, isPoster, updatePost)
router.get('/post/:postId', singlePost)
router.delete('/post/:postId', requireSignin, isPoster, deletePost)


//route for photo
router.get("/post/photo/:postId", postPhoto);



//looking for param in request url 
//first param is searching for userID parameter
//2nd param is method-> gets user information and appends to req object 
// any routes containing :userId, our app will first execute userById();
router.param("userId", userById)


// any routes containing :postId, our app will first execute postById();
router.param("postId", postById);


module.exports = router