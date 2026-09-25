-- =========================================================================
-- RIMS — dữ liệu khởi tạo
-- =========================================================================
--
-- Thay cho DatabaseSeeder (997 dòng Java, chỉ chạy ở profile "dev"). Dữ liệu
-- khởi tạo là DỮ LIỆU, không phải mã nguồn: để trong SQL thì sửa được bằng
-- công cụ CSDL, xem được diff, và không phải build lại app.
--
-- CHẠY LẠI ĐƯỢC NHIỀU LẦN: mọi câu đều kiểm tra trước khi chèn.
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

IF NOT EXISTS (SELECT 1 FROM restaurant_tables WHERE table_number = 'B01')
INSERT INTO restaurant_tables (table_number, capacity, status, active, created_at, updated_at)
VALUES ('B01', 2, 'AVAILABLE', 1, SYSDATETIME(), SYSDATETIME());

IF NOT EXISTS (SELECT 1 FROM restaurant_tables WHERE table_number = 'B02')
INSERT INTO restaurant_tables (table_number, capacity, status, active, created_at, updated_at)
VALUES ('B02', 2, 'AVAILABLE', 1, SYSDATETIME(), SYSDATETIME());

IF NOT EXISTS (SELECT 1 FROM restaurant_tables WHERE table_number = 'B03')
INSERT INTO restaurant_tables (table_number, capacity, status, active, created_at, updated_at)
VALUES ('B03', 2, 'AVAILABLE', 1, SYSDATETIME(), SYSDATETIME());

IF NOT EXISTS (SELECT 1 FROM restaurant_tables WHERE table_number = 'B04')
INSERT INTO restaurant_tables (table_number, capacity, status, active, created_at, updated_at)
VALUES ('B04', 2, 'AVAILABLE', 1, SYSDATETIME(), SYSDATETIME());

IF NOT EXISTS (SELECT 1 FROM restaurant_tables WHERE table_number = 'B05')
INSERT INTO restaurant_tables (table_number, capacity, status, active, created_at, updated_at)
VALUES ('B05', 4, 'AVAILABLE', 1, SYSDATETIME(), SYSDATETIME());

IF NOT EXISTS (SELECT 1 FROM restaurant_tables WHERE table_number = 'B06')
INSERT INTO restaurant_tables (table_number, capacity, status, active, created_at, updated_at)
VALUES ('B06', 4, 'AVAILABLE', 1, SYSDATETIME(), SYSDATETIME());

IF NOT EXISTS (SELECT 1 FROM restaurant_tables WHERE table_number = 'B07')
INSERT INTO restaurant_tables (table_number, capacity, status, active, created_at, updated_at)
VALUES ('B07', 4, 'AVAILABLE', 1, SYSDATETIME(), SYSDATETIME());

IF NOT EXISTS (SELECT 1 FROM restaurant_tables WHERE table_number = 'B08')
INSERT INTO restaurant_tables (table_number, capacity, status, active, created_at, updated_at)
VALUES ('B08', 4, 'AVAILABLE', 1, SYSDATETIME(), SYSDATETIME());

IF NOT EXISTS (SELECT 1 FROM restaurant_tables WHERE table_number = 'B09')
INSERT INTO restaurant_tables (table_number, capacity, status, active, created_at, updated_at)
VALUES ('B09', 4, 'AVAILABLE', 1, SYSDATETIME(), SYSDATETIME());

IF NOT EXISTS (SELECT 1 FROM restaurant_tables WHERE table_number = 'B10')
INSERT INTO restaurant_tables (table_number, capacity, status, active, created_at, updated_at)
VALUES ('B10', 4, 'AVAILABLE', 1, SYSDATETIME(), SYSDATETIME());

IF NOT EXISTS (SELECT 1 FROM restaurant_tables WHERE table_number = 'B11')
INSERT INTO restaurant_tables (table_number, capacity, status, active, created_at, updated_at)
VALUES ('B11', 6, 'AVAILABLE', 1, SYSDATETIME(), SYSDATETIME());

