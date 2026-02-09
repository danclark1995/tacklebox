/**
 * Template Engine — generates branded HTML for documents, presentations, and ad overlays
 */

function safeArr(val) {
  if (Array.isArray(val)) return val
  if (typeof val === 'string') { try { const p = JSON.parse(val); return Array.isArray(p) ? p : [] } catch { return [] } }
  return []
}

function getBrandStyles(bp) {
  const primary = safeArr(bp.colours_primary)
  const secondary = safeArr(bp.colours_secondary)
  const typo = safeArr(bp.typography)

  const accent = primary.find(c => c.hex && c.hex !== '#000000' && c.hex !== '#ffffff')?.hex || primary[0]?.hex || '#998542'
  const bg = primary.find(c => c.hex === '#000000')?.hex || '#000000'
  const fg = secondary.find(c => c.hex === '#ffffff')?.hex || '#ffffff'
  const surface = secondary.find(c => c.name?.toLowerCase().includes('neutral') || c.name?.toLowerCase().includes('black'))?.hex || '#1a1a1a'

  const titleFont = typo.find(t => t.role?.toLowerCase().includes('title'))?.font_family || 'system-ui'
  const bodyFont = typo.find(t => t.role?.toLowerCase().includes('body'))?.font_family || 'system-ui'
  const titleWeight = typo.find(t => t.role?.toLowerCase().includes('title'))?.weight || 'bold'

  return { accent, bg, fg, surface, titleFont, bodyFont, titleWeight }
}

