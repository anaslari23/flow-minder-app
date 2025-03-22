
import React, { createContext, useContext, useState, useEffect } from 'react';

type UserData = {
  name: string;
  dateOfBirth: string;
  occupation: string;
  onboarded: boolean;
};

type UserContextType = {
  userData: UserData;
  updateUserData: (data: Partial<UserData>) => void;
  isOnboarded: boolean;
  setIsOnboarded: (value: boolean) => void;
};

const defaultUserData: UserData = {
  name: '',
  dateOfBirth: '',
  occupation: '',
  onboarded: false,
};

const UserContext = createContext<UserContextType>({
  userData: defaultUserData,
  updateUserData: () => {},
  isOnboarded: false,
  setIsOnboarded: () => {},
});

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userData, setUserData] = useState<UserData>(() => {
    const savedData = localStorage.getItem('userData');
    return savedData ? JSON.parse(savedData) : defaultUserData;
  });
  
  const [isOnboarded, setIsOnboarded] = useState<boolean>(() => {
    return userData.onboarded || false;
  });

  useEffect(() => {
    localStorage.setItem('userData', JSON.stringify(userData));
  }, [userData]);

  const updateUserData = (data: Partial<UserData>) => {
    setUserData(prev => ({ ...prev, ...data }));
  };

  return (
    <UserContext.Provider value={{ userData, updateUserData, isOnboarded, setIsOnboarded }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
