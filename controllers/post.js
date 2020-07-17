// js utility library, provides lots of methods. here we use extend method
const _ = require('lodash')  //common practice "_"

//importing post model
const Post = require('../models/post')

//for file handling
const formidable = require('formidable')

//importing filesystem to access the FS (core nodejs module)
const fs = require('fs')

// query the database and returns the post
//also populates the user who created it 
// make posts available by adding it to request object like (req.post)
exports.postById = (req, res, next, id) => {  //id comes fro the URL
    Post.findById(id)
        .populate("postedBy", "_id name role")  //add role (admin)
        .populate("postedBy", "_id name")
        .populate("comments.postedBy", "_id name")
        //method to handle the error or post
        .exec((err, post) => {
            if (err || !post) {
                return res.status(400).json({
                    error: err
                })
            }
            req.post = post;
            next();
        })
}

exports.getPosts = async (req, res) => {
    // res.send("Hello world from NodeJS");
     // get current page from req.query or use default value of 1
     const currentPage = req.query.page || 1;
     // return 6 posts per page
     const perPage = 6;
     let totalItems;

    const posts = await Post.find()
        .countDocuments()  // countDocuments() gives you total count of posts
        .then(count =>{
            totalItems = count;
            return Post.find()
                .skip((currentPage - 1) * perPage)
                //property names we want to populate with: posted by's id name
                .populate("postedBy", "_id name") //cool
                .populate('comments', 'text created')  //gives the comment
                .populate('comments.postedBy', '_id name')  //gives the user who posted the comment
                .select("_id title body created postedBy likes")
                .limit(perPage)
                .sort({created: -1})   //sorts based on created date
        })
        .then(posts => {
            res.json(posts)
        })
        .catch(err => console.log(err))
}

exports.createPost = (req, res, next) => {

    //filehandling => formidable
    //we have to use x-www-form-urlencoded while sending data (POSTMAN)
    let form = new formidable.IncomingForm(); //expects to get form-data
    form.keepExtensions = true; //keeping the file extensions
    form.parse(req, (err, fields, files) => {  //we parse request and we get err/fields/files
        if (err) {
            return res.status(400).json({
                error: "IMAGE COULDN'T BE UPLOADED"
            })
        }

        //fields from request like reqbody
        let post = new Post(fields)

        req.profile.hashed_password = undefined
        req.profile.salt = undefined

        //assigning post to user
        post.postedBy = req.profile

        //handle files - sending photo from client
        if (files.photo) {
            //in photo field we have two fields (data and contentType)
            post.photo.data = fs.readFileSync(files.photo.path) //read file and give file path
            post.photo.contentType = files.photo.type 
        }

        //saving the post
        post.save((err, result) => {
            if (err) {
                return res.status(400).json({
                    error: err
                })
            }

            res.json(result)
        })
    })

    //before using the file handling and formidable
    // const post = new Post(req.body)
    // // console.log("Creating POST: ", req.body);
    //     //before using express-validator
    //     // post.save((err, result) => {
    //     //     if (err) {
    //     //         return res.status(400).json({
    //     //             error: err
    //     //         })
    //     //     }
    //     //     res.status(200).json({
    //     //         post: result
    //     //     })
    //     // })

    // //using express-validator
    // post.save().then(result => {
    //     res.json({
    //         post: result
    //     })
    // }).catch(err => console.log(err))


}


exports.postsByUser = (req, res) => {
    Post.find({
            // profile is available when there is user id in the route
            postedBy: req.profile._id  //find post based on posted by property in req.profile
        })
        //populate based on postedBy
        .populate("postedBy", "_id name") //looking for post with User (different model)
        .select("_id title body created likes")
        .sort("_created") //sorts based on created date
        .exec((err, posts) => {
            if (err) {
                return res.status(400).json({
                    error: err
                })
            }
            res.json(posts)
        })
}

//similar to hasAuthorization in UserCOntroller
//to make sure that request post id matches req auth id
//to check the posts to the specific user who posted it
exports.isPoster = (req, res, next) => {
    let generalUser = req.post && req.auth && req.post.postedBy._id == req.auth._id
    let adminUser = req.post && req.auth && req.auth.role == "admin"
   
    // let isPoster = req.post && req.auth && req.post.postedBy._id == req.auth._id
    console.log("REQUSET POST: " , req.post, "REQUEST AUTH: ", req.auth);
    console.log("GENERAL USER " , generalUser, "ADMIN: ", adminUser);

    let isPoster = generalUser || adminUser  //giving update, delete to admin

    if (!isPoster) {
        return res.status(403).json({
            error: "UNAUTHORIZED USER"
        })
    }
    next()
}

// exports.updatePost = (req, res, next) => {
//     let post = req.post
//     post = _.extend(post, req.body)
//     post.updated = Date.now()

