-- 1. Đảm bảo cột restaurant_revenue_amount đã tồn tại
IF COL_LENGTH('dbo.invoices', 'restaurant_revenue_amount') IS NULL
BEGIN
ALTER TABLE [dbo].[invoices] ADD [restaurant_revenue_amount] [numeric](38, 2) NULL;
END
GO

-- 2. Cập nhật LẠI TOÀN BỘ doanh thu cho chuẩn xác
-- Công thức: Doanh thu = Tiền khách thực trả (final_amount) - Tiền VAT (10% của tổng tiền hàng total_amount)
UPDATE i
SET [restaurant_revenue_amount] = ROUND(
    i.[final_amount] - (o.[total_amount] * 0.10),
    0
    )
FROM [dbo].[invoices] i
    JOIN [dbo].[orders] o ON o.[order_id] = i.[order_id];
GO

-- 3. Set NOT NULL sau khi đã đảm bảo mọi dòng đều có dữ liệu
ALTER TABLE [dbo].[invoices]
ALTER COLUMN [restaurant_revenue_amount] [numeric](38, 2) NOT NULL;
GO