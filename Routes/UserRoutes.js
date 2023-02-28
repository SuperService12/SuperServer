const express = require("express");
const asyncHandler = require("express-async-handler");
const nodemailer = require('nodemailer');
const Mailgen = require('mailgen');
const bcrypt = require("bcryptjs");

const { protect, admin } = require("../Middleware/AuthMiddleware.js");
const generateToken = require("../utils/generateToken.js");
const User = require("./../Models/UserModel.js");

const userRouter = express.Router();

// LOGIN
userRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (user && (await user.matchPassword(password))) {
      if (!user.isVerified) {
        res.status(300);
        throw new Error("Verify your email first");
      }
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        image: user.image,
        isAdmin: user.isAdmin,
        isVendor: user.isVendor,
        isVerified: user.isVerified,
        token: generateToken(user._id),
        createdAt: user.createdAt,
      });
    } else {
      res.status(401);
      throw new Error("Invalid Email or Password");
    }
  })
);

// REGISTER
userRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
      res.status(400);
      throw new Error("User already exists");
    }

    //MAILGEN Configuration
    var otpGen = Math.floor(1000 + Math.random() * 9000);

    let config = {
      service: 'gmail',
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
      }
    }

    let transporter = nodemailer.createTransport(config);

    let MailGenerator = new Mailgen({
      theme: "default",
      product: {
        name: "The SuperService Team",
        link: 'https://papaya-daffodil-e225e7.netlify.app/'
      }
    })
    let response = {
      body: {
        name: `${email}`,
        intro: `Please enter the code on the sign up page to confirm your identity: ${otpGen}`,
        outro: "All the best,\n The SuperService Team"
      }
    }

    let mail = MailGenerator.generate(response)

    let message = {
      from: process.env.EMAIL,
      to: email,
      subject: "Otp SuperService",
      html: mail
    }

    await transporter.sendMail(message).catch(error => {
      res.status(500);
      throw new Error("Internal Server Error");
    })

    const salt = await bcrypt.genSalt(10);
    otpGen = await bcrypt.hash(otpGen.toString(), salt);

    // USER CREATING PHASE
    const user = await User.create({
      name,
      email,
      password,
      otp: otpGen
    });

    if (user) {
      res.status(300);
      throw new Error("Now verify to continue");
    } else {
      res.status(400);
      throw new Error("Invalid User Data");
    }
  })
);

// OTP verify
userRouter.post(
  "/verify",
  asyncHandler(async (req, res) => {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (user && (await user.matchOtp(otp.toString()))) {
      user.isVerified = true;
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        image: user.image,
        isAdmin: user.isAdmin,
        isVendor: user.isVendor,
        isVerified: user.isVerified,
        token: generateToken(user._id),
        createdAt: user.createdAt,
      });
    } else {
      res.status(401);
      throw new Error("Invalid Otp Number");
    }
  })
);

//Register as Professional
userRouter.post(
  "/pro",
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    const userExists = await User.findOne({ email });

    if (userExists) {
      if (userExists.isVendor) {
        res.status(400);
        throw new Error("Already a Professional");
      }
      userExists.isVendor = true;
      userExists.isAdmin = true;
      const updatedUser = await userExists.save();
      res.status(200).json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        isVendor: updatedUser.isVendor,
        isAdmin: user.isAdmin,
        createdAt: updatedUser.createdAt,
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      isVendor: true,
      isAdmin: true
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        isVendor: user.isVendor,
        isAdmin: user.isAdmin,
        token: generateToken(user._id),
      });
    } else {
      res.status(400);
      throw new Error("Invalid User Data");
    }
  })
);

// LOGIN as Professional
userRouter.post(
  "/pro/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      if (!user.isVendor) {
        res.status(401);
        throw new Error("Your are not Professional");
      }
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        isVendor: user.isVendor,
        isAdmin: user.isAdmin,
        isVerified: user.isVerified,
        token: generateToken(user._id),
        createdAt: user.createdAt,
      });
    } else {
      res.status(401);
      throw new Error("Invalid Email or Password");
    }
  })
);

// PROFILE
userRouter.get(
  "/profile",
  protect,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        image: user.image,
        isAdmin: user.isAdmin,
        isVendor: user.isVendor,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
      });
    } else {
      res.status(404);
      throw new Error("User not found");
    }
  })
);

// UPDATE PROFILE
userRouter.put(
  "/profile",
  protect,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      if (req.body.password) {
        user.password = req.body.password;
      }
      const updatedUser = await user.save();
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        image: updatedUser.image,
        email: updatedUser.email,
        isAdmin: updatedUser.isAdmin,
        isVerified: user.isVerified,
        createdAt: updatedUser.createdAt,
        token: generateToken(updatedUser._id),
      });
    } else {
      res.status(404);
      throw new Error("User not found");
    }
  })
);

userRouter.post('/profile/photo',
  protect,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
      user.image = req.body.image || user.image;
      const updatedUser = await user.save();
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        image: updatedUser.image,
        email: updatedUser.email,
        isAdmin: updatedUser.isAdmin,
      });
    } else {
      res.status(404);
      throw new Error("User not found");
    }
  })
)

// GET ALL USER ADMIN
userRouter.get(
  "/",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const users = await User.find({});
    res.json(users);
  })
);

/** send mail from real gmail account */
userRouter.post(
  "/sendemail",
  asyncHandler(async (req, res) => {

    const { userEmail } = req.body;
    var otpGen = Math.floor(1000 + Math.random() * 9000);

    let config = {
      service: 'gmail',
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
      }
    }

    let transporter = nodemailer.createTransport(config);

    let MailGenerator = new Mailgen({
      theme: "default",
      product: {
        name: "The SuperService Team",
        link: 'https://papaya-daffodil-e225e7.netlify.app/'
      }
    })
    let response = {
      body: {
        name: `${userEmail}`,
        intro: `Please enter the code on the sign up page to confirm your identity: ${otpGen}`,
        outro: "All the best,\n The SuperService Team"
      }
    }

    let mail = MailGenerator.generate(response)

    let message = {
      from: process.env.EMAIL,
      to: userEmail,
      subject: "Otp SuperService",
      html: mail
    }

    transporter.sendMail(message).then(() => {
      return res.status(201).json({
        msg: "you should receive an email"
      })
    }).catch(error => {
      return res.status(500).json({ error })
    })

  }
  ));

module.exports = userRouter;
