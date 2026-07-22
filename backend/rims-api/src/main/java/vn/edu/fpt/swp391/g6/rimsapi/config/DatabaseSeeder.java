package vn.edu.fpt.swp391.g6.rimsapi.config;

import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.NonNull;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import vn.edu.fpt.swp391.g6.rimsapi.entity.*;
import vn.edu.fpt.swp391.g6.rimsapi.enums.*;
import vn.edu.fpt.swp391.g6.rimsapi.repository.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Random;


@Component
@RequiredArgsConstructor
public class DatabaseSeeder implements CommandLineRunner
{

    private static final String DEFAULT_PASSWORD = "123456";

    // Số lượng order lịch sử cần seed
    private static final int HISTORICAL_ORDER_COUNT = 3000;

    // Seed cố định để dữ liệu sinh ra ổn định giữa các lần chạy lại (dễ debug/test)
    private static final Random RNG = new Random(100);

    // Mốc bắt đầu rải dữ liệu lịch sử
    private static final LocalDateTime HISTORY_START = LocalDateTime.of(2025, 1, 1, 8, 0);

    /**
     * Table layout: each entry represents a group {count, capacity}.
     * T01–T04  → 4 tables × 2 seats
     * T05–T10  → 6 tables × 4 seats
     * T11–T12  → 2 tables × 8 seats
     */
    private static final int[][] TABLE_GROUPS = {
            {4, 2},
            {6, 4},
            {2, 8}
    };

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final DishRepository dishRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final CategoryRepository categoryRepository;
    private final RestaurantTableRepository tableRepository;
    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final ReservationRepository reservationRepository;

    // Dùng để ghi đè các cột do @CreatedDate/@LastModifiedDate tự set = now() khi save(),
    // bằng cách UPDATE thẳng qua SQL thuần (không đi qua vòng đời entity nên auditing
    // không can thiệp lại lần nữa). Không cần sửa entity.
    private final JdbcTemplate jdbcTemplate;


    @Override
    public void run(String @NonNull ... args)
    {
        seedUsers();
        seedTables();
        seedCategoriesAndDishes();
        seedHistoricalOrders();
        seedLiveServingOrders();
        seedReservations();
        backfillInvoiceRestaurantRevenueAmount();
        System.out.println("Database seeder done!");
    }

    // ══════════════════════════════════════════════════════════════════
    // Users – 6 tài khoản: 1 admin, 1 chef, 1 waiter, 1 cashier, 2 customer
    // ══════════════════════════════════════════════════════════════════
    private void seedUsers()
    {
        if (userRepository.count() > 0) return;

        record UserDef(String username, String fullName, String email, String phone, RoleType role)
        {
        }

        List<UserDef> defs = List.of(
                new UserDef("admin", "Nguyễn Thành Vinh", "admin@rims.local", "0900000001", RoleType.ADMIN),
                new UserDef("chef", "Phạm Minh Nghĩa", "chef@rims.local", "0900000002", RoleType.CHEF),
                new UserDef("waiter", "Nguyễn Anh Tuấn", "waiter@rims.local", "0900000003", RoleType.WAITER),
                new UserDef("cashier", "Phạm Tuấn Anh", "cashier@rims.local", "0900000004", RoleType.CASHIER),
                new UserDef("customer1", "Nguyễn Thị Thu Hiền", "customer1@rims.local", "0900000005", RoleType.CUSTOMER),
                new UserDef("customer2", "Nguyễn Xuân Bắc", "customer2@rims.local", "0900000006", RoleType.CUSTOMER)
        );

        List<User> users = defs.stream()
                .map(d -> buildUser(d.username(), d.fullName(), d.email(), d.phone(), d.role()))
                .toList();

        userRepository.saveAll(users);
    }

    private User buildUser(String username, String fullName, String email, String phone, RoleType role)
    {
        User user = new User();
        user.setUsername(username);
        user.setFullName(fullName);
        user.setEmail(email);
        user.setPhone(phone);
        user.setRole(role);
        user.setPasswordHash(passwordEncoder.encode(DEFAULT_PASSWORD));
        user.setActive(true);
        return user;
    }

