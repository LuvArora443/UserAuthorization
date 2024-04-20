const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { Details } = require("../models/User");

// Gmail account credentials
const gmailCredentials = {
  user: "pes2202100453@pesu.pes.edu", 
  pass: "PES2202100453" 
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

const maxAge = 3 * 24 * 60 * 60;
const createToken = (id) => {
  return jwt.sign({ id }, 'this is my secret', {
    expiresIn: maxAge
  });
};

const sendOTP = async (email) => {
  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailCredentials.user,
      pass: gmailCredentials.pass
    }
  });

  // generate random 6-digit OTP
  const OTP = Math.floor(100000 + Math.random() * 900000);

  let info = await transporter.sendMail({
    from: '"Luv Arora" <your_email@gmail.com>', // sender address
    to: email, // list of receivers
    subject: 'OTP Verification', // Subject line
    text: `Your OTP for registration is: ${OTP}`, // plain text body
  });
  console.log(OTP);
  console.log("OTP sent: %s", info.messageId);
  
  return OTP;
}

module.exports.signup_get = (req, res) => {
  res.render('signup');
}

module.exports.login_get = (req, res) => {
  res.render('login');
}

module.exports.login2_get = (req, res) => {
  res.render('login2');
}

module.exports.details_get = (req,res) => {
  res.render('details');
}




const { User } = require("../models/User"); // Import User model

module.exports.signup_post = async (req, res) => {
  const { email, password } = req.body;

  try {
    const OTP = await sendOTP(email);

    // Save the OTP to the session
    req.session.otp = OTP;

    const user = await new User({ email, password }).save(); 
    const token = createToken(user._id);

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
    const storedOTP = req.session.otp.toString();

    // Check if OTP entered by user matches the stored OTP
    if (otp !== storedOTP) {
      console.log("hello",otp);
      console.log(typeof otp);
      console.log(typeof storedOTP);
      console.log(storedOTP);
      return res.status(400).json({ errors: { otp: 'Invalid OTP' } });
    }

    const user = await User.login(email, password);
    const token = createToken(user._id);
    
    req.session.email = email;

    res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
    res.status(200).json({ user: user._id });
  } 
  catch (err) {
    const errors = handleErrors(err);
    res.status(400).json({ errors });
  }
}


module.exports.details_post = async (req, res) => {
  const { location, age, work } = req.body;

  try {
    const userEmail = req.session.email;
    const details = new Details({email:userEmail, location, age, work });

    await details.save();

    res.sendStatus(200); // Send success status
  } catch (err) {
    console.error('Error adding details:', err);
    res.sendStatus(500); // Send internal server error status
  }
};

module.exports.login2_post = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.login(email, password);
    const token = createToken(user._id);
    
    req.session.email = email;
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
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const user = await User.findById(req.user.id);
    const userDetails = await Details.findOne({ email: user.email }, { _id: 0 }); 
    res.status(200).json({ user: user.toObject(), details: userDetails });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};
