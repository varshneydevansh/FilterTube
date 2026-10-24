import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url), protocol=require('../../js/personal_sync.js'), core=require('../../js/device_auto_sync.js');
const source=fs.readFileSync(new URL('../../js/tab-view.js',import.meta.url),'utf8');
const section=(a,b)=>source.slice(source.indexOf(a),source.indexOf(b,source.indexOf(a)));
function fixture({firefox=false}={}) {
 let root={activeProfileId:'Parent',profiles:{Parent:{type:'account',name:'Parent',settings:{enabled:true},main:{keywords:[]}},Child:{type:'child',parentProfileId:'Parent',main:{keywords:[{word:'retain-child'}]}}}};
 let writes=0, loads=0, beforeLoad=null, deps;
 const io={loadProfilesV4:async()=>{loads++;await beforeLoad?.(loads);return structuredClone(root)},saveProfilesV4:async value=>{root=structuredClone(value);writes++}};
 const api={runtime:{id:'test',lastError:null,onMessage:{addListener(){}},getURL:p=>'chrome-extension://test/'+p,sendMessage:(r,done)=>done({ok:true})},storage:{local:{get:(keys,done)=>done({}),set:(data,done)=>done()},onChanged:{addListener(){}}}};
 const box={chrome:api,safeArray:value=>Array.isArray(value)?value:[],navigator:{locks:{request:(_n,_o,fn)=>fn()}},console,document:{getElementById:()=>({}),addEventListener(){}},
  loadNanahTrustedLinks:async()=>{},nanahTrustedLinks:[],NANAH_TRUSTED_LINKS_KEY:'ftNanahTrustedLinks',nanahStableDeviceId:'device-a',nanahSessionState:{},nanahClient:null,
  getNanahRole:()=> 'peer',getNanahRemoteLabel:()=> 'Other device',nanahFamilyDeviceSelectedIntent:null,
  refreshFilterTubeUiAfterNanahImport:async()=>{},runNanahManagedBackgroundSync:async()=>{},
  nanahManagedLivePolicy:{},getManagedTimeLimitPolicy:()=>null,addEventListener(){},tabViewUiText:(_k,f)=>f,
  FilterTubeNanahStorageLock:{run:fn=>fn()},FilterTubeIO:io,FilterTubePersonalSync:protocol,FilterTubeDeviceAutoSync:{...core,create:options=>{deps=options;return {schedule(){},view:async()=>({})}}},
  FilterTubeAutoSyncQueue:{create:()=>({})},FilterTubeDeviceAutoSyncUI:{install:()=>({ready:Promise.resolve()})}};
 if(firefox){
  api.runtime.sendMessage=async request=>({ok:true});
  api.storage.local.get=async keys=>({});
  api.storage.local.set=async values=>{};
  box.browser=api;
 }
 box.window=box;vm.createContext(box);vm.runInContext(section('    // Automatic updates reuse','    async function runNanahManagedOpenSync('),box);
 return {box,ready:()=>box.initializeDeviceAutoSync(),get deps(){return deps},get root(){return root},get writes(){return writes},intercept:fn=>{beforeLoad=fn}};
}
test('dashboard adapter supports callback Chrome and promise-only Firefox APIs',async()=>{
 for(const firefox of [false,true]){
  const f=fixture({firefox});await f.ready();
  const context=await f.deps.context();
  assert.equal(context.unlocked,true);assert.equal(context.profilesV4.activeProfileId,'Parent');
  await f.deps.set({test:true});assert.deepEqual(await f.deps.get(['test']),{});
 }
});
test('real dashboard settings writer refuses an edit made after runtime merge observed its base',async()=>{
 const f=fixture();await f.ready();const expected=protocol.snapshotSettings(f.root.profiles.Parent),remote=structuredClone(expected);remote.settings.enabled=false;
 f.root.profiles.Parent.main.keywords=[{word:'local-new'}];
 await assert.rejects(f.deps.applySettings('Parent',remote,async()=>true,expected),/Settings changed here/);
 assert.equal(f.writes,0);assert.equal(f.root.profiles.Parent.main.keywords[0].word,'local-new');
});
test('real dashboard writer preserves sibling and unrelated current profile fields',async()=>{
 const f=fixture();await f.ready();const expected=protocol.snapshotSettings(f.root.profiles.Parent),remote=structuredClone(expected);remote.settings.enabled=false;
 f.root.profiles.Parent.futureLocalOnly={keep:true};
 await f.deps.applySettings('Parent',remote,async()=>true,expected);
 assert.equal(f.writes,1);assert.equal(f.root.profiles.Parent.settings.enabled,false);assert.equal(f.root.profiles.Parent.futureLocalOnly.keep,true);
 assert.equal(f.root.profiles.Child.main.keywords[0].word,'retain-child');
});
test('real dashboard writer rechecks active profile and security around waits',async()=>{
 for(const change of [f=>{f.root.activeProfileId='Child'},f=>{f.root.profiles.Parent.security={profilePinVerifier:{changed:true}}}]){
  const f=fixture();await f.ready();const expected=protocol.snapshotSettings(f.root.profiles.Parent),remote=structuredClone(expected);remote.settings.enabled=false;
  let calls=0;await assert.rejects(f.deps.applySettings('Parent',remote,async()=>{calls++;if(calls===2)change(f);return true},expected),/profile|access|Settings/i);
  assert.equal(calls,2);
  assert.equal(f.writes,0);
 }
});
test('receiver readiness announces only its exact saved automatically approved source routes',async()=>{
 const sent=[];const box={nanahClient:{send:async message=>sent.push(message)},getNanahRole:()=> 'replica',
  nanahSessionState:{connected:true,sasConfirmed:true,autoSyncVersion:1,remoteRole:'source',remoteDevice:{deviceId:'parent-device'},remoteProfile:{profileId:'parent-A'}},
  normalizeString:v=>typeof v==='string'?v.trim():'',loadNanahTrustedLinks:async()=>{},nanahTrustedLinks:[
   {linkId:'allowed',localRole:'replica',remoteRole:'source',remoteDeviceId:'parent-device',sourceProfileId:'parent-A',policy:{autoApplyControlProposals:true,reconnectMode:'fast'}},
   {linkId:'review',localRole:'replica',remoteRole:'source',remoteDeviceId:'parent-device',sourceProfileId:'parent-A',policy:{autoApplyControlProposals:false,reconnectMode:'fast'}},
   {linkId:'other-parent',localRole:'replica',remoteRole:'source',remoteDeviceId:'parent-device',sourceProfileId:'parent-B',policy:{autoApplyControlProposals:true,reconnectMode:'fast'}}
  ]};
 vm.createContext(box);vm.runInContext(section('    async function sendNanahAutoSyncReadiness()', '    async function sendNanahHelloEnvelope('),box);
 await box.sendNanahAutoSyncReadiness();assert.deepEqual(Array.from(sent[0].linkIds),['allowed']);
 box.nanahTrustedLinks[0].policy.reconnectMode='approval_needed';await box.sendNanahAutoSyncReadiness();assert.deepEqual(Array.from(sent[1].linkIds),[]);
 box.nanahSessionState.trustedReconnectApproved=true;box.nanahSessionState.trustedReconnectDeviceId='parent-device';await box.sendNanahAutoSyncReadiness();assert.deepEqual(Array.from(sent[2].linkIds),['allowed']);
 box.nanahSessionState.sasConfirmed=false;await box.sendNanahAutoSyncReadiness();assert.equal(sent.length,3);
});
test('dashboard preserves a strong accepted-payload digest for replay validation while retaining legacy state',()=>{
 const box={safeObject:value=>value&&typeof value==='object'?value:{},normalizeString:value=>typeof value==='string'?value.trim():'',
  normalizeNonNegativeInteger:value=>Number.isSafeInteger(value)&&value>=0?value:null};
 vm.createContext(box);vm.runInContext(section('    function getManagedNanahPolicyAcceptedState(', '    function findNanahTrustedLinkForManagedEnvelope('),box);
 const accepted={revision:3,policyHash:'same-legacy-hash',payloadSha256:'sha256:'+'A'.repeat(43)};
 const profile={managedPolicyState:{remoteManagedPolicies:{link:{main:accepted}}}};
 assert.deepEqual(JSON.parse(JSON.stringify(box.getManagedNanahPolicyAcceptedState(profile,'link','main'))),accepted);
 delete accepted.payloadSha256;
 assert.deepEqual(JSON.parse(JSON.stringify(box.getManagedNanahPolicyAcceptedState(profile,'link','main'))),accepted);
 assert.equal(box.getManagedNanahPolicyAcceptedState(profile,'other-link','main'),null);
});