function escapeHtml(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export function renderDocument(brandProfile, contentData, subType) {
  const s = getBrandStyles(brandProfile)
  const company = brandProfile.client_company || brandProfile.company || ''
  const tagline = brandProfile.tagline || ''
  const logo = brandProfile.logo_path || ''
  const title = escapeHtml(contentData.title || 'Document')
  const body = (contentData.body || '').replace(/\n/g, '<br>')

  const headerHtml = `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:40px 60px;border-bottom:3px solid ${s.accent};">
      ${logo ? `<img src="${escapeHtml(logo)}" style="height:40px;" alt="${escapeHtml(company)}">` : `<div style="font-family:${s.titleFont};font-weight:${s.titleWeight};font-size:24px;color:${s.fg};">${escapeHtml(company)}</div>`}
      <div style="font-size:12px;color:${s.accent};font-family:${s.bodyFont};">${escapeHtml(tagline)}</div>
    </div>`

  const footerHtml = `
    <div style="position:absolute;bottom:0;left:0;right:0;padding:20px 60px;border-top:1px solid ${s.surface};font-size:11px;color:#666;font-family:${s.bodyFont};display:flex;justify-content:space-between;">
      <span>${escapeHtml(company)}</span>
      <span style="color:${s.accent};">Confidential</span>
    </div>`

  let mainContent = ''

  switch (subType) {
    case 'letterhead':
      mainContent = `
        <div style="padding:60px;">
          ${contentData.recipient ? `<p style="margin-bottom:24px;color:${s.fg};font-family:${s.bodyFont};">To: ${escapeHtml(contentData.recipient)}</p>` : ''}
          <div style="font-family:${s.bodyFont};font-size:15px;line-height:1.8;color:${s.fg};">${body}</div>
        </div>`
      break

    case 'one_pager':
      mainContent = `
        <div style="padding:40px 60px;">
          <h1 style="font-family:${s.titleFont};font-size:32px;font-weight:${s.titleWeight};color:${s.accent};margin-bottom:24px;text-transform:uppercase;">${title}</h1>
          <div style="font-family:${s.bodyFont};font-size:14px;line-height:1.8;color:${s.fg};columns:2;column-gap:40px;">${body}</div>
        </div>`
      break

    case 'report_cover':
      mainContent = `
        <div style="display:flex;flex-direction:column;justify-content:center;align-items:center;height:calc(100vh - 200px);text-align:center;padding:60px;">
          ${logo ? `<img src="${escapeHtml(logo)}" style="height:80px;margin-bottom:40px;" alt="">` : ''}
          <h1 style="font-family:${s.titleFont};font-size:48px;font-weight:${s.titleWeight};color:${s.accent};margin-bottom:16px;text-transform:uppercase;letter-spacing:2px;">${title}</h1>
          <p style="font-family:${s.bodyFont};font-size:18px;color:${s.fg};opacity:0.8;max-width:500px;">${escapeHtml(contentData.body?.substring(0, 200) || '')}</p>
          <div style="margin-top:60px;width:60px;height:3px;background:${s.accent};"></div>
          <p style="margin-top:20px;font-family:${s.bodyFont};font-size:14px;color:#888;">${escapeHtml(company)} | ${new Date().getFullYear()}</p>
        </div>`
      break

    default: // proposal, brief
      mainContent = `
        <div style="padding:40px 60px;">
          <h1 style="font-family:${s.titleFont};font-size:36px;font-weight:${s.titleWeight};color:${s.accent};margin-bottom:8px;text-transform:uppercase;">${title}</h1>
          <div style="width:60px;height:3px;background:${s.accent};margin-bottom:32px;"></div>
          ${contentData.key_points ? `<div style="padding:20px;background:${s.surface};border-radius:8px;margin-bottom:32px;border-left:4px solid ${s.accent};"><p style="font-family:${s.bodyFont};font-size:13px;color:${s.fg};line-height:1.7;">${escapeHtml(contentData.key_points)}</p></div>` : ''}
          <div style="font-family:${s.bodyFont};font-size:15px;line-height:1.8;color:${s.fg};">${body}</div>
        </div>`
  }

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;background:${s.bg};color:${s.fg};min-height:100vh;position:relative;font-family:${s.bodyFont};">
${headerHtml}${mainContent}${footerHtml}
</body></html>`
}

export function renderPresentation(brandProfile, slides, subType) {
  const s = getBrandStyles(brandProfile)
  const company = brandProfile.client_company || brandProfile.company || ''
  const logo = brandProfile.logo_path || ''
  const tagline = brandProfile.tagline || ''

  const slidesHtml = slides.map((slide, i) => {
    const isTitle = i === 0
    const bullets = (slide.bullets || []).map(b => `<li style="margin-bottom:12px;">${escapeHtml(b)}</li>`).join('')

    if (isTitle) {
      return `<div class="slide" style="display:${i === 0 ? 'flex' : 'none'};flex-direction:column;justify-content:center;align-items:center;text-align:center;">
        ${logo ? `<img src="${escapeHtml(logo)}" style="height:60px;margin-bottom:32px;" alt="">` : ''}
        <h1 style="font-family:${s.titleFont};font-size:44px;font-weight:${s.titleWeight};color:${s.accent};margin-bottom:16px;text-transform:uppercase;letter-spacing:2px;">${escapeHtml(slide.title)}</h1>
        ${tagline ? `<p style="font-size:20px;color:${s.fg};opacity:0.7;font-style:italic;">"${escapeHtml(tagline)}"</p>` : ''}
        ${bullets ? `<ul style="list-style:none;padding:0;margin-top:32px;font-size:16px;color:${s.fg};opacity:0.8;">${bullets}</ul>` : ''}
      </div>`
    }

    return `<div class="slide" style="display:none;padding:60px 80px;">
      <h2 style="font-family:${s.titleFont};font-size:32px;font-weight:${s.titleWeight};color:${s.accent};margin-bottom:8px;text-transform:uppercase;">${escapeHtml(slide.title)}</h2>
      <div style="width:40px;height:3px;background:${s.accent};margin-bottom:32px;"></div>
      ${bullets ? `<ul style="list-style:none;padding:0;font-family:${s.bodyFont};font-size:18px;line-height:1.6;color:${s.fg};">${bullets}</ul>` : ''}
      ${slide.notes ? `<p style="margin-top:32px;font-size:14px;color:#888;font-style:italic;">${escapeHtml(slide.notes)}</p>` : ''}
    </div>`
  }).join('\n')

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Presentation</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{background:${s.bg};color:${s.fg};font-family:${s.bodyFont};overflow:hidden}
  .slide{width:100vw;height:100vh;position:absolute;top:0;left:0}
  .nav{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);display:flex;gap:8px;z-index:10}
  .nav button{width:10px;height:10px;border-radius:50%;border:2px solid ${s.accent};background:transparent;cursor:pointer;padding:0}
  .nav button.active{background:${s.accent}}
  .counter{position:fixed;bottom:28px;right:32px;font-size:13px;color:#666;font-family:${s.bodyFont}}
  .logo-footer{position:fixed;bottom:24px;left:32px;opacity:0.4}
</style></head><body>
${slidesHtml}
<div class="nav" id="nav"></div>
<div class="counter" id="counter"></div>
${logo ? `<div class="logo-footer"><img src="${escapeHtml(logo)}" style="height:20px;" alt=""></div>` : ''}
<script>
const slides=document.querySelectorAll('.slide'),nav=document.getElementById('nav'),counter=document.getElementById('counter');
let cur=0;
function show(i){slides.forEach((s,j)=>{s.style.display=j===i?'flex':'none'});
nav.querySelectorAll('button').forEach((b,j)=>{b.className=j===i?'active':''});
counter.textContent=(i+1)+' / '+slides.length;cur=i}
slides.forEach((_,i)=>{const b=document.createElement('button');b.onclick=()=>show(i);nav.appendChild(b)});
document.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key===' ')show(Math.min(cur+1,slides.length-1));if(e.key==='ArrowLeft')show(Math.max(cur-1,0))});
document.addEventListener('click',e=>{if(e.target.tagName!=='BUTTON')show(Math.min(cur+1,slides.length-1))});
show(0);
</script></body></html>`
}

export function renderAdOverlay(brandProfile, imageUrl, adData) {
  const s = getBrandStyles(brandProfile)
  const logo = brandProfile.logo_path || ''
  const w = adData.dimensions?.width || 1080
  const h = adData.dimensions?.height || 1080

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>*{margin:0;padding:0;box-sizing:border-box}</style></head>
<body style="width:${w}px;height:${h}px;position:relative;overflow:hidden;font-family:${s.bodyFont};">
<img src="${escapeHtml(imageUrl)}" style="width:100%;height:100%;object-fit:cover;position:absolute;top:0;left:0;">
<div style="position:absolute;top:0;left:0;right:0;bottom:0;background:linear-gradient(to top,rgba(0,0,0,0.85) 30%,transparent 70%);"></div>
<div style="position:absolute;bottom:0;left:0;right:0;padding:${Math.round(w*0.05)}px;text-align:center;">
  ${logo ? `<img src="${escapeHtml(logo)}" style="height:${Math.round(h*0.06)}px;margin-bottom:${Math.round(h*0.02)}px;" alt="">` : ''}
  <h1 style="font-family:${s.titleFont};font-size:${Math.round(w*0.045)}px;font-weight:${s.titleWeight};color:${s.accent};text-transform:uppercase;letter-spacing:1px;margin-bottom:${Math.round(h*0.01)}px;">${escapeHtml(adData.headline || '')}</h1>
  ${adData.subheadline ? `<p style="font-size:${Math.round(w*0.025)}px;color:${s.fg};opacity:0.9;margin-bottom:${Math.round(h*0.015)}px;">${escapeHtml(adData.subheadline)}</p>` : ''}
  ${adData.cta ? `<div style="display:inline-block;padding:${Math.round(h*0.012)}px ${Math.round(w*0.04)}px;background:${s.accent};color:${s.bg};font-family:${s.titleFont};font-size:${Math.round(w*0.022)}px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;border-radius:4px;">${escapeHtml(adData.cta)}</div>` : ''}
</div>
</body></html>`
}
