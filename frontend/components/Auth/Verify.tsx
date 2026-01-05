"use client";
import { Loader, MailCheck } from "lucide-react";
import LoadingButton from "../Helper/LoadingButton";
import { ChangeEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import axios from "axios";
import { BASE_API_URL } from "@/server";
import { handleRequest } from "../utils/apiRequest";
import { useDispatch, useSelector } from "react-redux";
import { setAuthUser } from "@/store/authSlice";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { RootState } from "@/store/store";

const Verify = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const user = useSelector((state: RootState) => state?.auth.user);
  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [isPageLoading, setIsPageLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.replace("/auth/login");
    } else if (user && user.isVerified) {
      router.replace("/");
    } else {
      setIsPageLoading(false);
    }
  }, [user, router]);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  console.log(otp);

  const handleChange = (
    index: number,
    event: ChangeEvent<HTMLInputElement>
  ): void => {
    const { value } = event.target;
    if (/^\d*$/.test(value) && value.length <= 1) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
    }

    if (value.length === 1 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    event: KeyboardEvent<HTMLInputElement>
  ): void => {
    if (
      event.key === "Backspace" &&
      !inputRefs.current[index]?.value &&
      inputRefs.current[index - 1]
    ) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async () => {
    const otpValue = otp.join("");
    const verifyReq = async () =>
      await axios.post(
        `${BASE_API_URL}/users/verify`,
        { otp: otpValue },
        { withCredentials: true }
      );

    const result = await handleRequest(verifyReq, setIsLoading);

    if (result) {
      dispatch(setAuthUser(result.data.data.user));
      toast.success(result.data.message);
      router.push("/");
    }
  };

  const handleResentOtp = async () => {
    const resentOtp = async () =>
      await axios.post(`${BASE_API_URL}/users/resend-otp`, null, {
        withCredentials: true,
      });

    const result = await handleRequest(resentOtp, setIsLoading);
    if (result) {
      toast.success(result.data.message);
    }
  };

  if (isPageLoading) {
    return (
      <div className="h-screen flex justify-center items-center">
        <Loader className="w-20 h-20 animate-spin "></Loader>
      </div>
    );
  }

  return (
    <div className="h-screen flex items-center flex-col justify-center">
      <MailCheck className="w-20 h-20 sm:w-32 sm:h-32 text-red-600" />
      <h1 className="text-2xl sm:text-3xl font-bold mb-3">OTP Verification</h1>
      <p className="mb-6 text-sm sm:text-base text-gray-600 font-medium">
        We have sent a code to {user?.email}
      </p>
      <div className="flex space-x-4">
        {[0, 1, 2, 3, 4, 5].map((index) => {
          return (
            <input
              type="number"
              key={index}
              maxLength={1}
              className="sm:w-20 sm:h-20 w-10 h-10 rounded bg-gray-200 text-lg sm:text-3xl font-bold outline-gray-500 text-center no-spinner"
              value={otp[index] || ""}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              onKeyDown={(e) => {
                if (["e", "E", "+", "-", "."].includes(e.key)) {
                  e.preventDefault();
                }
                handleKeyDown(index, e);
              }}
              onChange={(e) => handleChange(index, e)}
            />
          );
        })}
      </div>
      <div className="flex items-center mt-4 space-x-2">
        <h1 className="text-sm sm:text-lg font-medium text-gray-700">
          Did't Get the Otp code ?
        </h1>
        <button
          onClick={handleResentOtp}
          className="text-sm sm:text-lg font-medium text-blue-900 underline cursor-pointer"
        >
          Resend Code
        </button>
      </div>

      <LoadingButton
        onClick={handleSubmit}
        isLoading={isLoading}
        size={"lg"}
        className="mt-6 w-52"
      >
        Verify
      </LoadingButton>
    </div>
  );
};

export default Verify;
