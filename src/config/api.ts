import { ApiServiceFactory } from "../domain/services/ApiServiceFactory";
import { UserService } from "../domain/services/UserService";
import { User } from "../domain/entities/User";
import { getToken } from "../utils/auth";

const API_URL = process.env.API_URL || "https://api.myapp.com";

export const userService = (() => {
  const baseService = ApiServiceFactory.create<User>(
    "users",
    API_URL,
    getToken,
    __DEV__,
  );

  return new UserService(baseService.httpClient, "users");
})();
