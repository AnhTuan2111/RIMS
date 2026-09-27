-- =========================================================================
-- RIMS — dữ liệu khởi tạo
-- =========================================================================
--
-- Thay cho DatabaseSeeder (997 dòng Java, chỉ chạy ở profile "dev"). Dữ liệu
-- khởi tạo là DỮ LIỆU, không phải mã nguồn: để trong SQL thì sửa được bằng
-- công cụ CSDL, xem được diff, và không phải build lại app.
--
-- CHẠY LẠI ĐƯỢC NHIỀU LẦN: mọi câu INSERT đều kết bằng
-- ON CONFLICT (<cột duy nhất>) DO NOTHING, nên khởi động lần thứ hai không lỗi
-- và không ghi đè gì. Cột nêu trong ON CONFLICT phải có ràng buộc duy nhất
-- trong schema.sql — nếu không, PostgreSQL từ chối cả câu lệnh.
--
-- KHÔNG CÓ TÀI KHOẢN NÀO Ở ĐÂY. Commit một hash mật khẩu admin vào repo
-- nghĩa là ai chạm được app cũng đăng nhập được trước chủ quán. Tài khoản
-- quản trị đầu tiên do BootstrapAdmin tạo, mật khẩu lấy từ biến môi trường
-- RIMS_ADMIN_PASSWORD và bắt đổi ngay lần đăng nhập đầu.
--
-- Hồ sơ nhà hàng cũng không nằm ở đây — nó đọc từ app.restaurant.* trong
-- application.yaml, xem RestaurantProfileServiceImpl.
-- =========================================================================

-- ---------- Bàn ----------

INSERT INTO restaurant_tables (table_number, capacity, status, active, created_at, updated_at)
VALUES ('B01', 2, 'AVAILABLE', true, LOCALTIMESTAMP, LOCALTIMESTAMP)
ON CONFLICT (table_number) DO NOTHING;

INSERT INTO restaurant_tables (table_number, capacity, status, active, created_at, updated_at)
VALUES ('B02', 2, 'AVAILABLE', true, LOCALTIMESTAMP, LOCALTIMESTAMP)
ON CONFLICT (table_number) DO NOTHING;

INSERT INTO restaurant_tables (table_number, capacity, status, active, created_at, updated_at)
VALUES ('B03', 2, 'AVAILABLE', true, LOCALTIMESTAMP, LOCALTIMESTAMP)
ON CONFLICT (table_number) DO NOTHING;

INSERT INTO restaurant_tables (table_number, capacity, status, active, created_at, updated_at)
VALUES ('B04', 2, 'AVAILABLE', true, LOCALTIMESTAMP, LOCALTIMESTAMP)
ON CONFLICT (table_number) DO NOTHING;

INSERT INTO restaurant_tables (table_number, capacity, status, active, created_at, updated_at)
VALUES ('B05', 4, 'AVAILABLE', true, LOCALTIMESTAMP, LOCALTIMESTAMP)
ON CONFLICT (table_number) DO NOTHING;

INSERT INTO restaurant_tables (table_number, capacity, status, active, created_at, updated_at)
VALUES ('B06', 4, 'AVAILABLE', true, LOCALTIMESTAMP, LOCALTIMESTAMP)
ON CONFLICT (table_number) DO NOTHING;

INSERT INTO restaurant_tables (table_number, capacity, status, active, created_at, updated_at)
VALUES ('B07', 4, 'AVAILABLE', true, LOCALTIMESTAMP, LOCALTIMESTAMP)
ON CONFLICT (table_number) DO NOTHING;

INSERT INTO restaurant_tables (table_number, capacity, status, active, created_at, updated_at)
VALUES ('B08', 4, 'AVAILABLE', true, LOCALTIMESTAMP, LOCALTIMESTAMP)
ON CONFLICT (table_number) DO NOTHING;

INSERT INTO restaurant_tables (table_number, capacity, status, active, created_at, updated_at)
VALUES ('B09', 4, 'AVAILABLE', true, LOCALTIMESTAMP, LOCALTIMESTAMP)
ON CONFLICT (table_number) DO NOTHING;

