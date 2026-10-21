import { Component,useEffect,useMemo,useRef,useState,type ReactNode } from 'react';
import { Canvas,useThree } from '@react-three/fiber';
import { DoubleSide,ExtrudeGeometry,PerspectiveCamera } from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Maximize,Minus,Plus,RotateCcw } from 'lucide-react';
import type { SvgAnalysis } from '@taller/contracts';
import { IconButton } from '../../components/ui';
import { num } from '../../lib/format';
type View='perspective'|'front'|'back';
type Colors={front:string;back:string;edge:string};
interface Props{analysis:SvgAnalysis;colors:Colors;ledEnabled:boolean;depthMm:number;frontThicknessMm:number;backThicknessMm:number;backEnabled:boolean;resetToken:number}
class ViewerBoundary extends Component<{children:ReactNode},{failed:boolean}>{
  state={failed:false};static getDerivedStateFromError(){return {failed:true};}
  render(){return this.state.failed?<div className="three-fallback" role="alert">No se pudo iniciar el visor 3D. Comprueba que la aceleración gráfica esté habilitada en tu navegador. El diseño 2D sigue disponible.</div>:this.props.children;}
}
function CameraControls({analysis,depthMm,view,resetToken,zoomStep}:{analysis:SvgAnalysis;depthMm:number;view:View;resetToken:number;zoomStep:number}){
  const {camera,gl,invalidate,size}=useThree();const controls=useRef<OrbitControls|null>(null);const previousZoom=useRef(zoomStep);
  useEffect(()=>{const orbit=new OrbitControls(camera,gl.domElement);orbit.enableDamping=false;orbit.minDistance=.1;orbit.maxDistance=1e7;const redraw=()=>invalidate();orbit.addEventListener('change',redraw);controls.current=orbit;return()=>{orbit.removeEventListener('change',redraw);orbit.dispose();controls.current=null;};},[camera,gl,invalidate]);
  useEffect(()=>{const perspective=camera as PerspectiveCamera;const tangent=Math.tan(perspective.fov*Math.PI/360);const distance=Math.max(analysis.widthMm/(2*tangent*(size.width/Math.max(size.height,1))),analysis.heightMm/(2*tangent),depthMm*2,1)*1.3;
    perspective.near=Math.max(.01,distance/10000);perspective.far=distance*100;perspective.updateProjectionMatrix();
    camera.position.set(view==='perspective'?distance*.25:0,view==='perspective'?distance*.18:0,view==='back'?-distance:distance);camera.up.set(0,1,0);controls.current?.target.set(0,0,0);controls.current?.update();invalidate();
  },[analysis.widthMm,analysis.heightMm,depthMm,view,resetToken,size.width,size.height,camera,invalidate]);
  useEffect(()=>{const factor=Math.pow(1.25,previousZoom.current-zoomStep);previousZoom.current=zoomStep;const orbit=controls.current;if(orbit){camera.position.sub(orbit.target).multiplyScalar(factor).add(orbit.target);orbit.update();invalidate();}},[zoomStep,camera,invalidate]);
  return null;
}
function LetterModel({analysis,colors,ledEnabled,depthMm,frontThicknessMm,backThicknessMm,backEnabled}:Props){
  const model=useMemo(()=>{
    const elements=new Map<string,typeof analysis.contours>();
    for(const contour of analysis.contours){if(!contour.closed||contour.duplicateOf||contour.operation!=='cut')continue;elements.set(contour.elementId,[...(elements.get(contour.elementId)||[]),contour]);}
    const paths=[...elements.values()].map(contours=>`<path fill="black" fill-rule="${contours[0].fillRule}" d="${contours.map(c=>c.path).join(' ')}"/>`).join('');
    const data=new SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg">${paths}</svg>`);const shapes=data.paths.flatMap(path=>path.toShapes());
    const frontDepth=Math.min(Math.max(frontThicknessMm,.2),depthMm/2);
    const backDepth=backEnabled?Math.min(Math.max(backThicknessMm,.2),depthMm-frontDepth):0;
    const edgeDepth=Math.max(depthMm-frontDepth-backDepth,.01);
    const extrude=(depth:number)=>new ExtrudeGeometry(shapes,{depth,bevelEnabled:false,curveSegments:48,steps:1});
    return {sides:extrude(edgeDepth),front:extrude(frontDepth),back:backDepth>0?extrude(backDepth):null,edgeDepth,frontDepth,backDepth};
  },[analysis,depthMm,frontThicknessMm,backThicknessMm,backEnabled]);
  useEffect(()=>()=>{model.sides.dispose();model.front.dispose();model.back?.dispose();},[model]);
  const centerX=analysis.viewBox[0]+analysis.widthMm/2,centerY=analysis.viewBox[1]+analysis.heightMm/2;
  return <group position={[-centerX,centerY,-depthMm/2]} scale={[1,-1,1]} dispose={null}>
    <mesh geometry={model.sides} position={[0,0,model.backDepth]}><meshPhysicalMaterial color={colors.edge} side={DoubleSide} roughness={.28} metalness={.025} clearcoat={.42} clearcoatRoughness={.2}/></mesh>
    <mesh geometry={model.front} position={[0,0,depthMm-model.frontDepth]}><meshPhysicalMaterial color={colors.front} emissive={ledEnabled?colors.front:'#000000'} emissiveIntensity={ledEnabled?0.58:0} side={DoubleSide} roughness={ledEnabled?0.2:0.24} metalness={.015} clearcoat={.62} clearcoatRoughness={.16}/></mesh>
    {model.back?<mesh geometry={model.back}><meshPhysicalMaterial color={colors.back} side={DoubleSide} roughness={.24} metalness={.015} clearcoat={.62} clearcoatRoughness={.16}/></mesh>:null}
  </group>;
}
export default function ThreePreview(props:Props){
  const [view,setView]=useState<View>('perspective');const [zoomStep,setZoomStep]=useState(0);const [reset,setReset]=useState(0);
  return <div className="three-preview" data-three-viewport><ViewerBoundary><Canvas frameloop="demand" dpr={[1,2]} camera={{fov:35,position:[0,0,500]}} gl={{antialias:true}} fallback={<span>Modelo tridimensional de las letras corpóreas</span>}><color attach="background" args={['#3a414b']}/><hemisphereLight color="#f8fbff" groundColor="#42464d" intensity={1.45}/><directionalLight position={[300,450,700]} intensity={2.7}/><directionalLight position={[-300,-150,-400]} intensity={1.8}/><directionalLight position={[0,100,-500]} intensity={1.1}/><LetterModel {...props}/><CameraControls analysis={props.analysis} depthMm={props.depthMm} view={view} resetToken={props.resetToken+reset} zoomStep={zoomStep}/></Canvas></ViewerBoundary>
    <div className="three-view-controls" role="group" aria-label="Orientación del modelo 3D">{([['perspective','Perspectiva'],['front','Frente'],['back','Fondo']] as const).map(([key,label])=><button type="button" key={key} aria-pressed={view===key} onClick={()=>setView(key)}>{label}</button>)}</div>
    <div className="three-depth">Profundidad {num(props.depthMm)} mm</div><div className="three-help">Arrastra para girar · rueda para acercar · botón derecho para mover</div>
    <div className="zoom-toolbar"><IconButton label="Alejar modelo 3D" onClick={()=>setZoomStep(n=>Math.max(n-1,-15))}><Minus size={15}/></IconButton><IconButton label="Acercar modelo 3D" onClick={()=>setZoomStep(n=>Math.min(n+1,20))}><Plus size={15}/></IconButton><IconButton label="Restablecer modelo 3D" onClick={()=>setReset(n=>n+1)}><RotateCcw size={15}/></IconButton><IconButton label="Encuadrar modelo 3D" onClick={()=>setReset(n=>n+1)}><Maximize size={15}/></IconButton></div>
    <div className="three-color-key">{(['front','edge','back'] as const).filter(k=>k!=='back'||props.backEnabled).map(k=><span key={k}><i style={{backgroundColor:props.colors[k]}}/>{k==='front'?'Frente':k==='edge'?'Cantos':'Fondo'}</span>)}</div>
  </div>;
}
