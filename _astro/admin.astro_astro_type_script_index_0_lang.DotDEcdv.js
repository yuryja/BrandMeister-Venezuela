const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["_astro/encode.B7qyjpkk.js","_astro/preload-helper.B3nfOi5I.js"])))=>i.map(i=>d[i]);
import{t as e}from"./preload-helper.B3nfOi5I.js";var t={admin:`Administrador`,editor:`Editor`,author:`Autor`},n=e=>String(e??``).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`);async function r(e,t,n){try{let r=await fetch(e,{method:n??(t===void 0?`GET`:`POST`),credentials:`same-origin`,headers:t===void 0?void 0:{"Content-Type":`application/json`},body:t===void 0?void 0:JSON.stringify(t)}),i=await r.json().catch(()=>({}));return r.status===401&&!e.includes(`action=login`)&&document.dispatchEvent(new CustomEvent(`bm:unauthorized`)),{ok:r.ok&&i?.success!==!1,status:r.status,data:i}}catch{return{ok:!1,status:0,data:{success:!1,error:`No fue posible contactar al servidor.`}}}}function i(e,t,r){e&&(e.innerHTML=`
    <div class="wp-notice wp-notice-${t}" role="${t===`error`?`alert`:`status`}">
      <p>${n(r)}</p>
      <button type="button" class="wp-notice-dismiss" aria-label="Descartar aviso">&times;</button>
    </div>`,e.querySelector(`.wp-notice-dismiss`)?.addEventListener(`click`,()=>e.innerHTML=``),e.scrollIntoView({block:`nearest`,behavior:`smooth`}))}function a(e,t={}){e.querySelectorAll(`.field-error`).forEach(e=>e.remove()),e.querySelectorAll(`.form-input.has-error`).forEach(e=>e.classList.remove(`has-error`));for(let[n,r]of Object.entries(t)){let t=e.querySelector(`[name="${n}"]`);if(!t)continue;t.classList.add(`has-error`);let i=document.createElement(`span`);i.className=`field-error`,i.textContent=r,(t.closest(`.password-field`)??t).insertAdjacentElement(`afterend`,i)}e.querySelector(`.has-error`)?.focus()}function o(e){if(!e)return`—`;let t=new Date(e*1e3);if(Number.isNaN(t.getTime()))return`—`;let n=Math.round((Date.now()-t.getTime())/1e3),r=new Intl.RelativeTimeFormat(`es`,{numeric:`auto`}),i=[[60,`second`],[60,`minute`],[24,`hour`],[30,`day`],[12,`month`],[1/0,`year`]],a=n;for(let[e,t]of i){if(Math.abs(a)<e)return r.format(-Math.round(a),t);a/=e}return t.toLocaleDateString(`es-VE`)}var s=new WeakMap;function c(e){s.get(e)?.abort();let t=new AbortController;s.set(e,t),e.style.display=`flex`,e.querySelector(`input, textarea, select, button.btn-primary`)?.focus(),e.querySelectorAll(`[data-close-modal]`).forEach(n=>n.addEventListener(`click`,()=>l(e),{signal:t.signal})),document.addEventListener(`keydown`,t=>t.key===`Escape`&&l(e),{signal:t.signal})}function l(e){e.style.display=`none`,s.get(e)?.abort(),s.delete(e)}function u(e=document){e.querySelectorAll(`[data-generate-password]`).forEach(t=>{t.addEventListener(`click`,()=>{let n=document.getElementById(t.dataset.generatePassword);if(!n)return;let r=crypto.getRandomValues(new Uint32Array(16));n.value=Array.from(r,e=>`ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*-_`[e%66]).join(``),n.type=`text`;let i=e.querySelector(`[data-toggle-password="${n.id}"]`);i&&(i.textContent=`Ocultar`),n.dispatchEvent(new Event(`input`,{bubbles:!0})),n.select()})}),e.querySelectorAll(`[data-toggle-password]`).forEach(e=>{e.addEventListener(`click`,()=>{let t=document.getElementById(e.dataset.togglePassword);if(!t)return;let n=t.type===`password`;t.type=n?`text`:`password`,e.textContent=n?`Ocultar`:`Mostrar`})})}async function d(e,t){e&&(e.disabled=!0);try{return await t()}finally{e&&(e.disabled=!1)}}var f=e=>document.getElementById(e),p=[],m=null,h=``,g=``,_=null,v=null,y=[],b=null,x=()=>f(`users-notice`);async function S(){let e=await r(`/api/users.php`);if(!e.ok){e.status!==401&&i(x(),`error`,e.data.error||`No se pudo cargar la lista de usuarios.`);return}p=e.data.users,f(`users-mail-warning`).hidden=e.data.mail_configured,re()}function ee(){let e=g.trim().toLowerCase();return p.filter(t=>(!h||t.role===h)&&(!e||[t.username,t.callsign,t.full_name,t.email].some(t=>t.toLowerCase().includes(e))))}function te(){let e={"":p.length};p.forEach(t=>e[t.role]=(e[t.role]||0)+1);let t=[[``,`Todos`],[`admin`,`Administradores`],[`editor`,`Editores`],[`author`,`Autores`]];f(`users-role-filter`).innerHTML=t.filter(([t])=>t===``||e[t]).map(([t,n])=>`<li><a href="#" data-role-filter="${t}" class="${t===h?`is-current`:``}">${n} <span class="count">(${e[t]||0})</span></a></li>`).join(``)}function ne(e){return e.split(/\s+/).filter(Boolean).slice(0,2).map(e=>e[0]).join(``).toUpperCase()||`?`}function re(){te();let e=ee();f(`users-count`).textContent=`${e.length} ${e.length===1?`elemento`:`elementos`}`,f(`users-select-all`).checked=!1;let r=f(`users-table-body`);if(!e.length){r.innerHTML=`<tr><td colspan="7" class="table-empty">No se encontraron usuarios.</td></tr>`;return}r.innerHTML=e.map(e=>{let r=e.id===m?.id,i=[r?`<span class="state-badge state-self">Tú</span>`:``,e.status===`inactive`?`<span class="state-badge state-inactive">Desactivado</span>`:``,e.pending_invite?`<span class="state-badge state-pending">Invitación pendiente</span>`:``].join(``),a=[`<span><a href="#" data-action="edit">Editar</a></span>`,`<span><a href="#" data-action="email">Enviar correo</a></span>`,e.status===`active`?`<span><a href="#" data-action="invite">${e.pending_invite?`Reenviar invitación`:`Enviar enlace de contraseña`}</a></span>`:``,r?``:`<span><a href="#" data-action="${e.status===`active`?`deactivate`:`activate`}">${e.status===`active`?`Desactivar`:`Activar`}</a></span>`,r?``:`<span class="trash"><a href="#" data-action="delete">Eliminar</a></span>`].filter(Boolean).join(` | `);return`
      <tr data-user-id="${e.id}" class="${e.status===`inactive`?`is-inactive`:``}">
        <td class="col-cb">${r?``:`<input type="checkbox" class="user-cb" value="${e.id}" aria-label="Seleccionar ${n(e.username)}" />`}</td>
        <td class="cell-title">
          <div class="user-cell">
            <span class="user-avatar" aria-hidden="true">${n(ne(e.full_name))}</span>
            <div>
              <strong><a href="#" data-action="edit">${n(e.username)}</a></strong>
              <span class="callsign-badge">${n(e.callsign)}</span>
              ${i}
              <div class="row-actions">${a}</div>
            </div>
          </div>
        </td>
        <td>${n(e.full_name)}</td>
        <td><a href="mailto:${n(e.email)}">${n(e.email)}</a></td>
        <td><span class="role-badge role-${e.role}">${t[e.role]}</span></td>
        <td class="col-num">${e.posts_count}</td>
        <td title="${e.last_login_ts?new Date(e.last_login_ts*1e3).toLocaleString(`es-VE`):``}">${e.last_login_ts?o(e.last_login_ts):`<span class="text-faint">Nunca</span>`}</td>
      </tr>`}).join(``)}function ie(){return Array.from(document.querySelectorAll(`.user-cb:checked`)).map(e=>Number(e.value))}function ae(e){v=e,window.switchView(`user-new`)}function oe(){_=v,v=null;let e=f(`user-form`),t=_!==null;e.reset(),a(e),f(`user-form-notice`).innerHTML=``;let n=(t,n)=>e.elements.namedItem(t).value=n;n(`id`,t?String(_.id):``),n(`username`,_?.username??``),n(`callsign`,_?.callsign??``),n(`full_name`,_?.full_name??``),n(`email`,_?.email??``),n(`role`,_?.role??`author`),n(`status`,_?.status??`active`);let r=t&&_.id===m?.id;f(`uf-role`).disabled=r,f(`uf-status`).disabled=r,f(`user-form-title`).textContent=t?`Editar usuario ${_.callsign}`:`Añadir nuevo usuario`,f(`user-form-intro`).textContent=t?r?`Estás editando tu propia cuenta: no puedes cambiar tu rol ni desactivarte.`:`Modifica los datos, el rol o el estado de la cuenta.`:`Crea una cuenta para un radioaficionado del equipo. Recibirá un correo para elegir su contraseña.`,f(`user-form-submit`).textContent=t?`Actualizar usuario`:`Añadir nuevo usuario`,f(`uf-status-row`).hidden=!t,f(`uf-invite-row`).hidden=t,f(`uf-send-invite`).checked=!0,se();let i=f(`uf-password`);i.type=`password`,f(`uf-password-label`).textContent=t?`Nueva contraseña`:`Contraseña`,f(`uf-password-hint`).textContent=t?`Déjala vacía para no cambiarla. Mínimo 10 caracteres. Mejor: usa "Enviar enlace de contraseña" en el listado.`:`Mínimo 10 caracteres. Compártela con la persona por un canal seguro.`,f(`uf-username`).focus()}function se(){let e=f(`uf-send-invite`).checked;f(`uf-password-row`).hidden=_===null&&e}async function ce(e){e.preventDefault();let t=e.currentTarget,n=new FormData(t),o=_!==null,s={action:o?`update`:`create`,id:o?_.id:void 0,username:String(n.get(`username`)||``),callsign:String(n.get(`callsign`)||``).toUpperCase(),full_name:String(n.get(`full_name`)||``),email:String(n.get(`email`)||``),role:f(`uf-role`).value,status:f(`uf-status`).value,password:f(`uf-password-row`).hidden?``:String(n.get(`password`)||``),send_invite:!o&&f(`uf-send-invite`).checked},c=await d(f(`user-form-submit`),()=>r(`/api/users.php`,s));if(!c.ok){a(t,c.data.validation_errors),i(f(`user-form-notice`),`error`,c.data.error||`No se pudo guardar el usuario.`);return}a(t),await S(),window.switchView(`users`),i(x(),c.data.mail_sent===!1?`warning`:`success`,c.data.message||`Usuario guardado.`),o&&_.id===m?.id&&c.data.user&&document.dispatchEvent(new CustomEvent(`bm:session`,{detail:{...m,...c.data.user}}))}async function le(e,t){switch(e){case`edit`:return ae(t);case`email`:return ue([t]);case`delete`:return fe(t);case`invite`:{let e=t.pending_invite?`la invitación`:`un enlace para restablecer la contraseña`;if(!confirm(`¿Enviar ${e} a ${t.email}?`))return;let n=await r(`/api/users.php`,{action:`invite`,id:t.id});i(x(),n.ok?`success`:`error`,n.data.message||n.data.error||`Error al enviar.`);return}case`activate`:case`deactivate`:{let n=await r(`/api/users.php`,{action:`update`,id:t.id,status:e===`activate`?`active`:`inactive`});i(x(),n.ok?`success`:`error`,n.ok?`Cuenta de ${t.callsign} ${e===`activate`?`activada`:`desactivada`}.`:n.data.error||`No se pudo cambiar el estado.`),n.ok&&S();return}}}function ue(e){y=e;let t=f(`user-email-form`);t.reset(),a(t),f(`user-email-notice`).innerHTML=``;let n=e.map(e=>`${e.full_name} (${e.callsign})`);f(`user-email-recipients`).textContent=n.length>4?`${n.slice(0,4).join(`, `)} y ${n.length-4} más`:n.join(`, `),c(f(`modal-user-email`))}async function de(e){e.preventDefault();let t=e.currentTarget,n=new FormData(t),o=await d(f(`user-email-submit`),()=>r(`/api/users.php`,{action:`email`,user_ids:y.map(e=>e.id),subject:n.get(`subject`),message:n.get(`message`)}));if(!o.ok){a(t,o.data.validation_errors),i(f(`user-email-notice`),`error`,o.data.error||`No se pudo enviar el correo.`);return}l(f(`modal-user-email`)),i(x(),o.data.failed?.length?`warning`:`success`,o.data.message)}function fe(e){b=e,f(`user-delete-notice`).innerHTML=``,f(`user-delete-name`).textContent=`${e.full_name} (${e.callsign})`;let t=e.posts_count>0;f(`user-delete-reassign`).hidden=!t,f(`user-delete-posts`).textContent=String(e.posts_count);let r=f(`ud-reassign`);r.innerHTML=p.filter(t=>t.id!==e.id&&t.status===`active`).map(e=>`<option value="${e.id}" ${e.id===m?.id?`selected`:``}>${n(e.full_name)} (${n(e.callsign)})</option>`).join(``),c(f(`modal-user-delete`))}async function pe(e){if(e.preventDefault(),!b)return;let t=b.posts_count>0?Number(f(`ud-reassign`).value):void 0,n=await d(f(`user-delete-submit`),()=>r(`/api/users.php`,{action:`delete`,id:b.id,reassign_to:t}));if(!n.ok){i(f(`user-delete-notice`),`error`,n.data.error||`No se pudo eliminar el usuario.`);return}l(f(`modal-user-delete`)),i(x(),`success`,n.data.message),S()}async function me(){let e=f(`users-bulk-action`).value,t=ie();if(!e)return i(x(),`info`,`Elige una acción en lote.`);if(!t.length)return i(x(),`info`,`Selecciona al menos un usuario.`);if(e===`email`)return ue(p.filter(e=>t.includes(e.id)));let n=await r(`/api/users.php`,{action:`bulk`,operation:e,user_ids:t});i(x(),n.ok?`success`:`error`,n.data.message||n.data.error||`No se pudo aplicar la acción.`),n.ok&&(f(`users-bulk-action`).value=``,S())}function he(){f(`view-users`)&&(document.addEventListener(`bm:session`,e=>m=e.detail),document.addEventListener(`bm:view`,e=>{let t=e.detail;m?.role===`admin`&&(t===`users`&&S(),t===`user-new`&&oe())}),f(`users-role-filter`).addEventListener(`click`,e=>{let t=e.target.closest(`[data-role-filter]`);t&&(e.preventDefault(),h=t.dataset.roleFilter??``,re())}),f(`users-search`).addEventListener(`input`,e=>{g=e.target.value,re()}),f(`users-select-all`).addEventListener(`change`,e=>{let t=e.target.checked;document.querySelectorAll(`.user-cb`).forEach(e=>e.checked=t)}),f(`users-table-body`).addEventListener(`click`,e=>{let t=e.target.closest(`[data-action]`);if(!t)return;e.preventDefault();let n=Number(t.closest(`tr`)?.dataset.userId),r=p.find(e=>e.id===n);r&&le(t.dataset.action,r)}),f(`users-bulk-apply`).addEventListener(`click`,me),f(`user-form`).addEventListener(`submit`,ce),f(`uf-send-invite`).addEventListener(`change`,se),f(`uf-callsign`).addEventListener(`input`,e=>{let t=e.target;t.value=t.value.toUpperCase()}),f(`user-email-form`).addEventListener(`submit`,de),f(`user-delete-form`).addEventListener(`submit`,pe),u(f(`view-user-new`)))}var C=e=>document.getElementById(e),ge=null;async function _e(){let e=await r(`/api/profile.php`);if(!e.ok){e.status!==401&&i(C(`profile-notice`),`error`,e.data.error||`No se pudo cargar tu perfil.`);return}let n=e.data.user;C(`profile-username`).textContent=n.username,C(`profile-callsign`).textContent=n.callsign;let a=C(`profile-role`);a.textContent=t[n.role],a.className=`role-badge role-${n.role}`,C(`pf-full-name`).value=n.full_name,C(`pf-email`).value=n.email,document.querySelector(`#password-form [name="username"]`).value=n.username;let o=new Date(n.created_ts*1e3).toLocaleDateString(`es-VE`,{year:`numeric`,month:`long`,day:`numeric`});C(`profile-meta`).textContent=`Miembro desde el ${o}.`}function ve(){C(`view-profile`)&&(document.addEventListener(`bm:session`,e=>ge=e.detail),document.addEventListener(`bm:view`,e=>{e.detail===`profile`&&(C(`profile-notice`).innerHTML=``,_e())}),C(`profile-form`).addEventListener(`submit`,async e=>{e.preventDefault();let t=e.currentTarget,n=new FormData(t),o=await d(C(`profile-submit`),()=>r(`/api/profile.php`,{action:`update`,full_name:n.get(`full_name`),email:n.get(`email`)}));a(t,o.ok?{}:o.data.validation_errors),i(C(`profile-notice`),o.ok?`success`:`error`,o.data.message||o.data.error||`No se pudo guardar.`),o.ok&&ge&&o.data.user&&document.dispatchEvent(new CustomEvent(`bm:session`,{detail:{...ge,...o.data.user}}))}),C(`password-form`).addEventListener(`submit`,async e=>{e.preventDefault();let t=e.currentTarget,n=new FormData(t),o=await d(C(`password-submit`),()=>r(`/api/profile.php`,{action:`password`,current_password:n.get(`current_password`),new_password:n.get(`new_password`)}));a(t,o.ok?{}:o.data.validation_errors),i(C(`profile-notice`),o.ok?`success`:`error`,o.data.message||o.data.error||`No se pudo cambiar la contraseña.`),o.ok&&(t.reset(),C(`pw-new`).type=`password`)}),u(C(`view-profile`)))}var ye=1500,be={width:1920,height:1280},xe={width:1600,height:1600},Se=.82,Ce=.68,we=1920,Te=1080,Ee=25e5,De=128e3,Oe=4194304;function ke(e,t,n=ye,r=n){let i=Math.min(1,n/e,r/t);return{width:Math.max(1,Math.round(e*i)),height:Math.max(1,Math.round(t*i))}}async function Ae(e){try{return await createImageBitmap(e,{imageOrientation:`from-image`})}catch{let t=URL.createObjectURL(e);try{let e=new Image;return e.decoding=`async`,e.src=t,await e.decode(),await createImageBitmap(e)}finally{URL.revokeObjectURL(t)}}}function je(e,t,n,r,i){let a=document.createElement(`canvas`),o=t,s=n;a.width=o,a.height=s;let c=a.getContext(`2d`);for(c.drawImage(e,0,0,o,s);o/2>=r&&s/2>=i;){let e=document.createElement(`canvas`);e.width=Math.round(o/2),e.height=Math.round(s/2);let t=e.getContext(`2d`);t.imageSmoothingQuality=`high`,t.drawImage(a,0,0,e.width,e.height),a=e,o=e.width,s=e.height}if(o!==r||s!==i){let e=document.createElement(`canvas`);e.width=r,e.height=i,c=e.getContext(`2d`),c.imageSmoothingQuality=`high`,c.drawImage(a,0,0,r,i),a=e}return a}async function Me(t,n,r){let{default:i}=await e(async()=>{let{default:e}=await import(`./encode.B7qyjpkk.js`);return{default:e}},__vite__mapDeps([0,1])),a=await i(t.getContext(`2d`).getImageData(0,0,t.width,t.height),r?{quality:Math.round(n*100),method:6,sns_strength:80,filter_strength:40,use_sharp_yuv:1}:{quality:Math.round(n*100)});return new Blob([a],{type:`image/webp`})}async function Ne(e,t=Se,n=`rapido`){if(n===`ultra`){let n=await Me(e,t,!0).catch(()=>null),r=await new Promise(n=>e.toBlob(n,`image/webp`,t)),i=r&&r.type===`image/webp`?r:null;if(n&&i)return n.size<=i.size?n:i;if(n||i)return n??i;throw Error(`No se pudo convertir la imagen a WebP.`)}let r=await new Promise(n=>e.toBlob(n,`image/webp`,t));return r&&r.type===`image/webp`?r:Me(e,t,!1)}async function Pe(e,t={}){let{maxWidth:n=ye,maxHeight:r=n,mode:i=`rapido`,quality:a=i===`ultra`?Ce:Se}=t,o=await Ae(e);try{let t=ke(o.width,o.height,n,r);return{blob:await Ne(je(o,o.width,o.height,t.width,t.height),a,i),width:t.width,height:t.height,originalBytes:e.size}}finally{o.close()}}function Fe(){return typeof MediaRecorder>`u`?null:[`video/mp4;codecs=avc1.640028,mp4a.40.2`,`video/mp4;codecs=avc1.42E01F,mp4a.40.2`,`video/mp4`,`video/webm;codecs=vp9,opus`,`video/webm;codecs=vp8,opus`,`video/webm`].find(e=>MediaRecorder.isTypeSupported(e))??null}function Ie(){let e=document.createElement(`canvas`);return Fe()!==null&&typeof e.captureStream==`function`}function Le(e){return new Promise((t,n)=>{let r=document.createElement(`video`);r.preload=`auto`,r.playsInline=!0,r.src=URL.createObjectURL(e),r.onloadedmetadata=()=>t(r),r.onerror=()=>n(Error(`El navegador no puede leer este video. Prueba con MP4 (H.264).`))})}function Re(e,t){return new Promise(n=>{e.onseeked=()=>n(),e.currentTime=t})}async function ze(e,t){await Re(e,Math.min(1,e.duration/10));let n=ke(e.videoWidth,e.videoHeight),r=await Ne(je(e,e.videoWidth,e.videoHeight,n.width,n.height));return await Re(e,0),{blob:r,width:n.width,height:n.height,originalBytes:t}}async function Be(e,t,n){let r=await Le(e);try{if(!Number.isFinite(r.duration)||r.duration<=0)throw Error(`No se pudo leer la duración del video.`);if(r.duration>300)throw Error(`El video dura más de 5 minutos. Recórtalo antes de subirlo.`);let i=await ze(r,e.size),a=r.videoWidth,o=r.videoHeight,s=Math.min(1,we/Math.max(a,o),Te/Math.min(a,o)),c=Math.max(2,Math.round(a*s/2)*2),l=Math.max(2,Math.round(o*s/2)*2),u=/^video\/mp4$/i.test(e.type)||/\.mp4$/i.test(e.name),d=Fe();if(!d||!Ie()){if(!u)throw Error(`Este navegador no puede comprimir videos. Usa Chrome, Edge o Safari recientes, o sube un MP4.`);return t(1),{blob:e,poster:i,width:a,height:o,duration:r.duration,originalBytes:e.size,compressed:!1}}let f=document.createElement(`canvas`);f.width=c,f.height=l;let p=f.getContext(`2d`);p.imageSmoothingQuality=`high`;let m=f.captureStream(30),h=null;try{h=new AudioContext;let e=h.createMediaElementSource(r),t=h.createMediaStreamDestination();e.connect(t),t.stream.getAudioTracks().forEach(e=>m.addTrack(e))}catch{}let g=new MediaRecorder(m,{mimeType:d,videoBitsPerSecond:Ee,audioBitsPerSecond:De}),_=[];g.ondataavailable=e=>e.data.size&&_.push(e.data);let v=new Promise(e=>g.onstop=()=>e()),y=()=>{p.drawImage(r,0,0,c,l),t(Math.min(.99,r.currentTime/r.duration))},b=0,x=()=>{y(),!r.paused&&!r.ended&&(b=`requestVideoFrameCallback`in r?r.requestVideoFrameCallback(x):requestAnimationFrame(x))},S=()=>{r.pause(),g.state!==`inactive`&&g.stop()};if(n?.addEventListener(`abort`,S,{once:!0}),y(),g.start(1e3),await h?.resume(),await r.play(),x(),await new Promise(e=>r.onended=()=>e()),cancelAnimationFrame(b),g.stop(),await v,m.getTracks().forEach(e=>e.stop()),await h?.close(),n?.removeEventListener(`abort`,S),n?.aborted)throw new DOMException(`Cancelado`,`AbortError`);let ee=d.split(`;`)[0],te=new Blob(_,{type:ee});return t(1),u&&te.size>=e.size?{blob:e,poster:i,width:a,height:o,duration:r.duration,originalBytes:e.size,compressed:!1}:{blob:te,poster:i,width:c,height:l,duration:r.duration,originalBytes:e.size,compressed:!0}}finally{URL.revokeObjectURL(r.src)}}function Ve(){return Array.from(crypto.getRandomValues(new Uint8Array(16)),e=>e.toString(16).padStart(2,`0`)).join(``)}async function He(e,t,n,r=`/api/gallery.php?action=upload_chunk`){let i=Ve(),a=Math.max(1,Math.ceil(e.size/Oe));for(let o=0;o<a;o++){let s=e.slice(o*Oe,(o+1)*Oe),c=new FormData;c.append(`upload_id`,i),c.append(`index`,String(o)),c.append(`total`,String(a)),c.append(`kind`,t),c.append(`chunk`,s,`${t}.part`);let l=``;for(let e=0;e<3;e++)try{let e=await fetch(r,{method:`POST`,body:c,credentials:`same-origin`}),t=await e.json().catch(()=>({}));if(e.status===401)throw document.dispatchEvent(new CustomEvent(`bm:unauthorized`)),Error(`Tu sesión expiró.`);if(!e.ok||t.success===!1)throw Object.assign(Error(t.error||`Error ${e.status} al subir.`),{fatal:e.status<500});l=``;break}catch(t){if(l=t.message,t.fatal)break;await new Promise(t=>setTimeout(t,800*(e+1)))}if(l)throw Error(l);n?.((o+1)/a)}return i}function w(e){return e<1024?`${e} B`:e<1048576?`${Math.round(e/1024)} KB`:`${(e/1024/1024).toFixed(1)} MB`}var T=e=>document.getElementById(e),Ue={IMAGE:`Foto`,VIDEO:`Video`,CAROUSEL_ALBUM:`Carrusel`},E=[],We=`all`,D=null,Ge=null,O=[],Ke=null,qe=!1,Je=e=>new Date(e*1e3).toLocaleDateString(`es-VE`,{year:`numeric`,month:`short`,day:`numeric`}),Ye=()=>{let e=new Date;return`${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,`0`)}-${String(e.getDate()).padStart(2,`0`)}`};async function Xe(){let e=await r(`/api/gallery.php?scope=admin`);if(!e.ok){e.status!==401&&i(T(`gallery-notice`),`error`,e.data.error||`No se pudieron cargar las publicaciones.`);return}E=e.data.posts,Ze()}function Ze(){let e={all:E.length,published:0,hidden:0};E.forEach(t=>e[t.status]++),document.querySelectorAll(`#gallery-status-filter [data-count]`).forEach(t=>{t.textContent=`(${e[t.dataset.count]})`}),document.querySelectorAll(`#gallery-status-filter [data-gallery-filter]`).forEach(e=>{e.classList.toggle(`is-current`,e.dataset.galleryFilter===We)});let t=E.filter(e=>We===`all`||e.status===We),r=T(`gallery-table-body`);if(!t.length){r.innerHTML=`<tr><td colspan="4" class="table-empty">${E.length?`No hay publicaciones en este filtro.`:`Aún no hay publicaciones. Pulsa "Añadir publicación".`}</td></tr>`;return}r.innerHTML=t.map(e=>{let t=e.caption.trim(),r=e.media_type===`CAROUSEL_ALBUM`?` · ${e.carousel_media.length}`:``;return`
      <tr data-post-id="${n(e.id)}" class="${e.status===`hidden`?`is-inactive`:``}">
        <td class="col-thumb">
          <a href="#" data-action="edit" aria-label="Editar publicación"><img src="${n(e.thumbnail_url)}" alt="" loading="lazy" class="gallery-thumb" /></a>
        </td>
        <td class="cell-title">
          <div>
            <span class="state-badge state-type">${Ue[e.media_type]}${r}</span>
            ${e.status===`hidden`?`<span class="state-badge state-inactive">Oculta</span>`:``}
          </div>
          <p class="gallery-caption"><a href="#" data-action="edit">${n(t.length>140?t.slice(0,140)+`…`:t)||`<span class="text-faint">(sin descripción)</span>`}</a></p>
          <div class="row-actions">
            <span><a href="#" data-action="edit">Editar</a></span> |
            <span><a href="#" data-action="toggle">${e.status===`published`?`Ocultar`:`Mostrar`}</a></span> |
            <span class="trash"><a href="#" data-action="delete">Eliminar</a></span>
          </div>
        </td>
        <td>${n(e.author)}</td>
        <td>${Je(e.published_ts)}</td>
      </tr>`}).join(``)}async function Qe(e,t){if(e===`edit`&&(Ge=t,window.switchView(`gallery-edit`)),e===`toggle`){let e=await r(`/api/gallery.php?action=visibility`,{id:t.id,status:t.status===`published`?`hidden`:`published`});i(T(`gallery-notice`),e.ok?`success`:`error`,e.data.message||e.data.error||`No se pudo cambiar.`),e.ok&&Xe()}if(e===`delete`){if(!confirm(`¿Eliminar esta publicación y sus archivos? No se puede deshacer.`))return;let e=await r(`/api/gallery.php?action=delete`,{id:t.id});i(T(`gallery-notice`),e.ok?`success`:`error`,e.data.message||e.data.error||`No se pudo eliminar.`),e.ok&&Xe()}}function $e(){Ke?.abort(),Ke=null,O.forEach(e=>e.previewUrl&&URL.revokeObjectURL(e.previewUrl)),O=[]}function et(){D=Ge,Ge=null,$e();let e=T(`gallery-form`);e.reset(),a(e),T(`gallery-edit-notice`).innerHTML=``,rt(null);let t=(t,n)=>e.elements.namedItem(t).value=n;if(t(`id`,D?.id??``),t(`caption`,D?.caption??``),t(`status`,D?.status??`published`),t(`author`,D?.author??`@brandmeister_yv`),t(`permalink`,D?.permalink??``),D){let e=new Date(D.published_ts*1e3);t(`published_date`,`${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,`0`)}-${String(e.getDate()).padStart(2,`0`)}`)}else t(`published_date`,Ye());T(`gallery-edit-title`).textContent=D?`Editar publicación`:`Añadir publicación`,T(`gallery-submit`).textContent=D?`Actualizar`:`Publicar`,T(`gallery-current-media-hint`).hidden=!D,at(),k()}function k(){let e=T(`gallery-media-list`),t=O.filter(e=>e.kind===`image`),r=``;D&&!O.length&&(r=(D.media_type===`CAROUSEL_ALBUM`?D.carousel_media.map(e=>e.url):[D.thumbnail_url]).map((e,t)=>`
      <li class="media-tile is-current">
        <img src="${n(e)}" alt="" />
        ${D.media_type===`VIDEO`?`<span class="media-tile-badge">▶ Video</span>`:`<span class="media-tile-badge">${t+1}</span>`}
      </li>`).join(``)),r+=O.map(e=>{let r=t.indexOf(e),i=e.image?`${e.image.width}×${e.image.height} · ${w(e.image.blob.size)}`:e.video?`${e.video.width}×${e.video.height} · ${w(e.video.blob.size)}${e.video.compressed?``:` (original)`}`:``,a=e.image||e.video?Math.max(0,Math.round((1-(e.image?.blob.size??e.video.blob.size)/e.file.size)*100)):0,o=e.state===`processing`?`<span class="media-tile-status">${e.kind===`video`?`Comprimiendo ${Math.round(e.progress*100)}%`:`Optimizando…`}</span>`:e.state===`error`?`<span class="media-tile-status is-error">${n(e.error||`Error`)}</span>`:`<span class="media-tile-status is-ready">${i}${a>0?` · −${a}%`:``}</span>`;return`
      <li class="media-tile ${e.state===`error`?`has-error`:``}" data-key="${e.key}">
        ${e.previewUrl?e.kind===`video`&&!e.video?`<div class="media-tile-placeholder">▶</div>`:`<img src="${e.previewUrl}" alt="" />`:`<div class="media-tile-placeholder">…</div>`}
        ${e.kind===`video`?`<span class="media-tile-badge">▶ Video</span>`:`<span class="media-tile-badge">${r+1}</span>`}
        ${e.state===`processing`?`<div class="media-tile-meter"><span style="width:${Math.round(e.progress*100)}%"></span></div>`:``}
        <div class="media-tile-tools">
          ${e.kind===`image`&&t.length>1?`
            <button type="button" data-media-action="left" aria-label="Mover antes" ${r===0?`disabled`:``}>←</button>
            <button type="button" data-media-action="right" aria-label="Mover después" ${r===t.length-1?`disabled`:``}>→</button>`:``}
          <button type="button" data-media-action="remove" aria-label="Quitar">✕</button>
        </div>
        ${o}
      </li>`}).join(``),e.innerHTML=r;let i=O.filter(e=>e.state===`ready`),a=O.some(e=>e.state===`processing`),o=i.reduce((e,t)=>e+t.file.size,0),s=i.reduce((e,t)=>e+(t.image?.blob.size??t.video?.blob.size??0),0);T(`gallery-media-summary`).textContent=i.length?`${i.length} listo(s) · ${w(o)} → ${w(s)}${a?` · procesando…`:``}`:a?`Procesando…`:``}async function tt(e){let t=Array.from(e),n=t.filter(e=>e.type.startsWith(`video/`)||/\.(mp4|mov|m4v|webm)$/i.test(e.name)),r=t.filter(e=>!n.includes(e)&&(e.type.startsWith(`image/`)||/\.(jpe?g|png|webp|heic|heif|gif|avif)$/i.test(e.name))),a=t.length-n.length-r.length,o=T(`gallery-edit-notice`),s=O.some(e=>e.kind===`video`),c=O.some(e=>e.kind===`image`);if(n.length>1||n.length&&(r.length||c||s)||r.length&&s){i(o,`warning`,`Cada publicación lleva varias fotos o un solo video, no ambos. Crea otra publicación para el resto.`);return}if(O.length+r.length>20){i(o,`warning`,`Máximo 20 fotos por publicación.`);return}a&&i(o,`info`,`${a} archivo(s) no son fotos ni videos y se ignoraron.`);let l=[...r,...n].map(e=>({key:Math.random().toString(36).slice(2),kind:n.includes(e)?`video`:`image`,file:e,state:`processing`,progress:0}));O.push(...l),k();let u=l.filter(e=>e.kind===`image`),d=Array.from({length:Math.min(2,u.length)},async()=>{for(;u.length;){let e=u.shift();try{e.image=await Pe(e.file),e.previewUrl=URL.createObjectURL(e.image.blob),e.state=`ready`}catch{e.state=`error`,e.error=/hei[cf]$/i.test(e.file.name)?`HEIC solo se puede leer en Safari: conviértela a JPG`:`No se pudo leer esta imagen`}O.includes(e)&&k()}}),f=l.find(e=>e.kind===`video`);if(f){Ke=new AbortController;let e=0;try{f.video=await Be(f.file,t=>{f.progress=t,Date.now()-e>500&&(e=Date.now(),k())},Ke.signal),f.previewUrl=URL.createObjectURL(f.video.poster.blob),f.state=`ready`}catch(e){if(e.name===`AbortError`)return;f.state=`error`,f.error=e.message||`No se pudo procesar el video`}O.includes(f)&&k()}await Promise.all(d)}function nt(e,t){let n=O.find(e=>e.key===t);if(n){if(e===`remove`)n.kind===`video`&&Ke?.abort(),n.previewUrl&&URL.revokeObjectURL(n.previewUrl),O=O.filter(e=>e!==n);else{let t=O.filter(e=>e.kind===`image`),r=t.indexOf(n),i=e===`left`?r-1:r+1;if(i<0||i>=t.length)return;[t[r],t[i]]=[t[i],t[r]],O=[...t,...O.filter(e=>e.kind===`video`)]}k()}}function rt(e,t=``){T(`gallery-progress`).hidden=e===null,e!==null&&(T(`gallery-progress-bar`).style.width=`${Math.round(e*100)}%`,T(`gallery-progress-label`).textContent=t)}async function it(e){if(e.preventDefault(),qe)return;let t=e.currentTarget,n=T(`gallery-edit-notice`);if(O.some(e=>e.state===`processing`)){i(n,`info`,`Espera a que terminen de optimizarse los archivos.`);return}let o=O.filter(e=>e.state===`ready`);if(O.some(e=>e.state===`error`)){i(n,`warning`,`Quita los archivos con error antes de guardar.`);return}if(!D&&!o.length){i(n,`warning`,`Añade al menos una foto o un video.`);return}let s=new FormData(t),c={id:D?.id,caption:s.get(`caption`),status:s.get(`status`),published_date:s.get(`published_date`),author:s.get(`author`),permalink:s.get(`permalink`)};qe=!0;let l=T(`gallery-submit`);try{await d(l,async()=>{if(o.length){let e=o.flatMap(e=>e.kind===`video`?[{blob:e.video.blob,kind:`video`},{blob:e.video.poster.blob,kind:`poster`}]:[{blob:e.image.blob,kind:`image`}]),t=e.reduce((e,t)=>e+t.blob.size,0),n=0,r=[];for(let i of e){let e=await He(i.blob,i.kind,e=>{rt((n+i.blob.size*e)/t,`Subiendo ${w(n+i.blob.size*e)} de ${w(t)}`)});n+=i.blob.size,i.kind===`image`&&r.push(e),i.kind===`video`&&(c.video=e),i.kind===`poster`&&(c.poster=e)}r.length&&(c.images=r)}rt(1,`Guardando…`);let e=await r(`/api/gallery.php?action=save`,c);if(!e.ok)throw a(t,e.data.validation_errors),Error(e.data.error||`No se pudo guardar la publicación.`);let n=e.data.message||`Publicación guardada.`;$e(),await Xe(),window.switchView(`gallery`),i(T(`gallery-notice`),`success`,n)})}catch(e){rt(null),i(n,`error`,e.message)}finally{qe=!1}}function at(){T(`gf-caption-count`).textContent=String(T(`gf-caption`).value.length)}function ot(){if(!T(`view-gallery`))return;document.addEventListener(`bm:session`,e=>e.detail),document.addEventListener(`bm:view`,e=>{let t=e.detail;t===`gallery`&&(qe||$e(),Xe()),t===`gallery-edit`&&et()}),T(`gallery-status-filter`).addEventListener(`click`,e=>{let t=e.target.closest(`[data-gallery-filter]`);t&&(e.preventDefault(),We=t.dataset.galleryFilter,Ze())}),T(`gallery-table-body`).addEventListener(`click`,e=>{let t=e.target.closest(`[data-action]`);if(!t)return;e.preventDefault();let n=E.find(e=>e.id===t.closest(`tr`)?.dataset.postId);n&&Qe(t.dataset.action,n)});let e=T(`gallery-file-input`);e.addEventListener(`change`,()=>{e.files?.length&&tt(e.files),e.value=``});let t=T(`gallery-drop-zone`);[`dragenter`,`dragover`].forEach(e=>t.addEventListener(e,e=>{e.preventDefault(),t.classList.add(`is-dragging`)})),[`dragleave`,`drop`].forEach(e=>t.addEventListener(e,()=>t.classList.remove(`is-dragging`))),t.addEventListener(`drop`,e=>{e.preventDefault(),e.dataTransfer?.files.length&&tt(e.dataTransfer.files)}),T(`gallery-media-list`).addEventListener(`click`,e=>{let t=e.target.closest(`[data-media-action]`),n=t?.closest(`[data-key]`)?.dataset.key;t&&n&&nt(t.dataset.mediaAction,n)}),T(`gf-caption`).addEventListener(`input`,at),T(`gallery-form`).addEventListener(`submit`,it),T(`gallery-cancel`).addEventListener(`click`,()=>{(!O.length||confirm(`¿Descartar los archivos añadidos?`))&&($e(),window.switchView(`gallery`))}),window.addEventListener(`beforeunload`,e=>{(qe||O.some(e=>e.state===`processing`))&&e.preventDefault()})}var A=e=>document.getElementById(e),st=null,j=[],ct=[],M={published:0,draft:0,trash:0},lt=!0,ut=`all`,dt=``,N=null,ft=null,pt=0,P=null,F=``,mt=!1,ht={published:`Publicada`,draft:`Borrador`,trash:`Papelera`},gt=e=>new Date(e*1e3).toLocaleDateString(`es-VE`,{year:`numeric`,month:`short`,day:`numeric`}),_t=e=>{let t=new Date(e*1e3);return`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,`0`)}-${String(t.getDate()).padStart(2,`0`)}`};async function I(){let e=new URLSearchParams({scope:`admin`,status:ut});dt.trim()&&e.set(`search`,dt.trim());let t=await r(`/api/posts.php?${e}`);if(!t.ok){t.status!==401&&i(A(`posts-notice`),`error`,t.data.error||`No se pudieron cargar las noticias.`);return}j=t.data.posts,M=t.data.counts;let n=A(`menu-posts-count`);if(n){let e=M.published+M.draft;n.textContent=String(e),n.hidden=e===0}ct=t.data.categories,lt=t.data.can_publish,vt()}function vt(){let e={all:M.published+M.draft,...M};document.querySelectorAll(`#posts-status-filter [data-count]`).forEach(t=>{t.textContent=`(${e[t.dataset.count]??0})`}),document.querySelectorAll(`#posts-status-filter [data-post-filter]`).forEach(e=>{e.classList.toggle(`is-current`,e.dataset.postFilter===ut)}),A(`posts-count`).textContent=`${j.length} ${j.length===1?`elemento`:`elementos`}`,A(`posts-select-all`).checked=!1;let t=A(`posts-table-body`);if(!j.length){t.innerHTML=`<tr><td colspan="7" class="table-empty">${dt?`Ninguna noticia coincide con la búsqueda.`:`No hay noticias en este filtro.`}</td></tr>`;return}t.innerHTML=j.map(e=>{let t=e.status===`trash`,r=t?[`<span><a href="#" data-action="restore">Restaurar</a></span>`,lt?`<span class="trash"><a href="#" data-action="delete">Eliminar definitivamente</a></span>`:``]:[`<span><a href="#" data-action="edit">Editar</a></span>`,e.status===`published`?`<span><a href="${n(e.url)}" target="_blank" rel="noopener">Ver</a></span>`:``,lt?`<span><a href="#" data-action="${e.status===`published`?`draft`:`publish`}">${e.status===`published`?`Pasar a borrador`:`Publicar`}</a></span>`:``,`<span class="trash"><a href="#" data-action="trash">Papelera</a></span>`];return`
      <tr data-post-id="${e.id}" class="${e.status===`published`?``:`is-inactive`}">
        <td class="col-cb"><input type="checkbox" class="post-cb" value="${e.id}" aria-label="Seleccionar ${n(e.title)}" /></td>
        <td class="cell-title">
          ${e.image_url?`<img src="${n(e.image_url)}" alt="" loading="lazy" class="post-thumb" />`:``}
          <strong>${t?n(e.title):`<a href="#" data-action="edit">${n(e.title)}</a>`}</strong>
          ${e.status===`published`?``:`<span class="state-badge state-${e.status===`draft`?`pending`:`inactive`}">${ht[e.status]}</span>`}
          ${e.featured?`<span class="state-badge state-self">Destacada</span>`:``}
          <p class="post-excerpt">${n(e.description.length>120?e.description.slice(0,120)+`…`:e.description)}</p>
          <div class="row-actions">${r.filter(Boolean).join(` | `)}</div>
        </td>
        <td>${n(e.author_callsign||e.author_name)}</td>
        <td><span class="cat-pill-mini">${n(e.category)}</span></td>
        <td class="post-tags">${e.tags.map(e=>`<span class="tag-label">#${n(e)}</span>`).join(` `)||`<span class="text-faint">—</span>`}</td>
        <td class="col-num">${e.views_count}</td>
        <td>${gt(e.published_ts)}</td>
      </tr>`}).join(``)}async function yt(e,t){if(e===`edit`){ft=t,window.switchView(`new-post`);return}if(e===`delete`){if(!confirm(`¿Eliminar definitivamente "${t.title}"? No se puede deshacer.`))return;let e=await r(`/api/posts.php?action=delete`,{id:t.id});i(A(`posts-notice`),e.ok?`success`:`error`,e.data.message||e.data.error||`No se pudo eliminar.`),e.ok&&I();return}let n=await r(`/api/posts.php?action=status`,{id:t.id,status:{publish:`published`,draft:`draft`,trash:`trash`,restore:`draft`}[e]});i(A(`posts-notice`),n.ok?`success`:`error`,n.data.message||n.data.error||`No se pudo cambiar el estado.`),n.ok&&I()}async function bt(){let e=A(`posts-bulk-action`).value,t=Array.from(document.querySelectorAll(`.post-cb:checked`)).map(e=>Number(e.value));if(!e)return i(A(`posts-notice`),`info`,`Elige una acción en lote.`);if(!t.length)return i(A(`posts-notice`),`info`,`Selecciona al menos una noticia.`);if(e===`delete`&&!confirm(`¿Eliminar definitivamente ${t.length} noticia(s)?`))return;let n=await r(`/api/posts.php?action=bulk`,{operation:e,ids:t});i(A(`posts-notice`),n.ok?`success`:`error`,n.data.message||n.data.error||`No se pudo aplicar.`),n.ok&&(A(`posts-bulk-action`).value=``,I())}function xt(e){return e.toLowerCase().normalize(`NFD`).replace(/[̀-ͯ]/g,``).replace(/[^a-z0-9]+/g,`-`).replace(/^-+|-+$/g,``).slice(0,180)}async function St(){let e=ft;ft=null;let t=A(`post-form`);if(t.reset(),a(t),A(`post-form-notice`).innerHTML=``,A(`pf-preview`).style.display=`none`,N=null,e&&e!==`new`){let t=await r(`/api/posts.php?scope=admin&id=${e.id}`);if(!t.ok){i(A(`post-form-notice`),`error`,t.data.error||`No se pudo abrir la noticia.`);return}N=t.data.post}let o=(e,n)=>t.elements.namedItem(e).value=n;o(`id`,N?String(N.id):``),o(`title`,N?.title??``),o(`slug`,N?.slug??``),o(`description`,N?.description??``),o(`content`,N?.content??``),o(`tags`,N?.tags.join(`, `)??``),o(`read_time`,N?.read_time??``),o(`published_date`,_t(N?N.published_ts:Date.now()/1e3)),A(`pf-featured`).checked=N?.featured??!1;let s=A(`pf-status`);s.innerHTML=`<option value="draft">Borrador</option>${lt?`<option value="published">Publicada</option>`:``}`,s.value=N&&N.status!==`trash`?N.status:`draft`,A(`pf-author-hint`).hidden=lt,A(`pf-categories`).innerHTML=ct.map(e=>`
    <label class="checkbox-inline">
      <input type="radio" name="category" value="${n(e)}" ${(N?.category??`General`)===e?`checked`:``} />
      ${n(e)}
    </label>`).join(``),A(`pf-author`).textContent=N?N.author_callsign||N.author_name:st?.callsign??``,A(`post-form-title`).textContent=N?`Editar noticia`:`Añadir nueva noticia`,A(`post-submit`).textContent=N?`Actualizar`:`Guardar`;let c=A(`pf-view-link`);c.hidden=!N||N.status!==`published`,N&&(c.href=N.url),Ct(),wt(),R(),A(`pf-title`).focus()}function Ct(){F&&URL.revokeObjectURL(F),F=``,P=null,mt=!1}function wt(){let e=A(`pf-image-preview`),t=A(`pf-image-thumb`),n=A(`pf-image-info`),r=!mt&&N?.image_url?N.image_url:``;if(P){t.src=F;let r=Math.max(0,Math.round((1-P.blob.size/P.originalBytes)*100));n.textContent=`${P.width}×${P.height} · ${w(P.blob.size)}${r?` · −${r}%`:``} · se sube al guardar`,e.hidden=!1}else r?(t.src=r,n.textContent=`Imagen actual de la noticia`,e.hidden=!1):e.hidden=!0}async function Tt(e){let t=A(`pf-image-info`);A(`pf-image-preview`).hidden=!1,t.textContent=`Optimizando imagen…`;try{let t=await Pe(e,{maxWidth:be.width,maxHeight:be.height,mode:`ultra`});Ct(),P=t,F=URL.createObjectURL(t.blob)}catch{i(A(`post-form-notice`),`error`,/hei[cf]$/i.test(e.name)?`HEIC solo se puede leer en Safari: conviértela a JPG antes de subirla.`:`No se pudo leer esa imagen.`)}wt()}function R(){let e=A(`pf-content`).value,t=e.trim()?e.trim().split(/\s+/).length:0;A(`pf-content-stats`).textContent=`${t} palabras · ${Math.max(1,Math.round(t/200))} min de lectura aprox.`,A(`pf-description-count`).textContent=String(A(`pf-description`).value.length)}var Et=/!\[([^\]]*)\]\(([^)\s]+)(?:\s+&quot;(.*?)&quot;)?\)/,Dt=e=>/^(https?:\/\/|mailto:|\/|#)/i.test(e)?e:`#`;function Ot(e,t){let n=t.endsWith(`#mediana`);return{mediana:n,img:`<img src="${Dt(n?t.slice(0,-8):t)}" alt="${e}" loading="lazy"${n?` class="img-mediana"`:``} />`}}function kt(e){let t=e=>{let t=[],r=e=>`\u0002${t.push(e)-1}\u0002`;return n(e).replace(/`([^`]+)`/g,(e,t)=>r(`<code>${t}</code>`)).replace(new RegExp(Et.source,`g`),(e,t,n)=>r(Ot(t,n).img)).replace(/\[([^\]]+)\]\(([^)\s]+)\)/g,(e,t,n)=>`<a href="${Dt(n)}">${t}</a>`).replace(/\*\*([^*]+)\*\*/g,`<strong>$1</strong>`).replace(/(?<![\w*])\*([^*\n]+)\*(?![\w*])/g,`<em>$1</em>`).replace(/\u0002(\d+)\u0002/g,(e,n)=>t[Number(n)])},r=e=>{let t=n(e).match(RegExp(`^${Et.source}$`));if(!t)return null;let{mediana:r,img:i}=Ot(t[1],t[2]);return`<figure class="post-figure${r?` post-figure-mediana`:``}">${i}${t[3]?`<figcaption>${t[3]}</figcaption>`:``}</figure>`},i=[],a=null,o=()=>{a&&i.push(`</${a}>`),a=null};for(let n of e.split(`
