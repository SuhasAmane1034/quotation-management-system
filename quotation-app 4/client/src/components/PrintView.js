import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { X, Printer, Share2 } from 'lucide-react';

export default function PrintView({ quotation, onClose, settings }) {
  const printRef = useRef();
  const currency = settings?.currency || '₹';
  const taxLabel = settings?.tax_label || 'GST';
  const colVis   = settings?.columns_visible || {};
  const showCol  = (k) => colVis[k] !== false;

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Quotation-${quotation.quote_number}`
  });

  const handleWhatsApp = () => {
    const text = `*${quotation.company_name || 'Quotation'}*\nQuote: ${quotation.quote_number}\nCustomer: ${quotation.customer_name || ''}\nTotal: ${currency}${Number(quotation.total).toLocaleString('en-IN')}\nValid Till: ${validTill}\n\nThank you for your business!`;
    const num = (quotation.customer_mobile || '').replace(/\D/g,'');
    window.open(`https://wa.me/${num || ''}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const validTill = quotation.date && quotation.validity_days
    ? new Date(new Date(quotation.date).getTime() + Number(quotation.validity_days) * 86400000)
        .toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })
    : '—';

  const dateFormatted = quotation.date
    ? new Date(quotation.date).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })
    : '—';

  // Global logo: prefer quotation logo, fallback to settings
  const logoUrl = quotation.company_logo || settings?.company_logo || '';
  const logoSrc = logoUrl ? (logoUrl.startsWith('http') ? logoUrl : `http://localhost:3001${logoUrl}`) : null;

  const cols = [
    { key:'sr_no',         label:'Sr.',         w:26,   align:'center' },
    { key:'product_image', label:'Image',        w:50,   align:'center' },
    { key:'product_name',  label:'Product Name', w:'auto',align:'left'  },
    { key:'shape',         label:'Shape',        w:58,   align:'center' },
    { key:'color',         label:'Color',        w:74,   align:'center' },
    { key:'body_color',    label:'Body Color',   w:58,   align:'center' },
    { key:'warranty',      label:'Warranty',     w:54,   align:'center' },
    { key:'quantity',      label:'Qty',          w:34,   align:'center' },
    { key:'unit',          label:'Unit',         w:38,   align:'center' },
    { key:'rate',          label:'Rate',         w:68,   align:'right'  },
    { key:'discount',      label:'Disc.',        w:42,   align:'center' },
    { key:'amount',        label:'Amount',       w:78,   align:'right'  },
  ].filter(c => showCol(c.key));

  const parseTerms = (text) => text ? text.split('\n').filter(l => l.trim()) : [];

  const renderCell = (col, item, i) => {
    switch (col.key) {
      case 'sr_no':        return <span style={{ color:'#aaa', fontSize:10 }}>{i+1}</span>;
      case 'product_image':
        const src = item.product_image ? (item.product_image.startsWith('http') ? item.product_image : `http://localhost:3001${item.product_image}`) : null;
        return src
          ? <img src={src} alt="" style={{ width:36, height:36, objectFit:'cover', borderRadius:5, display:'block', margin:'0 auto' }} />
          : <div style={{ width:36, height:36, background:'#f0f0ff', borderRadius:5, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, margin:'0 auto' }}>💡</div>;
      case 'product_name': return <span style={{ fontWeight:700, fontSize:11.5, color:'#1a1830', lineHeight:1.3 }}>{item.product_name}</span>;
      case 'shape':        return item.shape   ? <span style={{ background:'#eef0ff', color:'#6366f1', padding:'2px 7px', borderRadius:12, fontSize:9.5, fontWeight:700, display:'inline-block' }}>{item.shape}</span>      : <span style={{ color:'#ccc' }}>—</span>;
      case 'color':        return item.color   ? <span style={{ background:'#fff8e6', color:'#c97c00', padding:'2px 7px', borderRadius:12, fontSize:9.5, fontWeight:700, display:'inline-block' }}>{item.color}</span>      : <span style={{ color:'#ccc' }}>—</span>;
      case 'body_color':   return item.body_color  ? <span style={{ fontSize:10, color:'#555' }}>{item.body_color}</span>  : <span style={{ color:'#ccc' }}>—</span>;
      case 'warranty':     return item.warranty    ? <span style={{ fontSize:10, color:'#555' }}>{item.warranty}</span>    : <span style={{ color:'#ccc' }}>—</span>;
      case 'quantity':     return <span style={{ fontWeight:700, fontSize:11 }}>{item.quantity}</span>;
      case 'unit':         return <span style={{ color:'#666', fontSize:10 }}>{item.unit}</span>;
      case 'rate':         return <span style={{ fontWeight:600 }}>{currency}{Number(item.rate).toLocaleString('en-IN', { minimumFractionDigits:2 })}</span>;
      case 'discount':     return item.discount > 0 ? <span style={{ color:'#10b981', fontWeight:700 }}>{item.discount}%</span> : <span style={{ color:'#ccc' }}>—</span>;
      case 'amount':       return <span style={{ fontWeight:800, color:'#1a1830' }}>{currency}{Number(item.amount).toLocaleString('en-IN', { minimumFractionDigits:2 })}</span>;
      default: return null;
    }
  };

  return (
    <div style={{ height:'100vh', display:'flex', flexDirection:'column', background:'var(--bg)' }}>
      {/* Toolbar */}
      <div className="top-header no-print">
        <span className="header-title">Print Preview — {quotation.quote_number}</span>
        <div className="header-actions">
          {quotation.customer_mobile && (
            <button className="btn btn-success" onClick={handleWhatsApp}><Share2 size={14} /> WhatsApp</button>
          )}
          <button className="btn btn-primary" onClick={handlePrint}><Printer size={14} /> Print / Save PDF</button>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
      </div>

      {/* A4 Preview */}
      <div style={{ flex:1, overflow:'auto', padding:24, background:'#b8b7cf' }}>
        <div ref={printRef} style={{
          width:'210mm', minHeight:'297mm', margin:'0 auto',
          background:'white', boxShadow:'0 8px 48px rgba(0,0,0,0.25)',
          fontFamily:'"DM Sans",Arial,sans-serif', fontSize:'11px',
          color:'#111', padding:'14mm 14mm 16mm', boxSizing:'border-box'
        }}>
          {/* ── HEADER ── */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12, paddingBottom:12, borderBottom:'2.5px solid #6366f1' }}>
            <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
              {logoSrc
                ? <img src={logoSrc} alt="logo" style={{ width:64, height:64, objectFit:'contain', borderRadius:8 }} />
                : <div style={{ width:58, height:58, background:'linear-gradient(135deg,#6366f1,#818cf8)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:900, fontSize:22, fontFamily:'Syne,sans-serif', flexShrink:0 }}>
                    {(quotation.company_name||'Q').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()}
                  </div>
              }
              <div>
                <div style={{ fontSize:22, fontWeight:900, color:'#1a1830', fontFamily:'Syne,sans-serif', letterSpacing:'-0.02em', lineHeight:1.1, marginBottom:3 }}>
                  {(quotation.company_name || 'Company Name').toUpperCase()}
                </div>
                {settings?.company_address && <div style={{ fontSize:10, color:'#555', maxWidth:340, lineHeight:1.5 }}>{settings.company_address}</div>}
                {settings?.company_phone   && <div style={{ fontSize:10, color:'#555', marginTop:1 }}>📞 {settings.company_phone}</div>}
              </div>
            </div>
            <div style={{ textAlign:'right', minWidth:160 }}>
              <div style={{ fontSize:13, fontWeight:800, letterSpacing:'0.18em', color:'#6366f1', fontFamily:'Syne,sans-serif', marginBottom:7 }}>QUOTATION</div>
              <table style={{ marginLeft:'auto', borderCollapse:'collapse' }}>
                <tbody>
                  {[
                    ['Quote No:', quotation.quote_number, '#1a1830', 800],
                    ['Date:',      dateFormatted,           '#333',    500],
                    ['Valid Till:', validTill,              '#c97c00',  600],
                  ].map(([lbl, val, color, weight]) => (
                    <tr key={lbl}>
                      <td style={{ color:'#888', paddingRight:8, paddingBottom:3, fontSize:10.5, textAlign:'right', whiteSpace:'nowrap' }}>{lbl}</td>
                      <td style={{ fontWeight:weight, color, fontSize:10.5 }}>{val}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── CUSTOMER ── */}
          <div style={{ marginBottom:11 }}>
            <div style={{ fontSize:8.5, fontWeight:700, letterSpacing:'0.12em', color:'#888', textTransform:'uppercase', marginBottom:4 }}>QUOTATION FOR:</div>
            <div style={{ border:'1px solid #e8e7f5', borderRadius:7, padding:'8px 13px', background:'#fafafa' }}>
              <div style={{ fontSize:15, fontWeight:800, color:'#1a1830', fontFamily:'Syne,sans-serif', marginBottom:2 }}>
                {quotation.customer_name || 'Walk-in Customer'}
              </div>
              <div style={{ display:'flex', gap:20 }}>
                {quotation.customer_mobile  && <span style={{ fontSize:10, color:'#666' }}>📱 {quotation.customer_mobile}</span>}
                {quotation.customer_address && <span style={{ fontSize:10, color:'#666' }}>📍 {quotation.customer_address}</span>}
              </div>
            </div>
          </div>

          {/* ── PRODUCT TABLE ── */}
          <table style={{ width:'100%', borderCollapse:'collapse', marginBottom:12, tableLayout:'fixed' }}>
            <thead>
              <tr style={{ background:'#1a1830' }}>
                {cols.map(c => (
                  <th key={c.key} style={{ padding:'7px 5px', color:'rgba(255,255,255,0.85)', fontSize:9, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', textAlign:c.align, width:c.w==='auto'?undefined:c.w, borderRight:'1px solid rgba(255,255,255,0.08)', whiteSpace:'nowrap' }}>
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(quotation.items || []).map((item, i) => (
                <tr key={i} style={{ background: i%2===0 ? '#fff' : '#f8f7ff', borderBottom:'1px solid #eeecf9' }}>
                  {cols.map(c => (
                    <td key={c.key} style={{ padding:'8px 5px', textAlign:c.align, verticalAlign:'middle', borderRight:'1px solid #eeecf9' }}>
                      {renderCell(c, item, i)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          {/* ── NOTES + TOTALS ── */}
          <div style={{ display:'flex', gap:16, alignItems:'flex-start' }}>
            <div style={{ flex:1 }}>
              {quotation.notes && (
                <div style={{ marginBottom:9 }}>
                  <div style={{ fontSize:8.5, fontWeight:700, letterSpacing:'0.12em', color:'#888', textTransform:'uppercase', marginBottom:4 }}>NOTES</div>
                  <div style={{ fontSize:11, color:'#333', lineHeight:1.5 }}>{quotation.notes}</div>
                </div>
              )}
              {quotation.terms && (
                <div>
                  <div style={{ fontSize:8.5, fontWeight:700, letterSpacing:'0.12em', color:'#888', textTransform:'uppercase', marginBottom:4 }}>TERMS & CONDITIONS</div>
                  <ol style={{ margin:0, paddingLeft:14 }}>
                    {parseTerms(quotation.terms).map((line, i) => {
                      const clean = line.replace(/^\d+\.\s*/,'').trim();
                      const isHigh = (clean === clean.toUpperCase() && clean.length > 4 && /[A-Z]{2}/.test(clean)) || clean.startsWith('**');
                      return (
                        <li key={i} style={{ fontSize:10, marginBottom:2, lineHeight:1.5 }}>
                          <span style={{ color: isHigh ? '#cc0000' : '#444', fontWeight: isHigh ? 800 : 400 }}>
                            {clean.replace(/^\*\*|\*\*$/g,'')}
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              )}
            </div>

            {/* Totals box */}
            <div style={{ minWidth:230 }}>
              <table style={{ width:'100%', borderCollapse:'collapse', border:'1px solid #e8e7f5', borderRadius:8, overflow:'hidden', fontSize:11 }}>
                <tbody>
                  <tr style={{ borderBottom:'1px solid #e8e7f5' }}>
                    <td style={{ padding:'7px 12px', color:'#666' }}>Subtotal</td>
                    <td style={{ padding:'7px 12px', textAlign:'right', fontWeight:600 }}>{currency}{Number(quotation.subtotal||0).toLocaleString('en-IN',{minimumFractionDigits:2})}</td>
                  </tr>
                  {quotation.discount > 0 && (
                    <tr style={{ borderBottom:'1px solid #e8e7f5' }}>
                      <td style={{ padding:'7px 12px', color:'#666' }}>Discount</td>
                      <td style={{ padding:'7px 12px', textAlign:'right', fontWeight:600, color:'#10b981' }}>-{currency}{Number(quotation.discount).toLocaleString('en-IN',{minimumFractionDigits:2})}</td>
                    </tr>
                  )}
                  {quotation.tax > 0 && (
                    <tr style={{ borderBottom:'1px solid #e8e7f5' }}>
                      <td style={{ padding:'7px 12px', color:'#666' }}>{taxLabel} ({quotation.tax_rate}%)</td>
                      <td style={{ padding:'7px 12px', textAlign:'right', fontWeight:600 }}>{currency}{Number(quotation.tax).toLocaleString('en-IN',{minimumFractionDigits:2})}</td>
                    </tr>
                  )}
                  <tr style={{ background:'#1a1830' }}>
                    <td style={{ padding:'10px 12px', color:'white', fontWeight:800, fontSize:13, fontFamily:'Syne,sans-serif' }}>Grand Total</td>
                    <td style={{ padding:'10px 12px', textAlign:'right', color:'white', fontWeight:900, fontSize:14, fontFamily:'Syne,sans-serif' }}>{currency}{Number(quotation.total||0).toLocaleString('en-IN',{minimumFractionDigits:2})}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ── SIGNATURE ── */}
          <div style={{ marginTop:28, paddingTop:12, borderTop:'1px dashed #ccc', display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
            <div style={{ fontSize:8.5, color:'#bbb' }}>Generated by QuoteFlow &nbsp;·&nbsp; {quotation.quote_number}</div>
            <div style={{ textAlign:'center' }}>
              <div style={{ width:170, borderBottom:'1.5px solid #333', marginBottom:4 }}></div>
              <div style={{ fontSize:10, color:'#666', fontWeight:600, letterSpacing:'0.04em' }}>Authorized Signature</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