IF NOT EXISTS (SELECT 1 FROM restaurant_tables WHERE table_number = 'B12')
INSERT INTO restaurant_tables (table_number, capacity, status, active, created_at, updated_at)
VALUES ('B12', 6, 'AVAILABLE', 1, SYSDATETIME(), SYSDATETIME());

IF NOT EXISTS (SELECT 1 FROM restaurant_tables WHERE table_number = 'B13')
INSERT INTO restaurant_tables (table_number, capacity, status, active, created_at, updated_at)
VALUES ('B13', 6, 'AVAILABLE', 1, SYSDATETIME(), SYSDATETIME());

IF NOT EXISTS (SELECT 1 FROM restaurant_tables WHERE table_number = 'B14')
INSERT INTO restaurant_tables (table_number, capacity, status, active, created_at, updated_at)
VALUES ('B14', 6, 'AVAILABLE', 1, SYSDATETIME(), SYSDATETIME());


-- ---------- Danh mục ----------

IF NOT EXISTS (SELECT 1 FROM categories WHERE name = N'Sashimi')
INSERT INTO categories (name, description, is_available, created_at, updated_at)
VALUES (N'Sashimi', N'Cá sống thái lát, phục vụ cùng wasabi và củ cải bào.', 1, SYSDATETIME(), SYSDATETIME());

IF NOT EXISTS (SELECT 1 FROM categories WHERE name = N'Sushi & Maki')
INSERT INTO categories (name, description, is_available, created_at, updated_at)
VALUES (N'Sushi & Maki', N'Cơm giấm cuộn hoặc nắm, làm theo từng phần.', 1, SYSDATETIME(), SYSDATETIME());

IF NOT EXISTS (SELECT 1 FROM categories WHERE name = N'Ramen & Mì')
INSERT INTO categories (name, description, is_available, created_at, updated_at)
VALUES (N'Ramen & Mì', N'Nước dùng ninh trong ngày, mì làm tươi.', 1, SYSDATETIME(), SYSDATETIME());

IF NOT EXISTS (SELECT 1 FROM categories WHERE name = N'Tempura')
INSERT INTO categories (name, description, is_available, created_at, updated_at)
VALUES (N'Tempura', N'Chiên bột mỏng, dùng nóng cùng nước chấm tentsuyu.', 1, SYSDATETIME(), SYSDATETIME());

IF NOT EXISTS (SELECT 1 FROM categories WHERE name = N'Yakitori & Nướng')
INSERT INTO categories (name, description, is_available, created_at, updated_at)
VALUES (N'Yakitori & Nướng', N'Nướng than, xiên tre, quết sốt tare.', 1, SYSDATETIME(), SYSDATETIME());

IF NOT EXISTS (SELECT 1 FROM categories WHERE name = N'Donburi & Cơm')
INSERT INTO categories (name, description, is_available, created_at, updated_at)
VALUES (N'Donburi & Cơm', N'Cơm Nhật, phần một người.', 1, SYSDATETIME(), SYSDATETIME());

IF NOT EXISTS (SELECT 1 FROM categories WHERE name = N'Khai vị')
INSERT INTO categories (name, description, is_available, created_at, updated_at)
VALUES (N'Khai vị', N'Món nhỏ dùng đầu bữa.', 1, SYSDATETIME(), SYSDATETIME());

IF NOT EXISTS (SELECT 1 FROM categories WHERE name = N'Tráng miệng')
INSERT INTO categories (name, description, is_available, created_at, updated_at)
VALUES (N'Tráng miệng', N'Đồ ngọt Nhật, làm trong ngày.', 1, SYSDATETIME(), SYSDATETIME());

IF NOT EXISTS (SELECT 1 FROM categories WHERE name = N'Đồ uống')
INSERT INTO categories (name, description, is_available, created_at, updated_at)
VALUES (N'Đồ uống', N'Nước và trà phục vụ tại quán.', 1, SYSDATETIME(), SYSDATETIME());