`)){let e=n.trim();if(!e){o();continue}let s=e.match(/^(#{1,6})\s+(.*)$/),c=e.match(/^[-*+]\s+(.*)$/),l=e.match(/^\d+[.)]\s+(.*)$/),u=e.match(/^>\s?(.*)$/);if(s){o();let e=Math.min(6,Math.max(2,s[1].length));i.push(`<h${e}>${t(s[2])}</h${e}>`)}else/^(-{3,}|\*{3,})$/.test(e)?(o(),i.push(`<hr />`)):u?(o(),i.push(`<blockquote><p>${t(u[1])}</p></blockquote>`)):c?(a!==`ul`&&(o(),i.push(`<ul>`),a=`ul`),i.push(`<li>${t(c[1])}</li>`)):l?(a!==`ol`&&(o(),i.push(`<ol>`),a=`ol`),i.push(`<li>${t(l[1])}</li>`)):r(e)?(o(),i.push(r(e))):(o(),i.push(`<p>${t(e)}</p>`))}return o(),i.join(`
`)}var z=0,B=null,At=``,V=0;function jt(){V++,B=null,At&&URL.revokeObjectURL(At),At=``,A(`pi-details`).hidden=!0,A(`pi-drop`).hidden=!1,A(`pi-thumb`).removeAttribute(`src`),A(`pi-status`).textContent=``,A(`pi-alt`).value=``,A(`pi-caption`).value=``,A(`post-image-form`).querySelector(`input[name="pi-size"][value="completo"]`).checked=!0,A(`pi-insert`).disabled=!0,A(`post-image-notice`).innerHTML=``}function Mt(e){let t=A(`pf-content`);z=t.selectionStart??t.value.length,jt(),c(A(`modal-post-image`)),e&&Nt(e)}async function Nt(e){let t=++V,n=A(`pi-status`),a=A(`pi-insert`);if(A(`post-image-notice`).innerHTML=``,!e.type.startsWith(`image/`)&&!/\.(hei[cf])$/i.test(e.name)){i(A(`post-image-notice`),`error`,`Ese archivo no es una imagen.`);return}A(`pi-drop`).hidden=!0,A(`pi-details`).hidden=!1,a.disabled=!0,n.textContent=`Optimizando imagen…`;try{let i=await Pe(e,{maxWidth:xe.width,maxHeight:xe.height,mode:`ultra`});if(t!==V)return;At=URL.createObjectURL(i.blob),A(`pi-thumb`).src=At,n.textContent=`Subiendo… 0 %`;let o=await He(i.blob,`post-inline`,e=>{t===V&&(n.textContent=`Subiendo… ${Math.round(e*100)} %`)},`/api/posts.php?action=upload_chunk`);if(t!==V)return;let s=await r(`/api/posts.php?action=inline_image`,{upload_id:o});if(t!==V)return;if(!s.ok)throw Error(s.data.error||`No se pudo guardar la imagen.`);B=s.data,n.textContent=`Lista · ${i.width}×${i.height} px · ${w(i.blob.size)}`,a.disabled=!1,A(`pi-alt`).focus()}catch(r){if(t!==V)return;let a=/hei[cf]$/i.test(e.name)?`HEIC solo se puede leer en Safari: conviértela a JPG antes de subirla.`:r.message||`No se pudo preparar esa imagen.`;i(A(`post-image-notice`),`error`,a),A(`pi-details`).hidden=!0,A(`pi-drop`).hidden=!1,n.textContent=``}}function Pt(e){if(e.preventDefault(),!B)return;let t=e=>e.replace(/[\r\n]+/g,` `).trim(),n=t(A(`pi-alt`).value).replace(/[[\]]/g,``),r=t(A(`pi-caption`).value).replace(/"/g,`”`),i=A(`post-image-form`).querySelector(`input[name="pi-size"]:checked`)?.value===`mediana`,a=`![${n}](${B.url}${i?`#mediana`:``}${r?` "${r}"`:``})`,o=A(`pf-content`),s=o.value.slice(0,z),c=o.value.slice(z),u=s===``||s.endsWith(`

