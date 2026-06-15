package vn.edu.fpt.swp391.g6.rimsapi.service;

import com.lowagie.text.*;
import com.lowagie.text.pdf.BaseFont;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;
import vn.edu.fpt.swp391.g6.rimsapi.entity.Invoice;
import vn.edu.fpt.swp391.g6.rimsapi.entity.OrderItem;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.time.format.DateTimeFormatter;

@Service
public class InvoicePdfService {

    public byte[] generateInvoicePdf(Invoice invoice) {
        Document document = new Document(PageSize.A6, 15, 15, 15, 15);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            // 1. Nạp Font tiếng Việt Times New Roman từ thư mục của bạn
            InputStream fontStream = getClass().getClassLoader().getResourceAsStream("fonts.fonts/times.ttf");
            if (fontStream == null) {
                throw new RuntimeException("Không tìm thấy file! Hãy chắc chắn file times.ttf nằm trong thư mục src/main/resources");
            }
            byte[] fontBytes = fontStream.readAllBytes();
            BaseFont bf = BaseFont.createFont(null, BaseFont.IDENTITY_H, BaseFont.EMBEDDED, true, fontBytes, null);

            Font fontTitle = new Font(bf, 14, Font.BOLD);
            Font fontBold = new Font(bf, 9, Font.BOLD);
            Font fontNormal = new Font(bf, 9, Font.NORMAL);

            // 2. Viết Tiêu đề nhà hàng
            Paragraph restaurantName = new Paragraph("NHÀ HÀNG RIMS SYSTEM", fontTitle);
            restaurantName.setAlignment(Element.ALIGN_CENTER);
            document.add(restaurantName);

            Paragraph address = new Paragraph("Khu Công Nghệ Cao Hòa Lạc, Hà Nội\n", fontNormal);
            address.setAlignment(Element.ALIGN_CENTER);
            document.add(address);

            Paragraph lineSeparator = new Paragraph("----------------------------------------------------------------", fontNormal);
            lineSeparator.setAlignment(Element.ALIGN_CENTER);
            document.add(lineSeparator);

            // 3. Viết Thông tin hóa đơn
            document.add(new Paragraph("Mã hóa đơn: INV-" + invoice.getId(), fontBold));
            String tableName = (invoice.getOrder().getTable() != null) ? invoice.getOrder().getTable().getTableNumber() : "Mang về";
            document.add(new Paragraph("Bàn: " + tableName, fontNormal));

            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");
            document.add(new Paragraph("Ngày in: " + invoice.getInvoiceDate().format(formatter), fontNormal));
            document.add(new Paragraph("\n", fontNormal));

            // 4. Tạo bảng danh sách món ăn
            PdfPTable table = new PdfPTable(3);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{50, 15, 35});

            table.addCell(createCell("Tên món", fontBold, Element.ALIGN_LEFT, false));
            table.addCell(createCell("SL", fontBold, Element.ALIGN_CENTER, false));
            table.addCell(createCell("T.Tiền", fontBold, Element.ALIGN_RIGHT, false));

            for (OrderItem item : invoice.getOrder().getOrderItems()) {
                String dishName = (item.getDish() != null) ? item.getDish().getName() : "Món ăn chưa đặt tên";
                table.addCell(createCell(dishName, fontNormal, Element.ALIGN_LEFT, false));
                table.addCell(createCell(String.valueOf(item.getQuantity()), fontNormal, Element.ALIGN_CENTER, false));
                table.addCell(createCell(String.format("%,.0f đ", item.getSubTotal()), fontNormal, Element.ALIGN_RIGHT, false));
            }
            document.add(table);
            document.add(lineSeparator);

            // 5. Viết Tổng tiền
            PdfPTable totalTable = new PdfPTable(2);
            totalTable.setWidthPercentage(100);
            totalTable.setWidths(new float[]{60, 40});

            totalTable.addCell(createCell("THÀNH TIỀN:", fontBold, Element.ALIGN_LEFT, false));
            totalTable.addCell(createCell(String.format("%,.0f đ", invoice.getFinalAmount()), fontTitle, Element.ALIGN_RIGHT, false));

            document.add(totalTable);
            document.add(new Paragraph("\n", fontNormal));

            Paragraph footer = new Paragraph("CẢM ƠN QUÝ KHÁCH!", fontBold);
            footer.setAlignment(Element.ALIGN_CENTER);
            document.add(footer);

            document.close();
        } catch (Exception e) {
            e.printStackTrace();
        }

        return out.toByteArray();
    }

    private PdfPCell createCell(String text, Font font, int alignment, boolean hasBorder) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setHorizontalAlignment(alignment);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        if (!hasBorder) cell.setBorder(PdfPCell.NO_BORDER);
        cell.setPaddingTop(4);
        cell.setPaddingBottom(4);
        return cell;
    }
}