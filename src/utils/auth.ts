import SecureStore from "expo-secure-store";

const TOKEN_KEY = "@MyApp:token";

export const saveToken = async (token: string): Promise<void> => {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
};

export const getToken = (): Promise<string | null> | null => {
  try {
    const token = SecureStore.getItemAsync(TOKEN_KEY);
    if (token) {
      return token;
    }
    return null;
  } catch (error) {
    console.error("Error retrieving token:", error);
    return null;
  }
};

export const removeToken = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
};
