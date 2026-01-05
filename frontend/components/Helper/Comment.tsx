import { Post, User } from "@/types";
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import DotButton from "./DotButton";
import { Button } from "../ui/button";
import axios from "axios";
import { handleRequest } from "../utils/apiRequest";
import { addComment } from "@/store/postSlice";
import { toast } from "sonner";
import { BASE_API_URL } from "@/server";

type Props = {
  user: User | null;
  post: Post | null;
};

const Comment = ({ post, user }: Props) => {
  const [comment, setComment] = useState("");
  const dispatch = useDispatch();

  const addCommentHandler = async (id: string) => {
    if (!comment) return;
    const addCommentReq = async () =>
      await axios.post(
        `${BASE_API_URL}/posts/comment/${id}`,
        { text: comment },
        { withCredentials: true }
      );
    const result = await handleRequest(addCommentReq);

    if (result?.data.status === "success") {
      dispatch(addComment({ postId: id, comment: result?.data.data.comment }));
      toast.success("Comment Posted");
      setComment("");
    }
  };

  return (
    <div>
      <Dialog>
        <DialogTrigger>
          <p className="mt-2 text-sm font-semibold">
            View All {post?.comments?.length} Comment
          </p>
        </DialogTrigger>
        <DialogContent className="w-[95vw] sm:min-w-5xl p-0 gap-0 flex flex-col">
          <DialogTitle></DialogTitle>
          <div className="flex flex-1">
            <div className="sm:w-1/2 hidden max-h-[80vh] sm:block">
              <Image
                src={`${post?.image?.url}`}
                alt="Post Image"
                width={300}
                height={300}
                className="w-full h-full object-cover rounded-l-lg"
              />
            </div>
            <div className="w-full sm:w-1/2 flex flex-col justify-between">
              <div className="flex items-center mt-4 justify-between p-4">
                <div className="flex gap-3 items-center">
                  <Avatar>
                    <AvatarImage src={post?.user?.profilePicture} />
                    <AvatarFallback>
                      {post?.user?.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{post?.user?.username}</p>
                  </div>
                </div>
                <DotButton user={user} post={post} />
              </div>
              <hr />
              <div className="flex-1 overflow-y-auto max-h-96 p-4">
                {post?.comments.map((item) => {
                  return (
                    <div
                      key={item._id}
                      className="flex mb-4 gap-3 items-center"
                    >
                      <Avatar>
                        <AvatarImage src={item?.user?.profilePicture} />
                        <AvatarFallback>
                          {item?.user?.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-bold">
                          {item?.user?.username}
                        </p>
                        <p className="font-normal text-sm">{item?.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="w-full outline-none border text-sm border-gray-300 p-2 rounded"
                  />
                  <Button
                    onClick={() => {
                      if (post?._id) {
                        addCommentHandler(post?._id);
                      }
                    }}
                    variant={"outline"}
                  >
                    Send
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Comment;
