export function VoucherSlip({ data, label, t, today, student }) {
  return (
    <div style={{ 
      flex: '1 1 0', minWidth: 0, 
      border: `1px solid ${t.stripBorder}`, 
      borderRadius: 3, 
      overflow: 'hidden', 
      background: '#fff', 
      display: 'flex', 
      flexDirection: 'column' 
    }}>
      {/* Header */}
      <div style={{ 
        background: t.headerBg, 
        padding: '9px 11px 7px', 
        display: 'flex', alignItems: 'center', gap: 7 
      }}>
        <div style={{ 
          width: 32, height: 32, borderRadius: '50%', 
          border: t.emblemBorder, background: t.emblemBg, 
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          flexShrink: 0, fontSize: 15 
        }}>🏫</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: t.schoolName, fontSize: 10.5, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {data.schoolName || 'School Name'}
          </div>
          <div style={{ color: t.address, fontSize: 8, marginTop: 1.5 }}>
            {data.schoolAddress || 'School Address'}
          </div>
        </div>
        <div style={{ 
          background: t.badgeBg, border: t.badgeBorder, color: t.badgeText, 
          fontSize: 7, fontWeight: 700, padding: '2px 6px', borderRadius: 2, textTransform: 'uppercase' 
        }}>
          {label}
        </div>
      </div>

      {/* Title Strip */}
      <div style={{ background: t.stripBg, borderTop: `1.5px solid ${t.stripBorder}`, borderBottom: `1.5px solid ${t.stripBorder}`, padding: '4px 11px', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 8.5, fontWeight: 700, color: t.titleText }}>FEE VOUCHER</span>
        <span style={{ fontSize: 7.5, color: t.labelText, fontStyle: 'italic' }}>{today}</span>
      </div>

      {/* Student Details */}
      <div style={{ padding: '7px 11px 4px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px 10px' }}>
        {[
          ['Student Name', student?.name || '_______________'],
          ['Class / Section', `${student?.class} | ${student?.section}` || '_______________'],
          ['Roll No.', student?.rollNumber || '_______________'],
          ['Month', student?.month || '_______________'],
        ].map(([lbl, val]) => (
          <div key={lbl} style={{ borderBottom: `1px dashed ${t.dashedLine}`, paddingBottom: 3 }}>
            <span style={{ fontSize: 7, color: t.labelText, display: 'block', textTransform: 'uppercase' }}>{lbl}</span>
            <span style={{ fontSize: 9, color: t.valueText }}>{val}</span>
          </div>
        ))}
      </div>

      {/* Fee Table */}
      <div style={{ padding: '5px 11px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: t.tableHeadBg }}>
              <th style={{ padding: '4px 6px', textAlign: 'left', color: t.tableHeadText, fontSize: 7 }}>Description</th>
              <th style={{ padding: '4px 6px', textAlign: 'right', color: t.tableHeadText, fontSize: 7 }}>PKR</th>
            </tr>
          </thead>
          <tbody>
            {['Tuition Fee', 'Exam Fee', 'Library Fee', 'Other'].map((item, idx) => (
              <tr key={item} style={{ background: idx % 2 === 0 ? '#fff' : t.rowAlt }}>
                <td style={{ padding: '3.5px 6px', borderBottom: `1px solid ${t.rowBorder}`, fontSize: 8 }}>{item}</td>
                <td style={{ padding: '3.5px 6px', borderBottom: `1px solid ${t.rowBorder}`, textAlign: 'right', fontSize: 8 }}>____</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bank Details */}
      <div style={{ padding: '4px 11px 6px', flex: 1 }}>
        <div style={{ fontSize: 7, color: t.labelText, marginBottom: 4 }}>PAY AT</div>
        {data.banks?.map((b, i) => (
          <div key={i} style={{ background: t.bankCardBg, border: `1px solid ${t.bankCardBorder}`, borderRadius: 3, padding: '3px 7px', marginBottom: 3 }}>
            <div style={{ fontSize: 8, fontWeight: 700 }}>{b.bankName}</div>
            <div style={{ fontSize: 7 }}>A/C: {b.account}</div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ background: t.footerBg, padding: '4px 11px', marginTop: 'auto', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ color: t.footerSub, fontSize: 6.5 }}>Due: _______</span>
        <span style={{ color: t.footerMain, fontSize: 6.5 }}>{data.schoolName} © {new Date().getFullYear()}</span>
      </div>
    </div>
  );
}