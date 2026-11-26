(function(){
  const $=id=>document.getElementById(id);
  const sb=supabase.createClient(NOOR.SUPABASE_URL,NOOR.SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  let mode="in";
  const say=(el,t,ok)=>{el.textContent=t;el.className="msg "+(ok?"ok":"err")};
  const AR={"Invalid login credentials":"البريد أو كلمة المرور غير صحيحة.","Email not confirmed":"أكّد بريدك أولاً من الرسالة التي وصلتك.","User already registered":"هذا البريد مسجّل بالفعل."};
  const err=e=>AR[e&&e.message]||"حدث خطأ. حاول مرة أخرى.";
  function setMode(m){
    mode=m;
    $("tabIn").classList.toggle("on",m==="in");$("tabUp").classList.toggle("on",m==="up");
    $("nameRow").hidden=$("consentRow").hidden=m!=="up";
    $("pw").autocomplete=m==="up"?"new-password":"current-password";
    $("submit").textContent=m==="up"?"إنشاء حساب":"دخول";
    $("forgot").hidden=m==="up";
    $("gmsg").textContent="";
  }
  $("tabIn").onclick=()=>setMode("in");$("tabUp").onclick=()=>setMode("up");
  $("form").addEventListener("submit",async e=>{
    e.preventDefault();
    const email=$("email").value.trim(),pw=$("pw").value,btn=$("submit");
    btn.disabled=true;
    try{
      if(mode==="up"){
        if(!$("consent").checked){say($("gmsg"),"لازم توافق على شرط حفظ البيانات.");return}
        if(pw.length<10){say($("gmsg"),"كلمة المرور قصيرة.");return}
        const {error}=await sb.auth.signUp({email,password:pw,options:{data:{name:$("name").value.trim().slice(0,60)},emailRedirectTo:location.origin+location.pathname}});
        if(error)return say($("gmsg"),err(error));
        say($("gmsg"),"تم. افتح بريدك واضغط رابط التأكيد ثم ادخل.",true);
      }else{
        const {error}=await sb.auth.signInWithPassword({email,password:pw});
        if(error)return say($("gmsg"),err(error));
        show();
      }
    }finally{btn.disabled=false}
  });
  $("forgot").onclick=async()=>{
    const email=$("email").value.trim();
    if(!email)return say($("gmsg"),"اكتب بريدك أولاً.");
    await sb.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname});
    say($("gmsg"),"لو البريد مسجّل هيوصلك رابط لتغيير كلمة المرور.",true);
  };
  async function show(){
    const {data:{session}}=await sb.auth.getSession();
    $("guest").hidden=!!session;$("member").hidden=!session;
    if(!session)return;
    const u=session.user;
    $("mail").textContent=u.email;
    const {data:p}=await sb.from("profiles").select("display_name").eq("id",u.id).maybeSingle();
    const n=(p&&p.display_name)||"";
    $("hello").textContent="أهلاً"+(n?" "+n:"");$("dn").value=n;
    const {data:d}=await sb.from("user_data").select("data").eq("user_id",u.id).maybeSingle();
    const lr=d&&d.data&&d.data.lastRead;
    $("lastRead").textContent=lr&&typeof lr.surah==="number"?"سورة رقم "+lr.surah+" آية "+(lr.ayah||1):"لا يوجد بعد.";
  }
  $("saveName").onclick=async()=>{
    const {data:{session}}=await sb.auth.getSession();if(!session)return;
    const {error}=await sb.from("profiles").update({display_name:$("dn").value.trim().slice(0,60)}).eq("id",session.user.id);
    say($("mmsg"),error?"تعذّر الحفظ.":"تم الحفظ.",!error);
  };
  $("out").onclick=async()=>{await sb.auth.signOut();show()};
  $("del").onclick=async()=>{
    if(!confirm("هيتم حذف حسابك وكل بياناتك نهائياً. متأكد؟"))return;
    const {error}=await sb.rpc("delete_my_account");
    if(error)return say($("mmsg"),"تعذّر الحذف.");
    await sb.auth.signOut();show();
  };
  sb.auth.onAuthStateChange(ev=>{if(ev==="PASSWORD_RECOVERY"){const p=prompt("اكتب كلمة مرور جديدة (١٠ حروف على الأقل)");if(p&&p.length>=10)sb.auth.updateUser({password:p}).then(show)}});
  setMode("in");show();
})();
