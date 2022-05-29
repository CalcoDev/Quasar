import { atom } from "recoil";

const userContext = atom({
  key: "user",
  default: {
    loggedIn: false,
    currentUser: {
      name: "",
      id: "",
      imageUrl: "",
    },
  },
});

export default userContext;
