import express from "express";
import isAuthenticated from "../middleware/isAuthenticated.js";
import upload from "../middleware/multer.js";
import {
  addComment,
  creatPost,
  deletePost,
  getAllPost,
  getUserPost,
  likeOrDislikePost,
  saveOrUnsavePost,
} from "../controllers/postContoller.js";

const router = express.Router();

//define routes

router.post("/create-post", isAuthenticated, upload.single("image"), creatPost);
router.get("/all", getAllPost);
router.get("/user-post/:id", getUserPost);
router.post("/save-unsave-post/:postId", isAuthenticated, saveOrUnsavePost);
router.delete("/delete-post/:id", isAuthenticated, deletePost);
router.post("/like-dislike/:id", isAuthenticated, likeOrDislikePost);
router.post("/comment/:id", isAuthenticated, addComment);

export default router;