    // ══════════════════════════════════════════════════════════════════
    // Restaurant Tables – giữ nguyên số lượng bàn + sức chứa như bản mẫu
    //   7 SERVING  : T01, T02, T03, T05, T06, T07, T08
    //   3 AVAILABLE: T09, T11, T12
    //   2 RESERVED : T04, T10
    // ══════════════════════════════════════════════════════════════════
    private void seedTables()
    {
        if (tableRepository.count() > 0) return;

        List<RestaurantTable> tables = new ArrayList<>();
        int tableNumber = 1;
        for (int[] group : TABLE_GROUPS)
        {
            int count = group[0];
            int capacity = group[1];
            for (int i = 0; i < count; i++, tableNumber++)
            {
                tables.add(buildTable(String.format("T%02d", tableNumber), capacity,
                        resolveTableStatus(tableNumber)));
            }
        }
        tableRepository.saveAll(tables);
    }

    private TableStatus resolveTableStatus(int num)
    {
        return switch (num)
        {
            case 4, 10 -> TableStatus.RESERVED;
            case 9, 11, 12 -> TableStatus.AVAILABLE;
            default -> TableStatus.SERVING;
        };
    }

    private RestaurantTable buildTable(String tableNumber, int capacity, TableStatus status)
    {
        RestaurantTable table = new RestaurantTable();
        table.setTableNumber(tableNumber);
        table.setCapacity(capacity);
        table.setStatus(status);
        return table;
    }


