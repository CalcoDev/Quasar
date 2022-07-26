import React from "react";

export default function CustomButton({
  highlighted,
  colour,
  children,
  onClick,
}) {
  return highlighted ? (
    <div>no</div>
  ) : (
    <button
      type="button"
      className={`scale-[95%] border-[3px] m-0
      ${
        (colour === "red" &&
          "text-red-700 hover:text-white border-red-700 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:border-red-500 dark:text-red-500 dark:hover:text-white dark:hover:bg-red-600 dark:focus:ring-red-900") ||
        (colour === "green" &&
          "text-green-700 hover:text-white border-green-700 hover:bg-green-800 focus:ring-4 focus:outline-none focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:border-green-500 dark:text-green-500 dark:hover:text-white dark:hover:bg-green-600 dark:focus:ring-green-800") ||
        (colour === "blue" &&
          "text-blue-700 hover:text-white border-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:border-blue-500 dark:text-blue-500 dark:hover:text-white dark:hover:bg-blue-600 dark:focus:ring-blue-800")
      }`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