//     post.save((err) => {
//         if (err) {
//             return res.status(400).json({
//                 error: err
//             })
//         }
//         res.json(post)
//     })
// }

exports.updatePost = (req, res, next)=>{
    let form = new formidable.IncomingForm()  //handles incoming form request
    form.keepExtensions = true
    form.parse(req, (err, fields, files)=>{
        if(err){
            return res.status(400).json({
                error: "COULDNOT UPLOAD PHOTO"
            })
        }
         //save Post
        let post = req.post //whenever we get the userId the first function is called and the date is saved in the req.profile
        //mutate user -> lodash's extend function
        post = _.extend(post, fields) //updated data is available in the fields -> thats how it mutates
        post.updated = Date.now()

            // file handling
        if(files.photo){  //if the files have photo
            post.photo.data = fs.readFileSync(files.photo.path)
            post.photo.contentType = files.photo.type
        }

        post.save((err, result) => {
            if(err){return res.status(400).json({
                error: err
            })}
            res.json(post)
        })
    }) //form data is in req, 2nd arguement - how we handle the data (callback) -> err, fields(name email), files(how many)
}

exports.deletePost = (req, res) => {
    let post = req.post

    post.remove((err, post) => {
        if (err) {
            return res.status(400).json({
                error: err
            })
        }
        res.json({
            message: 'POST SUCCESSFULLY DELETED'
        })
    })
}


//route to retrieve photo for efficiency
exports.postPhoto = (req, res, next) =>{
        res.set("Content-Type", req.post.photo.contentType)
        return res.send(req.post.photo.data)
}

exports.singlePost = (req, res)=>{
    return res.json(req.post)
}

// like-unlike
exports.like = (req, res)=>{
    //when we make like request we send postId and userId from the frontend
    Post.findByIdAndUpdate(
        req.body.postId,
        { $push: { likes: req.body.userId } },
        { new: true }
    ).exec((err, result) => {
        if (err) {
            return res.status(400).json({
                error: err
            });
        } else {
            res.json(result);
        }
    });
}

exports.unlike = (req, res)=>{
    //when we make like request we send postId and userId from the frontend
    Post.findByIdAndUpdate(
        req.body.postId,
        { $pull: { likes: req.body.userId } },
        { new: true }
    ).exec((err, result) => {
        if (err) {
            return res.status(400).json({
                error: err
            });
        } else {
            res.json(result);
        }
    });
}


exports.comment = (req, res)=>{
    let comment = req.body.comment
    comment.postedBy = req.body.userId
    //when we make like request we send postId and userId from the frontend
    Post.findByIdAndUpdate(
        req.body.postId,
        { $push: { comments: comment } },
        { new: true }
    )
    .populate('comments.postedBy', '_id name')
    .populate('postedBy', '_id name')
    .exec((err, result) => {
        if (err) {
            return res.status(400).json({
                error: err
            });
        } else {
            res.json(result);
        }
    });
}

// exports.comment = async (req, res)=>{
//     // get current page from req.query or use default value of 1
//     const currentPage = req.query.page || 1;
//     // return 3 posts per page
//     const perPage = 3;
//     let totalItems;

//     let comment = req.body.comment
//     comment.postedBy = req.body.userId
    
//     const comments = await comments.find()
//         .countDocuments()
//         .then(count =>{
//             totalItems =count
//             return Post.findByIdAndUpdate(
//                 req.body.postId,
//                 { $push: { comments: comment } },
//                 { new: true }
//             )
//             .skip((currentPage - 1) * perPage)
//             .populate('comments.postedBy', '_id name')
//             .populate('postedBy', '_id name')
//             .limit(perPage)
//             .exec((err, result) => {
//                 if (err) {
//                     return res.status(400).json({
//                         error: err
//                     });
//                 } else {
//                     res.json(result);
//                 }
//             });
//         })
    
//     //when we make like request we send postId and userId from the frontend
//         // Post.findByIdAndUpdate(
//         //     req.body.postId,
//         //     { $push: { comments: comment } },
//         //     { new: true }
//         // )
//         // .populate('comments.postedBy', '_id name')
//         // .populate('postedBy', '_id name')
//         // .exec((err, result) => {
//         //     if (err) {
//         //         return res.status(400).json({
//         //             error: err
//         //         });
//         //     } else {
//         //         res.json(result);
//         //     }
//         // });
// }

exports.uncomment = (req, res)=>{
    let comment = req.body.comment
    //when we make like request we send postId and userId from the frontend
    Post.findByIdAndUpdate(
        req.body.postId,
        { $pull: { comments: {_id: comment._id} } },
        { new: true }
    )
    .populate('comments.postedBy', '_id name')
    .populate('postedBy', '_id name')
    .exec((err, result) => {
        if (err) {
            return res.status(400).json({
                error: err
            });
        } else {
            res.json(result);
        }
    });
}