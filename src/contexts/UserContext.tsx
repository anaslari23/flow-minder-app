
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, UserProfile } from '@/lib/supabase';
import { toast } from 'sonner';

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
        setIsLoading(true);
        
        // Try to get existing session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          // Create anonymous session if none exists
          try {
            const { data: { session: anonSession }, error } = await supabase.auth.signUp({
              email: `anonymous_${Date.now()}@example.com`,
              password: crypto.randomUUID(),
            });
            
            if (error) throw error;
            
            if (anonSession?.user) {
              setUserId(anonSession.user.id);
              
              // Create empty user profile for the new anonymous user
              await supabase
                .from('user_profiles')
                .upsert({
                  id: anonSession.user.id,
                  name: 'User',
                  date_of_birth: new Date().toISOString(),
                  onboarded: false,
                  created_at: new Date().toISOString(),
                });
              
              setUserData({
                ...defaultUserData,
                name: 'User'
              });
            }
          } catch (anonError) {
            console.error('Error creating anonymous session:', anonError);
            // Fallback to memory-only mode
            const tempId = `local_${Date.now()}`;
            setUserId(tempId);
            setUserData({
              ...defaultUserData,
              name: 'User'
            });
          }
        } else {
          // Use existing session
          setUserId(session.user.id);
          
          const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (error && error.code !== 'PGRST116') {
            // If no profile exists yet, create one
            if (error.code === 'PGRST116') {
              await supabase
                .from('user_profiles')
                .upsert({
                  id: session.user.id,
                  name: 'User',
                  date_of_birth: new Date().toISOString(),
                  onboarded: false,
                  created_at: new Date().toISOString(),
                });
              
              setUserData({
                ...defaultUserData,
                name: 'User'
              });
            } else {
              throw error;
            }
          }
          
          if (data) {
            setUserData({
              name: data.name || 'User',
              dateOfBirth: data.date_of_birth || new Date().toISOString(),
              occupation: data.occupation || '',
              onboarded: data.onboarded || false,
            });
            setIsOnboarded(data.onboarded || false);
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        // Load from localStorage if available
        const storedData = localStorage.getItem('userData');
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          setUserData(parsedData);
          setIsOnboarded(parsedData.onboarded || false);
        }
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
      
      // Store in localStorage as fallback
      localStorage.setItem('userData', JSON.stringify(updatedData));
      
      if (userId.startsWith('local_')) {
        return; // Don't try to update Supabase for local IDs
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
      toast.error('Failed to save data to server. Changes saved locally.');
      // Create a proper reference to the updated data
      const localUpdatedData = { ...userData, ...data };
      localStorage.setItem('userData', JSON.stringify(localUpdatedData));
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