    // ══════════════════════════════════════════════════════════════════
    // Categories & Dishes – 6 category, 30 món theo phong cách Nhật Bản
    //   Sushi (6) · Sashimi (4) · Món chính Nhật (8) · Khai vị (4)
    //   Tráng miệng (3) · Đồ uống (5)
    // ══════════════════════════════════════════════════════════════════
    private void seedCategoriesAndDishes()
    {
        if (dishRepository.count() > 0) return;

        Category sushi = buildCategory("Sushi", "Các loại sushi nigiri và maki tươi ngon");
        Category sashimi = buildCategory("Sashimi", "Cá và hải sản tươi sống thái lát kiểu Nhật");
        Category mainDish = buildCategory("Món chính Nhật Bản", "Các món chính đặc trưng ẩm thực Nhật: ramen, udon, teriyaki...");
        Category appetizer = buildCategory("Khai vị Nhật Bản", "Các món khai vị và món phụ kiểu Nhật");
        Category dessert = buildCategory("Tráng miệng", "Bánh và món tráng miệng kiểu Nhật");
        Category drink = buildCategory("Đồ uống", "Đồ uống Nhật Bản và giải khát các loại");
        categoryRepository.saveAll(List.of(sushi, sashimi, mainDish, appetizer, dessert, drink));

        List<Dish> dishes = new ArrayList<>();

        // 6 Sushi
        dishes.add(buildDish("Nigiri cá hồi - 2 miếng", "Sushi nigiri cá hồi Na Uy tươi, cơm giấm chuẩn vị Nhật", 55_000, "nigiri-ca-hoi.jpg", sushi));
        dishes.add(buildDish("Nigiri cá ngừ - 2 miếng", "Sushi nigiri cá ngừ đại dương tươi ngon, thịt săn chắc", 60_000, "nigiri-ca-ngu.jpg", sushi));
        dishes.add(buildDish("Nigiri tôm - 2 miếng", "Sushi nigiri tôm sú hấp chín, ngọt thanh tự nhiên", 48_000, "nigiri-tom.jpg", sushi));
        dishes.add(buildDish("Maki cá hồi bơ - 8 cuộn", "Cuộn sushi cá hồi kết hợp bơ béo ngậy, rong biển giòn", 79_000, "maki-ca-hoi-bo.jpg", sushi));
        dishes.add(buildDish("California Roll - 8 cuộn", "Sushi cuộn kiểu Mỹ với thanh cua, bơ và trứng cá tobiko", 89_000, "california-roll.jpg", sushi));
        dishes.add(buildDish("Dragon Roll - 8 cuộn", "Sushi cuộn lươn nướng phủ bơ và sốt unagi đặc trưng", 119_000, "dragon-roll.jpg", sushi));

        // 4 Sashimi
        dishes.add(buildDish("Sashimi cá hồi - 6 lát", "Cá hồi tươi thái lát mỏng, ăn kèm wasabi và nước tương", 129_000, "sashimi-ca-hoi.jpg", sashimi));
        dishes.add(buildDish("Sashimi cá ngừ - 6 lát", "Cá ngừ đại dương thái lát, thịt đỏ tươi đậm đà", 139_000, "sashimi-ca-ngu.jpg", sashimi));
        dishes.add(buildDish("Sashimi cá trắng - 6 lát", "Cá tráp trắng thái lát mỏng, vị thanh nhẹ tinh tế", 119_000, "sashimi-ca-trang.jpg", sashimi));
        dishes.add(buildDish("Sashimi bạch tuộc - 6 lát", "Bạch tuộc tươi thái lát, giòn sần sật đặc trưng", 109_000, "sashimi-bach-tuoc.jpg", sashimi));

        // 8 Món chính Nhật
        dishes.add(buildDish("Ramen Tonkotsu - 1 tô", "Mì ramen nước dùng xương heo ninh 12 giờ, chả cá và trứng lòng đào", 109_000, "ramen-tonkotsu.jpg", mainDish));
        dishes.add(buildDish("Ramen Miso - 1 tô", "Mì ramen nước dùng miso đậm đà, bắp ngô và rong biển", 119_000, "ramen-miso.jpg", mainDish));
        dishes.add(buildDish("Udon bò - 1 tô", "Mì udon dai mềm cùng thịt bò xào sốt teriyaki", 99_000, "udon-bo.jpg", mainDish));
        dishes.add(buildDish("Tempura tôm - 5 con", "Tôm tẩm bột chiên giòn kiểu Nhật, chấm sốt tentsuyu", 99_000, "tempura-tom.jpg", mainDish));
        dishes.add(buildDish("Gà Teriyaki - 1 phần", "Đùi gà áp chảo sốt teriyaki ngọt mặn hài hoà", 139_000, "ga-teriyaki.jpg", mainDish));
        dishes.add(buildDish("Donburi bò - 1 tô", "Cơm phủ thịt bò xào hành tây sốt dashi kiểu Nhật", 109_000, "donburi-bo.jpg", mainDish));
        dishes.add(buildDish("Cơm cà ri Nhật - 1 phần", "Cơm trắng dẻo cùng cà ri Nhật sánh mịn vị ngọt dịu", 99_000, "com-cari-nhat.jpg", mainDish));
        dishes.add(buildDish("Lẩu Sukiyaki - 1 suất", "Lẩu Sukiyaki bò Mỹ, đậu phụ và rau củ nấu cùng sốt shoyu", 329_000, "sukiyaki.jpg", mainDish));

        // 4 Khai vị
        dishes.add(buildDish("Gyoza - 6 cái", "Bánh xếp nhân thịt heo chiên giòn đáy, kiểu Nhật truyền thống", 69_000, "gyoza.jpg", appetizer));
        dishes.add(buildDish("Edamame - 1 đĩa", "Đậu nành Nhật luộc rắc muối biển, món khai vị thanh đạm", 45_000, "edamame.jpg", appetizer));
        dishes.add(buildDish("Súp Miso - 1 chén", "Súp miso truyền thống với đậu phụ, rong biển wakame", 35_000, "sup-miso.jpg", appetizer));
        dishes.add(buildDish("Chả cá viên chiên - 6 viên", "Chả cá viên Nhật chiên giòn, ăn kèm sốt mù tạt", 59_000, "cha-ca-vien.jpg", appetizer));

        // 3 Tráng miệng
        dishes.add(buildDish("Mochi - 2 bánh", "Bánh mochi Nhật nhân đậu đỏ, vỏ dẻo dai đặc trưng", 49_000, "mochi.jpg", dessert));
        dishes.add(buildDish("Dorayaki - 2 bánh", "Bánh rán Nhật nhân đậu đỏ ngọt dịu, mềm xốp", 45_000, "dorayaki.jpg", dessert));
        dishes.add(buildDish("Kem trà xanh - 1 cốc", "Kem matcha Nhật Bản béo mịn, vị trà xanh đậm đà", 55_000, "kem-tra-xanh.jpg", dessert));

        // 5 Đồ uống
        dishes.add(buildDish("Trà xanh nóng - 1 cốc", "Trà xanh Nhật Bản nguyên chất, thanh mát tự nhiên", 25_000, "tra-xanh-nong.jpg", drink));
        dishes.add(buildDish("Trà sữa Matcha - 500ml", "Trà sữa vị matcha Nhật đậm đà, béo ngậy vừa phải", 55_000, "tra-sua-matcha.jpg", drink));
        dishes.add(buildDish("Soda chanh - 450ml", "Soda chanh tươi mát lạnh, sủi bọt sảng khoái", 39_000, "soda-chanh.jpg", drink));
        dishes.add(buildDish("Ramune - 200ml", "Nước ngọt có ga Nhật Bản vị nguyên bản trong chai bi đặc trưng", 45_000, "ramune.jpg", drink));
        dishes.add(buildDish("Coca Cola - 330ml", "Nước ngọt có ga Coca-Cola lon 330ml", 20_000, "coca-cola.jpg", drink));

        dishRepository.saveAll(dishes);
    }

