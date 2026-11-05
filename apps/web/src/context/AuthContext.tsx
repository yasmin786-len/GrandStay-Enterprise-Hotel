import { createContext,useContext,useEffect,useMemo,useState,type ReactNode } from 'react';
import { api } from '../lib/api';
import type { AuthUser } from '../types';
interface AuthContextValue{user:AuthUser|null;loading:boolean;login:(email:string,password:string)=>Promise<void>;logout:()=>void;can:(permission:string)=>boolean;}
const AuthContext=createContext<AuthContextValue|null>(null);
export function AuthProvider({children}:{children:ReactNode}){const[user,setUser]=useState<AuthUser|null>(()=>{try{return JSON.parse(localStorage.getItem('hotel_erp_user')||'null')}catch{return null}});const[loading,setLoading]=useState(Boolean(localStorage.getItem('hotel_erp_token')));
useEffect(()=>{const token=localStorage.getItem('hotel_erp_token');if(!token){setLoading(false);return;}api.get<AuthUser>('/auth/me').then(({data})=>{setUser(data);localStorage.setItem('hotel_erp_user',JSON.stringify(data));}).catch(()=>{localStorage.clear();setUser(null);}).finally(()=>setLoading(false));},[]);
const value=useMemo<AuthContextValue>(()=>({user,loading,login:async(email,password)=>{const{data}=await api.post('/auth/login',{email,password});localStorage.setItem('hotel_erp_token',data.token);localStorage.setItem('hotel_erp_user',JSON.stringify(data.user));setUser(data.user);},logout:()=>{localStorage.removeItem('hotel_erp_token');localStorage.removeItem('hotel_erp_user');setUser(null);},can:(permission)=>Boolean(user?.role.permissions.includes(permission))}),[user,loading]);return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>}
export function useAuth(){const value=useContext(AuthContext);if(!value)throw new Error('useAuth must be used inside AuthProvider');return value;}