-- ---------- Món ăn ----------

-- Sashimi
IF NOT EXISTS (SELECT 1 FROM dishes WHERE name = N'Sashimi cá hồi')
INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, N'Sashimi cá hồi', N'Phi lê cá hồi Na Uy thái dày, 8 lát.', 189000, N'sashimi-ca-hoi.jpg', 1, 0, SYSDATETIME(), SYSDATETIME()
FROM categories WHERE name = N'Sashimi';

IF NOT EXISTS (SELECT 1 FROM dishes WHERE name = N'Sashimi cá ngừ đại dương')
INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, N'Sashimi cá ngừ đại dương', N'Phần lưng cá ngừ, thái 8 lát.', 229000, N'sashimi-ca-ngu.jpg', 1, 0, SYSDATETIME(), SYSDATETIME()
FROM categories WHERE name = N'Sashimi';

IF NOT EXISTS (SELECT 1 FROM dishes WHERE name = N'Sashimi cá cam Hamachi')
INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, N'Sashimi cá cam Hamachi', N'Cá cam Nhật, vị béo nhẹ, 8 lát.', 249000, N'sashimi-hamachi.jpg', 1, 0, SYSDATETIME(), SYSDATETIME()
FROM categories WHERE name = N'Sashimi';

IF NOT EXISTS (SELECT 1 FROM dishes WHERE name = N'Sashimi bạch tuộc')
INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, N'Sashimi bạch tuộc', N'Bạch tuộc chần, thái mỏng, 8 lát.', 159000, N'sashimi-bach-tuoc.jpg', 1, 0, SYSDATETIME(), SYSDATETIME()
FROM categories WHERE name = N'Sashimi';

IF NOT EXISTS (SELECT 1 FROM dishes WHERE name = N'Sashimi tổng hợp')
INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, N'Sashimi tổng hợp', N'Năm loại cá theo ngày, 15 lát.', 389000, N'sashimi-tong-hop.jpg', 1, 0, SYSDATETIME(), SYSDATETIME()
FROM categories WHERE name = N'Sashimi';


-- Sushi & Maki
IF NOT EXISTS (SELECT 1 FROM dishes WHERE name = N'Nigiri cá hồi')
INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, N'Nigiri cá hồi', N'Hai miếng, cơm giấm nắm tay.', 79000, N'nigiri-ca-hoi.jpg', 1, 0, SYSDATETIME(), SYSDATETIME()
FROM categories WHERE name = N'Sushi & Maki';

IF NOT EXISTS (SELECT 1 FROM dishes WHERE name = N'Nigiri lươn nướng')
INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, N'Nigiri lươn nướng', N'Lươn nướng sốt kabayaki, hai miếng.', 99000, N'nigiri-luon.jpg', 1, 0, SYSDATETIME(), SYSDATETIME()
FROM categories WHERE name = N'Sushi & Maki';

IF NOT EXISTS (SELECT 1 FROM dishes WHERE name = N'Maki cá ngừ cay')
INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, N'Maki cá ngừ cay', N'Cuộn cá ngừ trộn sốt cay, 8 miếng.', 129000, N'maki-ca-ngu-cay.jpg', 1, 0, SYSDATETIME(), SYSDATETIME()
FROM categories WHERE name = N'Sushi & Maki';

IF NOT EXISTS (SELECT 1 FROM dishes WHERE name = N'California maki')
INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, N'California maki', N'Cua, bơ, dưa leo, trứng cá tobiko, 8 miếng.', 139000, N'california-maki.jpg', 1, 0, SYSDATETIME(), SYSDATETIME()
FROM categories WHERE name = N'Sushi & Maki';

