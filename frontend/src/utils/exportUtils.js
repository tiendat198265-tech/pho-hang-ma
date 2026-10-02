// Tiện ích xuất báo cáo doanh thu: Excel, CSV, PDF
export const formatVND = (amount) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
};

export const exportToCSV = (reportData, filterInfo = {}) => {
  if (!reportData) return;
  const { summary = {}, timeline = [], detailedOrders = [] } = reportData;

  const lines = [];
  // UTF-8 BOM so Excel opens Vietnamese characters properly
  lines.push('\uFEFF');
  lines.push('BÁO CÁO DOANH THU - PHỐ HÀNG MÃ');
  lines.push(`Khoảng thời gian: "${filterInfo.label || 'Tất cả'} (${filterInfo.startDate || ''} - ${filterInfo.endDate || ''})"`);
  lines.push(`Thời gian xuất: "${new Date().toLocaleString('vi-VN')}"`);
  lines.push('');
  lines.push('TỔNG QUAN KINH DOANH');
  lines.push(`Tổng doanh thu thực tế,${summary.totalRevenue || 0}`);
  lines.push(`Tổng số đơn hợp lệ,${summary.totalOrders || 0}`);
  lines.push(`Giá trị đơn trung bình (AOV),${Math.round(summary.averageOrderValue || 0)}`);
  lines.push(`Số đơn đã hủy/hoàn (không tính vào doanh thu),${summary.cancelledOrders || 0}`);
  lines.push('');

  lines.push('CHI TIẾT THEO MỐC THỜI GIAN');
  lines.push('Thời gian,Doanh thu (VNĐ),Số đơn,Giá trị trung bình (VNĐ)');
  timeline.forEach((item) => {
    lines.push(`"${item.period}",${item.revenue},${item.orders},${Math.round(item.aov || 0)}`);
  });
  lines.push(`"TỔNG CỘNG",${summary.totalRevenue || 0},${summary.totalOrders || 0},${Math.round(summary.averageOrderValue || 0)}`);
  lines.push('');

  if (detailedOrders.length > 0) {
    lines.push('DANH SÁCH ĐƠN HÀNG CHI TIẾT');
    lines.push('Mã đơn,Ngày đặt,Khách hàng,Số điện thoại,Trạng thái đơn,Thanh toán,Giảm giá (VNĐ),Tổng tiền (VNĐ)');
    detailedOrders.forEach((o) => {
      lines.push(
        `"${o.orderCode}","${new Date(o.createdAt).toLocaleDateString('vi-VN')}","${o.shippingAddress?.fullName || 'Khách vãng lai'}","${o.shippingAddress?.phone || ''}","${o.orderStatus}","${o.paymentStatus}",${o.discount || 0},${o.totalAmount || 0}`
      );
    });
    lines.push(`"TỔNG CUỐI BẢNG",,,,,,,${summary.totalRevenue || 0}`);
  }

  const csvContent = lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Bao_Cao_Doanh_Thu_Pho_Hang_Ma_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToExcel = (reportData, filterInfo = {}) => {
  if (!reportData) return;
  const { summary = {}, timeline = [], detailedOrders = [] } = reportData;

  // Format as Excel XML Spreadsheet 2003 which supports styling, numbers and Vietnamese accents
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Header">
   <Font ss:Bold="1" ss:Size="14" ss:Color="#7f1d1d"/>
  </Style>
  <Style ss:ID="SubHeader">
   <Font ss:Italic="1" ss:Size="10" ss:Color="#555555"/>
  </Style>
  <Style ss:ID="TableHead">
   <Interior ss:Color="#991b1b" ss:Pattern="Solid"/>
   <Font ss:Bold="1" ss:Color="#FFFFFF"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
  </Style>
  <Style ss:ID="TotalRow">
   <Interior ss:Color="#fef2f2" ss:Pattern="Solid"/>
   <Font ss:Bold="1" ss:Color="#991b1b"/>
   <Borders>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="2"/>
   </Borders>
  </Style>
  <Style ss:ID="Currency">
   <NumberFormat ss:Format="#,##0"/>
  </Style>
  <Style ss:ID="CurrencyTotal">
   <Interior ss:Color="#fef2f2" ss:Pattern="Solid"/>
   <Font ss:Bold="1" ss:Color="#991b1b"/>
   <NumberFormat ss:Format="#,##0"/>
   <Borders>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="2"/>
   </Borders>
  </Style>
 </Styles>
 <Worksheet ss:Name="Báo Cáo Doanh Thu">
  <Table>
   <Column ss:Width="160"/>
   <Column ss:Width="140"/>
   <Column ss:Width="140"/>
   <Column ss:Width="140"/>
   <Column ss:Width="140"/>
   <Column ss:Width="140"/>
   <Row>
    <Cell ss:StyleID="Header"><Data ss:Type="String">BÁO CÁO DOANH THU - PHỐ HÀNG MÃ</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="SubHeader"><Data ss:Type="String">Khoảng thời gian: ${filterInfo.label || 'Tất cả'} (${filterInfo.startDate || ''} - ${filterInfo.endDate || ''})</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="SubHeader"><Data ss:Type="String">Thời gian xuất: ${new Date().toLocaleString('vi-VN')}</Data></Cell>
   </Row>
   <Row></Row>
   <Row>
    <Cell ss:StyleID="TableHead"><Data ss:Type="String">Chỉ số kinh doanh</Data></Cell>
    <Cell ss:StyleID="TableHead"><Data ss:Type="String">Giá trị thực tế</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">Tổng doanh thu thực tế</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${summary.totalRevenue || 0}</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">Tổng số đơn thành công</Data></Cell>
    <Cell><Data ss:Type="Number">${summary.totalOrders || 0}</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">Giá trị đơn trung bình (AOV)</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${Math.round(summary.averageOrderValue || 0)}</Data></Cell>
   </Row>
   <Row></Row>
   <Row>
    <Cell ss:StyleID="TableHead"><Data ss:Type="String">Mốc thời gian</Data></Cell>
    <Cell ss:StyleID="TableHead"><Data ss:Type="String">Doanh thu (VNĐ)</Data></Cell>
    <Cell ss:StyleID="TableHead"><Data ss:Type="String">Số lượng đơn</Data></Cell>
    <Cell ss:StyleID="TableHead"><Data ss:Type="String">Giá trị TB (AOV)</Data></Cell>
   </Row>`;

  timeline.forEach((item) => {
    xml += `
   <Row>
    <Cell><Data ss:Type="String">${item.period}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${item.revenue}</Data></Cell>
    <Cell><Data ss:Type="Number">${item.orders}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${Math.round(item.aov || 0)}</Data></Cell>
   </Row>`;
  });

  xml += `
   <Row>
    <Cell ss:StyleID="TotalRow"><Data ss:Type="String">TỔNG CỘNG</Data></Cell>
    <Cell ss:StyleID="CurrencyTotal"><Data ss:Type="Number">${summary.totalRevenue || 0}</Data></Cell>
    <Cell ss:StyleID="TotalRow"><Data ss:Type="Number">${summary.totalOrders || 0}</Data></Cell>
    <Cell ss:StyleID="CurrencyTotal"><Data ss:Type="Number">${Math.round(summary.averageOrderValue || 0)}</Data></Cell>
   </Row>
   <Row></Row>`;

  if (detailedOrders.length > 0) {
    xml += `
   <Row>
    <Cell ss:StyleID="TableHead"><Data ss:Type="String">Mã đơn hàng</Data></Cell>
    <Cell ss:StyleID="TableHead"><Data ss:Type="String">Ngày đặt</Data></Cell>
    <Cell ss:StyleID="TableHead"><Data ss:Type="String">Khách hàng</Data></Cell>
    <Cell ss:StyleID="TableHead"><Data ss:Type="String">Trạng thái đơn</Data></Cell>
    <Cell ss:StyleID="TableHead"><Data ss:Type="String">Thanh toán</Data></Cell>
    <Cell ss:StyleID="TableHead"><Data ss:Type="String">Tổng tiền (VNĐ)</Data></Cell>
   </Row>`;
    detailedOrders.forEach((o) => {
      xml += `
   <Row>
    <Cell><Data ss:Type="String">${o.orderCode}</Data></Cell>
    <Cell><Data ss:Type="String">${new Date(o.createdAt).toLocaleDateString('vi-VN')}</Data></Cell>
    <Cell><Data ss:Type="String">${o.shippingAddress?.fullName || 'Khách vãng lai'}</Data></Cell>
    <Cell><Data ss:Type="String">${o.orderStatus}</Data></Cell>
    <Cell><Data ss:Type="String">${o.paymentStatus}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${o.totalAmount || 0}</Data></Cell>
   </Row>`;
    });

    xml += `
   <Row>
    <Cell ss:StyleID="TotalRow"><Data ss:Type="String">TỔNG CUỐI BẢNG</Data></Cell>
    <Cell ss:StyleID="TotalRow"><Data ss:Type="String"></Data></Cell>
    <Cell ss:StyleID="TotalRow"><Data ss:Type="String"></Data></Cell>
    <Cell ss:StyleID="TotalRow"><Data ss:Type="String"></Data></Cell>
    <Cell ss:StyleID="TotalRow"><Data ss:Type="String"></Data></Cell>
    <Cell ss:StyleID="CurrencyTotal"><Data ss:Type="Number">${summary.totalRevenue || 0}</Data></Cell>
   </Row>`;
  }

  xml += `
  </Table>
 </Worksheet>
</Workbook>`;

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Bao_Cao_Doanh_Thu_Pho_Hang_Ma_${new Date().toISOString().slice(0, 10)}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToPDF = (reportData, filterInfo = {}) => {
  if (!reportData) return;
  const { summary = {}, timeline = [], detailedOrders = [] } = reportData;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Vui lòng cho phép popup trình duyệt để xem và in file PDF báo cáo.');
    return;
  }

  const html = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <title>Báo Cáo Doanh Thu - Phố Hàng Mã</title>
  <style>
    body {
      font-family: 'Roboto', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 20px;
      color: #1f2937;
      background: #fff;
    }
    .header {
      border-bottom: 2px solid #b91c1c;
      padding-bottom: 12px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .brand {
      color: #b91c1c;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: 0.5px;
    }
    .brand-sub {
      font-size: 13px;
      color: #6b7280;
    }
    .report-meta {
      text-align: right;
      font-size: 13px;
      color: #4b5563;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }
    .kpi-card {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 14px;
      background: #fafafa;
    }
    .kpi-title {
      font-size: 13px;
      color: #6b7280;
      margin-bottom: 4px;
    }
    .kpi-value {
      font-size: 20px;
      font-weight: 700;
      color: #b91c1c;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
      font-size: 13px;
    }
    th {
      background: #b91c1c;
      color: #ffffff;
      padding: 10px;
      text-align: left;
    }
    td {
      padding: 9px 10px;
      border-bottom: 1px solid #e5e7eb;
    }
    tr:nth-child(even) td {
      background: #fdf2f2;
    }
    .total-row td {
      font-weight: 700;
      background: #fee2e2 !important;
      color: #991b1b;
      border-top: 2px solid #b91c1c;
      border-bottom: 2px solid #b91c1c;
    }
    .text-right {
      text-align: right;
    }
    .footer {
      margin-top: 30px;
      font-size: 12px;
      color: #9ca3af;
      text-align: center;
      border-top: 1px solid #e5e7eb;
      padding-top: 10px;
    }
    @media print {
      body { margin: 10mm; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">🏮 QUẢN TRỊ PHỐ HÀNG MÃ</div>
      <div class="brand-sub">Báo Cáo Doanh Thu Thực Tế Hệ Thống Đồ Mã Truyền Thống</div>
    </div>
    <div class="report-meta">
      <div><strong>Khoảng thời gian:</strong> ${filterInfo.label || 'Tùy chỉnh'}</div>
      <div><strong>Thời gian xuất:</strong> ${new Date().toLocaleString('vi-VN')}</div>
    </div>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-title">Tổng Doanh Thu Thực Tế</div>
      <div class="kpi-value">${formatVND(summary.totalRevenue || 0)}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">Tổng Số Đơn Thành Công</div>
      <div class="kpi-value">${summary.totalOrders || 0} đơn</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">Giá Trị Đơn Trung Bình (AOV)</div>
      <div class="kpi-value">${formatVND(Math.round(summary.averageOrderValue || 0))}</div>
    </div>
  </div>

  <h3>Chi Tiết Doanh Thu Theo Mốc Thời Gian</h3>
  <table>
    <thead>
      <tr>
        <th>Mốc thời gian</th>
        <th class="text-right">Doanh thu</th>
        <th class="text-right">Số đơn</th>
        <th class="text-right">Giá trị TB (AOV)</th>
      </tr>
    </thead>
    <tbody>
      ${timeline
        .map(
          (t) => `
        <tr>
          <td><strong>${t.period}</strong></td>
          <td class="text-right">${formatVND(t.revenue)}</td>
          <td class="text-right">${t.orders}</td>
          <td class="text-right">${formatVND(Math.round(t.aov || 0))}</td>
        </tr>
      `
        )
        .join('')}
      <tr class="total-row">
        <td>TỔNG CỘNG</td>
        <td class="text-right">${formatVND(summary.totalRevenue || 0)}</td>
        <td class="text-right">${summary.totalOrders || 0}</td>
        <td class="text-right">${formatVND(Math.round(summary.averageOrderValue || 0))}</td>
      </tr>
    </tbody>
  </table>

  ${
    detailedOrders.length > 0
      ? `
  <h3>Danh Sách Đơn Hàng Thành Công Chi Tiết</h3>
  <table>
    <thead>
      <tr>
        <th>Mã đơn</th>
        <th>Ngày đặt</th>
        <th>Khách hàng</th>
        <th>Trạng thái</th>
        <th>Thanh toán</th>
        <th class="text-right">Tổng tiền</th>
      </tr>
    </thead>
    <tbody>
      ${detailedOrders
        .map(
          (o) => `
        <tr>
          <td><strong>${o.orderCode}</strong></td>
          <td>${new Date(o.createdAt).toLocaleDateString('vi-VN')}</td>
          <td>${o.shippingAddress?.fullName || 'Khách vãng lai'}</td>
          <td>${o.orderStatus}</td>
          <td>${o.paymentStatus}</td>
          <td class="text-right">${formatVND(o.totalAmount || 0)}</td>
        </tr>
      `
        )
        .join('')}
      <tr class="total-row">
        <td colspan="5">TỔNG CUỐI BẢNG</td>
        <td class="text-right">${formatVND(summary.totalRevenue || 0)}</td>
      </tr>
    </tbody>
  </table>
  `
      : ''
  }

  <div class="footer">
    Hệ Thống Quản Trị Phố Hàng Mã — Di sản thủ công Thăng Long Hà Nội. In lúc ${new Date().toLocaleString('vi-VN')}
  </div>

  <script>
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>
`;

  printWindow.document.write(html);
  printWindow.document.close();
};
