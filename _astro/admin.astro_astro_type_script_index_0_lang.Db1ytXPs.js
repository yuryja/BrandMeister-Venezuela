const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["_astro/encode.B7qyjpkk.js","_astro/preload-helper.B3nfOi5I.js"])))=>i.map(i=>d[i]);
import{t as e}from"./preload-helper.B3nfOi5I.js";var t={admin:`Administrador`,editor:`Editor`,author:`Autor`},n=e=>String(e??``).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`);async function r(e,t,n){try{let r=await fetch(e,{method:n??(t===void 0?`GET`:`POST`),credentials:`same-origin`,headers:t===void 0?void 0:{"Content-Type":`application/json`},body:t===void 0?void 0:JSON.stringify(t)}),i=await r.json().catch(()=>({}));return r.status===401&&!e.includes(`action=login`)&&document.dispatchEvent(new CustomEvent(`bm:unauthorized`)),{ok:r.ok&&i?.success!==!1,status:r.status,data:i}}catch{return{ok:!1,status:0,data:{success:!1,error:`No fue posible contactar al servidor.`}}}}function i(e,t,r){e&&(e.innerHTML=`
    <div class="wp-notice wp-notice-${t}" role="${t===`error`?`alert`:`status`}">
      <p>${n(r)}</p>
      <button type="button" class="wp-notice-dismiss" aria-label="Descartar aviso">&times;</button>
    </div>`,e.querySelector(`.wp-notice-dismiss`)?.addEventListener(`click`,()=>e.innerHTML=``),e.scrollIntoView({block:`nearest`,behavior:`smooth`}))}function a(e,t={}){e.querySelectorAll(`.field-error`).forEach(e=>e.remove()),e.querySelectorAll(`.form-input.has-error`).forEach(e=>e.classList.remove(`has-error`));for(let[n,r]of Object.entries(t)){let t=e.querySelector(`[name="${n}"]`);if(!t)continue;t.classList.add(`has-error`);let i=document.createElement(`span`);i.className=`field-error`,i.textContent=r,(t.closest(`.password-field`)??t).insertAdjacentElement(`afterend`,i)}e.querySelector(`.has-error`)?.focus()}function o(e){if(!e)return`—`;let t=new Date(e*1e3);if(Number.isNaN(t.getTime()))return`—`;let n=Math.round((Date.now()-t.getTime())/1e3),r=new Intl.RelativeTimeFormat(`es`,{numeric:`auto`}),i=[[60,`second`],[60,`minute`],[24,`hour`],[30,`day`],[12,`month`],[1/0,`year`]],a=n;for(let[e,t]of i){if(Math.abs(a)<e)return r.format(-Math.round(a),t);a/=e}return t.toLocaleDateString(`es-VE`)}var s=new WeakMap;function c(e){s.get(e)?.abort();let t=new AbortController;s.set(e,t),e.style.display=`flex`,e.querySelector(`input, textarea, select, button.btn-primary`)?.focus(),e.querySelectorAll(`[data-close-modal]`).forEach(n=>n.addEventListener(`click`,()=>l(e),{signal:t.signal})),document.addEventListener(`keydown`,t=>t.key===`Escape`&&l(e),{signal:t.signal})}function l(e){e.style.display=`none`,s.get(e)?.abort(),s.delete(e)}function u(e=document){e.querySelectorAll(`[data-generate-password]`).forEach(t=>{t.addEventListener(`click`,()=>{let n=document.getElementById(t.dataset.generatePassword);if(!n)return;let r=crypto.getRandomValues(new Uint32Array(16));n.value=Array.from(r,e=>`ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*-_`[e%66]).join(``),n.type=`text`;let i=e.querySelector(`[data-toggle-password="${n.id}"]`);i&&(i.textContent=`Ocultar`),n.dispatchEvent(new Event(`input`,{bubbles:!0})),n.select()})}),e.querySelectorAll(`[data-toggle-password]`).forEach(e=>{e.addEventListener(`click`,()=>{let t=document.getElementById(e.dataset.togglePassword);if(!t)return;let n=t.type===`password`;t.type=n?`text`:`password`,e.textContent=n?`Ocultar`:`Mostrar`})})}async function d(e,t){e&&(e.disabled=!0);try{return await t()}finally{e&&(e.disabled=!1)}}var f=e=>document.getElementById(e),p=[],m=null,h=``,g=``,_=null,ee=null,te=[],v=null,y=()=>f(`users-notice`);async function b(){let e=await r(`/api/users.php`);if(!e.ok){e.status!==401&&i(y(),`error`,e.data.error||`No se pudo cargar la lista de usuarios.`);return}p=e.data.users,f(`users-mail-warning`).hidden=e.data.mail_configured,ae()}function ne(){let e=g.trim().toLowerCase();return p.filter(t=>(!h||t.role===h)&&(!e||[t.username,t.callsign,t.full_name,t.email].some(t=>t.toLowerCase().includes(e))))}function re(){let e={"":p.length};p.forEach(t=>e[t.role]=(e[t.role]||0)+1);let t=[[``,`Todos`],[`admin`,`Administradores`],[`editor`,`Editores`],[`author`,`Autores`]];f(`users-role-filter`).innerHTML=t.filter(([t])=>t===``||e[t]).map(([t,n])=>`<li><a href="#" data-role-filter="${t}" class="${t===h?`is-current`:``}">${n} <span class="count">(${e[t]||0})</span></a></li>`).join(``)}function ie(e){return e.split(/\s+/).filter(Boolean).slice(0,2).map(e=>e[0]).join(``).toUpperCase()||`?`}function ae(){re();let e=ne();f(`users-count`).textContent=`${e.length} ${e.length===1?`elemento`:`elementos`}`,f(`users-select-all`).checked=!1;let r=f(`users-table-body`);if(!e.length){r.innerHTML=`<tr><td colspan="7" class="table-empty">No se encontraron usuarios.</td></tr>`;return}r.innerHTML=e.map(e=>{let r=e.id===m?.id,i=[r?`<span class="state-badge state-self">Tú</span>`:``,e.status===`inactive`?`<span class="state-badge state-inactive">Desactivado</span>`:``,e.pending_invite?`<span class="state-badge state-pending">Invitación pendiente</span>`:``].join(``),a=[`<span><a href="#" data-action="edit">Editar</a></span>`,`<span><a href="#" data-action="email">Enviar correo</a></span>`,e.status===`active`?`<span><a href="#" data-action="invite">${e.pending_invite?`Reenviar invitación`:`Enviar enlace de contraseña`}</a></span>`:``,r?``:`<span><a href="#" data-action="${e.status===`active`?`deactivate`:`activate`}">${e.status===`active`?`Desactivar`:`Activar`}</a></span>`,r?``:`<span class="trash"><a href="#" data-action="delete">Eliminar</a></span>`].filter(Boolean).join(` | `);return`
      <tr data-user-id="${e.id}" class="${e.status===`inactive`?`is-inactive`:``}">
        <td class="col-cb">${r?``:`<input type="checkbox" class="user-cb" value="${e.id}" aria-label="Seleccionar ${n(e.username)}" />`}</td>
        <td class="cell-title">
          <div class="user-cell">
            <span class="user-avatar" aria-hidden="true">${n(ie(e.full_name))}</span>
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
      </tr>`}).join(``)}function oe(){return Array.from(document.querySelectorAll(`.user-cb:checked`)).map(e=>Number(e.value))}function se(e){ee=e,window.switchView(`user-new`)}function ce(){_=ee,ee=null;let e=f(`user-form`),t=_!==null;e.reset(),a(e),f(`user-form-notice`).innerHTML=``;let n=(t,n)=>e.elements.namedItem(t).value=n;n(`id`,t?String(_.id):``),n(`username`,_?.username??``),n(`callsign`,_?.callsign??``),n(`full_name`,_?.full_name??``),n(`email`,_?.email??``),n(`role`,_?.role??`author`),n(`status`,_?.status??`active`);let r=t&&_.id===m?.id;f(`uf-role`).disabled=r,f(`uf-status`).disabled=r,f(`user-form-title`).textContent=t?`Editar usuario ${_.callsign}`:`Añadir nuevo usuario`,f(`user-form-intro`).textContent=t?r?`Estás editando tu propia cuenta: no puedes cambiar tu rol ni desactivarte.`:`Modifica los datos, el rol o el estado de la cuenta.`:`Crea una cuenta para un radioaficionado del equipo. Recibirá un correo para elegir su contraseña.`,f(`user-form-submit`).textContent=t?`Actualizar usuario`:`Añadir nuevo usuario`,f(`uf-status-row`).hidden=!t,f(`uf-invite-row`).hidden=t,f(`uf-send-invite`).checked=!0,le();let i=f(`uf-password`);i.type=`password`,f(`uf-password-label`).textContent=t?`Nueva contraseña`:`Contraseña`,f(`uf-password-hint`).textContent=t?`Déjala vacía para no cambiarla. Mínimo 10 caracteres. Mejor: usa "Enviar enlace de contraseña" en el listado.`:`Mínimo 10 caracteres. Compártela con la persona por un canal seguro.`,f(`uf-username`).focus()}function le(){let e=f(`uf-send-invite`).checked;f(`uf-password-row`).hidden=_===null&&e}async function ue(e){e.preventDefault();let t=e.currentTarget,n=new FormData(t),o=_!==null,s={action:o?`update`:`create`,id:o?_.id:void 0,username:String(n.get(`username`)||``),callsign:String(n.get(`callsign`)||``).toUpperCase(),full_name:String(n.get(`full_name`)||``),email:String(n.get(`email`)||``),role:f(`uf-role`).value,status:f(`uf-status`).value,password:f(`uf-password-row`).hidden?``:String(n.get(`password`)||``),send_invite:!o&&f(`uf-send-invite`).checked},c=await d(f(`user-form-submit`),()=>r(`/api/users.php`,s));if(!c.ok){a(t,c.data.validation_errors),i(f(`user-form-notice`),`error`,c.data.error||`No se pudo guardar el usuario.`);return}a(t),await b(),window.switchView(`users`),i(y(),c.data.mail_sent===!1?`warning`:`success`,c.data.message||`Usuario guardado.`),o&&_.id===m?.id&&c.data.user&&document.dispatchEvent(new CustomEvent(`bm:session`,{detail:{...m,...c.data.user}}))}async function de(e,t){switch(e){case`edit`:return se(t);case`email`:return fe([t]);case`delete`:return me(t);case`invite`:{let e=t.pending_invite?`la invitación`:`un enlace para restablecer la contraseña`;if(!confirm(`¿Enviar ${e} a ${t.email}?`))return;let n=await r(`/api/users.php`,{action:`invite`,id:t.id});i(y(),n.ok?`success`:`error`,n.data.message||n.data.error||`Error al enviar.`);return}case`activate`:case`deactivate`:{let n=await r(`/api/users.php`,{action:`update`,id:t.id,status:e===`activate`?`active`:`inactive`});i(y(),n.ok?`success`:`error`,n.ok?`Cuenta de ${t.callsign} ${e===`activate`?`activada`:`desactivada`}.`:n.data.error||`No se pudo cambiar el estado.`),n.ok&&b();return}}}function fe(e){te=e;let t=f(`user-email-form`);t.reset(),a(t),f(`user-email-notice`).innerHTML=``;let n=e.map(e=>`${e.full_name} (${e.callsign})`);f(`user-email-recipients`).textContent=n.length>4?`${n.slice(0,4).join(`, `)} y ${n.length-4} más`:n.join(`, `),c(f(`modal-user-email`))}async function pe(e){e.preventDefault();let t=e.currentTarget,n=new FormData(t),o=await d(f(`user-email-submit`),()=>r(`/api/users.php`,{action:`email`,user_ids:te.map(e=>e.id),subject:n.get(`subject`),message:n.get(`message`)}));if(!o.ok){a(t,o.data.validation_errors),i(f(`user-email-notice`),`error`,o.data.error||`No se pudo enviar el correo.`);return}l(f(`modal-user-email`)),i(y(),o.data.failed?.length?`warning`:`success`,o.data.message)}function me(e){v=e,f(`user-delete-notice`).innerHTML=``,f(`user-delete-name`).textContent=`${e.full_name} (${e.callsign})`;let t=e.posts_count>0;f(`user-delete-reassign`).hidden=!t,f(`user-delete-posts`).textContent=String(e.posts_count);let r=f(`ud-reassign`);r.innerHTML=p.filter(t=>t.id!==e.id&&t.status===`active`).map(e=>`<option value="${e.id}" ${e.id===m?.id?`selected`:``}>${n(e.full_name)} (${n(e.callsign)})</option>`).join(``),c(f(`modal-user-delete`))}async function he(e){if(e.preventDefault(),!v)return;let t=v.posts_count>0?Number(f(`ud-reassign`).value):void 0,n=await d(f(`user-delete-submit`),()=>r(`/api/users.php`,{action:`delete`,id:v.id,reassign_to:t}));if(!n.ok){i(f(`user-delete-notice`),`error`,n.data.error||`No se pudo eliminar el usuario.`);return}l(f(`modal-user-delete`)),i(y(),`success`,n.data.message),b()}async function ge(){let e=f(`users-bulk-action`).value,t=oe();if(!e)return i(y(),`info`,`Elige una acción en lote.`);if(!t.length)return i(y(),`info`,`Selecciona al menos un usuario.`);if(e===`email`)return fe(p.filter(e=>t.includes(e.id)));let n=await r(`/api/users.php`,{action:`bulk`,operation:e,user_ids:t});i(y(),n.ok?`success`:`error`,n.data.message||n.data.error||`No se pudo aplicar la acción.`),n.ok&&(f(`users-bulk-action`).value=``,b())}function _e(){f(`view-users`)&&(document.addEventListener(`bm:session`,e=>m=e.detail),document.addEventListener(`bm:view`,e=>{let t=e.detail;m?.role===`admin`&&(t===`users`&&b(),t===`user-new`&&ce())}),f(`users-role-filter`).addEventListener(`click`,e=>{let t=e.target.closest(`[data-role-filter]`);t&&(e.preventDefault(),h=t.dataset.roleFilter??``,ae())}),f(`users-search`).addEventListener(`input`,e=>{g=e.target.value,ae()}),f(`users-select-all`).addEventListener(`change`,e=>{let t=e.target.checked;document.querySelectorAll(`.user-cb`).forEach(e=>e.checked=t)}),f(`users-table-body`).addEventListener(`click`,e=>{let t=e.target.closest(`[data-action]`);if(!t)return;e.preventDefault();let n=Number(t.closest(`tr`)?.dataset.userId),r=p.find(e=>e.id===n);r&&de(t.dataset.action,r)}),f(`users-bulk-apply`).addEventListener(`click`,ge),f(`user-form`).addEventListener(`submit`,ue),f(`uf-send-invite`).addEventListener(`change`,le),f(`uf-callsign`).addEventListener(`input`,e=>{let t=e.target;t.value=t.value.toUpperCase()}),f(`user-email-form`).addEventListener(`submit`,pe),f(`user-delete-form`).addEventListener(`submit`,he),u(f(`view-user-new`)))}var x=e=>document.getElementById(e),ve=null;async function ye(){let e=await r(`/api/profile.php`);if(!e.ok){e.status!==401&&i(x(`profile-notice`),`error`,e.data.error||`No se pudo cargar tu perfil.`);return}let n=e.data.user;x(`profile-username`).textContent=n.username,x(`profile-callsign`).textContent=n.callsign;let a=x(`profile-role`);a.textContent=t[n.role],a.className=`role-badge role-${n.role}`,x(`pf-full-name`).value=n.full_name,x(`pf-email`).value=n.email,document.querySelector(`#password-form [name="username"]`).value=n.username;let o=new Date(n.created_ts*1e3).toLocaleDateString(`es-VE`,{year:`numeric`,month:`long`,day:`numeric`});x(`profile-meta`).textContent=`Miembro desde el ${o}.`}function be(){x(`view-profile`)&&(document.addEventListener(`bm:session`,e=>ve=e.detail),document.addEventListener(`bm:view`,e=>{e.detail===`profile`&&(x(`profile-notice`).innerHTML=``,ye())}),x(`profile-form`).addEventListener(`submit`,async e=>{e.preventDefault();let t=e.currentTarget,n=new FormData(t),o=await d(x(`profile-submit`),()=>r(`/api/profile.php`,{action:`update`,full_name:n.get(`full_name`),email:n.get(`email`)}));a(t,o.ok?{}:o.data.validation_errors),i(x(`profile-notice`),o.ok?`success`:`error`,o.data.message||o.data.error||`No se pudo guardar.`),o.ok&&ve&&o.data.user&&document.dispatchEvent(new CustomEvent(`bm:session`,{detail:{...ve,...o.data.user}}))}),x(`password-form`).addEventListener(`submit`,async e=>{e.preventDefault();let t=e.currentTarget,n=new FormData(t),o=await d(x(`password-submit`),()=>r(`/api/profile.php`,{action:`password`,current_password:n.get(`current_password`),new_password:n.get(`new_password`)}));a(t,o.ok?{}:o.data.validation_errors),i(x(`profile-notice`),o.ok?`success`:`error`,o.data.message||o.data.error||`No se pudo cambiar la contraseña.`),o.ok&&(t.reset(),x(`pw-new`).type=`password`)}),u(x(`view-profile`)))}var xe=1500,Se={width:1920,height:1280},Ce=.82,we=.68,Te=1920,Ee=1080,De=25e5,Oe=128e3,ke=4194304;function Ae(e,t,n=xe,r=n){let i=Math.min(1,n/e,r/t);return{width:Math.max(1,Math.round(e*i)),height:Math.max(1,Math.round(t*i))}}async function je(e){try{return await createImageBitmap(e,{imageOrientation:`from-image`})}catch{let t=URL.createObjectURL(e);try{let e=new Image;return e.decoding=`async`,e.src=t,await e.decode(),await createImageBitmap(e)}finally{URL.revokeObjectURL(t)}}}function Me(e,t,n,r,i){let a=document.createElement(`canvas`),o=t,s=n;a.width=o,a.height=s;let c=a.getContext(`2d`);for(c.drawImage(e,0,0,o,s);o/2>=r&&s/2>=i;){let e=document.createElement(`canvas`);e.width=Math.round(o/2),e.height=Math.round(s/2);let t=e.getContext(`2d`);t.imageSmoothingQuality=`high`,t.drawImage(a,0,0,e.width,e.height),a=e,o=e.width,s=e.height}if(o!==r||s!==i){let e=document.createElement(`canvas`);e.width=r,e.height=i,c=e.getContext(`2d`),c.imageSmoothingQuality=`high`,c.drawImage(a,0,0,r,i),a=e}return a}async function Ne(t,n,r){let{default:i}=await e(async()=>{let{default:e}=await import(`./encode.B7qyjpkk.js`);return{default:e}},__vite__mapDeps([0,1])),a=await i(t.getContext(`2d`).getImageData(0,0,t.width,t.height),r?{quality:Math.round(n*100),method:6,sns_strength:80,filter_strength:40,use_sharp_yuv:1}:{quality:Math.round(n*100)});return new Blob([a],{type:`image/webp`})}async function Pe(e,t=Ce,n=`rapido`){if(n===`ultra`){let n=await Ne(e,t,!0).catch(()=>null),r=await new Promise(n=>e.toBlob(n,`image/webp`,t)),i=r&&r.type===`image/webp`?r:null;if(n&&i)return n.size<=i.size?n:i;if(n||i)return n??i;throw Error(`No se pudo convertir la imagen a WebP.`)}let r=await new Promise(n=>e.toBlob(n,`image/webp`,t));return r&&r.type===`image/webp`?r:Ne(e,t,!1)}async function Fe(e,t={}){let{maxWidth:n=xe,maxHeight:r=n,mode:i=`rapido`,quality:a=i===`ultra`?we:Ce}=t,o=await je(e);try{let t=Ae(o.width,o.height,n,r);return{blob:await Pe(Me(o,o.width,o.height,t.width,t.height),a,i),width:t.width,height:t.height,originalBytes:e.size}}finally{o.close()}}function Ie(){return typeof MediaRecorder>`u`?null:[`video/mp4;codecs=avc1.640028,mp4a.40.2`,`video/mp4;codecs=avc1.42E01F,mp4a.40.2`,`video/mp4`,`video/webm;codecs=vp9,opus`,`video/webm;codecs=vp8,opus`,`video/webm`].find(e=>MediaRecorder.isTypeSupported(e))??null}function Le(){let e=document.createElement(`canvas`);return Ie()!==null&&typeof e.captureStream==`function`}function Re(e){return new Promise((t,n)=>{let r=document.createElement(`video`);r.preload=`auto`,r.playsInline=!0,r.src=URL.createObjectURL(e),r.onloadedmetadata=()=>t(r),r.onerror=()=>n(Error(`El navegador no puede leer este video. Prueba con MP4 (H.264).`))})}function ze(e,t){return new Promise(n=>{e.onseeked=()=>n(),e.currentTime=t})}async function Be(e,t){await ze(e,Math.min(1,e.duration/10));let n=Ae(e.videoWidth,e.videoHeight),r=await Pe(Me(e,e.videoWidth,e.videoHeight,n.width,n.height));return await ze(e,0),{blob:r,width:n.width,height:n.height,originalBytes:t}}async function Ve(e,t,n){let r=await Re(e);try{if(!Number.isFinite(r.duration)||r.duration<=0)throw Error(`No se pudo leer la duración del video.`);if(r.duration>300)throw Error(`El video dura más de 5 minutos. Recórtalo antes de subirlo.`);let i=await Be(r,e.size),a=r.videoWidth,o=r.videoHeight,s=Math.min(1,Te/Math.max(a,o),Ee/Math.min(a,o)),c=Math.max(2,Math.round(a*s/2)*2),l=Math.max(2,Math.round(o*s/2)*2),u=/^video\/mp4$/i.test(e.type)||/\.mp4$/i.test(e.name),d=Ie();if(!d||!Le()){if(!u)throw Error(`Este navegador no puede comprimir videos. Usa Chrome, Edge o Safari recientes, o sube un MP4.`);return t(1),{blob:e,poster:i,width:a,height:o,duration:r.duration,originalBytes:e.size,compressed:!1}}let f=document.createElement(`canvas`);f.width=c,f.height=l;let p=f.getContext(`2d`);p.imageSmoothingQuality=`high`;let m=f.captureStream(30),h=null;try{h=new AudioContext;let e=h.createMediaElementSource(r),t=h.createMediaStreamDestination();e.connect(t),t.stream.getAudioTracks().forEach(e=>m.addTrack(e))}catch{}let g=new MediaRecorder(m,{mimeType:d,videoBitsPerSecond:De,audioBitsPerSecond:Oe}),_=[];g.ondataavailable=e=>e.data.size&&_.push(e.data);let ee=new Promise(e=>g.onstop=()=>e()),te=()=>{p.drawImage(r,0,0,c,l),t(Math.min(.99,r.currentTime/r.duration))},v=0,y=()=>{te(),!r.paused&&!r.ended&&(v=`requestVideoFrameCallback`in r?r.requestVideoFrameCallback(y):requestAnimationFrame(y))},b=()=>{r.pause(),g.state!==`inactive`&&g.stop()};if(n?.addEventListener(`abort`,b,{once:!0}),te(),g.start(1e3),await h?.resume(),await r.play(),y(),await new Promise(e=>r.onended=()=>e()),cancelAnimationFrame(v),g.stop(),await ee,m.getTracks().forEach(e=>e.stop()),await h?.close(),n?.removeEventListener(`abort`,b),n?.aborted)throw new DOMException(`Cancelado`,`AbortError`);let ne=d.split(`;`)[0],re=new Blob(_,{type:ne});return t(1),u&&re.size>=e.size?{blob:e,poster:i,width:a,height:o,duration:r.duration,originalBytes:e.size,compressed:!1}:{blob:re,poster:i,width:c,height:l,duration:r.duration,originalBytes:e.size,compressed:!0}}finally{URL.revokeObjectURL(r.src)}}function He(){return Array.from(crypto.getRandomValues(new Uint8Array(16)),e=>e.toString(16).padStart(2,`0`)).join(``)}async function Ue(e,t,n,r=`/api/gallery.php?action=upload_chunk`){let i=He(),a=Math.max(1,Math.ceil(e.size/ke));for(let o=0;o<a;o++){let s=e.slice(o*ke,(o+1)*ke),c=new FormData;c.append(`upload_id`,i),c.append(`index`,String(o)),c.append(`total`,String(a)),c.append(`kind`,t),c.append(`chunk`,s,`${t}.part`);let l=``;for(let e=0;e<3;e++)try{let e=await fetch(r,{method:`POST`,body:c,credentials:`same-origin`}),t=await e.json().catch(()=>({}));if(e.status===401)throw document.dispatchEvent(new CustomEvent(`bm:unauthorized`)),Error(`Tu sesión expiró.`);if(!e.ok||t.success===!1)throw Object.assign(Error(t.error||`Error ${e.status} al subir.`),{fatal:e.status<500});l=``;break}catch(t){if(l=t.message,t.fatal)break;await new Promise(t=>setTimeout(t,800*(e+1)))}if(l)throw Error(l);n?.((o+1)/a)}return i}function S(e){return e<1024?`${e} B`:e<1048576?`${Math.round(e/1024)} KB`:`${(e/1024/1024).toFixed(1)} MB`}var C=e=>document.getElementById(e),We={IMAGE:`Foto`,VIDEO:`Video`,CAROUSEL_ALBUM:`Carrusel`},w=[],Ge=`all`,T=null,Ke=null,E=[],D=null,O=!1,qe=e=>new Date(e*1e3).toLocaleDateString(`es-VE`,{year:`numeric`,month:`short`,day:`numeric`}),Je=()=>{let e=new Date;return`${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,`0`)}-${String(e.getDate()).padStart(2,`0`)}`};async function Ye(){let e=await r(`/api/gallery.php?scope=admin`);if(!e.ok){e.status!==401&&i(C(`gallery-notice`),`error`,e.data.error||`No se pudieron cargar las publicaciones.`);return}w=e.data.posts,Xe()}function Xe(){let e={all:w.length,published:0,hidden:0};w.forEach(t=>e[t.status]++),document.querySelectorAll(`#gallery-status-filter [data-count]`).forEach(t=>{t.textContent=`(${e[t.dataset.count]})`}),document.querySelectorAll(`#gallery-status-filter [data-gallery-filter]`).forEach(e=>{e.classList.toggle(`is-current`,e.dataset.galleryFilter===Ge)});let t=w.filter(e=>Ge===`all`||e.status===Ge),r=C(`gallery-table-body`);if(!t.length){r.innerHTML=`<tr><td colspan="4" class="table-empty">${w.length?`No hay publicaciones en este filtro.`:`Aún no hay publicaciones. Pulsa "Añadir publicación".`}</td></tr>`;return}r.innerHTML=t.map(e=>{let t=e.caption.trim(),r=e.media_type===`CAROUSEL_ALBUM`?` · ${e.carousel_media.length}`:``;return`
      <tr data-post-id="${n(e.id)}" class="${e.status===`hidden`?`is-inactive`:``}">
        <td class="col-thumb">
          <a href="#" data-action="edit" aria-label="Editar publicación"><img src="${n(e.thumbnail_url)}" alt="" loading="lazy" class="gallery-thumb" /></a>
        </td>
        <td class="cell-title">
          <div>
            <span class="state-badge state-type">${We[e.media_type]}${r}</span>
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
        <td>${qe(e.published_ts)}</td>
      </tr>`}).join(``)}async function Ze(e,t){if(e===`edit`&&(Ke=t,window.switchView(`gallery-edit`)),e===`toggle`){let e=await r(`/api/gallery.php?action=visibility`,{id:t.id,status:t.status===`published`?`hidden`:`published`});i(C(`gallery-notice`),e.ok?`success`:`error`,e.data.message||e.data.error||`No se pudo cambiar.`),e.ok&&Ye()}if(e===`delete`){if(!confirm(`¿Eliminar esta publicación y sus archivos? No se puede deshacer.`))return;let e=await r(`/api/gallery.php?action=delete`,{id:t.id});i(C(`gallery-notice`),e.ok?`success`:`error`,e.data.message||e.data.error||`No se pudo eliminar.`),e.ok&&Ye()}}function Qe(){D?.abort(),D=null,E.forEach(e=>e.previewUrl&&URL.revokeObjectURL(e.previewUrl)),E=[]}function $e(){T=Ke,Ke=null,Qe();let e=C(`gallery-form`);e.reset(),a(e),C(`gallery-edit-notice`).innerHTML=``,A(null);let t=(t,n)=>e.elements.namedItem(t).value=n;if(t(`id`,T?.id??``),t(`caption`,T?.caption??``),t(`status`,T?.status??`published`),t(`author`,T?.author??`@brandmeister_yv`),t(`permalink`,T?.permalink??``),T){let e=new Date(T.published_ts*1e3);t(`published_date`,`${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,`0`)}-${String(e.getDate()).padStart(2,`0`)}`)}else t(`published_date`,Je());C(`gallery-edit-title`).textContent=T?`Editar publicación`:`Añadir publicación`,C(`gallery-submit`).textContent=T?`Actualizar`:`Publicar`,C(`gallery-current-media-hint`).hidden=!T,rt(),k()}function k(){let e=C(`gallery-media-list`),t=E.filter(e=>e.kind===`image`),r=``;T&&!E.length&&(r=(T.media_type===`CAROUSEL_ALBUM`?T.carousel_media.map(e=>e.url):[T.thumbnail_url]).map((e,t)=>`
      <li class="media-tile is-current">
        <img src="${n(e)}" alt="" />
        ${T.media_type===`VIDEO`?`<span class="media-tile-badge">▶ Video</span>`:`<span class="media-tile-badge">${t+1}</span>`}
      </li>`).join(``)),r+=E.map(e=>{let r=t.indexOf(e),i=e.image?`${e.image.width}×${e.image.height} · ${S(e.image.blob.size)}`:e.video?`${e.video.width}×${e.video.height} · ${S(e.video.blob.size)}${e.video.compressed?``:` (original)`}`:``,a=e.image||e.video?Math.max(0,Math.round((1-(e.image?.blob.size??e.video.blob.size)/e.file.size)*100)):0,o=e.state===`processing`?`<span class="media-tile-status">${e.kind===`video`?`Comprimiendo ${Math.round(e.progress*100)}%`:`Optimizando…`}</span>`:e.state===`error`?`<span class="media-tile-status is-error">${n(e.error||`Error`)}</span>`:`<span class="media-tile-status is-ready">${i}${a>0?` · −${a}%`:``}</span>`;return`
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
      </li>`}).join(``),e.innerHTML=r;let i=E.filter(e=>e.state===`ready`),a=E.some(e=>e.state===`processing`),o=i.reduce((e,t)=>e+t.file.size,0),s=i.reduce((e,t)=>e+(t.image?.blob.size??t.video?.blob.size??0),0);C(`gallery-media-summary`).textContent=i.length?`${i.length} listo(s) · ${S(o)} → ${S(s)}${a?` · procesando…`:``}`:a?`Procesando…`:``}async function et(e){let t=Array.from(e),n=t.filter(e=>e.type.startsWith(`video/`)||/\.(mp4|mov|m4v|webm)$/i.test(e.name)),r=t.filter(e=>!n.includes(e)&&(e.type.startsWith(`image/`)||/\.(jpe?g|png|webp|heic|heif|gif|avif)$/i.test(e.name))),a=t.length-n.length-r.length,o=C(`gallery-edit-notice`),s=E.some(e=>e.kind===`video`),c=E.some(e=>e.kind===`image`);if(n.length>1||n.length&&(r.length||c||s)||r.length&&s){i(o,`warning`,`Cada publicación lleva varias fotos o un solo video, no ambos. Crea otra publicación para el resto.`);return}if(E.length+r.length>20){i(o,`warning`,`Máximo 20 fotos por publicación.`);return}a&&i(o,`info`,`${a} archivo(s) no son fotos ni videos y se ignoraron.`);let l=[...r,...n].map(e=>({key:Math.random().toString(36).slice(2),kind:n.includes(e)?`video`:`image`,file:e,state:`processing`,progress:0}));E.push(...l),k();let u=l.filter(e=>e.kind===`image`),d=Array.from({length:Math.min(2,u.length)},async()=>{for(;u.length;){let e=u.shift();try{e.image=await Fe(e.file),e.previewUrl=URL.createObjectURL(e.image.blob),e.state=`ready`}catch{e.state=`error`,e.error=/hei[cf]$/i.test(e.file.name)?`HEIC solo se puede leer en Safari: conviértela a JPG`:`No se pudo leer esta imagen`}E.includes(e)&&k()}}),f=l.find(e=>e.kind===`video`);if(f){D=new AbortController;let e=0;try{f.video=await Ve(f.file,t=>{f.progress=t,Date.now()-e>500&&(e=Date.now(),k())},D.signal),f.previewUrl=URL.createObjectURL(f.video.poster.blob),f.state=`ready`}catch(e){if(e.name===`AbortError`)return;f.state=`error`,f.error=e.message||`No se pudo procesar el video`}E.includes(f)&&k()}await Promise.all(d)}function tt(e,t){let n=E.find(e=>e.key===t);if(n){if(e===`remove`)n.kind===`video`&&D?.abort(),n.previewUrl&&URL.revokeObjectURL(n.previewUrl),E=E.filter(e=>e!==n);else{let t=E.filter(e=>e.kind===`image`),r=t.indexOf(n),i=e===`left`?r-1:r+1;if(i<0||i>=t.length)return;[t[r],t[i]]=[t[i],t[r]],E=[...t,...E.filter(e=>e.kind===`video`)]}k()}}function A(e,t=``){C(`gallery-progress`).hidden=e===null,e!==null&&(C(`gallery-progress-bar`).style.width=`${Math.round(e*100)}%`,C(`gallery-progress-label`).textContent=t)}async function nt(e){if(e.preventDefault(),O)return;let t=e.currentTarget,n=C(`gallery-edit-notice`);if(E.some(e=>e.state===`processing`)){i(n,`info`,`Espera a que terminen de optimizarse los archivos.`);return}let o=E.filter(e=>e.state===`ready`);if(E.some(e=>e.state===`error`)){i(n,`warning`,`Quita los archivos con error antes de guardar.`);return}if(!T&&!o.length){i(n,`warning`,`Añade al menos una foto o un video.`);return}let s=new FormData(t),c={id:T?.id,caption:s.get(`caption`),status:s.get(`status`),published_date:s.get(`published_date`),author:s.get(`author`),permalink:s.get(`permalink`)};O=!0;let l=C(`gallery-submit`);try{await d(l,async()=>{if(o.length){let e=o.flatMap(e=>e.kind===`video`?[{blob:e.video.blob,kind:`video`},{blob:e.video.poster.blob,kind:`poster`}]:[{blob:e.image.blob,kind:`image`}]),t=e.reduce((e,t)=>e+t.blob.size,0),n=0,r=[];for(let i of e){let e=await Ue(i.blob,i.kind,e=>{A((n+i.blob.size*e)/t,`Subiendo ${S(n+i.blob.size*e)} de ${S(t)}`)});n+=i.blob.size,i.kind===`image`&&r.push(e),i.kind===`video`&&(c.video=e),i.kind===`poster`&&(c.poster=e)}r.length&&(c.images=r)}A(1,`Guardando…`);let e=await r(`/api/gallery.php?action=save`,c);if(!e.ok)throw a(t,e.data.validation_errors),Error(e.data.error||`No se pudo guardar la publicación.`);let n=e.data.message||`Publicación guardada.`;Qe(),await Ye(),window.switchView(`gallery`),i(C(`gallery-notice`),`success`,n)})}catch(e){A(null),i(n,`error`,e.message)}finally{O=!1}}function rt(){C(`gf-caption-count`).textContent=String(C(`gf-caption`).value.length)}function it(){if(!C(`view-gallery`))return;document.addEventListener(`bm:session`,e=>e.detail),document.addEventListener(`bm:view`,e=>{let t=e.detail;t===`gallery`&&(O||Qe(),Ye()),t===`gallery-edit`&&$e()}),C(`gallery-status-filter`).addEventListener(`click`,e=>{let t=e.target.closest(`[data-gallery-filter]`);t&&(e.preventDefault(),Ge=t.dataset.galleryFilter,Xe())}),C(`gallery-table-body`).addEventListener(`click`,e=>{let t=e.target.closest(`[data-action]`);if(!t)return;e.preventDefault();let n=w.find(e=>e.id===t.closest(`tr`)?.dataset.postId);n&&Ze(t.dataset.action,n)});let e=C(`gallery-file-input`);e.addEventListener(`change`,()=>{e.files?.length&&et(e.files),e.value=``});let t=C(`gallery-drop-zone`);[`dragenter`,`dragover`].forEach(e=>t.addEventListener(e,e=>{e.preventDefault(),t.classList.add(`is-dragging`)})),[`dragleave`,`drop`].forEach(e=>t.addEventListener(e,()=>t.classList.remove(`is-dragging`))),t.addEventListener(`drop`,e=>{e.preventDefault(),e.dataTransfer?.files.length&&et(e.dataTransfer.files)}),C(`gallery-media-list`).addEventListener(`click`,e=>{let t=e.target.closest(`[data-media-action]`),n=t?.closest(`[data-key]`)?.dataset.key;t&&n&&tt(t.dataset.mediaAction,n)}),C(`gf-caption`).addEventListener(`input`,rt),C(`gallery-form`).addEventListener(`submit`,nt),C(`gallery-cancel`).addEventListener(`click`,()=>{(!E.length||confirm(`¿Descartar los archivos añadidos?`))&&(Qe(),window.switchView(`gallery`))}),window.addEventListener(`beforeunload`,e=>{(O||E.some(e=>e.state===`processing`))&&e.preventDefault()})}var j=e=>document.getElementById(e),at=null,M=[],ot=[],N={published:0,draft:0,trash:0},P=!0,st=`all`,ct=``,F=null,lt=null,ut=0,I=null,R=``,dt=!1,ft={published:`Publicada`,draft:`Borrador`,trash:`Papelera`},pt=e=>new Date(e*1e3).toLocaleDateString(`es-VE`,{year:`numeric`,month:`short`,day:`numeric`}),mt=e=>{let t=new Date(e*1e3);return`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,`0`)}-${String(t.getDate()).padStart(2,`0`)}`};async function z(){let e=new URLSearchParams({scope:`admin`,status:st});ct.trim()&&e.set(`search`,ct.trim());let t=await r(`/api/posts.php?${e}`);if(!t.ok){t.status!==401&&i(j(`posts-notice`),`error`,t.data.error||`No se pudieron cargar las noticias.`);return}M=t.data.posts,N=t.data.counts;let n=j(`menu-posts-count`);if(n){let e=N.published+N.draft;n.textContent=String(e),n.hidden=e===0}ot=t.data.categories,P=t.data.can_publish,ht()}function ht(){let e={all:N.published+N.draft,...N};document.querySelectorAll(`#posts-status-filter [data-count]`).forEach(t=>{t.textContent=`(${e[t.dataset.count]??0})`}),document.querySelectorAll(`#posts-status-filter [data-post-filter]`).forEach(e=>{e.classList.toggle(`is-current`,e.dataset.postFilter===st)}),j(`posts-count`).textContent=`${M.length} ${M.length===1?`elemento`:`elementos`}`,j(`posts-select-all`).checked=!1;let t=j(`posts-table-body`);if(!M.length){t.innerHTML=`<tr><td colspan="7" class="table-empty">${ct?`Ninguna noticia coincide con la búsqueda.`:`No hay noticias en este filtro.`}</td></tr>`;return}t.innerHTML=M.map(e=>{let t=e.status===`trash`,r=t?[`<span><a href="#" data-action="restore">Restaurar</a></span>`,P?`<span class="trash"><a href="#" data-action="delete">Eliminar definitivamente</a></span>`:``]:[`<span><a href="#" data-action="edit">Editar</a></span>`,e.status===`published`?`<span><a href="${n(e.url)}" target="_blank" rel="noopener">Ver</a></span>`:``,P?`<span><a href="#" data-action="${e.status===`published`?`draft`:`publish`}">${e.status===`published`?`Pasar a borrador`:`Publicar`}</a></span>`:``,`<span class="trash"><a href="#" data-action="trash">Papelera</a></span>`];return`
      <tr data-post-id="${e.id}" class="${e.status===`published`?``:`is-inactive`}">
        <td class="col-cb"><input type="checkbox" class="post-cb" value="${e.id}" aria-label="Seleccionar ${n(e.title)}" /></td>
        <td class="cell-title">
          ${e.image_url?`<img src="${n(e.image_url)}" alt="" loading="lazy" class="post-thumb" />`:``}
          <strong>${t?n(e.title):`<a href="#" data-action="edit">${n(e.title)}</a>`}</strong>
          ${e.status===`published`?``:`<span class="state-badge state-${e.status===`draft`?`pending`:`inactive`}">${ft[e.status]}</span>`}
          ${e.featured?`<span class="state-badge state-self">Destacada</span>`:``}
          <p class="post-excerpt">${n(e.description.length>120?e.description.slice(0,120)+`…`:e.description)}</p>
          <div class="row-actions">${r.filter(Boolean).join(` | `)}</div>
        </td>
        <td>${n(e.author_callsign||e.author_name)}</td>
        <td><span class="cat-pill-mini">${n(e.category)}</span></td>
        <td class="post-tags">${e.tags.map(e=>`<span class="tag-label">#${n(e)}</span>`).join(` `)||`<span class="text-faint">—</span>`}</td>
        <td class="col-num">${e.views_count}</td>
        <td>${pt(e.published_ts)}</td>
      </tr>`}).join(``)}async function gt(e,t){if(e===`edit`){lt=t,window.switchView(`new-post`);return}if(e===`delete`){if(!confirm(`¿Eliminar definitivamente "${t.title}"? No se puede deshacer.`))return;let e=await r(`/api/posts.php?action=delete`,{id:t.id});i(j(`posts-notice`),e.ok?`success`:`error`,e.data.message||e.data.error||`No se pudo eliminar.`),e.ok&&z();return}let n=await r(`/api/posts.php?action=status`,{id:t.id,status:{publish:`published`,draft:`draft`,trash:`trash`,restore:`draft`}[e]});i(j(`posts-notice`),n.ok?`success`:`error`,n.data.message||n.data.error||`No se pudo cambiar el estado.`),n.ok&&z()}async function _t(){let e=j(`posts-bulk-action`).value,t=Array.from(document.querySelectorAll(`.post-cb:checked`)).map(e=>Number(e.value));if(!e)return i(j(`posts-notice`),`info`,`Elige una acción en lote.`);if(!t.length)return i(j(`posts-notice`),`info`,`Selecciona al menos una noticia.`);if(e===`delete`&&!confirm(`¿Eliminar definitivamente ${t.length} noticia(s)?`))return;let n=await r(`/api/posts.php?action=bulk`,{operation:e,ids:t});i(j(`posts-notice`),n.ok?`success`:`error`,n.data.message||n.data.error||`No se pudo aplicar.`),n.ok&&(j(`posts-bulk-action`).value=``,z())}function vt(e){return e.toLowerCase().normalize(`NFD`).replace(/[̀-ͯ]/g,``).replace(/[^a-z0-9]+/g,`-`).replace(/^-+|-+$/g,``).slice(0,180)}async function yt(){let e=lt;lt=null;let t=j(`post-form`);if(t.reset(),a(t),j(`post-form-notice`).innerHTML=``,j(`pf-preview`).style.display=`none`,F=null,e&&e!==`new`){let t=await r(`/api/posts.php?scope=admin&id=${e.id}`);if(!t.ok){i(j(`post-form-notice`),`error`,t.data.error||`No se pudo abrir la noticia.`);return}F=t.data.post}let o=(e,n)=>t.elements.namedItem(e).value=n;o(`id`,F?String(F.id):``),o(`title`,F?.title??``),o(`slug`,F?.slug??``),o(`description`,F?.description??``),o(`content`,F?.content??``),o(`tags`,F?.tags.join(`, `)??``),o(`read_time`,F?.read_time??``),o(`published_date`,mt(F?F.published_ts:Date.now()/1e3)),j(`pf-featured`).checked=F?.featured??!1;let s=j(`pf-status`);s.innerHTML=`<option value="draft">Borrador</option>${P?`<option value="published">Publicada</option>`:``}`,s.value=F&&F.status!==`trash`?F.status:`draft`,j(`pf-author-hint`).hidden=P,j(`pf-categories`).innerHTML=ot.map(e=>`
    <label class="checkbox-inline">
      <input type="radio" name="category" value="${n(e)}" ${(F?.category??`General`)===e?`checked`:``} />
      ${n(e)}
    </label>`).join(``),j(`pf-author`).textContent=F?F.author_callsign||F.author_name:at?.callsign??``,j(`post-form-title`).textContent=F?`Editar noticia`:`Añadir nueva noticia`,j(`post-submit`).textContent=F?`Actualizar`:`Guardar`;let c=j(`pf-view-link`);c.hidden=!F||F.status!==`published`,F&&(c.href=F.url),B(),bt(),V(),j(`pf-title`).focus()}function B(){R&&URL.revokeObjectURL(R),R=``,I=null,dt=!1}function bt(){let e=j(`pf-image-preview`),t=j(`pf-image-thumb`),n=j(`pf-image-info`),r=!dt&&F?.image_url?F.image_url:``;if(I){t.src=R;let r=Math.max(0,Math.round((1-I.blob.size/I.originalBytes)*100));n.textContent=`${I.width}×${I.height} · ${S(I.blob.size)}${r?` · −${r}%`:``} · se sube al guardar`,e.hidden=!1}else r?(t.src=r,n.textContent=`Imagen actual de la noticia`,e.hidden=!1):e.hidden=!0}async function xt(e){let t=j(`pf-image-info`);j(`pf-image-preview`).hidden=!1,t.textContent=`Optimizando imagen…`;try{let t=await Fe(e,{maxWidth:Se.width,maxHeight:Se.height,mode:`ultra`});B(),I=t,R=URL.createObjectURL(t.blob)}catch{i(j(`post-form-notice`),`error`,/hei[cf]$/i.test(e.name)?`HEIC solo se puede leer en Safari: conviértela a JPG antes de subirla.`:`No se pudo leer esa imagen.`)}bt()}function V(){let e=j(`pf-content`).value,t=e.trim()?e.trim().split(/\s+/).length:0;j(`pf-content-stats`).textContent=`${t} palabras · ${Math.max(1,Math.round(t/200))} min de lectura aprox.`,j(`pf-description-count`).textContent=String(j(`pf-description`).value.length)}function St(e){let t=e=>n(e).replace(/`([^`]+)`/g,`<code>$1</code>`).replace(/\[([^\]]+)\]\(([^)\s]+)\)/g,(e,t,r)=>`<a href="${n(r)}">${t}</a>`).replace(/\*\*([^*]+)\*\*/g,`<strong>$1</strong>`).replace(/(?<![\w*])\*([^*\n]+)\*(?![\w*])/g,`<em>$1</em>`),r=[],i=null,a=()=>{i&&r.push(`</${i}>`),i=null};for(let n of e.split(`
`)){let e=n.trim();if(!e){a();continue}let o=e.match(/^(#{1,6})\s+(.*)$/),s=e.match(/^[-*+]\s+(.*)$/),c=e.match(/^\d+[.)]\s+(.*)$/),l=e.match(/^>\s?(.*)$/);if(o){a();let e=Math.min(6,Math.max(2,o[1].length));r.push(`<h${e}>${t(o[2])}</h${e}>`)}else/^(-{3,}|\*{3,})$/.test(e)?(a(),r.push(`<hr />`)):l?(a(),r.push(`<blockquote><p>${t(l[1])}</p></blockquote>`)):s?(i!==`ul`&&(a(),r.push(`<ul>`),i=`ul`),r.push(`<li>${t(s[1])}</li>`)):c?(i!==`ol`&&(a(),r.push(`<ol>`),i=`ol`),r.push(`<li>${t(c[1])}</li>`)):(a(),r.push(`<p>${t(e)}</p>`))}return a(),r.join(`
`)}function Ct(e){let t=j(`pf-content`),{selectionStart:n,selectionEnd:r,value:i}=t,a=i.slice(n,r),o={bold:[`**`,`**`],italic:[`*`,`*`],h2:[`
## `,`
`],h3:[`
### `,`
`],quote:[`
> `,`
`],link:[`[`,`](https://)`]},s;if(e===`ul`||e===`ol`)s=`
`+(a||`Elemento`).split(`
`).map((t,n)=>e===`ul`?`- ${t}`:`${n+1}. ${t}`).join(`
`)+`
`;else{let[t,n]=o[e]??[``,``];s=t+(a||(e===`link`?`texto del enlace`:`texto`))+n}t.setRangeText(s,n,r,`end`),t.focus(),V()}async function wt(e){e.preventDefault();let t=e.currentTarget,n=new FormData(t),o={id:F?.id,title:n.get(`title`),slug:n.get(`slug`),description:n.get(`description`),content:n.get(`content`),category:n.get(`category`)||`General`,tags:n.get(`tags`),read_time:n.get(`read_time`),featured:j(`pf-featured`).checked,status:n.get(`status`),published_date:n.get(`published_date`)},s=await d(j(`post-submit`),async()=>{if(I){j(`pf-image-info`).textContent=`Subiendo imagen…`;let e=await Ue(I.blob,`post-image`,void 0,`/api/posts.php?action=upload_chunk`);o.image=e}else dt&&(o.remove_image=!0);return r(`/api/posts.php?action=save`,o)});if(!s.ok){a(t,s.data.validation_errors),i(j(`post-form-notice`),`error`,s.data.error||`No se pudo guardar la noticia.`);return}let c=s.data.message||`Noticia guardada.`;B(),await z(),window.switchView(`posts`),i(j(`posts-notice`),`success`,c)}function Tt(){if(!j(`view-posts`))return;document.addEventListener(`bm:session`,e=>at=e.detail),document.addEventListener(`bm:view`,e=>{let t=e.detail;t===`posts`&&z(),t===`new-post`&&yt()}),j(`posts-status-filter`).addEventListener(`click`,e=>{let t=e.target.closest(`[data-post-filter]`);t&&(e.preventDefault(),st=t.dataset.postFilter,z())}),j(`posts-search`).addEventListener(`input`,e=>{ct=e.target.value,clearTimeout(ut),ut=window.setTimeout(z,300)}),j(`posts-select-all`).addEventListener(`change`,e=>{let t=e.target.checked;document.querySelectorAll(`.post-cb`).forEach(e=>e.checked=t)}),j(`posts-table-body`).addEventListener(`click`,e=>{let t=e.target.closest(`[data-action]`);if(!t)return;e.preventDefault();let n=M.find(e=>e.id===Number(t.closest(`tr`)?.dataset.postId));n&&gt(t.dataset.action,n)}),j(`posts-bulk-apply`).addEventListener(`click`,_t),j(`quick-draft-form`)?.addEventListener(`submit`,async e=>{e.preventDefault();let t=e.currentTarget,n=j(`qd-title`).value.trim(),a=j(`qd-content`).value.trim(),o=await r(`/api/posts.php?action=save`,{title:n,content:a,description:a.slice(0,300),status:`draft`,category:`General`});if(!o.ok){let e=Object.values(o.data.validation_errors??{})[0];alert(e||o.data.error||`No se pudo guardar el borrador.`);return}t.reset(),window.switchView(`posts`),i(j(`posts-notice`),`success`,`Borrador guardado. Ábrelo para completarlo y publicarlo.`)}),j(`post-form`).addEventListener(`submit`,wt);let e=j(`pf-slug`),t=!1;e.addEventListener(`input`,()=>t=!0),j(`pf-title`).addEventListener(`input`,n=>{!t&&!F&&(e.value=vt(n.target.value))});let n=j(`pf-image-input`);n.addEventListener(`change`,()=>{n.files?.[0]&&xt(n.files[0]),n.value=``});let a=j(`pf-image-drop`);[`dragenter`,`dragover`].forEach(e=>a.addEventListener(e,e=>{e.preventDefault(),a.classList.add(`is-dragging`)})),[`dragleave`,`drop`].forEach(e=>a.addEventListener(e,()=>a.classList.remove(`is-dragging`))),a.addEventListener(`drop`,e=>{e.preventDefault();let t=e.dataTransfer?.files?.[0];t&&xt(t)}),j(`pf-image-remove`).addEventListener(`click`,()=>{B(),dt=!0,bt()}),j(`pf-content`).addEventListener(`input`,V),j(`pf-description`).addEventListener(`input`,V),document.querySelectorAll(`[data-md]`).forEach(e=>e.addEventListener(`click`,()=>Ct(e.dataset.md))),j(`pf-preview-toggle`).addEventListener(`click`,()=>{let e=j(`pf-preview`),t=j(`pf-content`),n=e.style.display!==`none`;e.style.display=n?`none`:`block`,t.style.display=n?`block`:`none`,n||(e.innerHTML=`<div class="prose-preview">${St(t.value)}</div>`)})}var Et=window.matchMedia(`(max-width: 900px)`),Dt=`bm-panel-submenus-abiertos`,H=e=>document.getElementById(e);function Ot(){try{let e=JSON.parse(localStorage.getItem(Dt)||`[]`);return new Set(Array.isArray(e)?e.filter(e=>typeof e==`string`):[])}catch{return new Set}}function kt(e){try{localStorage.setItem(Dt,JSON.stringify([...e]))}catch{}}function At(e,t){let n=document.getElementById(e.getAttribute(`aria-controls`)||``);n&&(n.hidden=!t,e.setAttribute(`aria-expanded`,String(t)),e.closest(`.has-submenu`)?.classList.toggle(`is-open`,t))}function U(e){let t=H(`wp-sidebar`),n=H(`wp-sidebar-backdrop`),r=H(`btn-menu-toggle`);if(!t||!n||!r)return;let i=e&&Et.matches;t.classList.toggle(`is-open`,i),n.hidden=!i,r.setAttribute(`aria-expanded`,String(i)),r.setAttribute(`aria-label`,i?`Cerrar menú`:`Abrir menú`),document.body.classList.toggle(`panel-menu-abierto`,i),i&&t.querySelector(`.menu-link.is-active, .menu-link`)?.focus()}function jt(){let e=H(`wp-sidebar`);if(!e)return;let t=Ot();Array.from(e.querySelectorAll(`.submenu-toggle`)).forEach(e=>{let n=e.getAttribute(`aria-controls`)||``;At(e,t.has(n)),e.addEventListener(`click`,()=>{let r=e.getAttribute(`aria-expanded`)!==`true`;At(e,r),r?t.add(n):t.delete(n),kt(t)})}),document.addEventListener(`bm:view`,n=>{let r=n.detail,i=e.querySelector(`.submenu-link[data-view="${CSS.escape(r)}"]`),a=Array.from(e.querySelectorAll(`.menu-link[data-view="${CSS.escape(r)}"]`)).find(e=>e.closest(`.wp-menu-item`)?.style.display!==`none`);if(i&&!a){let e=i.closest(`.has-submenu`)?.querySelector(`.submenu-toggle`);e&&e.getAttribute(`aria-expanded`)!==`true`&&(At(e,!0),t.add(e.getAttribute(`aria-controls`)||``),kt(t))}U(!1)}),H(`btn-menu-toggle`)?.addEventListener(`click`,()=>{U(!e.classList.contains(`is-open`))}),H(`wp-sidebar-backdrop`)?.addEventListener(`click`,()=>U(!1)),document.addEventListener(`keydown`,t=>{t.key===`Escape`&&e.classList.contains(`is-open`)&&(U(!1),H(`btn-menu-toggle`)?.focus())}),Et.addEventListener(`change`,()=>U(!1))}var Mt=null;function Nt(){return document.getElementById(`wp-login-screen`)?.dataset.recaptchaSiteKey?.trim()||``}function Pt(){let e=Nt();return e?Mt||(Mt=new Promise((t,n)=>{let r=document.createElement(`script`);r.src=`https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(e)}&hl=es-419`,r.async=!0,r.onload=()=>window.grecaptcha.ready(()=>t(window.grecaptcha)),r.onerror=()=>{Mt=null,n(Error(`No se pudo cargar reCAPTCHA. Revisa tu conexión o desactiva el bloqueador para este sitio.`))},document.head.appendChild(r)}),Mt):Promise.resolve(null)}async function Ft(e){let t=Nt();if(!t)return``;let n=Pt().then(n=>n.execute(t,{action:e})),r=new Promise((e,t)=>setTimeout(()=>t(Error(`reCAPTCHA no respondió. Recarga la página e inténtalo de nuevo.`)),1e4));return Promise.race([n,r])}var W=e=>document.getElementById(e);function It(e){document.querySelectorAll(`[data-account-panel]`).forEach(t=>{t.hidden=t.dataset.accountPanel!==e}),W(`account-panel-${e}`)?.querySelector(`input:not([type=hidden])`)?.focus()}function G(e,t,n){let r=W(e);r.className=t===`error`?`wp-login-error`:`wp-login-success`,r.textContent=n,r.hidden=!n}async function Lt(){document.querySelectorAll(`[data-show-panel]`).forEach(e=>e.addEventListener(`click`,t=>{t.preventDefault(),It(e.dataset.showPanel)})),u(W(`account-panel-set-password`)),W(`forgot-form`)?.addEventListener(`submit`,async e=>{e.preventDefault();let t=W(`forgot-identifier`).value.trim(),n=await d(W(`forgot-submit`),async()=>{let e=``;try{e=await Ft(`forgot`)}catch(e){return{ok:!1,status:0,data:{error:e.message}}}return r(`/api/auth.php?action=forgot`,{identifier:t,recaptcha_token:e})});G(`forgot-message`,n.ok?`success`:`error`,n.data.message||n.data.error||`No se pudo procesar la solicitud.`)});let e=new URLSearchParams(location.search).get(`clave`);if(!e)return!1;history.replaceState(null,``,location.pathname),It(`set-password`);let t=await r(`/api/auth.php?action=token&token=${encodeURIComponent(e)}`),i=W(`set-password-form`);if(!t.ok)return i.hidden=!0,G(`set-password-message`,`error`,t.data.error||`El enlace no es válido.`),!0;let{type:a,user:o}=t.data;return W(`set-password-title`).textContent=a===`invite`?`Crea tu contraseña`:`Elige una nueva contraseña`,W(`set-password-intro`).innerHTML=`${a===`invite`?`Bienvenido`:`Hola`}, <strong>${n(o.full_name)}</strong> (${n(o.callsign)}). Tu usuario es <strong>${n(o.username)}</strong>.`,i.querySelector(`[name="username"]`).value=o.username,i.addEventListener(`submit`,async t=>{t.preventDefault();let n=W(`sp-password`).value;if(n!==W(`sp-password-confirm`).value){G(`set-password-message`,`error`,`Las contraseñas no coinciden.`);return}let a=await d(W(`set-password-submit`),()=>r(`/api/auth.php?action=set_password`,{token:e,password:n}));if(!a.ok){G(`set-password-message`,`error`,a.data.error||`No se pudo guardar la contraseña.`);return}i.reset(),It(`login`),W(`login-username`).value=a.data.username||o.username,W(`login-password`).focus(),G(`login-error`,`success`,a.data.message||`Contraseña guardada. Ya puedes iniciar sesión.`)}),!0}var K=null,q=null,Rt=null,zt=`all`,J=`7d`,Y=e=>document.getElementById(e),X=e=>(e??0).toLocaleString(`es-VE`);function Z(e){if(!e||!/^[A-Za-z]{2}$/.test(e))return`🌐`;let t=e.toUpperCase().split(``).map(e=>127397+e.charCodeAt(0));return String.fromCodePoint(...t)}function Bt(){Y(`analytics-leaflet-map`)&&typeof L<`u`&&(K||(K=L.map(`analytics-leaflet-map`,{center:[8.5,-66],zoom:5,minZoom:2,maxZoom:16,zoomControl:!1,scrollWheelZoom:!1}),L.control.zoom({position:`topright`}).addTo(K),L.tileLayer(`https://tile.openstreetmap.org/{z}/{x}/{y}.png`,{attribution:`&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors`,maxZoom:19}).addTo(K),window.addEventListener(`resize`,()=>{K?.invalidateSize()})),Vt())}function Vt(){K&&Rt&&typeof L<`u`&&(q&&(q.clearLayers(),K.removeLayer(q)),typeof L.markerClusterGroup==`function`&&(q=L.markerClusterGroup({showCoverageOnHover:!1,maxClusterRadius:48,spiderfyOnMaxZoom:!0,iconCreateFunction:e=>{let t=e.getChildCount(),n=`bm-cluster-sm`,r=36;return t>=25?(n=`bm-cluster-lg`,r=48):t>=10&&(n=`bm-cluster-md`,r=42),L.divIcon({html:`<span>${t}</span>`,className:`bm-custom-cluster ${n}`,iconSize:L.point(r,r)})}})),(Rt.map_points||[]).forEach(e=>{if(zt!==`all`&&(e.events?.[zt]||0)===0)return;let t=Z(e.code),r=e.events?.player_play||0,i=e.events?.link_click||0,a=e.events?.post_view||0,o=`
      <div class="bm-popup-card">
        <div class="bm-popup-header">
          <span>${t}</span>
          <span>${n(e.city)}</span>
          <span class="bm-popup-badge">${n(e.country)}</span>
        </div>
        <div class="bm-popup-stat">
          <span>Total actividad:</span>
          <strong>${X(e.count)} interacciones</strong>
        </div>
        ${r?`<div class="bm-popup-stat"><span>Reproducciones</span><strong>${X(r)}</strong></div>`:``}
        ${i?`<div class="bm-popup-stat"><span>Clics en enlaces</span><strong>${X(i)}</strong></div>`:``}
        ${a?`<div class="bm-popup-stat"><span>Lecturas del blog</span><strong>${X(a)}</strong></div>`:``}
      </div>
    `,s=L.divIcon({className:`bm-single-pin`,iconSize:[18,18],iconAnchor:[9,9],popupAnchor:[0,-10]}),c=L.marker([e.lat,e.lng],{icon:s}).bindPopup(o);q?q.addLayer(c):c.addTo(K)}),q&&K.addLayer(q))}function Ht(e){Rt=e;let t=Y(`live-listeners-banner`),r=Y(`live-listeners-text`);if(t&&r){let i=e.live_audio;if(i&&i.is_active&&i.total_listeners>0){t.classList.add(`is-active-listening`);let e=i.total_listeners;r.innerHTML=`Hay <strong>${e===1?`1 usuario escuchando`:`${X(e)} usuarios escuchando`}</strong> en este momento desde: <span class="live-status-countries-pills">${(i.countries||[]).map(e=>`<span class="live-country-pill">${Z(e.code)} ${n(e.country)} <strong>(${X(e.count)})</strong></span>`).join(``)}</span>`}else t.classList.remove(`is-active-listening`),r.textContent=`No hay personas escuchando el audio en vivo en este momento.`}Y(`kpi-player-plays`)&&(Y(`kpi-player-plays`).textContent=X(e.kpis?.player_plays)),Y(`kpi-unique-listeners`)&&(Y(`kpi-unique-listeners`).textContent=X(e.kpis?.unique_listeners)),Y(`kpi-link-clicks`)&&(Y(`kpi-link-clicks`).textContent=X(e.kpis?.link_clicks)),Y(`kpi-post-views`)&&(Y(`kpi-post-views`).textContent=X(e.kpis?.post_views)),Y(`kpi-post-shares`)&&(Y(`kpi-post-shares`).textContent=X(e.kpis?.post_shares)),Y(`kpi-active-countries`)&&(Y(`kpi-active-countries`).textContent=X(e.kpis?.active_countries)),Y(`kpi-page-views`)&&(Y(`kpi-page-views`).textContent=X(e.kpis?.page_views??0)),Y(`kpi-unique-visitors`)&&(Y(`kpi-unique-visitors`).textContent=X(e.kpis?.unique_visitors??0)),Y(`kpi-petra-views`)&&(Y(`kpi-petra-views`).textContent=X(e.kpis?.petra_views??e.petra?.total_views??0)),Y(`kpi-petra-unique`)&&(Y(`kpi-petra-unique`).textContent=X(e.kpis?.petra_unique??e.petra?.unique_visitors??0));let i=Array.from(new Set((e.map_points||[]).map(e=>e.code).filter(e=>/^[A-Z]{2}$/.test(e)))).slice(0,4);Y(`kpi-top-countries`)&&(Y(`kpi-top-countries`).textContent=i.length?i.join(`, `):`Sin datos aún`);let a=(e.shares?.platforms||[])[0];Y(`kpi-top-platform`)&&(Y(`kpi-top-platform`).textContent=a?`Más usado: ${a.name}`:`Sin compartidos aún`);let o={"7d":`Últimos 7 días`,"30d":`Últimos 30 días`,all:`Histórico`};document.querySelectorAll(`[data-range-label]`).forEach(e=>e.textContent=o[J]??``),Vt(),Ut(e.audience);let s=Y(`player-countries-list`);if(s){let t=e.player?.countries||[];s.innerHTML=t.length?t.map(e=>`
            <div class="country-bar-item">
              <div class="country-bar-header">
                <span class="country-name-wrap">
                  <span>${Z(e.code)}</span>
                  <span>${n(e.country)}</span>
                  <span class="country-code-pill">${n(e.code)}</span>
                </span>
                <span class="country-bar-metrics">
                  <strong>${X(e.plays)}</strong>
                  <span>${Number(e.percent)||0}%</span>
                </span>
              </div>
              <div class="country-bar-track">
                <div class="country-bar-fill" style="width: ${Math.max(0,Math.min(100,Number(e.percent)||0))}%;"></div>
              </div>
            </div>
          `).join(``):`<p class="analytics-empty">Sin reproducciones en este periodo.</p>`}let c=Y(`player-listeners-tbody`);if(c){let t=e.player?.listeners||[];c.innerHTML=t.length?t.map(e=>{let t=Z(e.code);return`
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
          `}).join(``):`<tr><td colspan="4" class="analytics-empty">Sin oyentes en este periodo.</td></tr>`}let l=Y(`petra-talkgroups-container`);if(l){let t=e.petra?.talkgroups||[];l.innerHTML=t.length?t.map(e=>{let t=e.views||0,r=e.unique_users||0,i=Math.max(0,Math.min(100,Number(e.percent)||0)),a=e.id===`734`?`badge-tg-main`:e.id===`73452`?`badge-tg-alert`:`badge-tg-rcv`;return`
            <div class="petra-tg-card">
              <div class="petra-tg-head">
                <div class="petra-tg-info">
                  <span class="badge-tag-category ${a}">TG ${n(e.id)}</span>
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
                  <span class="metric-val">${X(t)}</span>
                  <span class="metric-lbl">${t===1?`interacción`:`interacciones`}</span>
                </div>
                <div class="petra-metric-block">
                  <span class="metric-val">${X(r)}</span>
                  <span class="metric-lbl">${r===1?`usuario`:`usuarios`}</span>
                </div>
                <div class="petra-metric-block petra-metric-right">
                  <span class="metric-val">${i}%</span>
                  <span class="metric-lbl">del interés</span>
                </div>
              </div>

              <div class="petra-tg-progress">
                <div class="petra-tg-progress-fill ${a}" style="width: ${i}%;"></div>
              </div>
            </div>
          `}).join(``):`<p class="analytics-empty">Sin interacciones registradas en Petra en este periodo.</p>`}let u=Y(`link-clicks-tbody`);if(u){let t=e.links||[];u.innerHTML=t.length?t.map(e=>`
            <tr>
              <td>
                <div class="cell-strong">${n(e.title)}</div>
                <div class="cell-url">${n(e.url)}</div>
              </td>
              <td class="col-opt">
                <span class="badge-tag-category">${n(e.category===`external_link`?`Externo`:e.category===`portal_link`?`Portal`:e.category||`Enlace`)}</span>
              </td>
              <td class="cell-num cell-right">
                ${X(e.clicks)}
              </td>
            </tr>
          `).join(``):`<tr><td colspan="3" class="analytics-empty">Sin clics en enlaces en este periodo.</td></tr>`}let d=Y(`global-countries-tbody`);if(d){let t=e.countries_detail||[];d.innerHTML=t.length?t.map(e=>{let t=Z(e.code),r=Math.max(0,Math.min(100,Number(e.percent)||0));return`
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
                <span class="badge-count">${X(e.unique_visitors)} ${e.unique_visitors===1?`usuario`:`usuarios`}</span>
              </td>
              <td class="cell-num">
                <span class="cell-strong">${X(e.total)}</span>
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
          `}).join(``):`<tr><td colspan="4" class="analytics-empty">Sin conexiones registradas en este periodo.</td></tr>`}let f=Y(`traffic-sources-container`);if(f){let t=e.traffic?.sources||[];f.innerHTML=t.length?t.map(e=>{let t=Math.max(0,Math.min(100,Number(e.percent)||0)),r=Number(e.people)||0;return`
            <div class="share-platform-row">
              <div class="share-platform-header">
                <span class="share-platform-name">${n(e.name)}</span>
                <span class="share-platform-count">
                  <strong>${X(e.visits)}</strong> <span>${t}%</span>
                </span>
              </div>
              <div class="share-track">
                <div class="share-fill" style="width: ${t}%;"></div>
              </div>
              <span class="share-platform-sub">${X(r)} ${r===1?`persona`:`personas`}</span>
            </div>
          `}).join(``):`<p class="analytics-empty">Todavía no hay visitas registradas en este periodo. Los datos empiezan a contarse desde que se publicó esta versión del sitio.</p>`}let p=Y(`traffic-sites-tbody`);if(p){let t=e.traffic?.sites||[];p.innerHTML=t.length?t.map(e=>`
            <tr>
              <td><span class="cell-strong">${n(e.host)}</span></td>
              <td class="col-opt">${n(e.source)}</td>
              <td class="cell-right"><strong>${X(e.visits)}</strong></td>
            </tr>
          `).join(``):`<tr><td colspan="3" class="analytics-empty">Ningún sitio externo nos enlazó en este periodo.</td></tr>`}let m=Y(`social-shares-container`);if(m){let t=e.shares?.platforms||[];m.innerHTML=t.length?t.map(e=>`
            <div class="share-platform-row">
              <div class="share-platform-header">
                <span class="share-platform-name">${n(e.name)}</span>
                <span class="share-platform-count">
                  <strong>${X(e.shares)}</strong> <span>${Number(e.percent)||0}%</span>
                </span>
              </div>
              <div class="share-track">
                <div class="share-fill" style="width: ${Math.max(0,Math.min(100,Number(e.percent)||0))}%;"></div>
              </div>
            </div>
          `).join(``):`<p class="analytics-empty">Sin compartidos en este periodo.</p>`}let h=Y(`posts-views-tbody`);if(h){let t=e.posts||[];if(!t.length)h.innerHTML=`<tr><td colspan="5" class="analytics-empty">Sin noticias publicadas.</td></tr>`;else{let e=Math.max(1,...t.map(e=>Number(e.views)||0));h.innerHTML=t.map(t=>{let r=Math.round((Number(t.views)||0)/e*100);return`
            <tr>
              <td>
                <div class="cell-strong">${t.slug?`<a href="/blog/${encodeURIComponent(t.slug)}" target="_blank" rel="noopener">${n(t.title)}</a>`:n(t.title)}</div>
              </td>
              <td class="col-opt">
                <span class="badge-tag-category is-neutral">${n(t.category||`General`)}</span>
              </td>
              <td class="cell-num">
                ${X(t.views)}
              </td>
              <td class="cell-num cell-muted col-opt">
                ${X(t.shares||0)}
              </td>
              <td class="cell-interest" title="${r}% respecto a la noticia más leída">
                <div class="interest-wrap">
                  <span class="interest-track"><span class="interest-fill" style="width: ${r}%;"></span></span>
                  <span class="interest-value">${r}%</span>
                </div>
              </td>
            </tr>
          `}).join(``)}}Ut(e.audience)}function Ut(e){let t=Y(`audience-devices-container`);if(t){let r=e?.devices||[],i=e?.total_device_visits||0;if(!r.length||i===0)t.innerHTML=`
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
                <strong>${X(e.visits)}</strong>
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
            <span class="audience-pie-center-val">${X(i)}</span>
            <span class="audience-pie-center-lbl">Visitas</span>
          </div>
        </div>
        <div class="audience-devices-legend">
          ${s}
        </div>
      `}}let r=Y(`audience-days-container`);if(r){let t=e?.days||[],i=e?.max_day_visits||0,a=e?.peak_day;r.innerHTML=!t.length||i===0?`
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
            <div class="day-bar-item ${t?`is-peak`:``}" title="${n(e.name)}: ${X(e.visits)} visitas (${X(e.people)} personas)">
              <span class="day-bar-value">${e.visits>0?X(e.visits):``}</span>
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
            <span>Día pico: <strong>${n(a.name)}</strong> (${X(a.visits)} visitas)</span>
          </div>
        `:`
          <div class="audience-summary-pill" style="background: #F8FAFC; color: #64748B; border-color: #E2E8F0;">
            <span>Sin visitas en este periodo</span>
          </div>
        `}
      `}let i=Y(`audience-hours-container`);if(i){let t=e?.hours||[],r=e?.max_hour_visits||0,a=e?.peak_hour;i.innerHTML=!t.length||r===0?`
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
              <div class="hour-tooltip">${n(e.label)}: <strong>${X(e.visits)}</strong> visitas</div>
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
            <span>Hora pico: <strong>${n(a.label)}</strong> (${X(a.visits)} visitas)</span>
          </div>
        `:`
          <div class="audience-summary-pill" style="background: #F8FAFC; color: #64748B; border-color: #E2E8F0;">
            <span>Sin visitas en este periodo</span>
          </div>
        `}
      `}}var Wt={kpis:{player_plays:0,unique_listeners:0,link_clicks:0,post_views:0,post_shares:0,active_countries:0},map_points:[],player:{countries:[],listeners:[],total_plays:0},live_audio:{is_active:!1,total_listeners:0,countries:[]},countries_detail:[],links:[],posts:[],shares:{platforms:[],total:0},audience:{devices:[],total_device_visits:0,days:[],max_day_visits:0,hours:[],max_hour_visits:0}};async function Gt(e=`7d`){J=e;try{let t=await fetch(`/api/analytics.php?action=stats&range=${encodeURIComponent(e)}`,{credentials:`same-origin`});if(t.status===401){document.dispatchEvent(new CustomEvent(`bm:unauthorized`));return}if(t.ok){let e=await t.json();if(e&&e.kpis){Ht(e);return}}Ht(Wt)}catch{Ht(Wt)}}function Kt(){Y(`view-dashboard`)&&(document.querySelectorAll(`.btn-time-range`).forEach(e=>{e.addEventListener(`click`,e=>{document.querySelectorAll(`.btn-time-range`).forEach(e=>e.classList.remove(`is-active`));let t=e.currentTarget;t.classList.add(`is-active`),Gt(t.dataset.range||`7d`)})}),document.querySelectorAll(`[data-map-filter]`).forEach(e=>{e.addEventListener(`click`,e=>{document.querySelectorAll(`[data-map-filter]`).forEach(e=>e.classList.remove(`is-active`));let t=e.currentTarget;t.classList.add(`is-active`),zt=t.dataset.mapFilter||`all`,Vt()})}),Y(`btn-reset-map`)?.addEventListener(`click`,()=>{K&&K.setView([8.5,-66],5,{animate:!0})}),document.addEventListener(`bm:view`,e=>{e.detail===`dashboard`&&(setTimeout(()=>{Bt(),K?.invalidateSize()},100),Gt(J))}),Gt(J).then(()=>{Y(`view-dashboard`)?.classList.contains(`is-active`)&&setTimeout(()=>{Bt(),K?.invalidateSize()},200)}),setInterval(()=>{document.visibilityState===`visible`&&Y(`view-dashboard`)?.classList.contains(`is-active`)&&Gt(J)},3e4))}var Q={id:0,username:``,callsign:``,full_name:``,email:``,role:`author`},qt={users:[`admin`],"user-new":[`admin`],"site-content":[`admin`,`editor`],posts:[`admin`,`editor`,`author`],"new-post":[`admin`,`editor`,`author`],gallery:[`admin`,`editor`],"gallery-edit":[`admin`,`editor`]},Jt=e=>{Q=e,document.dispatchEvent(new CustomEvent(`bm:session`,{detail:e}))},Yt=async()=>{try{let e=await(await fetch(`/api/auth.php?action=status`,{credentials:`same-origin`})).json();if(e?.logged_in&&e.user){Jt(e.user),Xt();return}}catch{$(`No fue posible contactar al servidor de autenticación.`);return}$()},$=(e=``)=>{document.getElementById(`wp-login-screen`).style.display=`flex`,Pt().catch(()=>{}),document.getElementById(`wp-app`).style.display=`none`,It(`login`);let t=document.getElementById(`login-error`);t&&(t.className=`wp-login-error`,t.textContent=e,t.hidden=!e)},Xt=()=>{document.getElementById(`wp-login-screen`).style.display=`none`,document.getElementById(`wp-app`).style.display=`flex`,Zt(),window.switchView(`dashboard`)},Zt=()=>{let e=document.getElementById(`bar-user-name`),n=document.getElementById(`bar-user-role`);e&&(e.textContent=Q.callsign),n&&(n.textContent=t[Q.role],n.className=`role-badge role-${Q.role}`);let r=(e,t)=>{let n=document.getElementById(e);n&&(n.style.display=t?``:`none`)};r(`menu-users-item`,Q.role===`admin`),r(`menu-profile-item`,Q.role!==`admin`),r(`menu-site-content-item`,Q.role!==`author`),r(`menu-gallery-item`,Q.role!==`author`)};document.addEventListener(`bm:session`,Zt),document.addEventListener(`bm:unauthorized`,()=>$(`Tu sesión ha expirado. Por favor, inicia sesión nuevamente.`));var Qt=async()=>{let e=document.getElementById(`wp-app`);if(e&&e.style.display!==`none`)try{(await(await fetch(`/api/auth.php?action=status`,{credentials:`same-origin`})).json().catch(()=>null))?.logged_in||$(`Tu sesión ha expirado. Por favor, inicia sesión nuevamente.`)}catch{}};window.addEventListener(`focus`,Qt),document.addEventListener(`visibilitychange`,()=>{document.visibilityState===`visible`&&Qt()}),window.switchView=e=>{let t=qt[e];t&&!t.includes(Q.role)&&(e=`dashboard`),document.querySelectorAll(`.wp-view`).forEach(e=>e.classList.remove(`is-active`)),document.querySelectorAll(`.menu-link, .submenu-link`).forEach(e=>e.classList.remove(`is-active`));let n=document.getElementById(`view-${e}`);n&&n.classList.add(`is-active`),document.querySelectorAll(`.wp-sidebar [data-view="${e}"]`).forEach(e=>{e.classList.add(`is-active`),e.closest(`.has-submenu`)?.querySelector(`:scope > .menu-link`)?.classList.add(`is-active`)}),document.dispatchEvent(new CustomEvent(`bm:view`,{detail:e})),window.scrollTo({top:0})},document.querySelectorAll(`[data-view]`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.getAttribute(`data-view`);t&&window.switchView(t)})});var $t=document.getElementById(`login-form`);$t&&$t.addEventListener(`submit`,async e=>{e.preventDefault();let t=document.getElementById(`login-username`),n=document.getElementById(`login-password`),r=document.getElementById(`login-submit`);r&&(r.disabled=!0);try{let e=``;try{e=await Ft(`login`)}catch(e){$(e.message);return}let r=await fetch(`/api/auth.php?action=login`,{method:`POST`,credentials:`same-origin`,headers:{"Content-Type":`application/json`},body:JSON.stringify({username:t.value,password:n.value,recaptcha_token:e})}),i=await r.json().catch(()=>null);r.ok&&i?.success&&i.user?(Jt(i.user),n.value=``,Xt()):$(i?.error||`No fue posible iniciar sesión.`)}catch{$(`No fue posible contactar al servidor de autenticación.`)}finally{r&&(r.disabled=!1)}}),document.getElementById(`btn-logout`)?.addEventListener(`click`,async()=>{try{await fetch(`/api/auth.php?action=logout`,{method:`POST`,credentials:`same-origin`})}catch{}$()}),document.getElementById(`btn-save-site-texts`)?.addEventListener(`click`,()=>{alert(`Los textos del portal todavía no se guardan: pendiente en la siguiente fase.`)}),_e(),be(),it(),Tt(),jt(),Kt(),Lt().then(e=>{e||Yt()});