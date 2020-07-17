
//validation for creating new post
exports.createPostValidator = (req, res, next) => {
    req.check('title', 'TITLE IS REQUIRED').notEmpty()
    req.check('title', 'TITLE must be between 4 - 150 characters').isLength({
        min: 4,
        max: 150
    })

    req.check('body', 'BODY IS REQUIRED').notEmpty()
    req.check('body', 'BODY must be between 4 - 2000characters').isLength({
        min: 4,
        max: 2000
    })

    //checking errors
    //if error show the first error occurance 

    const errors = req.validationErrors()
    //if error show the first error that occurs
    if (errors) {
        const firstError = errors.map((err) => //map through all errors
            err.msg
        )[0] //getting the first error 
        return res.status(400).json({
            error: firstError
        })
    }

    //proceed to next middle ware
    next();
}


//validation for creating new user
exports.userSignupValidator = (req, res, next) => {
    //name is not null and between 4-10 characters
    req.check("name", "Name is required").notEmpty();

    //email is not null, valid and normalized
    req.check("email", "Please check your email")
        .matches(/.+\@.+\..+/)   //regular expression
        .withMessage("Email must contain @")
        .isLength({
            min: 4,
            max: 200
        })

    //check for password
    req.check("password", "Password is required").notEmpty();
    req.check('password')
        .isLength({
            min: 6
        })
        .withMessage("Password must be minimum 6 characters")
        .matches(/\d/) //min one digit
        .withMessage("Password must contain a number")


    //check for errors
    const errors = req.validationErrors()
    //if error show the first error occured
    if (errors) {
        const firstError = errors.map((err) =>
            err.msg
        )[0]
        return res.status(400).json({
            error: firstError
        })
    }

    //proceed to next middle ware
    next();
}

exports.passwordResetValidator = (req, res, next) => {
    // check for password
    req.check("newPassword", "Password is required").notEmpty();
    req.check("newPassword")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 chars long")
        .matches(/\d/)
        .withMessage("must contain a number")
        .withMessage("Password must contain a number");
 
    // check for errors
    const errors = req.validationErrors();
    // if error show the first one as they happen
    if (errors) {
        const firstError = errors.map(error => error.msg)[0];
        return res.status(400).json({ error: firstError });
    }
    // proceed to next middleware or ...
    next();
};