    private Category buildCategory(String name, String description)
    {
        Category c = new Category();
        c.setName(name);
        c.setDescription(description);
        c.setAvailable(true);
        return c;
    }

    private Dish buildDish(String name, String description, int price, String imageUrl, Category category)
    {
        Dish d = new Dish();
        d.setName(name);
        d.setDescription(description);
        d.setPrice(price);
        d.setImageUrl(imageUrl);
        d.setAvailable(true);
        d.setCategory(category);
        return d;
    }


    // ══════════════════════════════════════════════════════════════════
    // Orders lịch sử – 3000 order, rải ngẫu nhiên từ đầu năm 2025 đến gần
    // hiện tại. Toàn bộ đã thanh toán thành công (có Invoice + Payment) nên
    // Order luôn ở trạng thái COMPLETED; từng OrderItem chủ yếu COMPLETED,
    // một tỉ lệ nhỏ (~8%) bị CANCELLED. Phương thức thanh toán (CASH /
    // QRCODE) chọn ngẫu nhiên cho mỗi order.
    //
    // LƯU Ý VỀ AUDITING: Order/OrderItem/Invoice/Payment/PaymentTransaction
    // đều dùng @EntityListeners(AuditingEntityListener.class) nên các cột
    // @CreatedDate (createdAt/invoiceDate/paymentDate/transactionDate) và
    // @LastModifiedDate (updatedAt) sẽ luôn bị Spring Data JPA auditing ghi
    // đè thành thời điểm chạy seeder thực tế ngay khi save() được gọi — bất
    // kể ta đã set giá trị "quá khứ" trước đó. Vì không được sửa entity, ta
    // để auditing set như bình thường, sau đó UPDATE thẳng qua SQL thuần
    // (JdbcTemplate) để ghi đè lại đúng mốc thời gian mong muốn — vì UPDATE
    // thuần không đi qua vòng đời entity/@PrePersist nên auditing không có
    // cơ hội can thiệp lại lần nữa. Toàn bộ được gom lại và chạy 1 lần bằng
    // batchUpdate() sau vòng lặp để tránh 15.000 lượt round-trip riêng lẻ.
    // ══════════════════════════════════════════════════════════════════
    private void seedHistoricalOrders()
    {
        if (orderRepository.count() > 0) return;

        List<RestaurantTable> allTables = tableRepository.findAll();
        List<Dish> dishes = dishRepository.findAll();

        User waiter = userRepository.findAll().stream()
                .filter(u -> u.getRole() == RoleType.WAITER).toList().getFirst();

        // Chừa lại 3 giờ gần nhất để không đụng với các order đang SERVING "thời gian thực"
        LocalDateTime historyEnd = LocalDateTime.now().minusHours(3);

        // Sinh trước toàn bộ mốc thời gian rồi sort tăng dần, để khi insert theo
        // đúng thứ tự này thì auto-increment ID cũng tăng dần theo thời gian tạo.
        List<LocalDateTime> orderTimes = new ArrayList<>(HISTORICAL_ORDER_COUNT);
        for (int i = 0; i < HISTORICAL_ORDER_COUNT; i++)
        {
            orderTimes.add(randomDateTimeBetween(HISTORY_START, historyEnd));
        }
        orderTimes.sort(Comparator.naturalOrder());

        // Gom các cặp (thời gian đúng, id) lại để backdate hàng loạt sau vòng lặp,
        // thay vì UPDATE từng dòng một (rất chậm với 3000 order).
        List<Object[]> orderBackdates = new ArrayList<>();
        List<Object[]> itemBackdates = new ArrayList<>();
        List<Object[]> invoiceBackdates = new ArrayList<>();
        List<Object[]> paymentBackdates = new ArrayList<>();
        List<Object[]> transactionBackdates = new ArrayList<>();

        for (LocalDateTime orderTime : orderTimes)
        {
            RestaurantTable table = allTables.get(RNG.nextInt(allTables.size()));

            Order order = buildOrder(table, waiter, OrderStatus.COMPLETED, orderTime);

            // Build items và gắn vào order qua addOrderItem() để đồng bộ 2 chiều
            // (order.orderItems <-> item.order), tránh Hibernate hiểu nhầm
            // collection rỗng rồi orphanRemoval xoá mất item ở lần save thứ 2.
            List<OrderItem> items = buildRandomOrderItems(order, dishes, orderTime);
            items.forEach(order::addOrderItem);

            recalcTotal(order, items);
            orderRepository.save(order);   // save 1 lần duy nhất, cascade lo phần OrderItem

            orderBackdates.add(new Object[]{Timestamp.valueOf(orderTime), order.getId()});

            for (OrderItem item : items)
            {
                Timestamp ts = Timestamp.valueOf(item.getCreatedAt());
                itemBackdates.add(new Object[]{ts, ts, item.getId()});
            }
            recalcTotal(order, items);
            orderRepository.save(order);

            LocalDateTime invoiceDate = orderTime.plusMinutes(60 + RNG.nextInt(90));
            Invoice invoice = buildInvoice(order, invoiceDate);
            invoiceRepository.save(invoice);
            invoiceBackdates.add(new Object[]{Timestamp.valueOf(invoiceDate), invoice.getId()});

            PaymentMethod method = RNG.nextBoolean() ? PaymentMethod.CASH : PaymentMethod.QRCODE;
            LocalDateTime paymentDate = invoiceDate.plusMinutes(1 + RNG.nextInt(5));
            Payment payment = buildPayment(invoice, method, paymentDate);
            paymentRepository.save(payment);
            paymentBackdates.add(new Object[]{Timestamp.valueOf(paymentDate), payment.getId()});

            if (method == PaymentMethod.QRCODE)
            {
                LocalDateTime txDate = paymentDate.plusSeconds(2);
                PaymentTransaction tx = buildPaymentTransaction(payment, txDate);
                paymentTransactionRepository.save(tx);
                transactionBackdates.add(new Object[]{Timestamp.valueOf(txDate), tx.getId()});
            }
        }

        // Ghi đè hàng loạt các cột do auditing tự set = now() về lại đúng mốc thời gian mong muốn
        jdbcTemplate.batchUpdate("UPDATE orders SET created_at = ? WHERE order_id = ?", orderBackdates);
        jdbcTemplate.batchUpdate("UPDATE order_items SET created_at = ?, updated_at = ? WHERE order_item_id = ?", itemBackdates);
        jdbcTemplate.batchUpdate("UPDATE invoices SET invoice_date = ? WHERE invoice_id = ?", invoiceBackdates);
        jdbcTemplate.batchUpdate("UPDATE payments SET payment_date = ? WHERE payment_id = ?", paymentBackdates);
        if (!transactionBackdates.isEmpty())
        {
            jdbcTemplate.batchUpdate("UPDATE payment_transaction SET transaction_date = ? WHERE transaction_id = ?", transactionBackdates);
        }
    }

