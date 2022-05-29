import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useRecoilState } from "recoil";
import userContext from "../../contexts/user.context";
import {
  signInWithGooglePopup,
  signInWithGoogleRedirect,
} from "../../utils/firebase/firebase.utils";

export default function Auth() {
  const [user, setUser] = useRecoilState(userContext);

  return (
    <div className="h-screen w-100 flex justify-center items-center bg-zinc-800">
      {user.loggedIn && <Navigate replace to="/" />}

      <button
        className="relative inline-flex items-center justify-center p-0.5 mb-2 mr-2 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-purple-600 to-blue-500 group-hover:from-purple-600 group-hover:to-blue-500 hover:text-white dark:text-white focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800"
        onClick={() => {
          signInWithGooglePopup(setUser);
        }}
      >
        <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white dark:bg-zinc-800 rounded-md group-hover:bg-opacity-0">
          Sign in with Google.
        </span>
      </button>
    </div>
  );
}
