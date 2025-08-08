import { createContext, useContext, useEffect, useState } from "react";

interface User {
    isAuthenticated: boolean;
    workspaceId: string;
    workspaceName: string;
}

interface UserContextType {
    user: User | null;
    setUser: (user: User | null) => void;
    logout: () => void;
}

const UserContext = createContext<UserContextType | null>(null);


export const UserProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);

    const logout = () => {
        localStorage.removeItem('user');
        setUser(null);
    }
    useEffect(()=>{
        const user = localStorage.getItem('user');
        if(user){
            setUser(JSON.parse(user));
        }
    }, []);
    return <UserContext.Provider value={{ user, setUser, logout }}>{children}</UserContext.Provider>;
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};