INSERT INTO restaurant_tables (table_number, capacity, status, active, created_at, updated_at)
VALUES ('B10', 4, 'AVAILABLE', true, LOCALTIMESTAMP, LOCALTIMESTAMP)
ON CONFLICT (table_number) DO NOTHING;

INSERT INTO restaurant_tables (table_number, capacity, status, active, created_at, updated_at)
VALUES ('B11', 6, 'AVAILABLE', true, LOCALTIMESTAMP, LOCALTIMESTAMP)
ON CONFLICT (table_number) DO NOTHING;

INSERT INTO restaurant_tables (table_number, capacity, status, active, created_at, updated_at)
VALUES ('B12', 6, 'AVAILABLE', true, LOCALTIMESTAMP, LOCALTIMESTAMP)
ON CONFLICT (table_number) DO NOTHING;

INSERT INTO restaurant_tables (table_number, capacity, status, active, created_at, updated_at)
VALUES ('B13', 6, 'AVAILABLE', true, LOCALTIMESTAMP, LOCALTIMESTAMP)
ON CONFLICT (table_number) DO NOTHING;

INSERT INTO restaurant_tables (table_number, capacity, status, active, created_at, updated_at)
VALUES ('B14', 6, 'AVAILABLE', true, LOCALTIMESTAMP, LOCALTIMESTAMP)
ON CONFLICT (table_number) DO NOTHING;


-- ---------- Danh mục ----------

INSERT INTO categories (name, description, is_available, created_at, updated_at)
VALUES ('Sashimi', 'Cá sống thái lát, phục vụ cùng wasabi và củ cải bào.', true, LOCALTIMESTAMP, LOCALTIMESTAMP)
ON CONFLICT (name) DO NOTHING;

INSERT INTO categories (name, description, is_available, created_at, updated_at)
VALUES ('Sushi & Maki', 'Cơm giấm cuộn hoặc nắm, làm theo từng phần.', true, LOCALTIMESTAMP, LOCALTIMESTAMP)
ON CONFLICT (name) DO NOTHING;

INSERT INTO categories (name, description, is_available, created_at, updated_at)
VALUES ('Ramen & Mì', 'Nước dùng ninh trong ngày, mì làm tươi.', true, LOCALTIMESTAMP, LOCALTIMESTAMP)
ON CONFLICT (name) DO NOTHING;

INSERT INTO categories (name, description, is_available, created_at, updated_at)
VALUES ('Tempura', 'Chiên bột mỏng, dùng nóng cùng nước chấm tentsuyu.', true, LOCALTIMESTAMP, LOCALTIMESTAMP)
ON CONFLICT (name) DO NOTHING;

INSERT INTO categories (name, description, is_available, created_at, updated_at)
VALUES ('Yakitori & Nướng', 'Nướng than, xiên tre, quết sốt tare.', true, LOCALTIMESTAMP, LOCALTIMESTAMP)
ON CONFLICT (name) DO NOTHING;

INSERT INTO categories (name, description, is_available, created_at, updated_at)
VALUES ('Donburi & Cơm', 'Cơm Nhật, phần một người.', true, LOCALTIMESTAMP, LOCALTIMESTAMP)
ON CONFLICT (name) DO NOTHING;

INSERT INTO categories (name, description, is_available, created_at, updated_at)
VALUES ('Khai vị', 'Món nhỏ dùng đầu bữa.', true, LOCALTIMESTAMP, LOCALTIMESTAMP)
ON CONFLICT (name) DO NOTHING;

INSERT INTO categories (name, description, is_available, created_at, updated_at)
VALUES ('Tráng miệng', 'Đồ ngọt Nhật, làm trong ngày.', true, LOCALTIMESTAMP, LOCALTIMESTAMP)
ON CONFLICT (name) DO NOTHING;

INSERT INTO categories (name, description, is_available, created_at, updated_at)
VALUES ('Đồ uống', 'Nước và trà phục vụ tại quán.', true, LOCALTIMESTAMP, LOCALTIMESTAMP)
ON CONFLICT (name) DO NOTHING;


-- ---------- Món ăn ----------

-- Sashimi
INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, 'Sashimi cá hồi', 'Phi lê cá hồi Na Uy thái dày, 8 lát.', 189000, 'sashimi-ca-hoi.jpg', true, false, LOCALTIMESTAMP, LOCALTIMESTAMP
FROM categories WHERE name = 'Sashimi'
ON CONFLICT (name) DO NOTHING;

INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, 'Sashimi cá ngừ đại dương', 'Phần lưng cá ngừ, thái 8 lát.', 229000, 'sashimi-ca-ngu.jpg', true, false, LOCALTIMESTAMP, LOCALTIMESTAMP
FROM categories WHERE name = 'Sashimi'
ON CONFLICT (name) DO NOTHING;

INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, 'Sashimi cá cam Hamachi', 'Cá cam Nhật, vị béo nhẹ, 8 lát.', 249000, 'sashimi-hamachi.jpg', true, false, LOCALTIMESTAMP, LOCALTIMESTAMP
FROM categories WHERE name = 'Sashimi'
ON CONFLICT (name) DO NOTHING;

INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, 'Sashimi bạch tuộc', 'Bạch tuộc chần, thái mỏng, 8 lát.', 159000, 'sashimi-bach-tuoc.jpg', true, false, LOCALTIMESTAMP, LOCALTIMESTAMP
FROM categories WHERE name = 'Sashimi'
ON CONFLICT (name) DO NOTHING;

INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, 'Sashimi tổng hợp', 'Năm loại cá theo ngày, 15 lát.', 389000, 'sashimi-tong-hop.jpg', true, false, LOCALTIMESTAMP, LOCALTIMESTAMP
FROM categories WHERE name = 'Sashimi'
ON CONFLICT (name) DO NOTHING;


-- Sushi & Maki
INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, 'Nigiri cá hồi', 'Hai miếng, cơm giấm nắm tay.', 79000, 'nigiri-ca-hoi.jpg', true, false, LOCALTIMESTAMP, LOCALTIMESTAMP
FROM categories WHERE name = 'Sushi & Maki'
ON CONFLICT (name) DO NOTHING;

INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, 'Nigiri lươn nướng', 'Lươn nướng sốt kabayaki, hai miếng.', 99000, 'nigiri-luon.jpg', true, false, LOCALTIMESTAMP, LOCALTIMESTAMP
FROM categories WHERE name = 'Sushi & Maki'
ON CONFLICT (name) DO NOTHING;

INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, 'Maki cá ngừ cay', 'Cuộn cá ngừ trộn sốt cay, 8 miếng.', 129000, 'maki-ca-ngu-cay.jpg', true, false, LOCALTIMESTAMP, LOCALTIMESTAMP
FROM categories WHERE name = 'Sushi & Maki'
ON CONFLICT (name) DO NOTHING;

INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, 'California maki', 'Cua, bơ, dưa leo, trứng cá tobiko, 8 miếng.', 139000, 'california-maki.jpg', true, false, LOCALTIMESTAMP, LOCALTIMESTAMP
FROM categories WHERE name = 'Sushi & Maki'
ON CONFLICT (name) DO NOTHING;

INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, 'Futomaki chay', 'Cuộn dày nhân rau củ và trứng, 8 miếng.', 109000, 'futomaki-chay.jpg', true, false, LOCALTIMESTAMP, LOCALTIMESTAMP
FROM categories WHERE name = 'Sushi & Maki'
ON CONFLICT (name) DO NOTHING;


-- Ramen & Mì
INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, 'Tonkotsu ramen', 'Nước dùng xương heo ninh 12 tiếng, thịt chashu.', 159000, 'tonkotsu-ramen.jpg', true, false, LOCALTIMESTAMP, LOCALTIMESTAMP
FROM categories WHERE name = 'Ramen & Mì'
ON CONFLICT (name) DO NOTHING;

INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, 'Shoyu ramen', 'Nước dùng gà và tương đậu nành, trứng lòng đào.', 145000, 'shoyu-ramen.jpg', true, false, LOCALTIMESTAMP, LOCALTIMESTAMP
FROM categories WHERE name = 'Ramen & Mì'
ON CONFLICT (name) DO NOTHING;

INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, 'Miso ramen', 'Nước dùng miso đỏ, bắp và măng chua.', 149000, 'miso-ramen.jpg', true, false, LOCALTIMESTAMP, LOCALTIMESTAMP
FROM categories WHERE name = 'Ramen & Mì'
ON CONFLICT (name) DO NOTHING;

INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, 'Mì udon nước', 'Udon sợi to trong nước dashi, chả cá.', 119000, 'udon-nuoc.jpg', true, false, LOCALTIMESTAMP, LOCALTIMESTAMP
FROM categories WHERE name = 'Ramen & Mì'
ON CONFLICT (name) DO NOTHING;

INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, 'Mì soba lạnh', 'Soba kiều mạch, chấm tsuyu, dùng lạnh.', 109000, 'soba-lanh.jpg', true, false, LOCALTIMESTAMP, LOCALTIMESTAMP
FROM categories WHERE name = 'Ramen & Mì'
ON CONFLICT (name) DO NOTHING;


-- Tempura
INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, 'Tempura tôm', 'Bốn con tôm sú, bột tempura giòn.', 139000, 'tempura-tom.jpg', true, false, LOCALTIMESTAMP, LOCALTIMESTAMP
FROM categories WHERE name = 'Tempura'
ON CONFLICT (name) DO NOTHING;

INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, 'Tempura rau củ', 'Khoai lang, bí đỏ, cà tím, ớt chuông.', 99000, 'tempura-rau-cu.jpg', true, false, LOCALTIMESTAMP, LOCALTIMESTAMP
FROM categories WHERE name = 'Tempura'
ON CONFLICT (name) DO NOTHING;

INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, 'Tempura cá bơn', 'Phi lê cá bơn tẩm bột, chiên nhanh.', 159000, 'tempura-ca.jpg', true, false, LOCALTIMESTAMP, LOCALTIMESTAMP
FROM categories WHERE name = 'Tempura'
ON CONFLICT (name) DO NOTHING;

INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, 'Tempura tổng hợp', 'Hai tôm và năm loại rau củ.', 179000, 'tempura-tong-hop.jpg', true, false, LOCALTIMESTAMP, LOCALTIMESTAMP
FROM categories WHERE name = 'Tempura'
ON CONFLICT (name) DO NOTHING;


-- Yakitori & Nướng
INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, 'Yakitori đùi gà', 'Ba xiên thịt đùi và hành boa rô.', 89000, 'yakitori-dui-ga.jpg', true, false, LOCALTIMESTAMP, LOCALTIMESTAMP
FROM categories WHERE name = 'Yakitori & Nướng'
ON CONFLICT (name) DO NOTHING;

INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, 'Yakitori da gà', 'Ba xiên da gà nướng giòn, muối tiêu.', 69000, 'yakitori-da-ga.jpg', true, false, LOCALTIMESTAMP, LOCALTIMESTAMP
FROM categories WHERE name = 'Yakitori & Nướng'
ON CONFLICT (name) DO NOTHING;

INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, 'Cá saba nướng muối', 'Nửa con cá thu Nhật, nướng muối.', 149000, 'saba-nuong-muoi.jpg', true, false, LOCALTIMESTAMP, LOCALTIMESTAMP
FROM categories WHERE name = 'Yakitori & Nướng'
ON CONFLICT (name) DO NOTHING;

INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, 'Bò lưỡi nướng', 'Lưỡi bò thái lát, nướng than, chanh muối.', 199000, 'bo-luoi-nuong.jpg', true, false, LOCALTIMESTAMP, LOCALTIMESTAMP
FROM categories WHERE name = 'Yakitori & Nướng'
ON CONFLICT (name) DO NOTHING;

INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, 'Măng tây cuộn ba chỉ', 'Bốn cuộn, nướng than.', 99000, 'mang-tay-cuon.jpg', true, false, LOCALTIMESTAMP, LOCALTIMESTAMP
FROM categories WHERE name = 'Yakitori & Nướng'
ON CONFLICT (name) DO NOTHING;


-- Donburi & Cơm
INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, 'Cơm cá hồi áp chảo', 'Cá hồi áp chảo, cơm và rong biển.', 149000, 'com-ca-hoi.jpg', true, false, LOCALTIMESTAMP, LOCALTIMESTAMP
FROM categories WHERE name = 'Donburi & Cơm'
ON CONFLICT (name) DO NOTHING;

INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, 'Gyudon bò', 'Bò thái mỏng nấu sốt ngọt mặn, hành tây.', 129000, 'gyudon.jpg', true, false, LOCALTIMESTAMP, LOCALTIMESTAMP
FROM categories WHERE name = 'Donburi & Cơm'
ON CONFLICT (name) DO NOTHING;

INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, 'Katsudon', 'Heo tẩm bột chiên, trứng, sốt dashi.', 139000, 'katsudon.jpg', true, false, LOCALTIMESTAMP, LOCALTIMESTAMP
FROM categories WHERE name = 'Donburi & Cơm'
ON CONFLICT (name) DO NOTHING;

INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, 'Unadon lươn', 'Lươn nướng sốt kabayaki trên cơm.', 239000, 'unadon.jpg', true, false, LOCALTIMESTAMP, LOCALTIMESTAMP
FROM categories WHERE name = 'Donburi & Cơm'
ON CONFLICT (name) DO NOTHING;

INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, 'Chirashi don', 'Cơm giấm phủ cá sống thái hạt lựu.', 219000, 'chirashi-don.jpg', true, false, LOCALTIMESTAMP, LOCALTIMESTAMP
FROM categories WHERE name = 'Donburi & Cơm'
ON CONFLICT (name) DO NOTHING;


-- Khai vị
INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, 'Edamame muối', 'Đậu nành Nhật luộc, rắc muối biển.', 49000, 'edamame.jpg', true, false, LOCALTIMESTAMP, LOCALTIMESTAMP
FROM categories WHERE name = 'Khai vị'
ON CONFLICT (name) DO NOTHING;

INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, 'Gyoza chiên', 'Sáu chiếc, nhân heo và bắp cải.', 89000, 'gyoza-chien.jpg', true, false, LOCALTIMESTAMP, LOCALTIMESTAMP
FROM categories WHERE name = 'Khai vị'
ON CONFLICT (name) DO NOTHING;

INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, 'Chawanmushi', 'Trứng hấp dashi, tôm và nấm.', 79000, 'chawanmushi.jpg', true, false, LOCALTIMESTAMP, LOCALTIMESTAMP
FROM categories WHERE name = 'Khai vị'
ON CONFLICT (name) DO NOTHING;

INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, 'Salad rong biển', 'Rong biển wakame trộn giấm mè.', 69000, 'salad-rong-bien.jpg', true, false, LOCALTIMESTAMP, LOCALTIMESTAMP
FROM categories WHERE name = 'Khai vị'
ON CONFLICT (name) DO NOTHING;

INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, 'Đậu hũ lạnh Hiyayakko', 'Đậu hũ non, gừng bào, hành lá.', 59000, 'hiyayakko.jpg', true, false, LOCALTIMESTAMP, LOCALTIMESTAMP
FROM categories WHERE name = 'Khai vị'
ON CONFLICT (name) DO NOTHING;


-- Tráng miệng
INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, 'Mochi kem', 'Ba viên, vị trà xanh, đậu đỏ và xoài.', 79000, 'mochi-kem.jpg', true, false, LOCALTIMESTAMP, LOCALTIMESTAMP
FROM categories WHERE name = 'Tráng miệng'
ON CONFLICT (name) DO NOTHING;

INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, 'Bánh dorayaki', 'Hai chiếc, nhân đậu đỏ.', 59000, 'dorayaki.jpg', true, false, LOCALTIMESTAMP, LOCALTIMESTAMP
FROM categories WHERE name = 'Tráng miệng'
ON CONFLICT (name) DO NOTHING;

INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, 'Kem trà xanh', 'Matcha Uji, một phần.', 55000, 'kem-tra-xanh.jpg', true, false, LOCALTIMESTAMP, LOCALTIMESTAMP
FROM categories WHERE name = 'Tráng miệng'
ON CONFLICT (name) DO NOTHING;

INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, 'Bánh phô mai Nhật', 'Bông xốp, một lát.', 69000, 'banh-pho-mai-nhat.jpg', true, false, LOCALTIMESTAMP, LOCALTIMESTAMP
FROM categories WHERE name = 'Tráng miệng'
ON CONFLICT (name) DO NOTHING;


