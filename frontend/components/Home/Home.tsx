"use client";

import { Loader, MenuIcon } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import Feed from "./Feed";
import LeftSidebar from "./LeftSidebar";
import RightSidebar from "./RightSidebar";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { useEffect, useState } from "react";
import axios from "axios";
import { BASE_API_URL } from "@/server";
import { handleRequest } from "../utils/apiRequest";
import { setAuthUser } from "@/store/authSlice";
import { redirect } from "next/navigation";

const Home = () => {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);

  const user = useSelector((state: RootState) => state.auth.user);

  useEffect(() => {
    const getAuthUser = async () => {
      const getAuthUserReq = async () =>
        await axios.get(`${BASE_API_URL}/users/me`, { withCredentials: true });
      const result = await handleRequest(getAuthUserReq, setIsLoading);

      if (result) {
        dispatch(setAuthUser(result.data.data.user));
      }
    };

    getAuthUser();
  }, [dispatch]);

  useEffect(() => {
    if (!user) return redirect("/auth/login");
  }, [user]);

  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center flex-col">
        <Loader className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex">
      <div className="w-[20%] hidden md:block border-r-2 h-screen fixed">
        <LeftSidebar />
      </div>

      <div className="flex-1 md:ml-[20%] overflow-y-auto">
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger>
              <MenuIcon />
            </SheetTrigger>
            <SheetContent>
              <SheetTitle></SheetTitle>
              <SheetDescription></SheetDescription>
              <LeftSidebar />
            </SheetContent>
          </Sheet>
        </div>
        <Feed />
      </div>

      <div className="w-[30%] hidden lg:block pt-8 px-6">
        <RightSidebar />
      </div>
    </div>
  );
};

export default Home;