IF NOT EXISTS (SELECT 1 FROM dishes WHERE name = N'Futomaki chay')
INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, N'Futomaki chay', N'Cuộn dày nhân rau củ và trứng, 8 miếng.', 109000, N'futomaki-chay.jpg', 1, 0, SYSDATETIME(), SYSDATETIME()
FROM categories WHERE name = N'Sushi & Maki';


-- Ramen & Mì
IF NOT EXISTS (SELECT 1 FROM dishes WHERE name = N'Tonkotsu ramen')
INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, N'Tonkotsu ramen', N'Nước dùng xương heo ninh 12 tiếng, thịt chashu.', 159000, N'tonkotsu-ramen.jpg', 1, 0, SYSDATETIME(), SYSDATETIME()
FROM categories WHERE name = N'Ramen & Mì';

IF NOT EXISTS (SELECT 1 FROM dishes WHERE name = N'Shoyu ramen')
INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, N'Shoyu ramen', N'Nước dùng gà và tương đậu nành, trứng lòng đào.', 145000, N'shoyu-ramen.jpg', 1, 0, SYSDATETIME(), SYSDATETIME()
FROM categories WHERE name = N'Ramen & Mì';

IF NOT EXISTS (SELECT 1 FROM dishes WHERE name = N'Miso ramen')
INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, N'Miso ramen', N'Nước dùng miso đỏ, bắp và măng chua.', 149000, N'miso-ramen.jpg', 1, 0, SYSDATETIME(), SYSDATETIME()
FROM categories WHERE name = N'Ramen & Mì';

IF NOT EXISTS (SELECT 1 FROM dishes WHERE name = N'Mì udon nước')
INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, N'Mì udon nước', N'Udon sợi to trong nước dashi, chả cá.', 119000, N'udon-nuoc.jpg', 1, 0, SYSDATETIME(), SYSDATETIME()
FROM categories WHERE name = N'Ramen & Mì';

IF NOT EXISTS (SELECT 1 FROM dishes WHERE name = N'Mì soba lạnh')
INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, N'Mì soba lạnh', N'Soba kiều mạch, chấm tsuyu, dùng lạnh.', 109000, N'soba-lanh.jpg', 1, 0, SYSDATETIME(), SYSDATETIME()
FROM categories WHERE name = N'Ramen & Mì';


-- Tempura
IF NOT EXISTS (SELECT 1 FROM dishes WHERE name = N'Tempura tôm')
INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, N'Tempura tôm', N'Bốn con tôm sú, bột tempura giòn.', 139000, N'tempura-tom.jpg', 1, 0, SYSDATETIME(), SYSDATETIME()
FROM categories WHERE name = N'Tempura';

IF NOT EXISTS (SELECT 1 FROM dishes WHERE name = N'Tempura rau củ')
INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, N'Tempura rau củ', N'Khoai lang, bí đỏ, cà tím, ớt chuông.', 99000, N'tempura-rau-cu.jpg', 1, 0, SYSDATETIME(), SYSDATETIME()
FROM categories WHERE name = N'Tempura';

IF NOT EXISTS (SELECT 1 FROM dishes WHERE name = N'Tempura cá bơn')
INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, N'Tempura cá bơn', N'Phi lê cá bơn tẩm bột, chiên nhanh.', 159000, N'tempura-ca.jpg', 1, 0, SYSDATETIME(), SYSDATETIME()
FROM categories WHERE name = N'Tempura';

IF NOT EXISTS (SELECT 1 FROM dishes WHERE name = N'Tempura tổng hợp')
INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, N'Tempura tổng hợp', N'Hai tôm và năm loại rau củ.', 179000, N'tempura-tong-hop.jpg', 1, 0, SYSDATETIME(), SYSDATETIME()
FROM categories WHERE name = N'Tempura';


-- Yakitori & Nướng
IF NOT EXISTS (SELECT 1 FROM dishes WHERE name = N'Yakitori đùi gà')
INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, N'Yakitori đùi gà', N'Ba xiên thịt đùi và hành boa rô.', 89000, N'yakitori-dui-ga.jpg', 1, 0, SYSDATETIME(), SYSDATETIME()
FROM categories WHERE name = N'Yakitori & Nướng';

