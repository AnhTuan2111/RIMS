IF COL_LENGTH('dbo.invoices', 'restaurant_revenue_amount') IS NULL
BEGIN
    ALTER TABLE [dbo].[invoices]
    ADD [restaurant_revenue_amount] [numeric](38, 2) NULL;
END
GO

UPDATE i
SET [restaurant_revenue_amount] = ROUND(
    COALESCE(o.[total_amount], i.[final_amount] / CAST(1.10 AS numeric(10, 2))),
    0
)
FROM [dbo].[invoices] i
LEFT JOIN [dbo].[orders] o ON o.[order_id] = i.[order_id]
WHERE i.[restaurant_revenue_amount] IS NULL;
GO

ALTER TABLE [dbo].[invoices]
ALTER COLUMN [restaurant_revenue_amount] [numeric](38, 2) NOT NULL;
GO
