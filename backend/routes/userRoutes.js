import express from "express";
import {
  changePassword,
  forgotPassword,
  login,
  logout,
  resendOtp,
  resetPassword,
  signup,
  verifyAccount,
} from "../controllers/authController.js";
import isAuthenticated from "../middleware/isAuthenticated.js";
import {
  editProfile,
  followUnfollow,
  getMe,
  getProfile,
  suggestedUser,
} from "../controllers/userController.js";
import upload from "../middleware/multer.js";

const router = express.Router();

//Auth routes

router.post("/signup", signup);
router.post("/verify", isAuthenticated, verifyAccount);
router.post("/resend-otp", isAuthenticated, resendOtp);
router.post("/login", login);
router.post("/logout", logout);
router.post("/forget-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/change-password", isAuthenticated, changePassword);

router.get("/profile/:id", getProfile);
router.post(
  "/edit-profile",
  isAuthenticated,
  upload.single("profilePicture"),
  editProfile
);
router.get("/suggested-user", isAuthenticated, suggestedUser);
router.post("/follow-unfollow/:id", isAuthenticated, followUnfollow);
router.get("/me", isAuthenticated, getMe);

export default router;
