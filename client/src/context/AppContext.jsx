import axios from "axios";
import React, { createContext, useEffect, useState, useMemo } from "react";
import { toast } from "react-toastify";

export const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
  const backendUrl = "https://mern-auth-backend-9dlc.onrender.com";

  const [isLoggedin, setIsLoggedin] = useState(false);
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Always send cookies with requests
  axios.defaults.withCredentials = true;

  // Fetch user data
  const getUserData = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/user/data`, {
        withCredentials: true,
      });

      if (data.success) {
        setUserData(data.userData);

        // Store email in localStorage for OTP verification
        if (data.userData?.email) {
          localStorage.setItem("otpEmail", data.userData.email);
        }
      } else {
        toast.error(data.message || "Failed to fetch user data");
        setUserData(null);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch user data");
      setUserData(null);
    }
  };

  // Check if user is authenticated
  const getAuthState = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/auth/is-auth`, {
        withCredentials: true,
      });

      if (data.success) {
        setIsLoggedin(true);
        await getUserData();
      } else {
        setIsLoggedin(false);
        setUserData(null);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        console.warn("Auth check failed: Unauthorized - No token provided");
      } else {
        console.error("Auth check failed:", error.response?.data?.message || error.message);
      }
      setIsLoggedin(false);
      setUserData(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Run once on app load
  useEffect(() => {
    getAuthState();
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      backendUrl,
      isLoggedin,
      setIsLoggedin,
      userData,
      setUserData,
      getUserData,
      isLoading,
    }),
    [backendUrl, isLoggedin, userData, isLoading]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
