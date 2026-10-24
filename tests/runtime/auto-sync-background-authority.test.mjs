import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
const source = fs.readFileSync(new URL('../../js/background.js', import.meta.url), 'utf8');
const protocol = require('../../js/personal_sync.js'), controller = require('../../js/device_auto_sync.js');
const code = source.slice(source.indexOf('function isAutoSyncDashboardSender('), source.indexOf('try { globalThis.FilterTubeAutoSyncWakeup'));
const origin = 'chrome-extension://test/';
function fixture() {
 const profile = {type:'account', settings:{}, security:{}}, root = {activeProfileId:'Parent',profiles:{Parent:profile,Child:{type:'child',parentProfileId:'Parent'}}};
 const peer = {linkId:'peer-one',remoteDeviceId:'device-b',linkType:'peer_link',localRole:'peer',remoteRole:'peer',createdAt:'fixed'};
 const key={kty:'OKP',crv:'Ed25519',x:'a'.repeat(43)};
 const grant=protocol.normalizeGrant({localDeviceId:'device-a',localProfileId:'Parent',remoteDeviceId:'device-b',remoteProfileId:'OtherParent',localGrantId:'local-grant',remoteGrantId:'remote-grant',localGeneration:1,remoteGeneration:1,areas:['notes'],enabled:true,localPublicKeyJwk:key,remotePublicKeyJwk:key});
 const row={grant,confirmed:true,securityFingerprint:controller.security(root,'Parent'),peerBinding:protocol.peerBinding([peer],'device-b')};
 const data={ftProfilesV4:root,ftNanahDeviceId:'device-a',ftNanahTrustedLinks:[peer],ftDeviceAutoSyncV1:{version:1,managed:[],personal:[row]}};
 let unlocked=true;
 const box={browserAPI:{runtime:{id:'test',getURL:path=>origin+path}},storageGet:async()=>data,
  isProfileSessionAuthorized:()=>unlocked,FilterTubePersonalSync:protocol,FilterTubeDeviceAutoSync:controller};
 vm.createContext(box);vm.runInContext(code,box);
 return {box,data,row,root,peer,lock:()=>{unlocked=false}};
}
const sender=()=>({id:'test',frameId:0,url:origin+'html/tab-view.html#account',tab:{id:123}});
test('only the exact top-level dashboard can query current profile authorization',async()=>{
 const f=fixture();let reply;
 assert.equal(f.box.handleAutoSyncAuthorization({action:'FilterTube_AutoSyncAuthorize',profileId:'Parent'},sender(),r=>{reply=r}),true);
 await Promise.resolve();assert.equal(reply.ok,true);
 reply=null;f.box.handleAutoSyncAuthorization({action:'FilterTube_AutoSyncAuthorize',profileId:'Parent'},{id:'test',url:origin+'html/tab-view.html#account'},r=>{reply=r});await Promise.resolve();assert.equal(reply.ok,true);
 for(const bad of [{...sender(),url:'https://www.youtube.com/watch?v=abcdefghijk'},{...sender(),id:'other'}, {...sender(),frameId:2}, {...sender(),url:origin+'html/tab-view.html?profile=Parent'}, {...sender(),url:origin+'html/video-notes.html'}]){
  reply=null; assert.equal(f.box.handleAutoSyncAuthorization({action:'FilterTube_AutoSyncAuthorize',profileId:'Parent'},bad,r=>{reply=r}),false);assert.equal(reply.ok,false);
 }
});
test('private notes require confirmed exact profile device grant and fresh unlocked authority',async()=>{
 const f=fixture(),auth=()=>f.box.authorizePersonalNotesSync('Parent',{grantId:'local-grant'});
 assert.equal(await auth(),true);assert.equal(await f.box.authorizePersonalNotesSync('Child',{grantId:'local-grant'}),false);
 f.row.confirmed=false;assert.equal(await auth(),false);f.row.confirmed=true;
 f.data.ftNanahDeviceId='wrong';assert.equal(await auth(),false);f.data.ftNanahDeviceId='device-a';
 f.lock();assert.equal(await auth(),false);
});
test('unlink, re-pair, scope reduction, profile switch and security edits revoke private notes access',async()=>{
 for(const change of [f=>{f.peer.revoked=true},f=>{f.data.ftNanahTrustedLinks=[]},f=>{f.peer.createdAt='new-pair'},f=>{f.row.grant.areas=['settings']},f=>{f.root.activeProfileId='Child'},f=>{f.root.profiles.Parent.security.profilePinVerifier={version:2}},f=>{f.row.invalidated=true}]){
  const f=fixture();assert.equal(await f.box.authorizePersonalNotesSync('Parent',{grantId:'local-grant'}),true);change(f);
  assert.equal(await f.box.authorizePersonalNotesSync('Parent',{grantId:'local-grant'}),false);
 }
});
test('foreign grant ids and ambiguous peer rows never authorize export',async()=>{
 const f=fixture();assert.equal(await f.box.authorizePersonalNotesSync('Parent',{grantId:'foreign'}),false);
 f.data.ftNanahTrustedLinks.push({...f.peer,linkId:'peer-two'});
 assert.equal(await f.box.authorizePersonalNotesSync('Parent',{grantId:'local-grant'}),false);
});
