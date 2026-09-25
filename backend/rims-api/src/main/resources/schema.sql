-- =========================================================================
-- RIMS — lược đồ cơ sở dữ liệu (SQL Server)
-- =========================================================================
--
-- File này là NGUỒN THẬT của lược đồ. Hibernate chỉ còn đối chiếu
-- (ddl-auto: validate), không tự tạo và không tự sửa bảng nữa.
--
-- VÌ SAO ĐỔI: ddl-auto: update im lặng bỏ qua những thay đổi nó không làm
-- được. Đợt thêm cột must_change_password vừa rồi là ví dụ: SQL Server từ
-- chối thêm cột NOT NULL vào bảng đã có dòng, Hibernate ghi một dòng WARN
-- rồi đi tiếp, ứng dụng khởi động bình thường, và mọi truy vấn bảng users
-- đều lỗi. Với validate thì ứng dụng dừng ngay lúc khởi động và nói rõ chỗ
-- lệch.
--
-- Nội dung dưới đây SINH TỪ CHÍNH CÁC ENTITY (jakarta.persistence
-- schema-generation), rồi bọc thêm điều kiện tồn tại. Không gõ tay, nên
-- không thể lệch với entity.
--
-- CHẠY LẠI ĐƯỢC NHIỀU LẦN: mọi câu đều kiểm tra trước khi tạo, nên khởi
-- động lần thứ hai không lỗi và không mất dữ liệu.
--
-- Đổi entity thì phải cập nhật file này. Cách sinh lại:
--   thêm tạm vào application.yaml, mục spring.jpa.properties:
--     jakarta.persistence.schema-generation.scripts.action: create
--     jakarta.persistence.schema-generation.scripts.create-target: target/generated-schema.sql
--   chạy app một lần, rồi bọc lại theo đúng dạng dưới đây.
-- =========================================================================

-- ---------- Bảng ----------

IF OBJECT_ID(N'dbo.categories', N'U') IS NULL
create table categories (category_id int identity not null, is_available bit default 1 not null, created_at datetime2(7) not null, updated_at datetime2(7) not null, name nvarchar(50) not null, description nvarchar(100), primary key (category_id));

IF OBJECT_ID(N'dbo.dishes', N'U') IS NULL
create table dishes (category_id int not null, dish_id int identity not null, is_available bit not null, is_hidden bit not null, price int not null, created_at datetime2(7) not null, updated_at datetime2(7) not null, name nvarchar(50) not null, description nvarchar(100), image_url varchar(500), primary key (dish_id));

IF OBJECT_ID(N'dbo.invoices', N'U') IS NULL
create table invoices (customer_id int, final_amount numeric(38,2) not null, points_earned_on_invoice int, points_used_on_invoice int, restaurant_revenue_amount numeric(38,2), invoice_date datetime2(7) not null, invoice_id bigint identity not null, order_id bigint not null, primary key (invoice_id));

IF OBJECT_ID(N'dbo.order_items', N'U') IS NULL
create table order_items (dish_id int not null, quantity int not null, sub_total numeric(38,2) not null, unit_price numeric(38,2) not null, cancel_requested_at datetime2(7), chef_internal_note_acknowledged_at datetime2(7), chef_internal_note_created_at datetime2(7), created_at datetime2(7) not null, order_id bigint not null, order_item_id bigint identity not null, updated_at datetime2(7) not null, dish_name_snapshot nvarchar(50) not null, cancel_reason nvarchar(100), chef_internal_note nvarchar(100), note nvarchar(100), status varchar(255) not null check ((status in ('PREPARING','COMPLETED','CANCELLED'))), primary key (order_item_id));

IF OBJECT_ID(N'dbo.orders', N'U') IS NULL
create table orders (created_by int not null, pending_customer_id int, pending_points_used int, table_id int not null, total_amount numeric(38,2) not null, created_at datetime2(7) not null, locked_at datetime2(7), order_id bigint identity not null, status varchar(255) not null check ((status in ('SERVING','LOCKED','COMPLETED'))), primary key (order_id));

IF OBJECT_ID(N'dbo.payment_transaction', N'U') IS NULL
create table payment_transaction (is_success bit not null, payment_id bigint not null, transaction_date datetime2(7) not null, transaction_id bigint identity not null, gateway varchar(255), transaction_code varchar(255) not null, gateway_response varchar(max) not null, primary key (transaction_id));

IF OBJECT_ID(N'dbo.payments', N'U') IS NULL
create table payments (amount numeric(38,2) not null, is_success bit not null, invoice_id bigint not null, payment_date datetime2(7) not null, payment_id bigint identity not null, payment_method varchar(255) not null check ((payment_method in ('CASH','QRCODE'))), primary key (payment_id));