IF NOT EXISTS (SELECT 1 FROM dishes WHERE name = N'Yakitori da gà')
INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, N'Yakitori da gà', N'Ba xiên da gà nướng giòn, muối tiêu.', 69000, N'yakitori-da-ga.jpg', 1, 0, SYSDATETIME(), SYSDATETIME()
FROM categories WHERE name = N'Yakitori & Nướng';

IF NOT EXISTS (SELECT 1 FROM dishes WHERE name = N'Cá saba nướng muối')
INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, N'Cá saba nướng muối', N'Nửa con cá thu Nhật, nướng muối.', 149000, N'saba-nuong-muoi.jpg', 1, 0, SYSDATETIME(), SYSDATETIME()
FROM categories WHERE name = N'Yakitori & Nướng';

IF NOT EXISTS (SELECT 1 FROM dishes WHERE name = N'Bò lưỡi nướng')
INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, N'Bò lưỡi nướng', N'Lưỡi bò thái lát, nướng than, chanh muối.', 199000, N'bo-luoi-nuong.jpg', 1, 0, SYSDATETIME(), SYSDATETIME()
FROM categories WHERE name = N'Yakitori & Nướng';

IF NOT EXISTS (SELECT 1 FROM dishes WHERE name = N'Măng tây cuộn ba chỉ')
INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, N'Măng tây cuộn ba chỉ', N'Bốn cuộn, nướng than.', 99000, N'mang-tay-cuon.jpg', 1, 0, SYSDATETIME(), SYSDATETIME()
FROM categories WHERE name = N'Yakitori & Nướng';


-- Donburi & Cơm
IF NOT EXISTS (SELECT 1 FROM dishes WHERE name = N'Cơm cá hồi áp chảo')
INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, N'Cơm cá hồi áp chảo', N'Cá hồi áp chảo, cơm và rong biển.', 149000, N'com-ca-hoi.jpg', 1, 0, SYSDATETIME(), SYSDATETIME()
FROM categories WHERE name = N'Donburi & Cơm';

IF NOT EXISTS (SELECT 1 FROM dishes WHERE name = N'Gyudon bò')
INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, N'Gyudon bò', N'Bò thái mỏng nấu sốt ngọt mặn, hành tây.', 129000, N'gyudon.jpg', 1, 0, SYSDATETIME(), SYSDATETIME()
FROM categories WHERE name = N'Donburi & Cơm';

IF NOT EXISTS (SELECT 1 FROM dishes WHERE name = N'Katsudon')
INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, N'Katsudon', N'Heo tẩm bột chiên, trứng, sốt dashi.', 139000, N'katsudon.jpg', 1, 0, SYSDATETIME(), SYSDATETIME()
FROM categories WHERE name = N'Donburi & Cơm';

IF NOT EXISTS (SELECT 1 FROM dishes WHERE name = N'Unadon lươn')
INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, N'Unadon lươn', N'Lươn nướng sốt kabayaki trên cơm.', 239000, N'unadon.jpg', 1, 0, SYSDATETIME(), SYSDATETIME()
FROM categories WHERE name = N'Donburi & Cơm';

IF NOT EXISTS (SELECT 1 FROM dishes WHERE name = N'Chirashi don')
INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, N'Chirashi don', N'Cơm giấm phủ cá sống thái hạt lựu.', 219000, N'chirashi-don.jpg', 1, 0, SYSDATETIME(), SYSDATETIME()
FROM categories WHERE name = N'Donburi & Cơm';


-- Khai vị
IF NOT EXISTS (SELECT 1 FROM dishes WHERE name = N'Edamame muối')
INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, N'Edamame muối', N'Đậu nành Nhật luộc, rắc muối biển.', 49000, N'edamame.jpg', 1, 0, SYSDATETIME(), SYSDATETIME()
FROM categories WHERE name = N'Khai vị';

