import { useEffect,useState } from 'react';
export function useSmallScreen(){const [small,setSmall]=useState(()=>window.matchMedia('(max-width: 767px)').matches);useEffect(()=>{const media=window.matchMedia('(max-width: 767px)');const update=()=>setSmall(media.matches);media.addEventListener('change',update);return()=>media.removeEventListener('change',update);},[]);return small;}
