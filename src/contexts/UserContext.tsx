import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, UserProfile } from '@/lib/supabase';

type UserData = {
  name: string;
  dateOfBirth: string;
  occupation: string;
  onboarded: boolean;
};

type UserContextType = {
  userData: UserData;
  updateUserData: (data: Partial<UserData>) => Promise<void>;
  isOnboarded: boolean;
  setIsOnboarded: (value: boolean) => void;
  userId: string | null;
  isLoading: boolean;
};

const defaultUserData: UserData = {
  name: '',
  dateOfBirth: '',
  occupation: '',
  onboarded: false,
};

const UserContext = createContext<UserContextType>({
  userData: defaultUserData,
  updateUserData: async () => {},
  isOnboarded: false,
  setIsOnboarded: () => {},
  userId: null,
  isLoading: true,
});

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userData, setUserData] = useState<UserData>(defaultUserData);
  const [isOnboarded, setIsOnboarded] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          const { data: { session: anonSession }, error } = await supabase.auth.signUp({
            email: `${Date.now()}@anonymous.com`,
            password: crypto.randomUUID(),
          });
          
          if (error) throw error;
          
          if (anonSession?.user) {
            setUserId(anonSession.user.id);
          }
        } else {
          setUserId(session.user.id);
          
          const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (error && error.code !== 'PGRST116') {
            throw error;
          }
          
          if (data) {
            setUserData({
              name: data.name,
              dateOfBirth: data.date_of_birth,
              occupation: data.occupation,
              onboarded: data.onboarded,
            });
            setIsOnboarded(data.onboarded);
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserData();
  }, []);

  const updateUserData = async (data: Partial<UserData>) => {
    try {
      if (!userId) return;
      
      const updatedData = { ...userData, ...data };
      setUserData(updatedData);
      
      if (data.onboarded !== undefined) {
        setIsOnboarded(data.onboarded);
      }
      
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          id: userId,
          name: updatedData.name,
          date_of_birth: updatedData.dateOfBirth,
          occupation: updatedData.occupation,
          onboarded: updatedData.onboarded,
          updated_at: new Date().toISOString(),
        });
      
      if (error) throw error;
      
    } catch (error) {
      console.error('Error updating user data:', error);
      localStorage.setItem('userData', JSON.stringify(updatedData));
    }
  };

  return (
    <UserContext.Provider value={{ 
      userData, 
      updateUserData, 
      isOnboarded, 
      setIsOnboarded,
      userId,
      isLoading,
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
