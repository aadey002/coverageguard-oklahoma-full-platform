import AppP1 from "./app_p1.jsx";
import AppP2 from "./app_p2.jsx";
import { useState } from "react";


const PLATFORM_CREDS = {
  maryland: "certcore2027",
  oklahoma: "sooner2027",
  kansas: "sunflower2027",
  newyork: "empire2027",
  q5d: "quantum5d!dev",
};

function LoginGate({ children }) {
  const [authed, setAuthed] = useState(() => {
    const ts = sessionStorage.getItem("cg_platform_auth_ts");
    if (!ts || !sessionStorage.getItem("cg_platform_auth")) return false;
    if (Date.now() - parseInt(ts, 10) > 24 * 60 * 60 * 1000) {
      sessionStorage.removeItem("cg_platform_auth");
      sessionStorage.removeItem("cg_platform_auth_ts");
      sessionStorage.removeItem("cg_platform_org");
      return false;
    }
    return true;
  });
  const [org, setOrg] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [showPass, setShowPass] = useState(false);

  if (authed) return children;

  const doLogin = () => {
    const key = org.trim().toLowerCase();
    if (!PLATFORM_CREDS[key] || PLATFORM_CREDS[key] !== pass) {
      setErr("Invalid organization code or access key");
      return;
    }
    sessionStorage.setItem("cg_platform_auth", "1");
    sessionStorage.setItem("cg_platform_auth_ts", String(Date.now()));
    sessionStorage.setItem("cg_platform_org", key);
    setAuthed(true);
  };

  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#F3F1FC",fontFamily:"ui-sans-serif,system-ui,-apple-system,sans-serif"}}>
      <div style={{background:"#fff",border:"1px solid #E1E1E1",borderRadius:16,padding:36,width:"100%",maxWidth:380,boxShadow:"0 2px 20px rgba(75,60,150,.08)"}}>
        <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:24}}>
          <div style={{width:34,height:34,borderRadius:9,background:"#4B3C96",display:"grid",placeItems:"center"}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <div>
            <div style={{fontSize:15,fontWeight:800,color:"#00003C"}}>CoverageGuard <span style={{color:"#4B3C96"}}>IQ</span></div>
            <div style={{fontSize:10,color:"#9B92C8",textTransform:"uppercase",letterSpacing:.4}}>Secure Access Required</div>
          </div>
        </div>
        <div style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:.5,color:"#5A4B96",marginBottom:6}}>Organization code</div>
        <input value={org} onChange={e=>{setOrg(e.target.value);setErr("");}}
          onKeyDown={e=>e.key==="Enter"&&doLogin()}
          placeholder="e.g. maryland, oklahoma, kansas, newyork, or q5d"
          style={{width:"100%",boxSizing:"border-box",background:"#F3F1FC",border:"1.5px solid #E1E1E1",borderRadius:9,padding:"10px 13px",fontSize:13,color:"#00003C",outline:"none",marginBottom:12,fontFamily:"inherit"}}/>
        <div style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:.5,color:"#5A4B96",marginBottom:6}}>Access key</div>
        <div style={{position:"relative",marginBottom:16}}>
          <input value={pass} onChange={e=>{setPass(e.target.value);setErr("");}}
            onKeyDown={e=>e.key==="Enter"&&doLogin()}
            type={showPass?"text":"password"} placeholder="Enter access key"
            style={{width:"100%",boxSizing:"border-box",background:"#F3F1FC",border:"1.5px solid #E1E1E1",borderRadius:9,padding:"10px 13px",fontSize:13,color:"#00003C",outline:"none",fontFamily:"inherit"}}/>
          <button onClick={()=>setShowPass(!showPass)} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",fontSize:11,color:"#5A4B96",cursor:"pointer",fontWeight:700}}>{showPass?"Hide":"Show"}</button>
        </div>
        {err&&<div style={{fontSize:12,color:"#C8472E",marginBottom:10}}>{err}</div>}
        <button onClick={doLogin} style={{width:"100%",background:"#4B3C96",color:"#fff",border:"none",borderRadius:9,padding:12,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Sign in</button>
        <div style={{fontSize:10,color:"#9B92C8",textAlign:"center",marginTop:14}}>
          {"Confidential · Patent Pending · U.S. Prov. App. No. 64/102,709"}
          <br/>Quantum 5D Consulting LLC
        </div>
      </div>
    </div>
  );
}

function AppInner() {
  const [product, setProduct] = useState("certcore");
  return (
    <>
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        background: "#0A2E38", padding: "8px 16px",
        position: "sticky", top: 0, zIndex: 100
      }}>
        <span style={{color:"#fff",fontWeight:800,fontSize:13}}>
          CoverageGuard IQ — Oklahoma
        </span>
        <button onClick={() => setProduct("certcore")}
          style={{background: product==="certcore" ? "#0F8CA8" : "transparent",
            color:"#fff", border:"1px solid #0F8CA8", borderRadius:8,
            padding:"5px 14px", fontSize:12, fontWeight:700, cursor:"pointer"}}>
          CertCore
        </button>
        <button onClick={() => setProduct("coverage")}
          style={{background: product==="coverage" ? "#0F8CA8" : "transparent",
            color:"#fff", border:"1px solid #0F8CA8", borderRadius:8,
            padding:"5px 14px", fontSize:12, fontWeight:700, cursor:"pointer"}}>
          Coverage Intelligence
        </button>
      </div>
      <div style={{display: product==="certcore" ? "block" : "none", height:"calc(100vh - 44px)"}}>
        <AppP1 />
      </div>
      <div style={{display: product==="coverage" ? "block" : "none", height:"calc(100vh - 44px)"}}>
        <AppP2 />
      </div>
    </>
  );
}

export default function App() { return <LoginGate><AppInner/></LoginGate>; }