    private List<OrderItem> buildRandomOrderItems(Order order, List<Dish> dishes, LocalDateTime orderTime)
    {
        int itemCount = 1 + RNG.nextInt(5); // 1-5 món mỗi order
        List<OrderItem> items = new ArrayList<>();
        boolean hasNonCancelled = false;

        for (int i = 0; i < itemCount; i++)
        {
            Dish dish = dishes.get(RNG.nextInt(dishes.size()));
            int qty = 1 + RNG.nextInt(3);
            LocalDateTime itemTime = orderTime.plusMinutes(RNG.nextInt(10));
            boolean isLastItem = (i == itemCount - 1);

            OrderItemStatus status;
            if (!hasNonCancelled && isLastItem)
            {
                // Đảm bảo order luôn có ít nhất 1 món không bị huỷ (order đã thanh toán thành công)
                status = OrderItemStatus.COMPLETED;
            }
            else
            {
                status = RNG.nextInt(100) < 8 ? OrderItemStatus.CANCELLED : OrderItemStatus.COMPLETED;
            }
            if (status != OrderItemStatus.CANCELLED) hasNonCancelled = true;

            items.add(buildItem(order, dish, qty, null, status, itemTime));
        }
        return items;
    }

    // Random ngày trong khoảng [start, end], sau đó random giờ riêng trong khung
    // 8h00 - 19h59 (đảm bảo luôn <= 20h00) để khớp giờ hoạt động của nhà hàng.
    private LocalDateTime randomDateTimeBetween(LocalDateTime start, LocalDateTime end)
    {
        long startDay = start.toLocalDate().toEpochDay();
        long endDay = end.toLocalDate().toEpochDay();
        long randomDay = startDay + (long) (RNG.nextDouble() * (endDay - startDay + 1));
        LocalDate date = LocalDate.ofEpochDay(Math.min(randomDay, endDay));

        int hour = 8 + RNG.nextInt(12);   // 8 - 19h
        int minute = RNG.nextInt(60);
        return LocalDateTime.of(date, LocalTime.of(hour, minute));
    }