IF NOT EXISTS (SELECT 1 FROM dishes WHERE name = N'Gyoza chiên')
INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, N'Gyoza chiên', N'Sáu chiếc, nhân heo và bắp cải.', 89000, N'gyoza-chien.jpg', 1, 0, SYSDATETIME(), SYSDATETIME()
FROM categories WHERE name = N'Khai vị';

IF NOT EXISTS (SELECT 1 FROM dishes WHERE name = N'Chawanmushi')
INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, N'Chawanmushi', N'Trứng hấp dashi, tôm và nấm.', 79000, N'chawanmushi.jpg', 1, 0, SYSDATETIME(), SYSDATETIME()
FROM categories WHERE name = N'Khai vị';

IF NOT EXISTS (SELECT 1 FROM dishes WHERE name = N'Salad rong biển')
INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, N'Salad rong biển', N'Rong biển wakame trộn giấm mè.', 69000, N'salad-rong-bien.jpg', 1, 0, SYSDATETIME(), SYSDATETIME()
FROM categories WHERE name = N'Khai vị';

IF NOT EXISTS (SELECT 1 FROM dishes WHERE name = N'Đậu hũ lạnh Hiyayakko')
INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, N'Đậu hũ lạnh Hiyayakko', N'Đậu hũ non, gừng bào, hành lá.', 59000, N'hiyayakko.jpg', 1, 0, SYSDATETIME(), SYSDATETIME()
FROM categories WHERE name = N'Khai vị';


-- Tráng miệng
IF NOT EXISTS (SELECT 1 FROM dishes WHERE name = N'Mochi kem')
INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, N'Mochi kem', N'Ba viên, vị trà xanh, đậu đỏ và xoài.', 79000, N'mochi-kem.jpg', 1, 0, SYSDATETIME(), SYSDATETIME()
FROM categories WHERE name = N'Tráng miệng';

IF NOT EXISTS (SELECT 1 FROM dishes WHERE name = N'Bánh dorayaki')
INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, N'Bánh dorayaki', N'Hai chiếc, nhân đậu đỏ.', 59000, N'dorayaki.jpg', 1, 0, SYSDATETIME(), SYSDATETIME()
FROM categories WHERE name = N'Tráng miệng';

IF NOT EXISTS (SELECT 1 FROM dishes WHERE name = N'Kem trà xanh')
INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, N'Kem trà xanh', N'Matcha Uji, một phần.', 55000, N'kem-tra-xanh.jpg', 1, 0, SYSDATETIME(), SYSDATETIME()
FROM categories WHERE name = N'Tráng miệng';

IF NOT EXISTS (SELECT 1 FROM dishes WHERE name = N'Bánh phô mai Nhật')
INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, N'Bánh phô mai Nhật', N'Bông xốp, một lát.', 69000, N'banh-pho-mai-nhat.jpg', 1, 0, SYSDATETIME(), SYSDATETIME()
FROM categories WHERE name = N'Tráng miệng';


-- Đồ uống
IF NOT EXISTS (SELECT 1 FROM dishes WHERE name = N'Trà xanh nóng')
INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, N'Trà xanh nóng', N'Sencha, ấm nhỏ.', 35000, N'tra-xanh-nong.jpg', 1, 0, SYSDATETIME(), SYSDATETIME()
FROM categories WHERE name = N'Đồ uống';

IF NOT EXISTS (SELECT 1 FROM dishes WHERE name = N'Trà lúa mạch lạnh')
INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, N'Trà lúa mạch lạnh', N'Mugicha, ly lớn.', 35000, N'tra-lua-mach.jpg', 1, 0, SYSDATETIME(), SYSDATETIME()
FROM categories WHERE name = N'Đồ uống';

