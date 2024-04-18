// const jwt = require('jsonwebtoken');
// const User = require('../models/User');


// const requireAuth = (req, res, next) => {
//     const token = req.cookies.jwt;
    
//     //check for the web token
//     if(token){
//         jwt.verify(token, 'this is my secret', (err, decodedToken) => {
//             if(err){
//                 console.log(err.message);
//                 res.redirect('/login');
//             }
//             else{
//                 console.log(decodedToken);
//                 req.user = decodedToken;
//                 next();
//             }
//         })
//     }
//     else{
//         res.redirect('/login');
//     }
// }

// const checkUser = (req, res, next) => {
//     const token = req.cookies.jwt;

//     if(token){
//         jwt.verify(token, 'this is my secret', async (err, decodedToken) => {
//             if(err){
//                 console.log(err.message);
//                 res.locals.user = null;
//                 next();
//             }
//             else{
//                 console.log(decodedToken);
//                 let user = await User.findById(decodedToken.id);
//                 res.locals.user = user;
//                 next();
//             }
//         })
//     }
//     else{
//         res.locals.user = null;
//         next();
//     }
// }

// module.exports = { requireAuth, checkUser };

// authMiddleware.js

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const requireAuth = (req, res, next) => {
    const token = req.cookies.jwt;
    
    //check for the web token
    if(token){
        jwt.verify(token, 'this is my secret', (err, decodedToken) => {
            if(err){
                console.log(err.message);
                res.redirect('/login');
            }
            else{
                req.user = decodedToken; // Set the req.user object
                next();
            }
        })
    }
    else{
        res.redirect('/login');
    }
}

const checkUser = (req, res, next) => {
    const token = req.cookies.jwt;

    if(token){
        jwt.verify(token, 'this is my secret', async (err, decodedToken) => {
            if(err){
                console.log(err.message);
                res.locals.user = null;
                next();
            }
            else{
                const user = await User.findById(decodedToken.id);
                req.user = user; // Set the req.user object
                res.locals.user = user;
                next();
            }
        })
    }
    else{
        res.locals.user = null;
        next();
    }
}

module.exports = { requireAuth, checkUser };
