(function(){
  const $=id=>document.getElementById(id);
  const sb=supabase.createClient(NOOR.SUPABASE_URL,NOOR.SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true}});
  let list=[];
  const fmt=d=>d?new Date(d).toLocaleDateString("ar-EG",{year:"numeric",month:"short",day:"numeric"}):"-";
  function cell(tr,t,dir){const td=document.createElement("td");td.textContent=t;if(dir)td.dir=dir;tr.appendChild(td)}
  function render(){
    const tb=$("rows");tb.textContent="";
    list.forEach(u=>{const tr=document.createElement("tr");
      cell(tr,u.display_name||"-");cell(tr,u.email,"ltr");cell(tr,fmt(u.created_at));
      cell(tr,u.email_confirmed?"مؤكَّد":"غير مؤكَّد");cell(tr,fmt(u.last_sign_in_at));tb.appendChild(tr)});
  }
  async function load(q){
    const {data,error}=await sb.rpc("admin_list_users",{p_search:q||""});
    if(error)throw error;list=data||[];render();
  }
  async function enter(){
    const {data:ok}=await sb.rpc("is_admin");
    if(ok!==true){await sb.auth.signOut();$("login").hidden=false;$("dash").hidden=true;$("out").hidden=true;$("lmsg").textContent="هذا الحساب ليس أدمن.";return}
    $("login").hidden=true;$("dash").hidden=false;$("out").hidden=false;
    const {data:s}=await sb.rpc("admin_stats");const r=s&&s[0]||{};
    $("sTotal").textContent=r.total??"-";$("sNew").textContent=r.new_7d??"-";$("sConf").textContent=r.confirmed??"-";$("sAct").textContent=r.active_7d??"-";
    await load("");
  }
  $("form").addEventListener("submit",async e=>{
    e.preventDefault();$("lmsg").textContent="";
    const {error}=await sb.auth.signInWithPassword({email:$("email").value.trim(),password:$("pw").value});
    $("pw").value="";
    if(error){$("lmsg").textContent="بيانات الدخول غير صحيحة.";return}
    await enter();
  });
  let t;$("q").addEventListener("input",()=>{clearTimeout(t);t=setTimeout(()=>load($("q").value.trim()).catch(()=>{}),300)});
  $("out").onclick=async()=>{await sb.auth.signOut();location.reload()};
  $("copy").onclick=async()=>{
    const cut=Date.now()-3*864e5,n=list.filter(u=>new Date(u.created_at)>cut);
    const txt="تسجيلات آخر ٣ أيام: "+n.length+"\n"+n.map(u=>"- "+(u.display_name||"بدون اسم")+" | "+u.email+" | "+fmt(u.created_at)+" | "+(u.email_confirmed?"مؤكَّد":"غير مؤكَّد")).join("\n");
    try{await navigator.clipboard.writeText(txt);$("dmsg").className="msg ok";$("dmsg").textContent="تم النسخ."}catch(_){$("dmsg").className="msg err";$("dmsg").textContent="تعذّر النسخ."}
  };
  sb.auth.getSession().then(({data:{session}})=>{if(session)enter()});
})();