IF NOT EXISTS (SELECT 1 FROM dishes WHERE name = N'Ramune soda')
INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, N'Ramune soda', N'Soda Nhật, vị nguyên bản.', 45000, N'ramune.jpg', 1, 0, SYSDATETIME(), SYSDATETIME()
FROM categories WHERE name = N'Đồ uống';

IF NOT EXISTS (SELECT 1 FROM dishes WHERE name = N'Nước suối')
INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, N'Nước suối', N'Chai 500ml.', 20000, N'nuoc-suoi.jpg', 1, 0, SYSDATETIME(), SYSDATETIME()
FROM categories WHERE name = N'Đồ uống';

IF NOT EXISTS (SELECT 1 FROM dishes WHERE name = N'Bia Nhật')
INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_hidden, created_at, updated_at)
SELECT category_id, N'Bia Nhật', N'Chai 330ml.', 65000, N'bia-nhat.jpg', 1, 0, SYSDATETIME(), SYSDATETIME()
FROM categories WHERE name = N'Đồ uống';

-- ---------- Ảnh món cho cơ sở dữ liệu đã có sẵn ----------
--
-- Câu INSERT ở trên có điều kiện IF NOT EXISTS nên một CSDL đang chạy sẽ bỏ
-- qua nó, và món đã tạo từ trước không bao giờ nhận ảnh. Khối này lo phần đó.
--
-- Chỉ điền vào món CHƯA có ảnh. Chủ quán tự tải ảnh khác lên thì lần khởi
-- động sau không bị ghi đè.