IF OBJECT_ID(N'dbo.reservations', N'U') IS NULL
create table reservations (table_id int, user_id int, created_at datetime2(7) not null, reservation_id bigint identity not null, reservation_time datetime2(7), updated_at datetime2(7) not null, phone varchar(10) not null, customer_name nvarchar(50) not null, note nvarchar(100), status varchar(255) check ((status in ('QUEUED','WAITING','COMPLETED','CANCELLED'))), primary key (reservation_id));

IF OBJECT_ID(N'dbo.restaurant_profile', N'U') IS NULL
create table restaurant_profile (id int identity not null, updated_at datetime2(7) not null, phone nvarchar(30), email nvarchar(120), name nvarchar(120) not null, opening_hours nvarchar(120), address nvarchar(200), tagline nvarchar(200), hero_image_url nvarchar(500), logo_url nvarchar(500), description nvarchar(2000), primary key (id));

IF OBJECT_ID(N'dbo.restaurant_tables', N'U') IS NULL
create table restaurant_tables (active bit not null, capacity int, table_id int identity not null, created_at datetime2(7) not null, updated_at datetime2(7) not null, status varchar(255) check ((status in ('AVAILABLE','RESERVED','SERVING'))), table_number varchar(255) not null, primary key (table_id));

IF OBJECT_ID(N'dbo.revoked_tokens', N'U') IS NULL
create table revoked_tokens (expires_at datetime2(7), revoked_at datetime2(7), jti varchar(255) not null, primary key (jti));

IF OBJECT_ID(N'dbo.users', N'U') IS NULL
create table users (is_active bit not null, must_change_password bit default 0 not null, reward_points int not null, user_id int identity not null, created_at datetime2(7) not null, updated_at datetime2(7) not null, phone varchar(10) not null, role varchar(10) not null check ((role in ('ADMIN','CHEF','WAITER','CASHIER','CUSTOMER'))), email varchar(50) not null, full_name nvarchar(50) not null, username varchar(50) not null, password_hash varchar(255) not null, primary key (user_id));

-- ---------- Chuyển cột đã có sang NOT NULL ----------
--
-- Câu create table ở trên chỉ chạy khi bảng chưa tồn tại, nên CSDL đang chạy
-- sẽ không nhận thay đổi nào từ nó. Những cột đổi ràng buộc về sau phải có
-- một câu ALTER riêng, viết sao cho chạy lại nhiều lần không lỗi.
--
-- users.email: trước đây cho phép để trống, giờ bắt buộc. Nó là đường lấy lại
-- mật khẩu duy nhất của tài khoản — OTP chỉ gửi qua email, vì tin nhắn
-- thương hiệu đòi giấy phép kinh doanh.

-- MỖI CÂU TRONG FILE NÀY PHẢI LÀ MỘT CÂU, VỚI ĐÚNG MỘT DẤU CHẤM PHẨY Ở CUỐI.
-- Spring cắt file theo dấu chấm phẩy rồi gửi từng mảnh sang JDBC, kể cả dấu
-- chấm phẩy nằm trong chuỗi hay trong khối BEGIN...END. Viết một khối nhiều
-- câu ở đây thì nó bị cắt đôi giữa chừng và lỗi cú pháp.
--
-- Còn tài khoản nào email trống thì câu dưới đây thất bại và ứng dụng dừng
-- lúc khởi động. Đó là ý muốn. Cách xử lý:
--     SELECT user_id, username FROM users WHERE email IS NULL
-- điền email cho những tài khoản đó rồi khởi động lại.
-- SQL Server từ chối ALTER một cột đang có chỉ số duy nhất dựa vào nó, nên
-- phải gỡ chỉ số trước rồi mới đổi cột. Tên chỉ số không đoán được: CSDL dựng
-- bằng ddl-auto: update mang tên Hibernate băm ra (UK6dotkott...), CSDL dựng
-- bằng file này mang tên ix_users_email. Vì vậy phải tra tên theo cột rồi
-- dựng câu lệnh động.
--
-- Không tạo lại chỉ số ở đây — câu create unique index ở cuối file lo việc đó,
-- và nó cũng hỏi theo cột nên sau khi gỡ là nó tạo lại.
IF EXISTS (SELECT 1 FROM sys.columns
           WHERE object_id = OBJECT_ID(N'dbo.users') AND name = N'email' AND is_nullable = 1)
EXEC sp_executesql N'DECLARE @ten sysname, @sql nvarchar(400);
SELECT TOP 1 @ten = i.name
FROM sys.indexes i
JOIN sys.index_columns ic ON ic.object_id = i.object_id AND ic.index_id = i.index_id
JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
WHERE i.object_id = OBJECT_ID(N''dbo.users'') AND i.is_unique = 1
  AND i.is_primary_key = 0 AND c.name = N''email'';
