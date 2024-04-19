// const User = require("../models/User");
// const jwt = require('jsonwebtoken');

// // handle errors
// const handleErrors = (err) => {
//   console.log(err.message, err.code);
//   let errors = { email: '', password: '' };

//   // incorrect email
//   if (err.message === 'incorrect email') {
//     errors.email = 'The email is not registered';
//   }

//   // incorrect password
//   if (err.message === 'incorrect password') {
//     errors.password = 'The password is incorrect';
//   }

//   // duplicate email error
//   if (err.code === 11000) {
//     errors.email = 'That email is already registered';
//     return errors;
//   }

//   // validation errors
//   if (err.message.includes('user validation failed')) {
//     // console.log(err);
//     Object.values(err.errors).forEach(({ properties }) => {
//       // console.log(val);
//       // console.log(properties);
//       errors[properties.path] = properties.message;
//     });
//   }

//   return errors;
// }

// // create json web token
// const maxAge = 3 * 24 * 60 * 60;
// const createToken = (id) => {
//   return jwt.sign({ id }, 'this is my secret', {
//     expiresIn: maxAge
//   });
// };

// // controller actions
// module.exports.signup_get = (req, res) => {
//   res.render('signup');
// }

// module.exports.login_get = (req, res) => {
//   res.render('login');
// }

// module.exports.signup_post = async (req, res) => {
//   const { email, password } = req.body;

//   try {
//     const user = await User.create({ email, password });
//     const token = createToken(user._id);
//     res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
//     res.status(201).json({ user: user._id });
//   }
//   catch(err) {
//     const errors = handleErrors(err);
//     res.status(400).json({ errors });
//   }
 
// }

// module.exports.login_post = async (req, res) => {
//   const { email, password } = req.body;

//   try {
//     const user = await User.login(email, password);
//     const token = createToken(user._id);
//     res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
//     res.status(200).json({ user: user._id });
//   } 
//   catch (err) {
//     const errors = handleErrors(err);
//     res.status(400).json({ errors });
//   }

// }

// module.exports.logout_get = (req,res) => {
//   res.cookie('jwt', '', {maxAge: 1});
//   res.redirect('/');
// }

// module.exports.getUserInfo = async (req, res) => {
//   try {
//     // Ensure that req.user is not null
//     if (!req.user) {
//       return res.status(401).json({ message: "Unauthorized" });
//     }
//     const user = await User.findById(req.user.id);
//     res.status(200).json(user);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

//require('dotenv').config(); // Load environment variables

const User = require("../models/User");
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// Gmail account credentials
const gmailCredentials = {
  user: "pes2202100453@pesu.pes.edu", // your Gmail email address
  pass: "PES2202100453" // your Gmail password
};

// handle errors
const handleErrors = (err) => {
  console.log(err.message, err.code);
  let errors = { email: '', password: '' };

  // incorrect email
  if (err.message === 'incorrect email') {
    errors.email = 'The email is not registered';
  }

  // incorrect password
  if (err.message === 'incorrect password') {
    errors.password = 'The password is incorrect';
  }

  // duplicate email error
  if (err.code === 11000) {
    errors.email = 'That email is already registered';
    return errors;
  }

  // validation errors
  if (err.message.includes('user validation failed')) {
    Object.values(err.errors).forEach(({ properties }) => {
      errors[properties.path] = properties.message;
    });
  }

  return errors;
}

// create json web token
const maxAge = 3 * 24 * 60 * 60;
const createToken = (id) => {
  return jwt.sign({ id }, 'this is my secret', {
    expiresIn: maxAge
  });
};

// Function to send OTP to user's email
const sendOTP = async (email) => {
  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailCredentials.user,
      pass: gmailCredentials.pass
    }
  });

  // generate random 6-digit OTP
  const OTP = Math.floor(100000 + Math.random() * 900000);

  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: '"Your Name" <your_email@gmail.com>', // sender address
    to: email, // list of receivers
    subject: 'OTP Verification', // Subject line
    text: `Your OTP for registration is: ${OTP}`, // plain text body
  });
  console.log(OTP);
  console.log("OTP sent: %s", info.messageId);
  
  return OTP;
}

// controller actions
module.exports.signup_get = (req, res) => {
  res.render('signup');
}

module.exports.login_get = (req, res) => {
  res.render('login');
}

module.exports.signup_post = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Sending OTP to user's email
    const OTP = await sendOTP(email);

    // Save the OTP to the session
    req.session.otp = OTP;

    // Proceed with normal signup process
    const user = await User.create({ email, password });
    const token = createToken(user._id);

    // Store OTP in session along with JWT
    req.session.jwtWithOTP = {
      jwt: token,
      otp: OTP
    };

    res.status(201).json({ user: user._id });
  }
  catch(err) {
    const errors = handleErrors(err);
    res.status(400).json({ errors });
  }
}

module.exports.login_post = async (req, res) => {
  const { email, password, otp } = req.body;

  try {
    // Retrieve OTP from the session
    const storedOTP = req.session.otp;

    // Check if OTP entered by user matches the stored OTP
    if (otp !== storedOTP) {
      console.log("hello",otp);
      console.log(typeof storedOTP);
      return res.status(400).json({ errors: { otp: 'Invalid OTP' } });
    }

    const user = await User.login(email, password);
    const token = createToken(user._id);
    res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
    res.status(200).json({ user: user._id });
  } 
  catch (err) {
    const errors = handleErrors(err);
    res.status(400).json({ errors });
  }
}


module.exports.logout_get = (req,res) => {
  res.cookie('jwt', '', {maxAge: 1});
  res.redirect('/');
}

module.exports.getUserInfo = async (req, res) => {
  try {
    // Ensure that req.user is not null
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const user = await User.findById(req.user.id);
    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};