    // ══════════════════════════════════════════════════════════════════
    // 7 order đang phục vụ tại thời điểm hiện tại (khớp với 7 bàn đang
    // SERVING: T01, T02, T03, T05, T06, T07, T08). Mỗi order có 2-5 món,
    // từng món ở trạng thái COMPLETED hoặc PREPARING; chưa có Invoice/Payment
    // vì khách chưa thanh toán.
    //
    // Các order này chỉ lệch "vài chục phút" so với now() nên việc auditing
    // ghi đè createdAt = now() gần như không đáng kể — nhưng vẫn backdate lại
    // cho chính xác 100% (số lượng nhỏ nên update từng dòng, không cần batch).
    // ══════════════════════════════════════════════════════════════════
    private void seedLiveServingOrders()
    {
        List<RestaurantTable> allTables = tableRepository.findAll();
        allTables.sort(Comparator.comparing(RestaurantTable::getTableNumber));
        List<Dish> dishes = dishRepository.findAll();

        User waiter = userRepository.findAll().stream()
                .filter(u -> u.getRole() == RoleType.WAITER)
                .findFirst()
                .orElseThrow();

        List<String> servingTableNumbers = List.of("T01", "T02", "T03", "T05", "T06", "T07", "T08");
        LocalDateTime now = LocalDateTime.now();

        // Sinh createdAt trước cho từng bàn, rồi sort tăng dần theo thời gian
        // trước khi insert, để ID cũng tăng đúng thứ tự thời gian.
        record LivePlan(RestaurantTable table, LocalDateTime createdAt) {}

        List<LivePlan> plans = servingTableNumbers.stream()
                .map(tn -> new LivePlan(getTable(allTables, tn), now.minusMinutes(15 + RNG.nextInt(45))))
                .sorted(Comparator.comparing(LivePlan::createdAt))
                .toList();

        for (LivePlan plan : plans)
        {
            RestaurantTable table = plan.table();
            LocalDateTime createdAt = plan.createdAt();

            Order order = buildOrder(table, waiter, OrderStatus.SERVING, createdAt);

            int itemCount = 2 + RNG.nextInt(4);
            List<OrderItem> items = new ArrayList<>();
            for (int i = 0; i < itemCount; i++)
            {
                Dish dish = dishes.get(RNG.nextInt(dishes.size()));
                int qty = 1 + RNG.nextInt(3);
                LocalDateTime itemTime = createdAt.plusMinutes(2 + RNG.nextInt(10));
                OrderItemStatus status = RNG.nextBoolean() ? OrderItemStatus.COMPLETED : OrderItemStatus.PREPARING;
                items.add(buildItem(order, dish, qty, null, status, itemTime));
            }
            items.forEach(order::addOrderItem);

            recalcTotal(order, items);
            orderRepository.save(order);
            jdbcTemplate.update("UPDATE orders SET created_at = ? WHERE order_id = ?",
                    Timestamp.valueOf(createdAt), order.getId());

            for (OrderItem item : items)
            {
                jdbcTemplate.update("UPDATE order_items SET created_at = ?, updated_at = ? WHERE order_item_id = ?",
                        Timestamp.valueOf(item.getCreatedAt()), Timestamp.valueOf(item.getCreatedAt()), item.getId());
            }
        }
    }