IF @ten IS NOT NULL
BEGIN
  IF EXISTS (SELECT 1 FROM sys.key_constraints
             WHERE parent_object_id = OBJECT_ID(N''dbo.users'') AND name = @ten)
    SET @sql = N''ALTER TABLE users DROP CONSTRAINT '' + QUOTENAME(@ten);
  ELSE
    SET @sql = N''DROP INDEX '' + QUOTENAME(@ten) + N'' ON users'';
  EXEC sp_executesql @sql;
END;
ALTER TABLE users ALTER COLUMN email varchar(50) NOT NULL;';

-- ---------- Ràng buộc duy nhất và khoá ngoại ----------
--
-- Điều kiện dưới đây hỏi theo CỘT chứ không theo TÊN ràng buộc. Lý do: những
-- CSDL dựng bằng ddl-auto: update trước đây mang tên do Hibernate băm ra
-- (UKt8o6piv...). Hỏi theo tên thì tên mới không thấy, và SQL Server vui vẻ
-- thêm ràng buộc thứ hai lên đúng cột đó — một chỉ số duy nhất thừa, hoặc một
-- khoá ngoại thừa, không báo lỗi gì cả. Hỏi theo cột thì đúng một ràng buộc
-- tồn tại dù nó tên gì.

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes i
    JOIN sys.index_columns ic ON ic.object_id = i.object_id AND ic.index_id = i.index_id
    JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
    WHERE i.object_id = OBJECT_ID(N'dbo.categories') AND i.is_unique = 1 AND c.name = N'name')
alter table categories add constraint uk_categories_name unique (name);

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes i
    JOIN sys.index_columns ic ON ic.object_id = i.object_id AND ic.index_id = i.index_id
    JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
    WHERE i.object_id = OBJECT_ID(N'dbo.dishes') AND i.is_unique = 1 AND c.name = N'name')
alter table dishes add constraint uk_dishes_name unique (name);

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes i
    JOIN sys.index_columns ic ON ic.object_id = i.object_id AND ic.index_id = i.index_id
    JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
    WHERE i.object_id = OBJECT_ID(N'dbo.invoices') AND i.is_unique = 1 AND c.name = N'order_id')
alter table invoices add constraint uk_invoices_order unique (order_id);

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes i
    JOIN sys.index_columns ic ON ic.object_id = i.object_id AND ic.index_id = i.index_id
    JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
    WHERE i.object_id = OBJECT_ID(N'dbo.restaurant_tables') AND i.is_unique = 1 AND c.name = N'table_number')
alter table restaurant_tables add constraint uk_restaurant_tables_number unique (table_number);

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes i
    JOIN sys.index_columns ic ON ic.object_id = i.object_id AND ic.index_id = i.index_id
    JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
    WHERE i.object_id = OBJECT_ID(N'dbo.users') AND i.is_unique = 1 AND c.name = N'phone')
alter table users add constraint uk_users_phone unique (phone);

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes i
    JOIN sys.index_columns ic ON ic.object_id = i.object_id AND ic.index_id = i.index_id
    JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
    WHERE i.object_id = OBJECT_ID(N'dbo.users') AND i.is_unique = 1 AND c.name = N'username')
alter table users add constraint uk_users_username unique (username);

IF NOT EXISTS (
    SELECT 1 FROM sys.foreign_key_columns fkc
    JOIN sys.columns c ON c.object_id = fkc.parent_object_id AND c.column_id = fkc.parent_column_id
    WHERE fkc.parent_object_id = OBJECT_ID(N'dbo.dishes') AND c.name = N'category_id')
alter table dishes add constraint fk_dishes_category foreign key (category_id) references categories;

IF NOT EXISTS (
    SELECT 1 FROM sys.foreign_key_columns fkc
    JOIN sys.columns c ON c.object_id = fkc.parent_object_id AND c.column_id = fkc.parent_column_id
    WHERE fkc.parent_object_id = OBJECT_ID(N'dbo.invoices') AND c.name = N'customer_id')
alter table invoices add constraint fk_invoices_customer foreign key (customer_id) references users;

IF NOT EXISTS (
    SELECT 1 FROM sys.foreign_key_columns fkc
    JOIN sys.columns c ON c.object_id = fkc.parent_object_id AND c.column_id = fkc.parent_column_id
    WHERE fkc.parent_object_id = OBJECT_ID(N'dbo.invoices') AND c.name = N'order_id')
alter table invoices add constraint uk_invoices_order foreign key (order_id) references orders;

