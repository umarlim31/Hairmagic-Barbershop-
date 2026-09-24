import { beforeEach, afterEach, test } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
const context = { user: null, owner: false, calls: [], report: { counts: [], rows: [] } };
globalThis.__hm = context;
const nativeFetch = globalThis.fetch;
async function route(entry) {
  const result = await build({ entryPoints: [entry], bundle: true, write: false, format: "esm", platform: "node", plugins: [{ name: "auth-boundary", setup(b) {
    b.onResolve({filter: /supabase-server$/}, () => ({path:"auth",namespace:"test"}));
    b.onLoad({filter: /.*/,namespace:"test"},()=>({contents: `export async function createServerSupabase() { const c=globalThis.__hm; return { auth: { getUser: async()=>({data:{user:c.user},error:null}) }, from: ()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:c.owner?{user_id:c.user.id}:null,error:null})})})}), rpc:async(name,payload)=>{c.calls.push({name,payload});return {data:c.report,error:null};} }; }` }));
  }}] });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);
}
const submit=await route("app/api/feedback/route.ts");
const report=await route("app/api/owner/feedback/route.ts");
const booking=await route("app/api/bookings/route.ts");
const availability=await route("app/api/availability/route.ts");
beforeEach(()=> { context.user=null; context.owner=false; context.calls=[]; context.report={counts:[],rows:[]}; globalThis.fetch=async(url,options)=>{context.calls.push({url:String(url),options});return Response.json(null);}; });
afterEach(()=>{globalThis.fetch=nativeFetch;});
const body=override=>({submissionId:crypto.randomUUID(),rating:5,message:"  Ramah.  ",website:"",...override});
const post=(path,value,headers={})=>new Request(`https://hairmagic.test${path}`,{method:"POST",headers:{"Content-Type":"application/json",origin:"https://hairmagic.test",...headers},body:JSON.stringify(value)});
const get=()=>new Request("https://hairmagic.test/api/owner/feedback");
test("anonymous feedback sends only anonymous fields with publishable key",async()=>{
 const input=body(); const response=await submit.POST(post("/api/feedback",input)); assert.equal(response.status,201); assert.deepEqual(await response.json(),{ok:true});
 const call=context.calls[0]; assert.match(call.options.headers.apikey,/^sb_publishable_/);assert.equal(call.options.headers.Authorization,undefined);
 assert.deepEqual(Object.keys(JSON.parse(call.options.body).payload).sort(),["id","message","rating","submitted_day"]);
 assert.equal(JSON.parse(call.options.body).payload.message,"Ramah.");
});
test("invalid ratings, identity fields and honeypots never reach database",async()=>{
 for(const invalid of [{rating:0},{rating:6},{rating:2.5},{rating:"5"},{customerName:"Forbidden"},{owner:true},{website:"spam"},{message:"x".repeat(1501)}]) assert.equal((await submit.POST(post("/api/feedback",body(invalid)))).status,400);
 assert.equal(context.calls.length,0);
});
test("cross-site and oversized feedback fail before database",async()=>{
 assert.equal((await submit.POST(post("/api/feedback",body(),{origin:"https://evil.test"}))).status,403);
 assert.equal((await submit.POST(post("/api/feedback",body({message:"x".repeat(9000)})))).status,413);assert.equal(context.calls.length,0);
});
test("provider error never becomes successful submission or exposes content",async()=>{
 globalThis.fetch=async()=>Response.json({message:"PRIVATE DATABASE DETAIL"},{status:500});const r=await submit.POST(post("/api/feedback",body()));assert.equal(r.status,503);assert.ok(!(await r.text()).includes("PRIVATE"));
});
test("anonymous report access is denied without database queries",async()=>{assert.equal((await report.GET(get())).status,401);assert.equal(context.calls.length,0);});
test("authenticated non-owner and forged owner email remain denied",async()=>{
 context.user={id:"outsider",email:"owner@example.test",user_metadata:{role:"owner"}};assert.equal((await report.GET(get())).status,403);assert.equal(context.calls.length,0);
});
test("owner report uses authenticated RPC and private cache headers",async()=>{
 context.user={id:"owner-id"};context.owner=true;context.report={counts:[{rating:5,count:23}],rows:Array.from({length:21},()=>({id:crypto.randomUUID(),rating:5,message:"",submittedDay:"2026-09-24"}))};
 const r=await report.GET(get());const data=await r.json();assert.equal(r.status,200);assert.match(r.headers.get("Cache-Control"),/private.*no-store/);assert.equal(data.summary.total,23);assert.equal(data.items.length,20);assert.ok(data.nextCursor);assert.equal(context.calls[0].name,"hm_feedback_report");
});
test("invalid report cursors rejected",async()=>{context.user={id:"owner"};context.owner=true;assert.equal((await report.GET(new Request("https://hairmagic.test/api/owner/feedback?cursor=invalid"))).status,400);assert.equal(context.calls.length,0);});
test("invalid barber, closed day and past date do not reserve a slot",async()=>{
 const base={customerName:"Test",customerPhone:"08123456789",bookingDate:"2030-01-01",startTime:"10:00",barberId:"umar"};
 for(const invalid of [{barberId:"erdi"},{bookingDate:"2026-09-28"},{bookingDate:"2026-02-30"},{bookingDate:"2020-01-01"},{startTime:"12:00"}]) assert.equal((await booking.POST(post("/api/bookings",{...base,...invalid}))).status,400);
 assert.equal(context.calls.length,0);
});
test("booking conflict returns 409 without a false confirmation",async()=>{
 globalThis.fetch=async()=>Response.json(false);const r=await booking.POST(post("/api/bookings",{customerName:"Test",customerPhone:"08123456789",bookingDate:"2030-01-01",startTime:"10:00",barberId:"umar"}));assert.equal(r.status,409);assert.equal((await r.json()).booking,undefined);
});
test("successful booking keeps the Astra WhatsApp contract",async()=>{
 globalThis.fetch=async()=>Response.json(true);const r=await booking.POST(post("/api/bookings",{customerName:"Test",customerPhone:"08123456789",bookingDate:"2030-01-01",startTime:"10:00",barberId:"umar"}));const d=await r.json();assert.equal(r.status,201);assert.equal(d.booking.status,"pending");assert.equal(d.booking.endTime,"10:40");assert.match(d.whatsappUrl,/^https:\/\/wa.me\/62895374034221/);
});
test("availability removes full and selected-barber slots",async()=>{
 globalThis.fetch=async()=>Response.json([{barber_id:"umar",start_time:"10:00"},{barber_id:null,start_time:"10:40"},{barber_id:null,start_time:"10:40"},{barber_id:null,start_time:"10:40"}]);const r=await availability.GET(new Request("https://hairmagic.test/api/availability?date=2030-01-01&barber=umar"));const d=await r.json();assert.equal(d.capacity,3);assert.ok(!d.slots.includes("10:00"));assert.ok(!d.slots.includes("10:40"));assert.ok(d.slots.includes("11:20"));
});
test("availability outage fails closed instead of displaying all slots",async()=>{
 globalThis.fetch=async()=>{throw new Error("Network");};const r=await availability.GET(new Request("https://hairmagic.test/api/availability?date=2030-01-01"));assert.equal(r.status,503);assert.equal((await r.json()).slots,undefined);
});