    private Order buildOrder(RestaurantTable table, User createdBy, OrderStatus status, LocalDateTime createdAt)
    {
        Order order = new Order();
        order.setTable(table);
        order.setCreatedBy(createdBy);
        order.setStatus(status);
        order.setTotalAmount(BigDecimal.ZERO);   // recalculated by recalcTotal()
        order.setCreatedAt(createdAt);
        return order;
    }

    private OrderItem buildItem(Order order, Dish dish, int qty, String note,
                                OrderItemStatus status, LocalDateTime createdAt)
    {
        OrderItem item = new OrderItem();
        item.setOrder(order);
        item.setDish(dish);
        item.setDishNameSnapshot(dish.getName());
        item.setQuantity(qty);
        item.setUnitPrice(BigDecimal.valueOf(dish.getPrice()));
        item.setSubTotal(BigDecimal.valueOf((long) dish.getPrice() * qty));
        item.setNote(note);
        item.setStatus(status);
        item.setCreatedAt(createdAt);
        return item;
    }

    /**
     * Sums subtotals of non-CANCELLED items and updates the order's totalAmount.
     */
    private void recalcTotal(Order order, List<OrderItem> items)
    {
        BigDecimal total = items.stream()
                .filter(i -> i.getStatus() != OrderItemStatus.CANCELLED)
                .map(OrderItem::getSubTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        order.setTotalAmount(total);
    }

    private Invoice buildInvoice(Order order, LocalDateTime invoiceDate)
    {
        BigDecimal restaurantRevenueAmount =
                order.getTotalAmount() == null
                        ? BigDecimal.ZERO
                        : order.getTotalAmount().setScale(0, RoundingMode.HALF_UP);

        Invoice invoice = new Invoice();
        invoice.setOrder(order);
        invoice.setFinalAmount(
                restaurantRevenueAmount
                        .multiply(new BigDecimal("1.10"))
                        .setScale(0, RoundingMode.HALF_UP)
        );
        invoice.setRestaurantRevenueAmount(restaurantRevenueAmount);
        invoice.setInvoiceDate(invoiceDate);
        return invoice;
    }

    private Payment buildPayment(Invoice invoice, PaymentMethod method, LocalDateTime paymentDate)
    {
        Payment payment = new Payment();
        payment.setInvoice(invoice);
        payment.setPaymentMethod(method);
        payment.setAmount(invoice.getFinalAmount());
        payment.setSuccess(true);
        payment.setPaymentDate(paymentDate);
        return payment;
    }

    private PaymentTransaction buildPaymentTransaction(Payment payment, LocalDateTime transactionDate)
    {
        PaymentTransaction tx = new PaymentTransaction();
        tx.setPayment(payment);
        tx.setTransactionCode("QR" + (100_000_000 + RNG.nextInt(900_000_000)));
        tx.setGateway("VNPAY");
        tx.setGatewayResponse("{\"status\":\"SUCCESS\",\"code\":\"00\"}");
        tx.setSuccess(true);
        tx.setTransactionDate(transactionDate);
        return tx;
    }

    private void backfillInvoiceRestaurantRevenueAmount()
    {
        List<Invoice> invoices =
                invoiceRepository.findByRestaurantRevenueAmountIsNull();

        if (invoices.isEmpty())
        {
            return;
        }

        invoices.forEach(invoice ->
        {
            BigDecimal restaurantRevenueAmount;

            if (invoice.getOrder() != null && invoice.getOrder().getTotalAmount() != null)
            {
                restaurantRevenueAmount =
                        invoice.getOrder().getTotalAmount().setScale(0, RoundingMode.HALF_UP);
            } else
            {
                restaurantRevenueAmount = invoice.getFinalAmount()
                        .divide(new BigDecimal("1.10"), 0, RoundingMode.HALF_UP);
            }

            invoice.setRestaurantRevenueAmount(restaurantRevenueAmount);
        });

        invoiceRepository.saveAll(invoices);
    }


    // ══════════════════════════════════════════════════════════════════
    // Reservations – 5 đơn:
    //   2 đơn WAITING cách hiện tại 15 phút (khớp 2 bàn RESERVED: T04, T10)
    //   3 đơn QUEUED cho những ngày sắp tới (còn trong hàng chờ, chưa tới giờ)
    // ══════════════════════════════════════════════════════════════════
    private void seedReservations()
    {
        if (reservationRepository.count() > 0) return;

        List<RestaurantTable> allTables = tableRepository.findAll();
        RestaurantTable t04 = getTable(allTables, "T04");
        RestaurantTable t10 = getTable(allTables, "T10");
        RestaurantTable t09 = getTable(allTables, "T09");
        RestaurantTable t11 = getTable(allTables, "T11");
        RestaurantTable t12 = getTable(allTables, "T12");

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime arrivalSoon = now.plusMinutes(15);

        List<Reservation> reservations = List.of(
                buildReservation(t04, "Nguyễn Thị Lan", "0912345678",
                        arrivalSoon, "Kỷ niệm ngày cưới, cần bàn yên tĩnh", ReservationStatus.WAITING),
                buildReservation(t10, "Trần Văn Minh", "0987654321",
                        arrivalSoon, "Nhóm 6 người, cần ghế cao cho trẻ em", ReservationStatus.WAITING),
                buildReservation(t09, "Lê Thị Hoa", "0934567890",
                        now.plusDays(1).withHour(18).withMinute(30),
                        "Sinh nhật, cần trang trí bàn", ReservationStatus.QUEUED),
                buildReservation(t11, "Phạm Văn Đức", "0945678901",
                        now.plusDays(2).withHour(19).withMinute(0),
                        "Họp mặt gia đình 8 người", ReservationStatus.QUEUED),
                buildReservation(t12, "Hoàng Thị Mai", "0956789012",
                        now.plusDays(3).withHour(12).withMinute(0),
                        "Đặt bàn trưa, nhóm công ty", ReservationStatus.QUEUED)
        );

        reservationRepository.saveAll(reservations);
    }

    private Reservation buildReservation(RestaurantTable table, String customerName,
                                         String phone, LocalDateTime reservationTime, String note,
                                         ReservationStatus status)
    {
        Reservation r = new Reservation();
        r.setTable(table);
        r.setCustomerName(customerName);
        r.setPhone(phone);
        r.setReservationTime(reservationTime);
        r.setNote(note);
        r.setStatus(status);
        return r;
    }


    // ══════════════════════════════════════════════════════════════════
    // Utility helpers
    // ══════════════════════════════════════════════════════════════════
    private RestaurantTable getTable(List<RestaurantTable> tables, String tableNumber)
    {
        return tables.stream()
                .filter(t -> t.getTableNumber().equals(tableNumber))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Table not found: " + tableNumber));
    }
}