IF NOT EXISTS (
    SELECT 1 FROM sys.foreign_key_columns fkc
    JOIN sys.columns c ON c.object_id = fkc.parent_object_id AND c.column_id = fkc.parent_column_id
    WHERE fkc.parent_object_id = OBJECT_ID(N'dbo.order_items') AND c.name = N'dish_id')
alter table order_items add constraint fk_order_items_dish foreign key (dish_id) references dishes;

IF NOT EXISTS (
    SELECT 1 FROM sys.foreign_key_columns fkc
    JOIN sys.columns c ON c.object_id = fkc.parent_object_id AND c.column_id = fkc.parent_column_id
    WHERE fkc.parent_object_id = OBJECT_ID(N'dbo.order_items') AND c.name = N'order_id')
alter table order_items add constraint fk_order_items_order foreign key (order_id) references orders;

IF NOT EXISTS (
    SELECT 1 FROM sys.foreign_key_columns fkc
    JOIN sys.columns c ON c.object_id = fkc.parent_object_id AND c.column_id = fkc.parent_column_id
    WHERE fkc.parent_object_id = OBJECT_ID(N'dbo.orders') AND c.name = N'created_by')
alter table orders add constraint fk_orders_created_by foreign key (created_by) references users;

IF NOT EXISTS (
    SELECT 1 FROM sys.foreign_key_columns fkc
    JOIN sys.columns c ON c.object_id = fkc.parent_object_id AND c.column_id = fkc.parent_column_id
    WHERE fkc.parent_object_id = OBJECT_ID(N'dbo.orders') AND c.name = N'table_id')
alter table orders add constraint fk_orders_table foreign key (table_id) references restaurant_tables;

IF NOT EXISTS (
    SELECT 1 FROM sys.foreign_key_columns fkc
    JOIN sys.columns c ON c.object_id = fkc.parent_object_id AND c.column_id = fkc.parent_column_id
    WHERE fkc.parent_object_id = OBJECT_ID(N'dbo.payment_transaction') AND c.name = N'payment_id')
alter table payment_transaction add constraint fk_payment_tx_payment foreign key (payment_id) references payments;

IF NOT EXISTS (
    SELECT 1 FROM sys.foreign_key_columns fkc
    JOIN sys.columns c ON c.object_id = fkc.parent_object_id AND c.column_id = fkc.parent_column_id
    WHERE fkc.parent_object_id = OBJECT_ID(N'dbo.payments') AND c.name = N'invoice_id')
alter table payments add constraint fk_payments_invoice foreign key (invoice_id) references invoices;

IF NOT EXISTS (
    SELECT 1 FROM sys.foreign_key_columns fkc
    JOIN sys.columns c ON c.object_id = fkc.parent_object_id AND c.column_id = fkc.parent_column_id
    WHERE fkc.parent_object_id = OBJECT_ID(N'dbo.reservations') AND c.name = N'table_id')
alter table reservations add constraint fk_reservations_table foreign key (table_id) references restaurant_tables;

IF NOT EXISTS (
    SELECT 1 FROM sys.foreign_key_columns fkc
    JOIN sys.columns c ON c.object_id = fkc.parent_object_id AND c.column_id = fkc.parent_column_id
    WHERE fkc.parent_object_id = OBJECT_ID(N'dbo.reservations') AND c.name = N'user_id')
alter table reservations add constraint fk_reservations_user foreign key (user_id) references users;

-- ---------- Chỉ số ----------

IF NOT EXISTS (
    SELECT 1 FROM sys.index_columns ic
    JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
    WHERE ic.object_id = OBJECT_ID(N'dbo.reservations') AND ic.key_ordinal = 1 AND c.name = N'reservation_time')
create index ix_reservations_reservation_time on reservations (reservation_time);

-- Mệnh đề WHERE là dấu vết từ thời email còn được bỏ trống: SQL Server chỉ cho
-- đúng MỘT dòng NULL trong một cột UNIQUE, nên phải lọc các dòng NULL ra.
-- Email giờ là NOT NULL nên mệnh đề này không còn lọc gì, nhưng giữ lại thì
-- vô hại mà bỏ đi lại buộc những CSDL đang chạy phải dựng lại chỉ số.
--
-- Hỏi theo cột: CSDL dựng bằng ddl-auto: update trước đây có một ràng buộc
-- UNIQUE thường trên chính cột này, tên do Hibernate băm ra. Hỏi theo tên thì
-- không thấy nó, và chỉ số lọc sẽ được tạo thành cái thứ hai chồng lên.
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes i
    JOIN sys.index_columns ic ON ic.object_id = i.object_id AND ic.index_id = i.index_id
    JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
    WHERE i.object_id = OBJECT_ID(N'dbo.users') AND i.is_unique = 1 AND c.name = N'email')
create unique nonclustered index ix_users_email on users (email) where email is not null;
