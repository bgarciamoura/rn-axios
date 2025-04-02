import { ApiServiceFactory } from "../domain/services/ApiServiceFactory";
import { UserService } from "../domain/services/UserService";
import { User } from "../domain/entities/User";
import { getToken } from "../utils/auth";

const API_URL = process.env.API_URL || "https://digi-api.com/api/v1";

export const userService = (() => {
  const baseService = ApiServiceFactory.createJson<User>("", {
    baseURL: API_URL,
    getToken,
    useLogger: __DEV__,
  });

  return new UserService(baseService.httpClient, "digimon");
})();
