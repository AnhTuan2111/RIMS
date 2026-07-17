package vn.edu.fpt.swp391.g6.rimsapi.config;

import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.NonNull;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import vn.edu.fpt.swp391.g6.rimsapi.entity.*;
import vn.edu.fpt.swp391.g6.rimsapi.enums.*;
import vn.edu.fpt.swp391.g6.rimsapi.repository.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;


@Component
@RequiredArgsConstructor
public class DatabaseSeeder implements CommandLineRunner
{

    private static final String DEFAULT_PASSWORD = "123456";

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
    private final ReservationRepository reservationRepository;


    @Override
    public void run(String @NonNull ... args)
    {
        seedUsers();
        seedTables();
        seedCategoriesAndDishes();
        seedOrdersInvoicesAndPayments();
        seedReservations();
        backfillInvoiceRestaurantRevenueAmount();
        System.out.println("Database seeder done!");
    }

    // Users
    private void seedUsers()
    {
        if (userRepository.count() > 0) return;

        record UserDef(String username, String fullName, String email, String phone, RoleType role)
        {
        }

        List<UserDef> defs = List.of(
                new UserDef("admin", "Quản trị viên", "admin@rims.local", "0900000001", RoleType.ADMIN),
                new UserDef("chef", "Đầu bếp", "chef@rims.local", "0900000002", RoleType.CHEF),
                new UserDef("waiter", "Phục vụ", "waiter@rims.local", "0900000003", RoleType.WAITER),
                new UserDef("cashier", "Thu ngân", "cashier@rims.local", "0900000004", RoleType.CASHIER),
                new UserDef("customer", "Khách hàng", "customer@rims.local", "0900000005", RoleType.CUSTOMER)
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

    // Restaurant Tables  –  12 tables, status distribution:
    //   7 SERVING  : T01, T02, T03, T05, T06, T07, T08
    //   3 AVAILABLE: T09, T11, T12
    //   2 RESERVED : T04, T10

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

    /**
     * Maps table number (1–12) to the required status:
     * RESERVED : T04, T10
     * AVAILABLE: T09, T11, T12
     * SERVING  : T01, T02, T03, T05, T06, T07, T08   (7 tables)
     */
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


    // Categories & Dishes  –  3 categories, 30 dishes (15 food + 8 drinks + 7 desserts)

    private void seedCategoriesAndDishes()
    {
        if (dishRepository.count() > 0) return;

        Category food = buildCategory("Đồ ăn", "Các món ăn chính trong thực đơn");
        Category drink = buildCategory("Nước uống", "Đồ uống giải khát các loại");
        Category dessert = buildCategory("Đồ tráng miệng", "Bánh ngọt và món tráng miệng");
        categoryRepository.saveAll(List.of(food, drink, dessert));

        List<Dish> dishes = new ArrayList<>();

        // 15 Food dishes
        dishes.add(buildDish("Cơm chiên hải sản", "Cơm chiên với tôm, mực và rau củ tươi, thơm béo đậm đà", 85_000, "com-chien-hai-san.jpg", food));
        dishes.add(buildDish("Cơm gà nướng mật ong", "Cơm trắng dẻo kèm gà nướng mật ong vàng giòn hấp dẫn", 80_000, "com-ga-nuong.jpg", food));
        dishes.add(buildDish("Bò lúc lắc", "Thịt bò xào lúc lắc với ớt chuông, hành tây và sốt tiêu đen", 120_000, "bo-luc-lac.jpg", food));
        dishes.add(buildDish("Bún bò Huế", "Bún bò chuẩn vị Huế với chả cua, giò heo và sả tươi", 75_000, "bun-bo-hue.jpg", food));
        dishes.add(buildDish("Phở bò đặc biệt", "Phở bò truyền thống với tái, nạm, gân và nước dùng ninh 12 giờ", 70_000, "pho-bo.jpg", food));
        dishes.add(buildDish("Mì xào hải sản", "Mì trứng xào với tôm, mực, ngao và rau cải tươi giòn", 90_000, "mi-xao-hai-san.jpg", food));
        dishes.add(buildDish("Gà nướng ngũ vị", "Nửa con gà ta nướng ngũ vị hương, da giòn vàng ươm", 95_000, "ga-nuong.jpg", food));
        dishes.add(buildDish("Cá kho tộ", "Cá lóc kho tộ sốt caramel đậm đà, ăn kèm cơm trắng", 85_000, "ca-kho-to.jpg", food));
        dishes.add(buildDish("Lẩu thái hải sản", "Lẩu thái chua cay đặc trưng với tôm, mực và nấm kim châm", 320_000, "lau-thai.jpg", food));
        dishes.add(buildDish("Sườn nướng BBQ", "Sườn heo nướng than hoa sốt BBQ Mỹ, kèm khoai tây chiên", 130_000, "suon-nuong.jpg", food));
        dishes.add(buildDish("Bún chả Hà Nội", "Bún chả thịt nướng than hoa đúng điệu Hà Nội, nước chấm chuẩn", 65_000, "bun-cha.jpg", food));
        dishes.add(buildDish("Cơm tấm sườn bì", "Cơm tấm sườn nướng, bì lợn, chả trứng và đồ chua cà rốt", 75_000, "com-tam.jpg", food));
        dishes.add(buildDish("Bánh mì thịt nướng", "Bánh mì giòn nhân thịt nướng, rau sống, pate và đồ chua tươi", 35_000, "banh-mi.jpg", food));
        dishes.add(buildDish("Gỏi cuốn tôm thịt", "Gỏi cuốn bánh tráng tươi, tôm luộc, thịt heo và rau sống", 45_000, "goi-cuon.jpg", food));
        dishes.add(buildDish("Canh chua cá bông lau", "Canh chua miền Nam nấu với cá bông lau, me tươi và rau thơm", 95_000, "canh-chua.jpg", food));

        // 8 Drinks
        dishes.add(buildDish("Coca Cola", "Nước ngọt có ga Coca-Cola lon 330ml", 20_000, "coca-cola.jpg", drink));
        dishes.add(buildDish("Pepsi", "Nước ngọt có ga Pepsi lon 330ml", 20_000, "pepsi.jpg", drink));
        dishes.add(buildDish("Trà đào cam sả", "Trà đào cam sả mát lạnh, thanh ngọt đặc trưng", 35_000, "tra-dao.jpg", drink));
        dishes.add(buildDish("Trà chanh đường đá", "Trà xanh pha chanh tươi, đường đá mát lạnh giải nhiệt", 30_000, "tra-chanh.jpg", drink));
        dishes.add(buildDish("Cam ép tươi", "Nước cam vắt tươi 100%, không đường không đá", 40_000, "cam-ep.jpg", drink));
        dishes.add(buildDish("Chanh dây mật ong", "Nước chanh dây mật ong, vị chua ngọt tự nhiên kích thích vị giác", 35_000, "chanh-day.jpg", drink));
        dishes.add(buildDish("Matcha Latte", "Matcha Nhật hòa với sữa tươi và đá viên, vị thơm đặc biệt", 55_000, "matcha-latte.jpg", drink));
        dishes.add(buildDish("Cà phê sữa đá", "Cà phê phin Việt Nam truyền thống với sữa đặc và đá viên", 30_000, "ca-phe-sua-da.jpg", drink));

        // 7 Desserts
        dishes.add(buildDish("Bánh flan caramel", "Bánh flan mềm mịn sốt caramel đắng nhẹ, vị ngọt dịu hấp dẫn", 35_000, "banh-flan.jpg", dessert));
        dishes.add(buildDish("Chè khúc bạch", "Chè hạnh nhân, thạch sương sáo và vải lạnh ngọt mát thanh", 45_000, "che-khuc-bach.jpg", dessert));
        dishes.add(buildDish("Rau câu hoa quả", "Rau câu nhiều màu sắc hoa quả tươi, mát lạnh thanh đạm", 30_000, "rau-cau.jpg", dessert));
        dishes.add(buildDish("Kem vani dừa", "Kem vani Ý phủ mảnh dừa nạo và sốt chocolate đen", 40_000, "kem-vani.jpg", dessert));
        dishes.add(buildDish("Tiramisu", "Bánh Tiramisu Ý truyền thống, phủ bột cacao đắng thơm quyến rũ", 65_000, "tiramisu.jpg", dessert));
        dishes.add(buildDish("Bánh mousse chanh leo", "Bánh mousse chanh leo tươi, xốp nhẹ, vị chua ngọt hài hoà", 60_000, "banh-mousse.jpg", dessert));
        dishes.add(buildDish("Yogurt dâu tây", "Sữa chua Hy Lạp tự làm kết hợp mứt dâu tây và granola giòn", 40_000, "yogurt-dau.jpg", dessert));

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


    // Orders, Invoices, Payments
    //   10 orders: 3 COMPLETED (historical on SERVING tables) + 7 SERVING
    //   3 Invoices  →  one per COMPLETED order
    //   3 Payments  →  CASH, success = true, no PaymentTransactions

    private void seedOrdersInvoicesAndPayments()
    {
        if (orderRepository.count() > 0) return;

        List<RestaurantTable> allTables = tableRepository.findAll();
        allTables.sort(Comparator.comparing(RestaurantTable::getTableNumber));

        List<Dish> dishes = dishRepository.findAll();

        User waiter = userRepository.findAll().stream()
                .filter(u -> u.getRole() == RoleType.WAITER)
                .findFirst()
                .orElseThrow();

        // Dish references
        Dish phoBo = findDish(dishes, "Phở bò đặc biệt");
        Dish bunBoHue = findDish(dishes, "Bún bò Huế");
        Dish boLucLac = findDish(dishes, "Bò lúc lắc");
        Dish comChienHaiSan = findDish(dishes, "Cơm chiên hải sản");
        Dish comGaNuong = findDish(dishes, "Cơm gà nướng mật ong");
        Dish miXaoHaiSan = findDish(dishes, "Mì xào hải sản");
        Dish gaNuong = findDish(dishes, "Gà nướng ngũ vị");
        Dish caKhoTo = findDish(dishes, "Cá kho tộ");
        Dish suonNuong = findDish(dishes, "Sườn nướng BBQ");
        Dish bunCha = findDish(dishes, "Bún chả Hà Nội");
        Dish comTam = findDish(dishes, "Cơm tấm sườn bì");
        Dish canhChua = findDish(dishes, "Canh chua cá bông lau");
        Dish cocaCola = findDish(dishes, "Coca Cola");
        Dish pepsi = findDish(dishes, "Pepsi");
        Dish traDao = findDish(dishes, "Trà đào cam sả");
        Dish traChanh = findDish(dishes, "Trà chanh đường đá");
        Dish camEp = findDish(dishes, "Cam ép tươi");
        Dish matcha = findDish(dishes, "Matcha Latte");
        Dish caPhe = findDish(dishes, "Cà phê sữa đá");
        Dish banhFlan = findDish(dishes, "Bánh flan caramel");
        Dish tiramisu = findDish(dishes, "Tiramisu");
        Dish cheKhucBach = findDish(dishes, "Chè khúc bạch");
        Dish mousse = findDish(dishes, "Bánh mousse chanh leo");
        Dish yogurt = findDish(dishes, "Yogurt dâu tây");

        // Table references (all SERVING tables)
        RestaurantTable t01 = getTable(allTables, "T01");
        RestaurantTable t02 = getTable(allTables, "T02");
        RestaurantTable t03 = getTable(allTables, "T03");
        RestaurantTable t05 = getTable(allTables, "T05");
        RestaurantTable t06 = getTable(allTables, "T06");
        RestaurantTable t07 = getTable(allTables, "T07");
        RestaurantTable t08 = getTable(allTables, "T08");

        LocalDateTime now = LocalDateTime.now();

        // 3 COMPLETED orders (historical)

        Order comp1 = buildOrder(t01, waiter, OrderStatus.COMPLETED, now.minusHours(3));
        Order comp2 = buildOrder(t03, waiter, OrderStatus.COMPLETED, now.minusHours(2));
        Order comp3 = buildOrder(t05, waiter, OrderStatus.COMPLETED, now.minusHours(1));
        orderRepository.saveAll(List.of(comp1, comp2, comp3));

        List<OrderItem> completedItems = new ArrayList<>();

        // comp1: T01 (2 seats) – Phở bò × 1, Bún chả × 1, Trà đào × 2
        int c1Start = completedItems.size();
        completedItems.add(buildItem(comp1, phoBo, 1, null, OrderItemStatus.COMPLETED, now.minusHours(3).plusMinutes(2)));
        completedItems.add(buildItem(comp1, bunCha, 1, null, OrderItemStatus.COMPLETED, now.minusHours(3).plusMinutes(2)));
        completedItems.add(buildItem(comp1, traDao, 2, null, OrderItemStatus.COMPLETED, now.minusHours(3).plusMinutes(3)));
        recalcTotal(comp1, completedItems.subList(c1Start, completedItems.size()));

        // comp2: T03 (2 seats) – Cơm gà × 2, Coca × 1, Bánh flan × 1 (CANCELLED)
        int c2Start = completedItems.size();
        completedItems.add(buildItem(comp2, comGaNuong, 2, null, OrderItemStatus.COMPLETED, now.minusHours(2).plusMinutes(2)));
        completedItems.add(buildItem(comp2, cocaCola, 1, null, OrderItemStatus.COMPLETED, now.minusHours(2).plusMinutes(3)));
        completedItems.add(buildItem(comp2, banhFlan, 1, "Ít đường", OrderItemStatus.CANCELLED, now.minusHours(2).plusMinutes(5)));
        recalcTotal(comp2, completedItems.subList(c2Start, completedItems.size()));

        // comp3: T05 (4 seats) – Bò lúc lắc × 1, Cơm chiên hải sản × 1, Cam ép × 2, Tiramisu × 2
        int c3Start = completedItems.size();
        completedItems.add(buildItem(comp3, boLucLac, 1, null, OrderItemStatus.COMPLETED, now.minusHours(1).plusMinutes(2)));
        completedItems.add(buildItem(comp3, comChienHaiSan, 1, null, OrderItemStatus.COMPLETED, now.minusHours(1).plusMinutes(2)));
        completedItems.add(buildItem(comp3, camEp, 2, null, OrderItemStatus.COMPLETED, now.minusHours(1).plusMinutes(3)));
        completedItems.add(buildItem(comp3, tiramisu, 2, null, OrderItemStatus.COMPLETED, now.minusHours(1).plusMinutes(4)));
        recalcTotal(comp3, completedItems.subList(c3Start, completedItems.size()));

        orderRepository.saveAll(List.of(comp1, comp2, comp3));
        orderItemRepository.saveAll(completedItems);

        // ══ 7 SERVING orders ══════════════════════════════════════════════

        Order serv1 = buildOrder(t01, waiter, OrderStatus.SERVING, now.minusMinutes(55));
        Order serv2 = buildOrder(t02, waiter, OrderStatus.SERVING, now.minusMinutes(40));
        Order serv3 = buildOrder(t03, waiter, OrderStatus.SERVING, now.minusMinutes(30));
        Order serv4 = buildOrder(t05, waiter, OrderStatus.SERVING, now.minusMinutes(50));
        Order serv5 = buildOrder(t06, waiter, OrderStatus.SERVING, now.minusMinutes(25));
        Order serv6 = buildOrder(t07, waiter, OrderStatus.SERVING, now.minusMinutes(45));
        Order serv7 = buildOrder(t08, waiter, OrderStatus.SERVING, now.minusMinutes(20));
        orderRepository.saveAll(List.of(serv1, serv2, serv3, serv4, serv5, serv6, serv7));

        List<OrderItem> servingItems = new ArrayList<>();

        // serv1: T01 – Phở bò × 1 (COMPLETED), Cà phê sữa đá × 1 (PREPARING), Bánh flan × 1 (PREPARING)
        int s1Start = servingItems.size();
        servingItems.add(buildItem(serv1, phoBo, 1, null, OrderItemStatus.COMPLETED, now.minusMinutes(50)));
        servingItems.add(buildItem(serv1, caPhe, 1, "Ít đá", OrderItemStatus.PREPARING, now.minusMinutes(48)));
        servingItems.add(buildItem(serv1, banhFlan, 1, null, OrderItemStatus.PREPARING, now.minusMinutes(47)));
        recalcTotal(serv1, servingItems.subList(s1Start, servingItems.size()));

        // serv2: T02 – Bún bò Huế × 2 (PREPARING), Cam ép × 2 (COMPLETED), Chè khúc bạch × 1 (PREPARING)
        int s2Start = servingItems.size();
        servingItems.add(buildItem(serv2, bunBoHue, 2, "Thêm sả", OrderItemStatus.PREPARING, now.minusMinutes(38)));
        servingItems.add(buildItem(serv2, camEp, 2, null, OrderItemStatus.COMPLETED, now.minusMinutes(36)));
        servingItems.add(buildItem(serv2, cheKhucBach, 1, null, OrderItemStatus.PREPARING, now.minusMinutes(35)));
        recalcTotal(serv2, servingItems.subList(s2Start, servingItems.size()));

        // serv3: T03 – Cơm chiên hải sản × 1 (COMPLETED), Pepsi × 1 (CANCELLED), Trà đào × 1 (COMPLETED)
        int s3Start = servingItems.size();
        servingItems.add(buildItem(serv3, comChienHaiSan, 1, null, OrderItemStatus.COMPLETED, now.minusMinutes(28)));
        servingItems.add(buildItem(serv3, pepsi, 1, null, OrderItemStatus.CANCELLED, now.minusMinutes(27)));
        servingItems.add(buildItem(serv3, traDao, 1, null, OrderItemStatus.COMPLETED, now.minusMinutes(26)));
        recalcTotal(serv3, servingItems.subList(s3Start, servingItems.size()));

        // serv4: T05 – Gà nướng × 2 (COMPLETED), Mì xào hải sản × 1 (PREPARING), Matcha × 2 (COMPLETED), Mousse × 2 (PREPARING)
        int s4Start = servingItems.size();
        servingItems.add(buildItem(serv4, gaNuong, 2, null, OrderItemStatus.COMPLETED, now.minusMinutes(48)));
        servingItems.add(buildItem(serv4, miXaoHaiSan, 1, "Không cay", OrderItemStatus.PREPARING, now.minusMinutes(45)));
        servingItems.add(buildItem(serv4, matcha, 2, null, OrderItemStatus.COMPLETED, now.minusMinutes(44)));
        servingItems.add(buildItem(serv4, mousse, 2, null, OrderItemStatus.PREPARING, now.minusMinutes(40)));
        recalcTotal(serv4, servingItems.subList(s4Start, servingItems.size()));

        // serv5: T06 – Sườn nướng × 2 (PREPARING), Trà chanh × 2 (COMPLETED), Yogurt × 1 (PREPARING), Coca × 2 (COMPLETED)
        int s5Start = servingItems.size();
        servingItems.add(buildItem(serv5, suonNuong, 2, null, OrderItemStatus.PREPARING, now.minusMinutes(23)));
        servingItems.add(buildItem(serv5, traChanh, 2, "Ít đường", OrderItemStatus.COMPLETED, now.minusMinutes(22)));
        servingItems.add(buildItem(serv5, yogurt, 1, null, OrderItemStatus.PREPARING, now.minusMinutes(21)));
        servingItems.add(buildItem(serv5, cocaCola, 2, null, OrderItemStatus.COMPLETED, now.minusMinutes(20)));
        recalcTotal(serv5, servingItems.subList(s5Start, servingItems.size()));

        // serv6: T07 – Bò lúc lắc × 1 (COMPLETED), Cá kho tộ × 2 (PREPARING), Cà phê × 2 (COMPLETED), Tiramisu × 1 (PREPARING)
        int s6Start = servingItems.size();
        servingItems.add(buildItem(serv6, boLucLac, 1, null, OrderItemStatus.COMPLETED, now.minusMinutes(43)));
        servingItems.add(buildItem(serv6, caKhoTo, 2, "Ăn kèm cơm", OrderItemStatus.PREPARING, now.minusMinutes(40)));
        servingItems.add(buildItem(serv6, caPhe, 2, null, OrderItemStatus.COMPLETED, now.minusMinutes(39)));
        servingItems.add(buildItem(serv6, tiramisu, 1, null, OrderItemStatus.PREPARING, now.minusMinutes(38)));
        recalcTotal(serv6, servingItems.subList(s6Start, servingItems.size()));

        // serv7: T08 – Cơm tấm × 3 (PREPARING), Canh chua × 2 (PREPARING), Cam ép × 3 (COMPLETED), Bánh flan × 2 (COMPLETED), Chè × 1 (PREPARING)
        int s7Start = servingItems.size();
        servingItems.add(buildItem(serv7, comTam, 3, null, OrderItemStatus.PREPARING, now.minusMinutes(18)));
        servingItems.add(buildItem(serv7, canhChua, 2, "Thêm me", OrderItemStatus.PREPARING, now.minusMinutes(17)));
        servingItems.add(buildItem(serv7, camEp, 3, null, OrderItemStatus.COMPLETED, now.minusMinutes(16)));
        servingItems.add(buildItem(serv7, banhFlan, 2, null, OrderItemStatus.COMPLETED, now.minusMinutes(15)));
        servingItems.add(buildItem(serv7, cheKhucBach, 1, null, OrderItemStatus.PREPARING, now.minusMinutes(14)));
        recalcTotal(serv7, servingItems.subList(s7Start, servingItems.size()));

        orderRepository.saveAll(List.of(serv1, serv2, serv3, serv4, serv5, serv6, serv7));
        orderItemRepository.saveAll(servingItems);

        // 3 Invoices for COMPLETED orders

        Invoice inv1 = buildInvoice(comp1, now.minusHours(2).minusMinutes(45));
        Invoice inv2 = buildInvoice(comp2, now.minusHours(1).minusMinutes(45));
        Invoice inv3 = buildInvoice(comp3, now.minusMinutes(45));
        invoiceRepository.saveAll(List.of(inv1, inv2, inv3));

        // 3 CASH Payments (no PaymentTransactions for CASH)

        paymentRepository.saveAll(List.of(
                buildPayment(inv1, now.minusHours(2).minusMinutes(43)),
                buildPayment(inv2, now.minusHours(1).minusMinutes(43)),
                buildPayment(inv3, now.minusMinutes(43))
        ));
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

    private Payment buildPayment(Invoice invoice, LocalDateTime paymentDate)
    {
        Payment payment = new Payment();
        payment.setInvoice(invoice);
        payment.setPaymentMethod(PaymentMethod.CASH);
        payment.setAmount(invoice.getFinalAmount());
        payment.setSuccess(true);
        payment.setPaymentDate(paymentDate);
        return payment;
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
                // Tự chia trực tiếp inline để làm dữ liệu mẫu (thay vì gọi hàm đã xóa bên Invoice)
                restaurantRevenueAmount = invoice.getFinalAmount()
                        .divide(new BigDecimal("1.10"), 0, RoundingMode.HALF_UP);
            }

            invoice.setRestaurantRevenueAmount(restaurantRevenueAmount);
        });

        invoiceRepository.saveAll(invoices);
    }


    // Reservations  –  2 WAITING reservations on T04 and T10 (RESERVED tables)
    private void seedReservations()
    {
        if (reservationRepository.count() > 0) return;

        List<RestaurantTable> allTables = tableRepository.findAll();
        RestaurantTable t04 = getTable(allTables, "T04");
        RestaurantTable t10 = getTable(allTables, "T10");

        LocalDateTime arrivalTime = LocalDateTime.now().plusMinutes(15);

        reservationRepository.saveAll(List.of(
                buildReservation(t04, "Nguyễn Thị Lan", "0912345678",
                        arrivalTime, "Kỷ niệm ngày cưới, cần bàn yên tĩnh"),
                buildReservation(t10, "Trần Văn Minh", "0987654321",
                        arrivalTime, "Nhóm 6 người, cần ghế cao cho trẻ em")
        ));
    }

    private Reservation buildReservation(RestaurantTable table, String customerName,
                                         String phone, LocalDateTime reservationTime, String note)
    {
        Reservation r = new Reservation();
        r.setTable(table);
        r.setCustomerName(customerName);
        r.setPhone(phone);
        r.setReservationTime(reservationTime);
        r.setNote(note);
        r.setStatus(ReservationStatus.WAITING);
        return r;
    }


    // Utility helpers

    private Dish findDish(List<Dish> dishes, String name)
    {
        return dishes.stream()
                .filter(d -> d.getName().equals(name))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Dish not found: " + name));
    }

    private RestaurantTable getTable(List<RestaurantTable> tables, String tableNumber)
    {
        return tables.stream()
                .filter(t -> t.getTableNumber().equals(tableNumber))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Table not found: " + tableNumber));
    }
}