`)?``:s.endsWith(`
`)?`
`:`

`,d=c.startsWith(`

`)?``:c.startsWith(`
`)?`
`:`

`;o.setRangeText(u+a+d,z,z,`end`),B=null,l(A(`modal-post-image`)),R();let f=A(`pf-preview`);f.style.display===`none`?o.focus():f.innerHTML=`<div class="prose-preview">${kt(o.value)}</div>`}function Ft(e){for(let t of Array.from(e??[]))if(t.kind===`file`&&t.type.startsWith(`image/`))return t.getAsFile();return null}function It(e){let t=A(`pf-content`),{selectionStart:n,selectionEnd:r,value:i}=t,a=i.slice(n,r),o={bold:[`**`,`**`],italic:[`*`,`*`],h2:[`
## `,`
`],h3:[`
### `,`
`],quote:[`
> `,`
`],link:[`[`,`](https://)`]},s;if(e===`ul`||e===`ol`)s=`
`+(a||`Elemento`).split(`
`).map((t,n)=>e===`ul`?`- ${t}`:`${n+1}. ${t}`).join(`
`)+`
`;else{let[t,n]=o[e]??[``,``];s=t+(a||(e===`link`?`texto del enlace`:`texto`))+n}t.setRangeText(s,n,r,`end`),t.focus(),R()}async function Lt(e){e.preventDefault();let t=e.currentTarget,n=new FormData(t),o={id:N?.id,title:n.get(`title`),slug:n.get(`slug`),description:n.get(`description`),content:n.get(`content`),category:n.get(`category`)||`General`,tags:n.get(`tags`),read_time:n.get(`read_time`),featured:A(`pf-featured`).checked,status:n.get(`status`),published_date:n.get(`published_date`)},s=await d(A(`post-submit`),async()=>{if(P){A(`pf-image-info`).textContent=`Subiendo imagen…`;let e=await He(P.blob,`post-image`,void 0,`/api/posts.php?action=upload_chunk`);o.image=e}else mt&&(o.remove_image=!0);return r(`/api/posts.php?action=save`,o)});if(!s.ok){a(t,s.data.validation_errors),i(A(`post-form-notice`),`error`,s.data.error||`No se pudo guardar la noticia.`);return}let c=s.data.message||`Noticia guardada.`;Ct(),await I(),window.switchView(`posts`),i(A(`posts-notice`),`success`,c)}function Rt(){if(!A(`view-posts`))return;document.addEventListener(`bm:session`,e=>st=e.detail),document.addEventListener(`bm:view`,e=>{let t=e.detail;t===`posts`&&I(),t===`new-post`&&St()}),A(`posts-status-filter`).addEventListener(`click`,e=>{let t=e.target.closest(`[data-post-filter]`);t&&(e.preventDefault(),ut=t.dataset.postFilter,I())}),A(`posts-search`).addEventListener(`input`,e=>{dt=e.target.value,clearTimeout(pt),pt=window.setTimeout(I,300)}),A(`posts-select-all`).addEventListener(`change`,e=>{let t=e.target.checked;document.querySelectorAll(`.post-cb`).forEach(e=>e.checked=t)}),A(`posts-table-body`).addEventListener(`click`,e=>{let t=e.target.closest(`[data-action]`);if(!t)return;e.preventDefault();let n=j.find(e=>e.id===Number(t.closest(`tr`)?.dataset.postId));n&&yt(t.dataset.action,n)}),A(`posts-bulk-apply`).addEventListener(`click`,bt),A(`quick-draft-form`)?.addEventListener(`submit`,async e=>{e.preventDefault();let t=e.currentTarget,n=A(`qd-title`).value.trim(),a=A(`qd-content`).value.trim(),o=await r(`/api/posts.php?action=save`,{title:n,content:a,description:a.slice(0,300),status:`draft`,category:`General`});if(!o.ok){let e=Object.values(o.data.validation_errors??{})[0];alert(e||o.data.error||`No se pudo guardar el borrador.`);return}t.reset(),window.switchView(`posts`),i(A(`posts-notice`),`success`,`Borrador guardado. Ábrelo para completarlo y publicarlo.`)}),A(`post-form`).addEventListener(`submit`,Lt);let e=A(`pf-slug`),t=!1;e.addEventListener(`input`,()=>t=!0),A(`pf-title`).addEventListener(`input`,n=>{!t&&!N&&(e.value=xt(n.target.value))});let n=A(`pf-image-input`);n.addEventListener(`change`,()=>{n.files?.[0]&&Tt(n.files[0]),n.value=``});let a=A(`pf-image-drop`);[`dragenter`,`dragover`].forEach(e=>a.addEventListener(e,e=>{e.preventDefault(),a.classList.add(`is-dragging`)})),[`dragleave`,`drop`].forEach(e=>a.addEventListener(e,()=>a.classList.remove(`is-dragging`))),a.addEventListener(`drop`,e=>{e.preventDefault();let t=e.dataTransfer?.files?.[0];t&&Tt(t)}),A(`pf-image-remove`).addEventListener(`click`,()=>{Ct(),mt=!0,wt()}),A(`pf-content`).addEventListener(`input`,R),A(`pf-description`).addEventListener(`input`,R),document.querySelectorAll(`[data-md]`).forEach(e=>e.addEventListener(`click`,()=>It(e.dataset.md))),A(`pf-insert-image`).addEventListener(`click`,()=>Mt());let o=A(`pf-content`);o.addEventListener(`dragover`,e=>{Array.from(e.dataTransfer?.items??[]).some(e=>e.kind===`file`)&&(e.preventDefault(),o.classList.add(`is-dragging`))}),o.addEventListener(`dragleave`,()=>o.classList.remove(`is-dragging`)),o.addEventListener(`drop`,e=>{o.classList.remove(`is-dragging`);let t=e.dataTransfer?.files?.[0];t&&(e.preventDefault(),Mt(t))}),o.addEventListener(`paste`,e=>{let t=Ft(e.clipboardData?.items);t&&(e.preventDefault(),Mt(t))});let s=A(`pi-file`);s.addEventListener(`change`,()=>{s.files?.[0]&&Nt(s.files[0]),s.value=``});let c=A(`pi-drop`);[`dragenter`,`dragover`].forEach(e=>c.addEventListener(e,e=>{e.preventDefault(),c.classList.add(`is-dragging`)})),[`dragleave`,`drop`].forEach(e=>c.addEventListener(e,()=>c.classList.remove(`is-dragging`))),c.addEventListener(`drop`,e=>{e.preventDefault();let t=e.dataTransfer?.files?.[0];t&&Nt(t)}),A(`pi-change`).addEventListener(`click`,()=>jt()),A(`post-image-form`).addEventListener(`submit`,Pt),A(`pf-preview-toggle`).addEventListener(`click`,()=>{let e=A(`pf-preview`),t=A(`pf-content`),n=e.style.display!==`none`;e.style.display=n?`none`:`block`,t.style.display=n?`block`:`none`,n||(e.innerHTML=`<div class="prose-preview">${kt(t.value)}</div>`)})}var zt=window.matchMedia(`(max-width: 900px)`),Bt=`bm-panel-submenus-abiertos`,H=e=>document.getElementById(e);function Vt(){try{let e=JSON.parse(localStorage.getItem(Bt)||`[]`);return new Set(Array.isArray(e)?e.filter(e=>typeof e==`string`):[])}catch{return new Set}}function Ht(e){try{localStorage.setItem(Bt,JSON.stringify([...e]))}catch{}}function Ut(e,t){let n=document.getElementById(e.getAttribute(`aria-controls`)||``);n&&(n.hidden=!t,e.setAttribute(`aria-expanded`,String(t)),e.closest(`.has-submenu`)?.classList.toggle(`is-open`,t))}function Wt(e){let t=H(`wp-sidebar`),n=H(`wp-sidebar-backdrop`),r=H(`btn-menu-toggle`);if(!t||!n||!r)return;let i=e&&zt.matches;t.classList.toggle(`is-open`,i),n.hidden=!i,r.setAttribute(`aria-expanded`,String(i)),r.setAttribute(`aria-label`,i?`Cerrar menú`:`Abrir menú`),document.body.classList.toggle(`panel-menu-abierto`,i),i&&t.querySelector(`.menu-link.is-active, .menu-link`)?.focus()}function Gt(){let e=H(`wp-sidebar`);if(!e)return;let t=Vt();Array.from(e.querySelectorAll(`.submenu-toggle`)).forEach(e=>{let n=e.getAttribute(`aria-controls`)||``;Ut(e,t.has(n)),e.addEventListener(`click`,()=>{let r=e.getAttribute(`aria-expanded`)!==`true`;Ut(e,r),r?t.add(n):t.delete(n),Ht(t)})}),document.addEventListener(`bm:view`,n=>{let r=n.detail,i=e.querySelector(`.submenu-link[data-view="${CSS.escape(r)}"]`),a=Array.from(e.querySelectorAll(`.menu-link[data-view="${CSS.escape(r)}"]`)).find(e=>e.closest(`.wp-menu-item`)?.style.display!==`none`);if(i&&!a){let e=i.closest(`.has-submenu`)?.querySelector(`.submenu-toggle`);e&&e.getAttribute(`aria-expanded`)!==`true`&&(Ut(e,!0),t.add(e.getAttribute(`aria-controls`)||``),Ht(t))}Wt(!1)}),H(`btn-menu-toggle`)?.addEventListener(`click`,()=>{Wt(!e.classList.contains(`is-open`))}),H(`wp-sidebar-backdrop`)?.addEventListener(`click`,()=>Wt(!1)),document.addEventListener(`keydown`,t=>{t.key===`Escape`&&e.classList.contains(`is-open`)&&(Wt(!1),H(`btn-menu-toggle`)?.focus())}),zt.addEventListener(`change`,()=>Wt(!1))}var U=``,Kt=!1,W=e=>document.getElementById(e);function qt(e){let t=e.split(/\r?\n/),n=[],r=`General`,i=``,a=[],o=()=>{i&&(n.push({category:r,question:i,answerMd:a.join(`
`).trim()}),i=``,a=[])};for(let e of t){let t=e.trim();t.startsWith(`## `)&&!t.startsWith(`### `)?(o(),r=t.substring(3).trim()):t.startsWith(`### `)?(o(),i=t.substring(4).trim()):i&&a.push(e)}return o(),n}function Jt(e){let t=n(e);t=t.replace(/```([a-zA-Z0-9]*)\n([\s\S]*?)```/g,`<pre><code>$2</code></pre>`),t=t.replace(/`([^`]+)`/g,`<code>$1</code>`),t=t.replace(/\*\*([^*]+)\*\*/g,`<strong>$1</strong>`),t=t.replace(/\*([^*]+)\*/g,`<em>$1</em>`),t=t.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,`<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>`);let r=t.split(`
`),i=!1,a=[];for(let e of r){let t=e.trim();t.startsWith(`- `)?(i||=(a.push(`<ul>`),!0),a.push(`<li>${t.substring(2)}</li>`)):(i&&=(a.push(`</ul>`),!1),t===``?a.push(``):a.push(`<p>${e}</p>`))}return i&&a.push(`</ul>`),a.join(`
`)}function Yt(e){let t=qt(e),n=new Set(t.map(e=>e.category)),r=W(`faqs-count-val`);r&&(r.textContent=String(t.length));let i=W(`faqs-cats-val`);i&&(i.textContent=String(n.size));let a=W(`faqs-char-count`);a&&(a.textContent=`${e.length.toLocaleString(`es-VE`)} caracteres · ${t.length} preguntas`)}function Xt(e){let t=W(`faqs-preview-body`);if(!t)return;let r=qt(e);if(r.length===0){t.innerHTML=`<p style="text-align: center; color: var(--text-muted); padding: 2rem;">No se detectaron preguntas en el Markdown. Usa <code>## Categoría</code> y <code>### Pregunta</code>.</p>`;return}let i=new Map;for(let e of r)i.has(e.category)||i.set(e.category,[]),i.get(e.category).push(e);let a=``;for(let[e,t]of i.entries()){a+=`
      <div class="faqs-preview-group">
        <h3 class="faqs-preview-cat">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
          ${n(e)} (${t.length})
        </h3>
        <div class="faqs-preview-items">
    `;for(let e of t){let t=e.question.toLowerCase().includes(`internet`);a+=`
        <details class="faqs-preview-accordion"${t?` open`:``}>
          <summary class="faqs-preview-question">
            <span>${n(e.question)}</span>
            ${t?`<span style="font-size: 0.72rem; background: #fee2e2; color: #dc2626; padding: 0.15rem 0.45rem; border-radius: 4px; font-weight: 700;">Destacada</span>`:``}
          </summary>
          <div class="faqs-preview-answer">
            ${Jt(e.answerMd)}
          </div>
        </details>
      `}a+=`
        </div>
      </div>
    `}t.innerHTML=a}function Zt(e){let t=W(`faqs-table-body`);if(!t)return;let r=qt(e);if(r.length===0){t.innerHTML=`<tr><td colspan="4" class="table-empty" style="text-align:center; padding:2rem; color:var(--text-muted);">Sin preguntas detectadas en el editor.</td></tr>`;return}let i=``;r.forEach((e,t)=>{i+=`
      <tr>
        <td style="font-weight: 700; color: var(--text-faint);">${t+1}</td>
        <td><span class="cat-pill-mini">${n(e.category)}</span></td>
        <td>
          <strong>${n(e.question)}</strong>
          <div class="row-actions" style="margin-top: 0.2rem; font-size: 0.8rem; color: var(--text-muted);">
            ${n(e.answerMd.substring(0,90))}…
          </div>
        </td>
        <td style="text-align: center; font-size: 0.8rem; color: var(--text-muted);">${e.answerMd.length} caracteres</td>
      </tr>
    `}),t.innerHTML=i}async function Qt(){let e=W(`faqs-markdown-input`),t=W(`faqs-db-badge`);try{let n=await r(`/api/faqs.php`);n.ok&&n.data?(U=n.data.raw_md||``,e&&(e.value=U),Yt(U),Xt(U),Zt(U),t&&(n.data.from_db?(t.className=`faqs-stat-pill is-live`,t.innerHTML=`<span style="width: 7px; height: 7px; border-radius: 50%; background: #10b981; display: inline-block;"></span> Sincronizado con MySQL`):(t.className=`faqs-stat-pill`,t.innerHTML=`<span style="width: 7px; height: 7px; border-radius: 50%; background: #f59e0b; display: inline-block;"></span> Modo Respaldo Local`))):i(W(`faqs-notice`),`error`,n.data?.error||`No fue posible cargar las preguntas frecuentes.`)}catch{i(W(`faqs-notice`),`error`,`Error al consultar la API de FAQs.`)}}async function $t(){if(Kt)return;let e=W(`faqs-markdown-input`),t=W(`btn-save-faqs`);if(!e)return;let n=e.value.trim();if(!n){i(W(`faqs-notice`),`warning`,`El contenido no puede estar vacío.`);return}let a=qt(n);if(a.length===0){i(W(`faqs-notice`),`error`,`No se detectaron preguntas válidas. Usa "## Categoría" y "### Pregunta".`);return}Kt=!0,t&&(t.disabled=!0,t.textContent=`Guardando…`);try{let e=await r(`/api/faqs.php?action=save_all_md`,{markdown:n},`POST`);e.ok&&e.data?.success!==!1?(U=n,i(W(`faqs-notice`),`success`,e.data?.message||`Guardadas exitosamente ${a.length} preguntas frecuentes.`),await Qt()):i(W(`faqs-notice`),`error`,e.data?.error||`Error al guardar las preguntas frecuentes.`)}catch{i(W(`faqs-notice`),`error`,`Fallo de conexión al guardar.`)}finally{Kt=!1,t&&(t.disabled=!1,t.textContent=`Guardar Cambios`)}}function G(e,t,n=``){let r=e.selectionStart,i=e.selectionEnd,a=e.value,o=a.substring(r,i),s=t+(o||``)+n;e.value=a.substring(0,r)+s+a.substring(i);let c=r+t.length+o.length;e.focus(),e.setSelectionRange(c,c),Yt(e.value)}function en(){let e=W(`view-faqs`);if(!e)return;let t=W(`faqs-markdown-input`);document.addEventListener(`bm:view`,e=>{e.detail===`faqs`&&Qt()}),W(`btn-save-faqs`)?.addEventListener(`click`,$t),W(`btn-reload-faqs`)?.addEventListener(`click`,()=>{confirm(`¿Deseas recargar y descartar los cambios no guardados?`)&&Qt()}),t&&(t.addEventListener(`input`,()=>{Yt(t.value)}),t.addEventListener(`keydown`,e=>{e.key===`Tab`&&(e.preventDefault(),G(t,`  `))})),e.querySelectorAll(`[data-faq-tab]`).forEach(n=>{n.addEventListener(`click`,()=>{let r=n.dataset.faqTab;if(!r)return;e.querySelectorAll(`.faqs-tab-btn`).forEach(e=>e.classList.remove(`is-active`)),n.classList.add(`is-active`);let i=W(`faqs-panel-editor`),a=W(`faqs-panel-preview`),o=W(`faqs-panel-table`);i&&(i.hidden=r!==`editor`),a&&(a.hidden=r!==`preview`,r===`preview`&&t&&Xt(t.value)),o&&(o.hidden=r!==`table`,r===`table`&&t&&Zt(t.value))})}),e.querySelectorAll(`.faqs-toolbar-btn`).forEach(e=>{e.addEventListener(`click`,()=>{if(t)switch(e.dataset.action){case`insert-cat`:G(t,`

## Nueva Categoría

`);break;case`insert-q`:G(t,`

### ¿Tu pregunta aquí?

Respuesta clara y técnica en Markdown...

`);break;case`bold`:G(t,`**`,`**`);break;case`italic`:G(t,`*`,`*`);break;case`list`:G(t,`
- Elemento 1
- Elemento 2
`);break;case`code`:G(t,"`","`");break;case`link`:G(t,`[texto del enlace](`,`)`);break;case`copy-md`:navigator.clipboard.writeText(t.value).then(()=>{i(W(`faqs-notice`),`info`,`Markdown copiado al portapapeles.`)});break;case`download-md`:{let e=new Blob([t.value],{type:`text/markdown;charset=utf-8;`}),n=URL.createObjectURL(e),r=document.createElement(`a`);r.href=n,r.download=`brandmeister-faqs-${new Date().toISOString().slice(0,10)}.md`,r.click(),URL.revokeObjectURL(n);break}}})})}var tn=null;function nn(){return document.getElementById(`wp-login-screen`)?.dataset.recaptchaSiteKey?.trim()||``}function rn(){let e=nn();return e?tn||(tn=new Promise((t,n)=>{let r=document.createElement(`script`);r.src=`https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(e)}&hl=es-419`,r.async=!0,r.onload=()=>window.grecaptcha.ready(()=>t(window.grecaptcha)),r.onerror=()=>{tn=null,n(Error(`No se pudo cargar reCAPTCHA. Revisa tu conexión o desactiva el bloqueador para este sitio.`))},document.head.appendChild(r)}),tn):Promise.resolve(null)}async function an(e){let t=nn();if(!t)return``;let n=rn().then(n=>n.execute(t,{action:e})),r=new Promise((e,t)=>setTimeout(()=>t(Error(`reCAPTCHA no respondió. Recarga la página e inténtalo de nuevo.`)),1e4));return Promise.race([n,r])}var K=e=>document.getElementById(e);function on(e){document.querySelectorAll(`[data-account-panel]`).forEach(t=>{t.hidden=t.dataset.accountPanel!==e}),K(`account-panel-${e}`)?.querySelector(`input:not([type=hidden])`)?.focus()}function q(e,t,n){let r=K(e);r.className=t===`error`?`wp-login-error`:`wp-login-success`,r.textContent=n,r.hidden=!n}async function sn(){document.querySelectorAll(`[data-show-panel]`).forEach(e=>e.addEventListener(`click`,t=>{t.preventDefault(),on(e.dataset.showPanel)})),u(K(`account-panel-set-password`)),K(`forgot-form`)?.addEventListener(`submit`,async e=>{e.preventDefault();let t=K(`forgot-identifier`).value.trim(),n=await d(K(`forgot-submit`),async()=>{let e=``;try{e=await an(`forgot`)}catch(e){return{ok:!1,status:0,data:{error:e.message}}}return r(`/api/auth.php?action=forgot`,{identifier:t,recaptcha_token:e})});q(`forgot-message`,n.ok?`success`:`error`,n.data.message||n.data.error||`No se pudo procesar la solicitud.`)});let e=new URLSearchParams(location.search).get(`clave`);if(!e)return!1;history.replaceState(null,``,location.pathname),on(`set-password`);let t=await r(`/api/auth.php?action=token&token=${encodeURIComponent(e)}`),i=K(`set-password-form`);if(!t.ok)return i.hidden=!0,q(`set-password-message`,`error`,t.data.error||`El enlace no es válido.`),!0;let{type:a,user:o}=t.data;return K(`set-password-title`).textContent=a===`invite`?`Crea tu contraseña`:`Elige una nueva contraseña`,K(`set-password-intro`).innerHTML=`${a===`invite`?`Bienvenido`:`Hola`}, <strong>${n(o.full_name)}</strong> (${n(o.callsign)}). Tu usuario es <strong>${n(o.username)}</strong>.`,i.querySelector(`[name="username"]`).value=o.username,i.addEventListener(`submit`,async t=>{t.preventDefault();let n=K(`sp-password`).value;if(n!==K(`sp-password-confirm`).value){q(`set-password-message`,`error`,`Las contraseñas no coinciden.`);return}let a=await d(K(`set-password-submit`),()=>r(`/api/auth.php?action=set_password`,{token:e,password:n}));if(!a.ok){q(`set-password-message`,`error`,a.data.error||`No se pudo guardar la contraseña.`);return}i.reset(),on(`login`),K(`login-username`).value=a.data.username||o.username,K(`login-password`).focus(),q(`login-error`,`success`,a.data.message||`Contraseña guardada. Ya puedes iniciar sesión.`)}),!0}var J=null,Y=null,cn=null,ln=`all`,un=`7d`,X=e=>document.getElementById(e),Z=e=>(e??0).toLocaleString(`es-VE`);function dn(e){if(!e||!/^[A-Za-z]{2}$/.test(e))return`🌐`;let t=e.toUpperCase().split(``).map(e=>127397+e.charCodeAt(0));return String.fromCodePoint(...t)}function fn(){X(`analytics-leaflet-map`)&&typeof L<`u`&&(J||(J=L.map(`analytics-leaflet-map`,{center:[8.5,-66],zoom:5,minZoom:2,maxZoom:16,zoomControl:!1,scrollWheelZoom:!1}),L.control.zoom({position:`topright`}).addTo(J),L.tileLayer(`https://tile.openstreetmap.org/{z}/{x}/{y}.png`,{attribution:`&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors`,maxZoom:19}).addTo(J),window.addEventListener(`resize`,()=>{J?.invalidateSize()})),pn())}function pn(){J&&cn&&typeof L<`u`&&(Y&&(Y.clearLayers(),J.removeLayer(Y)),typeof L.markerClusterGroup==`function`&&(Y=L.markerClusterGroup({showCoverageOnHover:!1,maxClusterRadius:48,spiderfyOnMaxZoom:!0,iconCreateFunction:e=>{let t=e.getChildCount(),n=`bm-cluster-sm`,r=36;return t>=25?(n=`bm-cluster-lg`,r=48):t>=10&&(n=`bm-cluster-md`,r=42),L.divIcon({html:`<span>${t}</span>`,className:`bm-custom-cluster ${n}`,iconSize:L.point(r,r)})}})),(cn.map_points||[]).forEach(e=>{if(ln!==`all`&&(e.events?.[ln]||0)===0)return;let t=dn(e.code),r=e.events?.player_play||0,i=e.events?.link_click||0,a=e.events?.post_view||0,o=`
      <div class="bm-popup-card">
        <div class="bm-popup-header">
          <span>${t}</span>
          <span>${n(e.city)}</span>
          <span class="bm-popup-badge">${n(e.country)}</span>
        </div>
        <div class="bm-popup-stat">
          <span>Total actividad:</span>
          <strong>${Z(e.count)} interacciones</strong>
        </div>
        ${r?`<div class="bm-popup-stat"><span>Reproducciones</span><strong>${Z(r)}</strong></div>`:``}
        ${i?`<div class="bm-popup-stat"><span>Clics en enlaces</span><strong>${Z(i)}</strong></div>`:``}
        ${a?`<div class="bm-popup-stat"><span>Lecturas del blog</span><strong>${Z(a)}</strong></div>`:``}
      </div>
    `,s=L.divIcon({className:`bm-single-pin`,iconSize:[18,18],iconAnchor:[9,9],popupAnchor:[0,-10]}),c=L.marker([e.lat,e.lng],{icon:s}).bindPopup(o);Y?Y.addLayer(c):c.addTo(J)}),Y&&J.addLayer(Y))}function mn(e){cn=e;let t=X(`live-listeners-banner`),r=X(`live-listeners-text`);if(t&&r){let i=e.live_audio;if(i&&i.is_active&&i.total_listeners>0){t.classList.add(`is-active-listening`);let e=i.total_listeners;r.innerHTML=`Hay <strong>${e===1?`1 usuario escuchando`:`${Z(e)} usuarios escuchando`}</strong> en este momento desde: <span class="live-status-countries-pills">${(i.countries||[]).map(e=>`<span class="live-country-pill">${dn(e.code)} ${n(e.country)} <strong>(${Z(e.count)})</strong></span>`).join(``)}</span>`}else t.classList.remove(`is-active-listening`),r.textContent=`No hay personas escuchando el audio en vivo en este momento.`}X(`kpi-player-plays`)&&(X(`kpi-player-plays`).textContent=Z(e.kpis?.player_plays)),X(`kpi-unique-listeners`)&&(X(`kpi-unique-listeners`).textContent=Z(e.kpis?.unique_listeners)),X(`kpi-link-clicks`)&&(X(`kpi-link-clicks`).textContent=Z(e.kpis?.link_clicks)),X(`kpi-post-views`)&&(X(`kpi-post-views`).textContent=Z(e.kpis?.post_views)),X(`kpi-post-shares`)&&(X(`kpi-post-shares`).textContent=Z(e.kpis?.post_shares)),X(`kpi-active-countries`)&&(X(`kpi-active-countries`).textContent=Z(e.kpis?.active_countries)),X(`kpi-page-views`)&&(X(`kpi-page-views`).textContent=Z(e.kpis?.page_views??0)),X(`kpi-unique-visitors`)&&(X(`kpi-unique-visitors`).textContent=Z(e.kpis?.unique_visitors??0)),X(`kpi-petra-views`)&&(X(`kpi-petra-views`).textContent=Z(e.kpis?.petra_views??e.petra?.total_views??0)),X(`kpi-petra-unique`)&&(X(`kpi-petra-unique`).textContent=Z(e.kpis?.petra_unique??e.petra?.unique_visitors??0));let i=Array.from(new Set((e.map_points||[]).map(e=>e.code).filter(e=>/^[A-Z]{2}$/.test(e)))).slice(0,4);X(`kpi-top-countries`)&&(X(`kpi-top-countries`).textContent=i.length?i.join(`, `):`Sin datos aún`);let a=(e.shares?.platforms||[])[0];X(`kpi-top-platform`)&&(X(`kpi-top-platform`).textContent=a?`Más usado: ${a.name}`:`Sin compartidos aún`);let o={"7d":`Últimos 7 días`,"30d":`Últimos 30 días`,all:`Histórico`};document.querySelectorAll(`[data-range-label]`).forEach(e=>e.textContent=o[un]??``),pn(),hn(e.audience);let s=X(`player-countries-list`);if(s){let t=e.player?.countries||[];s.innerHTML=t.length?t.map(e=>`
            <div class="country-bar-item">
              <div class="country-bar-header">
                <span class="country-name-wrap">
                  <span>${dn(e.code)}</span>
                  <span>${n(e.country)}</span>
                  <span class="country-code-pill">${n(e.code)}</span>
                </span>
                <span class="country-bar-metrics">
                  <strong>${Z(e.plays)}</strong>
                  <span>${Number(e.percent)||0}%</span>
                </span>
              </div>
              <div class="country-bar-track">
                <div class="country-bar-fill" style="width: ${Math.max(0,Math.min(100,Number(e.percent)||0))}%;"></div>
              </div>
            </div>
          `).join(``):`<p class="analytics-empty">Sin reproducciones en este periodo.</p>`}let c=X(`player-listeners-tbody`);if(c){let t=e.player?.listeners||[];c.innerHTML=t.length?t.map(e=>{let t=dn(e.code);return`
            <tr>
              <td><span class="ip-pill">${n(e.ip)}</span></td>
              <td>${t} ${n(e.city)}, ${n(e.code)}</td>
              <td class="cell-num">
                <span class="badge-count">${e.plays} ${e.plays===1?`vez`:`veces`}</span>
              </td>
              <td class="cell-right cell-muted">
                ${n(e.last_active)}
              </td>
            </tr>
          `}).join(``):`<tr><td colspan="4" class="analytics-empty">Sin oyentes en este periodo.</td></tr>`}let l=X(`petra-talkgroups-container`);if(l){let t=e.petra?.talkgroups||[];l.innerHTML=t.length?t.map(e=>{let t=e.views||0,r=e.unique_users||0,i=Math.max(0,Math.min(100,Number(e.percent)||0)),a=String(e.id),o=a===`734`?`badge-tg-main`:a===`73452`?`badge-tg-alert`:a===`73473`?`badge-tg-rcv`:`badge-tg-rvr`;return`
            <div class="petra-tg-card">
              <div class="petra-tg-head">
                <div class="petra-tg-info">
                  <span class="badge-tag-category ${o}">TG ${n(e.id)}</span>
                  <span class="petra-tg-badge-meta">${n(e.badge)}</span>
                </div>
                <a href="/petra/${encodeURIComponent(e.id)}" target="_blank" rel="noopener" class="petra-tg-link" title="Ver monitoreo en vivo">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                  </svg>
                </a>
              </div>
              <div class="petra-tg-title">${n(e.name)}</div>
              ${e.sub?`<div class="petra-tg-sub">${n(e.sub)}</div>`:``}
              
              <div class="petra-tg-metrics">
                <div class="petra-metric-block">
                  <span class="metric-val">${Z(t)}</span>
                  <span class="metric-lbl">${t===1?`interacción`:`interacciones`}</span>
                </div>
                <div class="petra-metric-block">
                  <span class="metric-val">${Z(r)}</span>
                  <span class="metric-lbl">${r===1?`usuario`:`usuarios`}</span>
                </div>
                <div class="petra-metric-block petra-metric-right">
                  <span class="metric-val">${i}%</span>
                  <span class="metric-lbl">del interés</span>
                </div>
              </div>

              <div class="petra-tg-progress">
                <div class="petra-tg-progress-fill ${o}" style="width: ${i}%;"></div>
              </div>
            </div>
          `}).join(``):`<p class="analytics-empty">Sin interacciones registradas en Petra en este periodo.</p>`}let u=X(`link-clicks-tbody`);if(u){let t=e.links||[];u.innerHTML=t.length?t.map(e=>`
            <tr>
              <td>
                <div class="cell-strong">${n(e.title)}</div>
                <div class="cell-url">${n(e.url)}</div>
              </td>
              <td class="col-opt">
                <span class="badge-tag-category">${n(e.category===`external_link`?`Externo`:e.category===`portal_link`?`Portal`:e.category||`Enlace`)}</span>
              </td>
              <td class="cell-num cell-right">
                ${Z(e.clicks)}
              </td>
            </tr>
          `).join(``):`<tr><td colspan="3" class="analytics-empty">Sin clics en enlaces en este periodo.</td></tr>`}let d=X(`global-countries-tbody`);if(d){let t=e.countries_detail||[];d.innerHTML=t.length?t.map(e=>{let t=dn(e.code),r=Math.max(0,Math.min(100,Number(e.percent)||0));return`
            <tr>
              <td>
                <div class="country-cell-info">
                  <span class="country-flag-icon">${t}</span>
                  <div class="country-titles">
                    <span class="country-name-text">${n(e.country)}</span>
                    <span class="country-code-pill">${n(e.code)}</span>
                  </div>
                </div>
              </td>
              <td class="cell-num">
                <span class="badge-count">${Z(e.unique_visitors)} ${e.unique_visitors===1?`usuario`:`usuarios`}</span>
              </td>
              <td class="cell-num">
                <span class="cell-strong">${Z(e.total)}</span>
              </td>
              <td class="cell-interest">
                <div class="interest-wrap">
                  <div class="country-bar-track" style="flex: 1;">
                    <div class="country-bar-fill" style="width: ${r}%;"></div>
                  </div>
                  <span class="interest-val">${r}%</span>
                </div>
              </td>
            </tr>
          `}).join(``):`<tr><td colspan="4" class="analytics-empty">Sin conexiones registradas en este periodo.</td></tr>`}let f=X(`traffic-sources-container`);if(f){let t=e.traffic?.sources||[];f.innerHTML=t.length?t.map(e=>{let t=Math.max(0,Math.min(100,Number(e.percent)||0)),r=Number(e.people)||0;return`
            <div class="share-platform-row">
              <div class="share-platform-header">
                <span class="share-platform-name">${n(e.name)}</span>
                <span class="share-platform-count">
                  <strong>${Z(e.visits)}</strong> <span>${t}%</span>
                </span>
              </div>
              <div class="share-track">
                <div class="share-fill" style="width: ${t}%;"></div>
              </div>
              <span class="share-platform-sub">${Z(r)} ${r===1?`persona`:`personas`}</span>
            </div>
          `}).join(``):`<p class="analytics-empty">Todavía no hay visitas registradas en este periodo. Los datos empiezan a contarse desde que se publicó esta versión del sitio.</p>`}let p=X(`traffic-sites-tbody`);if(p){let t=e.traffic?.sites||[];p.innerHTML=t.length?t.map(e=>`
            <tr>
              <td><span class="cell-strong">${n(e.host)}</span></td>
              <td class="col-opt">${n(e.source)}</td>
              <td class="cell-right"><strong>${Z(e.visits)}</strong></td>
            </tr>
          `).join(``):`<tr><td colspan="3" class="analytics-empty">Ningún sitio externo nos enlazó en este periodo.</td></tr>`}let m=(e,t)=>e.length?e.map(e=>{let t=Math.max(0,Math.min(100,Number(e.percent)||0));return`
              <div class="tool-bar-row">
                <div class="tool-bar-head">
                  <span class="tool-bar-name">${n(e.name)}</span>
                  <span class="tool-bar-count"><strong>${Z(e.count)}</strong> ${t}%</span>
                </div>
                <div class="share-track"><div class="share-fill" style="width: ${t}%;"></div></div>
              </div>`}).join(``):`<p class="analytics-empty">${t}</p>`,h=e.codeplug,g=(e,t,n)=>e===1?t:n,_=e=>`<strong>${Z(e)}</strong> ${g(e,`persona distinta`,`personas distintas`)}`,v=h?.total??0;X(`codeplug-total`)&&(X(`codeplug-total`).textContent=Z(v)),X(`codeplug-label`)&&(X(`codeplug-label`).innerHTML=`${g(v,`descarga`,`descargas`)} · ${_(h?.people??0)}`);let y=X(`codeplug-models`);y&&(y.innerHTML=m(h?.models||[],`Sin descargas en este periodo.`));let b=X(`codeplug-scopes`);b&&(b.innerHTML=m(h?.scopes||[],`Sin descargas en este periodo.`));let x=e.lookups,S=x?.total??0;X(`lookups-total`)&&(X(`lookups-total`).textContent=Z(S)),X(`lookups-label`)&&(X(`lookups-label`).innerHTML=`${g(S,`consulta`,`consultas`)} · ${_(x?.people??0)}`+(S?` · <strong>${Number(x?.found_percent)||0} %</strong> con resultado`:``));let ee=X(`lookups-top-tbody`);if(ee){let e=x?.top||[];ee.innerHTML=e.length?e.map(e=>`
              <tr>
                <td>
                  <a class="cell-strong" href="/radioid?q=${encodeURIComponent(e.query)}" target="_blank" rel="noopener">${n(e.query)}</a>
                  ${e.found?``:`<span class="badge-mini badge-sin-resultado">Sin resultado</span>`}
                </td>
                <td class="col-opt">${n(e.type)}</td>
                <td class="cell-right"><strong>${Z(e.count)}</strong></td>
              </tr>`).join(``):`<tr><td colspan="3" class="analytics-empty">Sin consultas en este periodo.</td></tr>`}let te=X(`social-shares-container`);if(te){let t=e.shares?.platforms||[];te.innerHTML=t.length?t.map(e=>`
            <div class="share-platform-row">
              <div class="share-platform-header">
                <span class="share-platform-name">${n(e.name)}</span>
                <span class="share-platform-count">
                  <strong>${Z(e.shares)}</strong> <span>${Number(e.percent)||0}%</span>
                </span>
              </div>
              <div class="share-track">
                <div class="share-fill" style="width: ${Math.max(0,Math.min(100,Number(e.percent)||0))}%;"></div>
              </div>
            </div>
          `).join(``):`<p class="analytics-empty">Sin compartidos en este periodo.</p>`}let ne=X(`posts-views-tbody`);if(ne){let t=e.posts||[];if(!t.length)ne.innerHTML=`<tr><td colspan="5" class="analytics-empty">Sin noticias publicadas.</td></tr>`;else{let e=Math.max(1,...t.map(e=>Number(e.views)||0));ne.innerHTML=t.map(t=>{let r=Math.round((Number(t.views)||0)/e*100);return`
            <tr>
              <td>
                <div class="cell-strong">${t.slug?`<a href="/blog/${encodeURIComponent(t.slug)}" target="_blank" rel="noopener">${n(t.title)}</a>`:n(t.title)}</div>
              </td>
              <td class="col-opt">
                <span class="badge-tag-category is-neutral">${n(t.category||`General`)}</span>
              </td>
              <td class="cell-num">
                ${Z(t.views)}
              </td>
              <td class="cell-num cell-muted col-opt">
                ${Z(t.shares||0)}
              </td>
              <td class="cell-interest" title="${r}% respecto a la noticia más leída">
                <div class="interest-wrap">
                  <span class="interest-track"><span class="interest-fill" style="width: ${r}%;"></span></span>
                  <span class="interest-value">${r}%</span>
                </div>
              </td>
            </tr>
          `}).join(``)}}hn(e.audience)}function hn(e){let t=X(`audience-devices-container`);if(t){let r=e?.devices||[],i=e?.total_device_visits||0;if(!r.length||i===0)t.innerHTML=`
        <div class="audience-pie-svg-container">
          <svg viewBox="0 0 140 140" class="audience-pie-svg">
            <circle cx="70" cy="70" r="52" fill="none" stroke="#F1F5F9" stroke-width="16" />
          </svg>
          <div class="audience-pie-center">
            <span class="audience-pie-center-val">0</span>
            <span class="audience-pie-center-lbl">Sin datos</span>
          </div>
        </div>
        <p class="analytics-empty" style="padding: 0.5rem 0 !important;">Sin visitas en este periodo.</p>
      `;else{let e=2*Math.PI*52,a=0,o=r.map(t=>{let n=Math.max(0,Math.min(100,Number(t.percent)||0));if(n===0)return``;let r=n/100*e,i=a;return a+=r,`<circle class="pie-slice" cx="70" cy="70" r="52" fill="none" stroke="${t.color}" stroke-width="16" stroke-dasharray="${r} ${e-r}" stroke-dashoffset="${-i}" />`}).join(``),s=r.map(e=>`
            <div class="audience-legend-row">
              <div class="audience-legend-name">
                <span class="audience-legend-dot" style="background-color: ${e.color};"></span>
                <span>${n(e.name)}</span>
              </div>
              <div class="audience-legend-metrics">
                <strong>${Z(e.visits)}</strong>
                <span>(${e.percent}%)</span>
              </div>
            </div>
          `).join(``);t.innerHTML=`
        <div class="audience-pie-svg-container">
          <svg viewBox="0 0 140 140" class="audience-pie-svg">
            <circle cx="70" cy="70" r="52" fill="none" stroke="#F1F5F9" stroke-width="16" />
            ${o}
          </svg>
          <div class="audience-pie-center">
            <span class="audience-pie-center-val">${Z(i)}</span>
            <span class="audience-pie-center-lbl">Visitas</span>
          </div>
        </div>
        <div class="audience-devices-legend">
          ${s}
        </div>
      `}}let r=X(`audience-days-container`);if(r){let t=e?.days||[],i=e?.max_day_visits||0,a=e?.peak_day;r.innerHTML=!t.length||i===0?`
        <div class="day-bars-track-area">
          ${[`Lun`,`Mar`,`Mié`,`Jue`,`Vie`,`Sáb`,`Dom`].map(e=>`
            <div class="day-bar-item">
              <div class="day-bar-slot"><div class="day-bar-fill" style="height: 4px;"></div></div>
              <span class="day-bar-label">${e}</span>
            </div>
          `).join(``)}
        </div>
        <div class="audience-summary-pill" style="background: #F8FAFC; color: #64748B; border-color: #E2E8F0;">
          <span>Sin actividad registrada en este periodo</span>
        </div>
      `:`
        <div class="day-bars-track-area">
          ${t.map(e=>{let t=!!(a&&a.day_idx===e.day_idx&&e.visits>0),r=e.visits>0?Math.max(8,Math.round(e.visits/i*100)):4;return`
            <div class="day-bar-item ${t?`is-peak`:``}" title="${n(e.name)}: ${Z(e.visits)} visitas (${Z(e.people)} personas)">
              <span class="day-bar-value">${e.visits>0?Z(e.visits):``}</span>
              <div class="day-bar-slot">
                <div class="day-bar-fill" style="height: ${r}%;"></div>
              </div>
              <span class="day-bar-label">${n(e.short)}</span>
            </div>
          `}).join(``)}
        </div>
        ${a&&a.visits>0?`
          <div class="audience-summary-pill">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
            </svg>
            <span>Día pico: <strong>${n(a.name)}</strong> (${Z(a.visits)} visitas)</span>
          </div>
        `:`
          <div class="audience-summary-pill" style="background: #F8FAFC; color: #64748B; border-color: #E2E8F0;">
            <span>Sin visitas en este periodo</span>
          </div>
        `}
      `}let i=X(`audience-hours-container`);if(i){let t=e?.hours||[],r=e?.max_hour_visits||0,a=e?.peak_hour;i.innerHTML=!t.length||r===0?`
        <div class="hour-bars-track-area">
          ${Array.from({length:24}).map(()=>`
            <div class="hour-bar-item">
              <div class="hour-bar-slot"><div class="hour-bar-fill" style="height: 4px;"></div></div>
            </div>
          `).join(``)}
        </div>
        <div class="hour-bars-axis">
          <span>00h</span><span>04h</span><span>08h</span><span>12h</span><span>16h</span><span>20h</span><span>23h</span>
        </div>
        <div class="audience-summary-pill" style="background: #F8FAFC; color: #64748B; border-color: #E2E8F0;">
          <span>Sin actividad registrada en este periodo</span>
        </div>
      `:`
        <div class="hour-bars-track-area">
          ${t.map(e=>{let t=!!(a&&a.hour===e.hour&&e.visits>0),i=e.visits>0?Math.max(8,Math.round(e.visits/r*100)):4;return`
            <div class="hour-bar-item ${t?`is-peak`:``}">
              <div class="hour-tooltip">${n(e.label)}: <strong>${Z(e.visits)}</strong> visitas</div>
              <div class="hour-bar-slot">
                <div class="hour-bar-fill" style="height: ${i}%;"></div>
              </div>
            </div>
          `}).join(``)}
        </div>
        <div class="hour-bars-axis">
          <span>00h</span><span>04h</span><span>08h</span><span>12h</span><span>16h</span><span>20h</span><span>23h</span>
        </div>
        ${a&&a.visits>0?`
          <div class="audience-summary-pill">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>Hora pico: <strong>${n(a.label)}</strong> (${Z(a.visits)} visitas)</span>
          </div>
        `:`
          <div class="audience-summary-pill" style="background: #F8FAFC; color: #64748B; border-color: #E2E8F0;">
            <span>Sin visitas en este periodo</span>
          </div>
        `}
      `}}var gn={kpis:{player_plays:0,unique_listeners:0,link_clicks:0,post_views:0,post_shares:0,active_countries:0},map_points:[],player:{countries:[],listeners:[],total_plays:0},live_audio:{is_active:!1,total_listeners:0,countries:[]},countries_detail:[],links:[],posts:[],shares:{platforms:[],total:0},audience:{devices:[],total_device_visits:0,days:[],max_day_visits:0,hours:[],max_hour_visits:0}};async function _n(e=`7d`){if(un=e,document.documentElement.dataset.panel===`app`)try{let t=await fetch(`/api/analytics.php?action=stats&range=${encodeURIComponent(e)}`,{credentials:`same-origin`});if(t.status===401){document.dispatchEvent(new CustomEvent(`bm:unauthorized`));return}if(t.ok){let e=await t.json();if(e&&e.kpis){mn(e),vn();return}}mn(gn)}catch{mn(gn)}}function vn(){let e=X(`dashboard-updated`);e&&(e.textContent=`Actualizado a las ${new Date().toLocaleTimeString(`es-VE`,{hour:`2-digit`,minute:`2-digit`})}`)}async function yn(){let e=X(`view-dashboard`);if(!e||document.documentElement.dataset.panel!==`app`||e.classList.contains(`is-refreshing`))return;e.classList.add(`is-refreshing`),e.setAttribute(`aria-busy`,`true`);let t=X(`dashboard-updated`);t&&(t.textContent=`Actualizando…`);let n=performance.now();await _n(un);let r=450-(performance.now()-n);r>0&&await new Promise(e=>setTimeout(e,r)),J?.setView([8.5,-66],5),e.classList.remove(`is-refreshing`),e.removeAttribute(`aria-busy`)}function bn(){X(`view-dashboard`)&&(document.querySelectorAll(`.btn-time-range`).forEach(e=>{e.addEventListener(`click`,e=>{document.querySelectorAll(`.btn-time-range`).forEach(e=>e.classList.remove(`is-active`));let t=e.currentTarget;t.classList.add(`is-active`),_n(t.dataset.range||`7d`)})}),document.querySelectorAll(`[data-map-filter]`).forEach(e=>{e.addEventListener(`click`,e=>{document.querySelectorAll(`[data-map-filter]`).forEach(e=>e.classList.remove(`is-active`));let t=e.currentTarget;t.classList.add(`is-active`),ln=t.dataset.mapFilter||`all`,pn()})}),X(`btn-reset-map`)?.addEventListener(`click`,()=>{J&&J.setView([8.5,-66],5,{animate:!0})}),document.addEventListener(`bm:view`,e=>{e.detail===`dashboard`&&(setTimeout(()=>{fn(),J?.invalidateSize()},100),yn())}),setInterval(()=>{document.visibilityState===`visible`&&X(`view-dashboard`)?.classList.contains(`is-active`)&&_n(un)},3e4))}var Q={id:0,username:``,callsign:``,full_name:``,email:``,role:`author`},xn={users:[`admin`],"user-new":[`admin`],"site-content":[`admin`,`editor`],faqs:[`admin`,`editor`],posts:[`admin`,`editor`,`author`],"new-post":[`admin`,`editor`,`author`],gallery:[`admin`,`editor`],"gallery-edit":[`admin`,`editor`]},Sn=e=>{Q=e,document.documentElement.dataset.rol=e.role,document.dispatchEvent(new CustomEvent(`bm:session`,{detail:e}))},Cn=()=>{let e=document.getElementById(`bm-sesion-inicial`);if(!e)return null;try{let t=JSON.parse(e.textContent||``);return t&&t.id&&t.role?t:null}catch{return null}},wn=async()=>{try{let e=await(await fetch(`/api/auth.php?action=status`,{credentials:`same-origin`})).json();if(e?.logged_in&&e.user){Sn(e.user),Tn();return}}catch{$(`No fue posible contactar al servidor de autenticación.`);return}$()},$=(e=``)=>{document.documentElement.dataset.panel=`login`,delete document.documentElement.dataset.rol,document.getElementById(`wp-login-screen`).style.display=`flex`,rn().catch(()=>{}),document.getElementById(`wp-app`).style.display=`none`,on(`login`);let t=document.getElementById(`login-error`);t&&(t.className=`wp-login-error`,t.textContent=e,t.hidden=!e)},Tn=()=>{document.documentElement.dataset.panel=`app`,document.getElementById(`wp-login-screen`).style.display=`none`,document.getElementById(`wp-app`).style.display=`flex`,En(),window.switchView(`dashboard`)},En=()=>{let e=document.getElementById(`bar-user-name`),n=document.getElementById(`bar-user-role`);e&&(e.textContent=Q.callsign),n&&(n.textContent=t[Q.role],n.className=`role-badge role-${Q.role}`);let r=(e,t)=>{let n=document.getElementById(e);n&&(n.style.display=t?``:`none`)};r(`menu-users-item`,Q.role===`admin`),r(`menu-profile-item`,Q.role!==`admin`),r(`menu-site-content-item`,Q.role!==`author`),r(`menu-faqs-item`,Q.role!==`author`),r(`menu-gallery-item`,Q.role!==`author`)};document.addEventListener(`bm:session`,En),document.addEventListener(`bm:unauthorized`,()=>$(`Tu sesión ha expirado. Por favor, inicia sesión nuevamente.`));var Dn=async()=>{if(document.documentElement.dataset.panel===`app`)try{(await(await fetch(`/api/auth.php?action=status`,{credentials:`same-origin`})).json().catch(()=>null))?.logged_in||$(`Tu sesión ha expirado. Por favor, inicia sesión nuevamente.`)}catch{}};window.addEventListener(`focus`,Dn),document.addEventListener(`visibilitychange`,()=>{document.visibilityState===`visible`&&Dn()}),window.switchView=e=>{let t=xn[e];t&&!t.includes(Q.role)&&(e=`dashboard`),document.querySelectorAll(`.wp-view`).forEach(e=>e.classList.remove(`is-active`)),document.querySelectorAll(`.menu-link, .submenu-link`).forEach(e=>e.classList.remove(`is-active`));let n=document.getElementById(`view-${e}`);n&&n.classList.add(`is-active`),document.querySelectorAll(`.wp-sidebar [data-view="${e}"]`).forEach(e=>{e.classList.add(`is-active`),e.closest(`.has-submenu`)?.querySelector(`:scope > .menu-link`)?.classList.add(`is-active`)}),document.dispatchEvent(new CustomEvent(`bm:view`,{detail:e})),window.scrollTo({top:0})},document.querySelectorAll(`[data-view]`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.getAttribute(`data-view`);t&&window.switchView(t)})});var On=document.getElementById(`login-form`);On&&On.addEventListener(`submit`,async e=>{e.preventDefault();let t=document.getElementById(`login-username`),n=document.getElementById(`login-password`),r=document.getElementById(`login-submit`);r&&(r.disabled=!0);try{let e=``;try{e=await an(`login`)}catch(e){$(e.message);return}let r=await fetch(`/api/auth.php?action=login`,{method:`POST`,credentials:`same-origin`,headers:{"Content-Type":`application/json`},body:JSON.stringify({username:t.value,password:n.value,recaptcha_token:e})}),i=await r.json().catch(()=>null);r.ok&&i?.success&&i.user?(Sn(i.user),n.value=``,Tn()):$(i?.error||`No fue posible iniciar sesión.`)}catch{$(`No fue posible contactar al servidor de autenticación.`)}finally{r&&(r.disabled=!1)}}),document.getElementById(`btn-logout`)?.addEventListener(`click`,async()=>{try{await fetch(`/api/auth.php?action=logout`,{method:`POST`,credentials:`same-origin`})}catch{}$()}),document.getElementById(`btn-save-site-texts`)?.addEventListener(`click`,()=>{alert(`Los textos del portal todavía no se guardan: pendiente en la siguiente fase.`)}),he(),ve(),ot(),Rt(),en(),Gt(),bn(),sn().then(e=>{if(e)return;let t=Cn();t?(Sn(t),Tn()):document.documentElement.dataset.panel===`login`?$():wn()});