UPDATE dishes SET image_url = N'bia-nhat.jpg' WHERE name = N'Bia Nhật' AND image_url IS NULL;
UPDATE dishes SET image_url = N'dorayaki.jpg' WHERE name = N'Bánh dorayaki' AND image_url IS NULL;
UPDATE dishes SET image_url = N'banh-pho-mai-nhat.jpg' WHERE name = N'Bánh phô mai Nhật' AND image_url IS NULL;
UPDATE dishes SET image_url = N'bo-luoi-nuong.jpg' WHERE name = N'Bò lưỡi nướng' AND image_url IS NULL;
UPDATE dishes SET image_url = N'california-maki.jpg' WHERE name = N'California maki' AND image_url IS NULL;
UPDATE dishes SET image_url = N'chawanmushi.jpg' WHERE name = N'Chawanmushi' AND image_url IS NULL;
UPDATE dishes SET image_url = N'chirashi-don.jpg' WHERE name = N'Chirashi don' AND image_url IS NULL;
UPDATE dishes SET image_url = N'saba-nuong-muoi.jpg' WHERE name = N'Cá saba nướng muối' AND image_url IS NULL;
UPDATE dishes SET image_url = N'com-ca-hoi.jpg' WHERE name = N'Cơm cá hồi áp chảo' AND image_url IS NULL;
UPDATE dishes SET image_url = N'edamame.jpg' WHERE name = N'Edamame muối' AND image_url IS NULL;
UPDATE dishes SET image_url = N'futomaki-chay.jpg' WHERE name = N'Futomaki chay' AND image_url IS NULL;
UPDATE dishes SET image_url = N'gyoza-chien.jpg' WHERE name = N'Gyoza chiên' AND image_url IS NULL;
UPDATE dishes SET image_url = N'gyudon.jpg' WHERE name = N'Gyudon bò' AND image_url IS NULL;
UPDATE dishes SET image_url = N'katsudon.jpg' WHERE name = N'Katsudon' AND image_url IS NULL;
UPDATE dishes SET image_url = N'kem-tra-xanh.jpg' WHERE name = N'Kem trà xanh' AND image_url IS NULL;
UPDATE dishes SET image_url = N'maki-ca-ngu-cay.jpg' WHERE name = N'Maki cá ngừ cay' AND image_url IS NULL;
UPDATE dishes SET image_url = N'miso-ramen.jpg' WHERE name = N'Miso ramen' AND image_url IS NULL;
UPDATE dishes SET image_url = N'mochi-kem.jpg' WHERE name = N'Mochi kem' AND image_url IS NULL;
UPDATE dishes SET image_url = N'soba-lanh.jpg' WHERE name = N'Mì soba lạnh' AND image_url IS NULL;
UPDATE dishes SET image_url = N'udon-nuoc.jpg' WHERE name = N'Mì udon nước' AND image_url IS NULL;
UPDATE dishes SET image_url = N'mang-tay-cuon.jpg' WHERE name = N'Măng tây cuộn ba chỉ' AND image_url IS NULL;
UPDATE dishes SET image_url = N'nigiri-ca-hoi.jpg' WHERE name = N'Nigiri cá hồi' AND image_url IS NULL;
UPDATE dishes SET image_url = N'nigiri-luon.jpg' WHERE name = N'Nigiri lươn nướng' AND image_url IS NULL;
UPDATE dishes SET image_url = N'nuoc-suoi.jpg' WHERE name = N'Nước suối' AND image_url IS NULL;
UPDATE dishes SET image_url = N'ramune.jpg' WHERE name = N'Ramune soda' AND image_url IS NULL;
UPDATE dishes SET image_url = N'salad-rong-bien.jpg' WHERE name = N'Salad rong biển' AND image_url IS NULL;
UPDATE dishes SET image_url = N'sashimi-bach-tuoc.jpg' WHERE name = N'Sashimi bạch tuộc' AND image_url IS NULL;
UPDATE dishes SET image_url = N'sashimi-hamachi.jpg' WHERE name = N'Sashimi cá cam Hamachi' AND image_url IS NULL;
UPDATE dishes SET image_url = N'sashimi-ca-hoi.jpg' WHERE name = N'Sashimi cá hồi' AND image_url IS NULL;
UPDATE dishes SET image_url = N'sashimi-ca-ngu.jpg' WHERE name = N'Sashimi cá ngừ đại dương' AND image_url IS NULL;
UPDATE dishes SET image_url = N'sashimi-tong-hop.jpg' WHERE name = N'Sashimi tổng hợp' AND image_url IS NULL;
UPDATE dishes SET image_url = N'shoyu-ramen.jpg' WHERE name = N'Shoyu ramen' AND image_url IS NULL;
UPDATE dishes SET image_url = N'tempura-ca.jpg' WHERE name = N'Tempura cá bơn' AND image_url IS NULL;
UPDATE dishes SET image_url = N'tempura-rau-cu.jpg' WHERE name = N'Tempura rau củ' AND image_url IS NULL;
UPDATE dishes SET image_url = N'tempura-tom.jpg' WHERE name = N'Tempura tôm' AND image_url IS NULL;
UPDATE dishes SET image_url = N'tempura-tong-hop.jpg' WHERE name = N'Tempura tổng hợp' AND image_url IS NULL;
UPDATE dishes SET image_url = N'tonkotsu-ramen.jpg' WHERE name = N'Tonkotsu ramen' AND image_url IS NULL;
UPDATE dishes SET image_url = N'tra-lua-mach.jpg' WHERE name = N'Trà lúa mạch lạnh' AND image_url IS NULL;
UPDATE dishes SET image_url = N'tra-xanh-nong.jpg' WHERE name = N'Trà xanh nóng' AND image_url IS NULL;
UPDATE dishes SET image_url = N'unadon.jpg' WHERE name = N'Unadon lươn' AND image_url IS NULL;
UPDATE dishes SET image_url = N'yakitori-da-ga.jpg' WHERE name = N'Yakitori da gà' AND image_url IS NULL;
UPDATE dishes SET image_url = N'yakitori-dui-ga.jpg' WHERE name = N'Yakitori đùi gà' AND image_url IS NULL;
UPDATE dishes SET image_url = N'hiyayakko.jpg' WHERE name = N'Đậu hũ lạnh Hiyayakko' AND image_url IS NULL;
