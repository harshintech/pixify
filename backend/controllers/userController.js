import User from "../models/userModel.js";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import getDataUri from "../utils/datauri.js";

export const getProfile = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  // /user/242342243

  const user = await User.findById(id)
    .select(
      "-password -otp -otpExpires -resetPasswordOTP -resetPasswordOTPExpires -passwordConfirm"
    )
    .populate({
      path: "posts",
      options: { sort: { createdAt: -1 } },
    })
    .populate({
      path: "savedPosts",
      options: { sort: { createdAt: -1 } },
    });

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      user,
    },
  });
});

export const editProfile = catchAsync(async (req, res, next) => {
  // console.log("REQ FILE:", req.file);
  // console.log("REQ BODY:", req.body);

  const userId = req.user.id;

  const { bio } = req.body;
  const profilePicture = req.file;

  let cloudResponse;

  if (profilePicture) {
    const fileUri = getDataUri(profilePicture);

    // console.log("FILE URI TYPE:", typeof fileUri);
    // console.log("FILE URI START:", fileUri?.slice(0, 30));

    cloudResponse = await uploadToCloudinary(fileUri);
  }

  const user = await User.findById(userId).select("-password");

  if (!user) return next(new AppError("User not found", 404));

  if (bio) user.bio = bio;
  if (profilePicture) user.profilePicture = cloudResponse.secure_url;

  await user.save({ validateBeforeSave: false });

  return res.status(200).json({
    message: "Profile Updated",
    status: "success",
    data: {
      user,
    },
  });
});

export const suggestedUser = catchAsync(async (req, res, next) => {
  const loginUserId = req.user.id;

  const users = await User.find({ _id: { $ne: loginUserId } }).select(
    "-password -otp -otpExpires -resetPasswordOTP -resetPasswordOTPExpires -passwordConfirm"
  );

  res.status(200).json({
    status: "success",
    data: {
      users,
    },
  });
});

export const followUnfollow = catchAsync(async (req, res, next) => {
  const loginUserId = req.user._id;
  const targetUserId = req.params.id;

  if (loginUserId.toString() == targetUserId) {
    return next(new AppError("You cannot follow/unfollow yourself", 404));
  }

  const targetUser = await User.findById(targetUserId);

  if (!targetUser) {
    return next(new AppError("User not found", 404));
  }

  const isFollowing = targetUser.followers.includes(loginUserId);

  if (isFollowing) {
    await Promise.all([
      User.updateOne(
        { _id: loginUserId },
        { $pull: { following: targetUserId } }
      ),

      User.updateOne(
        { _id: targetUserId },
        { $pull: { followers: loginUserId } }
      ),
    ]);
  } else {
    await Promise.all([
      User.updateOne(
        { _id: loginUserId },
        { $addToSet: { following: targetUserId } }
      ),
      User.updateOne(
        { _id: targetUserId },
        { $addToSet: { followers: loginUserId } }
      ),
    ]);
  }

  const updatedLoggedInUser = await User.findById(loginUserId).select(
    "-password"
  );

  res.status(200).json({
    message: isFollowing ? "Unfollowed Successfully" : "Followed Successfully",
    status: "success",
    data: {
      user: updatedLoggedInUser,
    },
  });
});

export const getMe = catchAsync(async (req, res, next) => {
  const user = req.user;
  if (!user) return next(new AppError("User not Authenticated", 404));

  res.status(200).json({
    status: "success",
    message: "Authenticated User",
    data: {
      user,
    },
  });
});
