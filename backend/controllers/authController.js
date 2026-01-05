import catchAsync from "../utils/catchAsync.js";
import User from "../models/userModel.js";
import AppError from "../utils/appError.js";
import generateOtp from "../utils/generateOtp.js";
import jwt from "jsonwebtoken";
import fs from "fs";
import hbs from "hbs";
import { fileURLToPath } from "url";
import path from "path";
import sendEmail from "../utils/email.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const loadTemplate = (templateName, replacement) => {
  const templatePath = path.join(__dirname, "../emailTemplate", templateName);
  const source = fs.readFileSync(templatePath, "utf-8");
  const template = hbs.compile(source);
  return template(replacement);
};

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res, message) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPRESS_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  };

  res.cookie("token", token, cookieOptions);
  user.password = undefined;
  user.otp = undefined;
  res.status(statusCode).json({
    status: "success",
    message,
    token,
    data: {
      user,
    },
  });
};

export const signup = catchAsync(async (req, res, next) => {
  const { email, password, passwordConfirm, username } = req.body;
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    return next(new AppError("Email already registerd", 400));
  }
  const otp = generateOtp();
  const otpExpires = Date.now() + 24 * 60 * 60 * 100;
  const newUser = await User.create({
    username,
    email,
    password,
    passwordConfirm,
    otp,
    otpExpires,
  });

  try {
    const htmlTemplate = loadTemplate("otpTemplate.hbs", {
      title: "Otp Verification",
      username: newUser.username,
      otp,
      message: "Your one-time passwords (OTP) for account verification is : ",
    });

    await sendEmail({
      email: newUser.email,
      subject: "OTP for Email Verification",
      html: htmlTemplate,
    });

    console.log("EMAIL FUNCTION COMPLETED");

    createSendToken(
      newUser,
      200,
      res,
      "Registeration Successful. Check your email for otp verification"
    );
  } catch (error) {
    await User.findByIdAndDelete(newUser.id);
    console.log(error);
    return next(
      new AppError(
        "There is an error creating the account. Please try again later",
        500
      )
    );
  }

  // res.status(200).json({
  //   status: "success",
  //   data: {
  //     user: newUser,
  //   },
  // });
});

export const verifyAccount = catchAsync(async (req, res, next) => {
  const { otp } = req.body;
  if (!otp) {
    return next(new AppError("Otp is required for verification", 400));
  }

  const user = req.user;

  if (user.otp !== otp) {
    return next(new AppError("Invalid otp", 400));
  }

  if (Date.now() > user.otpExpires) {
    return next(new AppError("Otp has expired. Please request a new OTP", 400));
  }

  user.isVerified = true;
  user.otp = undefined;
  user.otpExpires = undefined;

  await user.save({ validateBeforeSave: false });

  createSendToken(user, 200, res, "Email Has been verified");
});

export const resendOtp = catchAsync(async (req, res, next) => {
  const { email } = req.user;

  if (!email) {
    return next(new AppError("Email is required", 400));
  }

  const user = await User.findOne({ email });

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  if (user.isVerified) {
    return next(new AppError("This account is already verified", 400));
  }

  const otp = generateOtp();
  const otpExpires = Date.now() + 24 * 60 * 60 * 100;

  user.otp = otp;
  user.otpExpires = otpExpires;

  await user.save({ validateBeforeSave: false });

  const htmlTemplate = loadTemplate("otpTemplate.hbs", {
    title: "Otp Verification",
    username: user.username,
    otp,
    message: "Your one-time passwords (OTP) for account verification is : ",
  });

  try {
    await sendEmail({
      email: user.email,
      subject: "Resend otp for email verification",
      html: htmlTemplate,
    });

    res.status(200).json({
      status: "success",
      message: "A new Otp is send to your email",
    });
  } catch (error) {
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError("There is an error sending email. Try again later!", 500)
    );
  }
});

export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError("Please provide email and password", 400));
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect email or password", 401));
  }

  createSendToken(user, 200, res, "Login Successful");
});

export const logout = catchAsync(async (req, res, next) => {
  res.cookie("token", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });

  res.status(200).json({
    status: "success",
    message: "Logged out successfully",
  });
});

export const forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return next(new AppError("No User found", 404));
  }

  const otp = generateOtp();
  const resetExpires = Date.now() + 300000;

  user.resetPasswordOTP = otp;
  user.resetPasswordOTPExpires = resetExpires;

  await user.save({ validateBeforeSave: false });

  const htmlTemplate = loadTemplate("otpTemplate.hbs", {
    title: "Reset Password OTP",
    username: user.username,
    otp,
    message: "Your Password reset otp is ",
  });

  try {
    await sendEmail({
      email: user.email,
      subject: "Password reset OTP (Valid for 5min)",
      html: htmlTemplate,
    });

    res.status(200).json({
      status: "success",
      message: "Password reset otp is send to your email",
    });
  } catch (error) {
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        "There was an error sending the email. Try agian later!",
        500
      )
    );
  }
});

export const resetPassword = catchAsync(async (req, res, next) => {
  const { email, otp, password, passwordConfirm } = req.body;
  const user = await User.findOne({
    email,
    resetPasswordOTP: otp,
    resetPasswordOTPExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError("No User Found", 404));
  }

  user.password = password;
  user.passwordConfirm = passwordConfirm;

  user.resetPasswordOTP = undefined;
  user.resetPasswordOTPExpires = undefined;

  await user.save();
  createSendToken(user, 200, res, "Password Reset Successfully");
});

export const changePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword, newPasswordConfirm } = req.body;

  const { email } = req.user;

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  if (!(await user.correctPassword(currentPassword, user.password))) {
    return next(new AppError("Incorrect Current Password", 400));
  }

  if (newPassword != newPasswordConfirm) {
    return next(
      new AppError("New password and confirm password are not same", 400)
    );
  }

  user.password = newPassword;
  user.passwordConfirm = newPasswordConfirm;
  await user.save();

  createSendToken(user, 200, res, "Password Change Successfully");
});
