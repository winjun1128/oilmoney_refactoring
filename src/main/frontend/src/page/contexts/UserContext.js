import { createContext } from "react";

export const UserContext = createContext({
  userInfo: {},       // 초기값
  setUserInfo: () => {} // 초기값은 빈 함수
});
