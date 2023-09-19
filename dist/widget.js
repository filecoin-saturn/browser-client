(()=>{"use strict";var e,t=new Uint8Array(16);function r(){if(!e&&!(e="undefined"!=typeof crypto&&crypto.getRandomValues&&crypto.getRandomValues.bind(crypto)||"undefined"!=typeof msCrypto&&"function"==typeof msCrypto.getRandomValues&&msCrypto.getRandomValues.bind(msCrypto)))throw new Error("crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported");return e(t)}const n=/^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i,o=function(e){return"string"==typeof e&&n.test(e)};for(var i=[],s=0;s<256;++s)i.push((s+256).toString(16).substr(1));const a=function(e,t,n){var s=(e=e||{}).random||(e.rng||r)();if(s[6]=15&s[6]|64,s[8]=63&s[8]|128,t){n=n||0;for(var a=0;a<16;++a)t[n+a]=s[a];return t}return function(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:0,r=(i[e[t+0]]+i[e[t+1]]+i[e[t+2]]+i[e[t+3]]+"-"+i[e[t+4]]+i[e[t+5]]+"-"+i[e[t+6]]+i[e[t+7]]+"-"+i[e[t+8]]+i[e[t+9]]+"-"+i[e[t+10]]+i[e[t+11]]+i[e[t+12]]+i[e[t+13]]+i[e[t+14]]+i[e[t+15]]).toLowerCase();if(!o(r))throw TypeError("Stringified UUID is invalid");return r}(s)};console.log,"serviceWorker"in navigator&&(function(e,t){const r=`link#${t.id}`;let n=document.head.querySelector(r);if(n)return n;n=document.createElement(e);for(const e in t)n[e]=t[e];document.head.appendChild(n)}("link",{href:"https://localhost",crossOrigin:"",rel:"preconnect",id:"saturn-preconnect"}),async function(e){try{const t=`/saturn-sw.js?clientId=${e}`;await navigator.serviceWorker.register(t)}catch(e){console.warn("Failed to install Saturn's Service Worker.\n\nFor installation help, see https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers#Why_is_my_service_worker_failing_to_register.\n\n",e.name,e.message)}}(function(){const e="saturnClientId";let t=localStorage.getItem(e);return t||(t=a(),localStorage.setItem(e,t)),t}()))})();