-- Đồ uống
INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, 'Trà xanh nóng', 'Sencha, ấm nhỏ.', 35000, 'tra-xanh-nong.jpg', true, false, LOCALTIMESTAMP, LOCALTIMESTAMP
FROM categories WHERE name = 'Đồ uống'
ON CONFLICT (name) DO NOTHING;

INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, 'Trà lúa mạch lạnh', 'Mugicha, ly lớn.', 35000, 'tra-lua-mach.jpg', true, false, LOCALTIMESTAMP, LOCALTIMESTAMP
FROM categories WHERE name = 'Đồ uống'
ON CONFLICT (name) DO NOTHING;

INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, 'Ramune soda', 'Soda Nhật, vị nguyên bản.', 45000, 'ramune.jpg', true, false, LOCALTIMESTAMP, LOCALTIMESTAMP
FROM categories WHERE name = 'Đồ uống'
ON CONFLICT (name) DO NOTHING;

INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, 'Nước suối', 'Chai 500ml.', 20000, 'nuoc-suoi.jpg', true, false, LOCALTIMESTAMP, LOCALTIMESTAMP
FROM categories WHERE name = 'Đồ uống'
ON CONFLICT (name) DO NOTHING;

INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, 'Bia Nhật', 'Chai 330ml.', 65000, 'bia-nhat.jpg', true, false, LOCALTIMESTAMP, LOCALTIMESTAMP
FROM categories WHERE name = 'Đồ uống'
ON CONFLICT (name) DO NOTHING;

-- ---------- Ảnh món cho cơ sở dữ liệu đã có sẵn ----------
--
-- Câu INSERT ở trên có ON CONFLICT DO NOTHING nên một CSDL đang chạy sẽ bỏ
-- qua nó, và món đã tạo từ trước không bao giờ nhận ảnh. Khối này lo phần đó.
--
-- Chỉ điền vào món CHƯA có ảnh. Chủ quán tự tải ảnh khác lên thì lần khởi
-- động sau không bị ghi đè.

