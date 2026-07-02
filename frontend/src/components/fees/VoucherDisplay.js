import { useEffect, useRef } from 'react';
import { VoucherSlip } from './VoucherSlip';
import { COLOR_THEME, BW_THEME } from './constants';

export const VoucherDisplay = ({ data, student, colorMode = 'color' }) => {
  const t = colorMode === 'color' ? COLOR_THEME : BW_THEME;
  const today = new Date().toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' });
  const wrapperRef = useRef(null);
  const pageRef = useRef(null);

  // A4 Landscape dimensions in pixels (at 96 DPI)
  const A4_W = 1122;
  const A4_H = 794;

  useEffect(() => {
    function applyScale() {
      if (!wrapperRef.current || !pageRef.current) return;
      const available = wrapperRef.current.offsetWidth;
      const scale = Math.min(1, available / A4_W);
      pageRef.current.style.transform = `scale(${scale})`;
      wrapperRef.current.style.height = `${A4_H * scale}px`;
    }
    applyScale();
    const ro = new ResizeObserver(applyScale);
    if (wrapperRef.current) ro.observe(wrapperRef.current);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={wrapperRef} style={{ width: '100%', position: 'relative', overflow: 'hidden' }}>
      <div
        ref={pageRef}
        style={{
          position: 'absolute', top: 0, left: 0,
          width: A4_W, height: A4_H,
          transformOrigin: 'top left',
          background: '#fff',
          boxShadow: '0 4px 28px rgba(0,0,0,0.18)',
          fontFamily: "'Georgia', 'Times New Roman', serif",
          padding: '18px 22px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Page Heading */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{ flex: 1, height: 1, background: t.divider }} />
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: t.titleText }}>
            Fee Voucher — {data.schoolName || 'School Name'}
          </span>
          <div style={{ flex: 1, height: 1, background: t.divider }} />
        </div>

        {/* 3 Slips Side by Side */}
        <div style={{ display: 'flex', gap: 12, flex: 1, minHeight: 0 }}>
          {['School Copy', 'Bank Copy', 'Student Copy'].map((label) => (
            <VoucherSlip 
              key={label} 
              data={data} 
              student={student} 
              label={label} 
              t={t} 
              today={today} 
            />
          ))}
        </div>

        {/* Cut line */}
        <div style={{ marginTop: 7, display: 'flex', alignItems: 'center', gap: 5, opacity: 0.35 }}>
          <span style={{ fontSize: 9 }}>✂</span>
          <div style={{ flex: 1, borderTop: '1px dashed #aaa' }} />
          <span style={{ fontSize: 7, letterSpacing: '0.08em', textTransform: 'uppercase' }}>cut here</span>
          <div style={{ flex: 1, borderTop: '1px dashed #aaa' }} />
          <span style={{ fontSize: 9 }}>✂</span>
        </div>
      </div>
    </div>
  );
};