UPDATE dishes SET image_url = 'bia-nhat.jpg' WHERE name = 'Bia Nhật' AND image_url IS NULL;
UPDATE dishes SET image_url = 'dorayaki.jpg' WHERE name = 'Bánh dorayaki' AND image_url IS NULL;
UPDATE dishes SET image_url = 'banh-pho-mai-nhat.jpg' WHERE name = 'Bánh phô mai Nhật' AND image_url IS NULL;
UPDATE dishes SET image_url = 'bo-luoi-nuong.jpg' WHERE name = 'Bò lưỡi nướng' AND image_url IS NULL;
UPDATE dishes SET image_url = 'california-maki.jpg' WHERE name = 'California maki' AND image_url IS NULL;
UPDATE dishes SET image_url = 'chawanmushi.jpg' WHERE name = 'Chawanmushi' AND image_url IS NULL;
UPDATE dishes SET image_url = 'chirashi-don.jpg' WHERE name = 'Chirashi don' AND image_url IS NULL;
UPDATE dishes SET image_url = 'saba-nuong-muoi.jpg' WHERE name = 'Cá saba nướng muối' AND image_url IS NULL;
UPDATE dishes SET image_url = 'com-ca-hoi.jpg' WHERE name = 'Cơm cá hồi áp chảo' AND image_url IS NULL;
UPDATE dishes SET image_url = 'edamame.jpg' WHERE name = 'Edamame muối' AND image_url IS NULL;
UPDATE dishes SET image_url = 'futomaki-chay.jpg' WHERE name = 'Futomaki chay' AND image_url IS NULL;
UPDATE dishes SET image_url = 'gyoza-chien.jpg' WHERE name = 'Gyoza chiên' AND image_url IS NULL;
UPDATE dishes SET image_url = 'gyudon.jpg' WHERE name = 'Gyudon bò' AND image_url IS NULL;
UPDATE dishes SET image_url = 'katsudon.jpg' WHERE name = 'Katsudon' AND image_url IS NULL;
UPDATE dishes SET image_url = 'kem-tra-xanh.jpg' WHERE name = 'Kem trà xanh' AND image_url IS NULL;
UPDATE dishes SET image_url = 'maki-ca-ngu-cay.jpg' WHERE name = 'Maki cá ngừ cay' AND image_url IS NULL;
UPDATE dishes SET image_url = 'miso-ramen.jpg' WHERE name = 'Miso ramen' AND image_url IS NULL;
UPDATE dishes SET image_url = 'mochi-kem.jpg' WHERE name = 'Mochi kem' AND image_url IS NULL;
UPDATE dishes SET image_url = 'soba-lanh.jpg' WHERE name = 'Mì soba lạnh' AND image_url IS NULL;
UPDATE dishes SET image_url = 'udon-nuoc.jpg' WHERE name = 'Mì udon nước' AND image_url IS NULL;
UPDATE dishes SET image_url = 'mang-tay-cuon.jpg' WHERE name = 'Măng tây cuộn ba chỉ' AND image_url IS NULL;
UPDATE dishes SET image_url = 'nigiri-ca-hoi.jpg' WHERE name = 'Nigiri cá hồi' AND image_url IS NULL;
UPDATE dishes SET image_url = 'nigiri-luon.jpg' WHERE name = 'Nigiri lươn nướng' AND image_url IS NULL;
UPDATE dishes SET image_url = 'nuoc-suoi.jpg' WHERE name = 'Nước suối' AND image_url IS NULL;
UPDATE dishes SET image_url = 'ramune.jpg' WHERE name = 'Ramune soda' AND image_url IS NULL;
UPDATE dishes SET image_url = 'salad-rong-bien.jpg' WHERE name = 'Salad rong biển' AND image_url IS NULL;
UPDATE dishes SET image_url = 'sashimi-bach-tuoc.jpg' WHERE name = 'Sashimi bạch tuộc' AND image_url IS NULL;
UPDATE dishes SET image_url = 'sashimi-hamachi.jpg' WHERE name = 'Sashimi cá cam Hamachi' AND image_url IS NULL;
UPDATE dishes SET image_url = 'sashimi-ca-hoi.jpg' WHERE name = 'Sashimi cá hồi' AND image_url IS NULL;
UPDATE dishes SET image_url = 'sashimi-ca-ngu.jpg' WHERE name = 'Sashimi cá ngừ đại dương' AND image_url IS NULL;
UPDATE dishes SET image_url = 'sashimi-tong-hop.jpg' WHERE name = 'Sashimi tổng hợp' AND image_url IS NULL;
UPDATE dishes SET image_url = 'shoyu-ramen.jpg' WHERE name = 'Shoyu ramen' AND image_url IS NULL;
UPDATE dishes SET image_url = 'tempura-ca.jpg' WHERE name = 'Tempura cá bơn' AND image_url IS NULL;
UPDATE dishes SET image_url = 'tempura-rau-cu.jpg' WHERE name = 'Tempura rau củ' AND image_url IS NULL;
UPDATE dishes SET image_url = 'tempura-tom.jpg' WHERE name = 'Tempura tôm' AND image_url IS NULL;
UPDATE dishes SET image_url = 'tempura-tong-hop.jpg' WHERE name = 'Tempura tổng hợp' AND image_url IS NULL;
UPDATE dishes SET image_url = 'tonkotsu-ramen.jpg' WHERE name = 'Tonkotsu ramen' AND image_url IS NULL;
UPDATE dishes SET image_url = 'tra-lua-mach.jpg' WHERE name = 'Trà lúa mạch lạnh' AND image_url IS NULL;
UPDATE dishes SET image_url = 'tra-xanh-nong.jpg' WHERE name = 'Trà xanh nóng' AND image_url IS NULL;
UPDATE dishes SET image_url = 'unadon.jpg' WHERE name = 'Unadon lươn' AND image_url IS NULL;
UPDATE dishes SET image_url = 'yakitori-da-ga.jpg' WHERE name = 'Yakitori da gà' AND image_url IS NULL;
UPDATE dishes SET image_url = 'yakitori-dui-ga.jpg' WHERE name = 'Yakitori đùi gà' AND image_url IS NULL;
UPDATE dishes SET image_url = 'hiyayakko.jpg' WHERE name = 'Đậu hũ lạnh Hiyayakko' AND image_url IS NULL;
