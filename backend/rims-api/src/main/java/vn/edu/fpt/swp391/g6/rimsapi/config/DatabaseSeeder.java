package vn.edu.fpt.swp391.g6.rimsapi.config;

import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.NonNull;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import vn.edu.fpt.swp391.g6.rimsapi.entity.*;
import vn.edu.fpt.swp391.g6.rimsapi.enums.OrderItemStatus;
import vn.edu.fpt.swp391.g6.rimsapi.enums.OrderStatus;
import vn.edu.fpt.swp391.g6.rimsapi.enums.RoleType;
import vn.edu.fpt.swp391.g6.rimsapi.enums.TableStatus;
import vn.edu.fpt.swp391.g6.rimsapi.repository.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
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


    @Override
    public void run(String @NonNull ... args)
    {
        seedTables();
        seedUsers();
        seedCategoriesAndDishes();
        seedOrders();
    }


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
                tables.add(buildTable(String.format("T%02d", tableNumber), capacity));
            }
        }

        tableRepository.saveAll(tables);
    }

    private RestaurantTable buildTable(String tableNumber, int capacity)
    {
        RestaurantTable table = new RestaurantTable();
        table.setTableNumber(tableNumber);
        table.setCapacity(capacity);

        if (capacity == 2)
        {
            table.setStatus(TableStatus.SERVING);
        } else
        {
            table.setStatus(TableStatus.AVAILABLE);
        }

        return table;
    }

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
                new UserDef("cashier", "Thu ngân", "cashier@rims.local", "0900000004", RoleType.CASHIER)
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

    private void seedCategoriesAndDishes()
    {
        if (dishRepository.count() > 0) return;

        Category mainCourse = buildCategory("Main Course", "Các món chính");
        Category drink = buildCategory("Drink", "Đồ uống");
        categoryRepository.saveAll(List.of(mainCourse, drink));

        List<Dish> dishes = List.of(
                buildDish("Fried Rice", "Cơm chiên truyền thống", 50_000, "fried-rice.jpg", mainCourse),
                buildDish("Pho Bo", "Phở bò đặc biệt", 65_000, "pho-bo.jpg", mainCourse),
                buildDish("Bun Cha", "Bún chả thịt nướng", 60_000, "bun-cha.jpg", mainCourse),
                buildDish("Coca Cola", "Nước ngọt có ga", 15_000, "coca-cola.jpg", drink),
                buildDish("Orange Juice", "Nước cam ép tươi", 25_000, "orange-juice.jpg", drink)
        );

        dishRepository.saveAll(dishes);
    }

    private Category buildCategory(String name, String description)
    {
        Category category = new Category();
        category.setName(name);
        category.setDescription(description);
        return category;
    }

    private Dish buildDish(String name, String description, int price, String imageUrl, Category category)
    {
        Dish dish = new Dish();
        dish.setName(name);
        dish.setDescription(description);
        dish.setPrice(price);
        dish.setImageUrl(imageUrl);
        dish.setAvailable(true);
        dish.setCategory(category);
        return dish;
    }

    private void seedOrders()
    {
        if (orderRepository.count() > 0) return;

        List<RestaurantTable> tables = tableRepository.findAll();
        List<Dish> dishes = dishRepository.findAll();
        User waiter = userRepository.findAll().getFirst();

        // Dish indices (by seeding order): 0=FriedRice, 1=PhoBo, 2=Bun Cha, 3=Coca-Cola, 4=OrangeJuice
        Dish friedRice = dishes.get(0);
        Dish phoBo = dishes.get(1);
        Dish bunCha = dishes.get(2);
        Dish cocaCola = dishes.get(3);
        Dish orangeJuice = dishes.get(4);

        record ItemDef(Order order, Dish dish, int qty, String note, OrderItemStatus status)
        {
        }

        // Build orders
        Order order1 = buildOrder(tables.get(0), waiter, 140_000);
        Order order2 = buildOrder(tables.get(1), waiter, 200_000);
        Order order3 = buildOrder(tables.get(2), waiter, 180_000);
        Order order4 = buildOrder(tables.get(3), waiter, 220_000);
        orderRepository.saveAll(List.of(order1, order2, order3, order4));

        // Build order items
        List<ItemDef> itemDefs = List.of(
                // T01
                new ItemDef(order1, friedRice, 2, "Less spicy", OrderItemStatus.PREPARING),
                new ItemDef(order1, cocaCola, 2, null, OrderItemStatus.PREPARING),
                new ItemDef(order1, orangeJuice, 1, null, OrderItemStatus.COMPLETED),
                // T02
                new ItemDef(order2, phoBo, 1, null, OrderItemStatus.PREPARING),
                new ItemDef(order2, bunCha, 2, "No onions", OrderItemStatus.PREPARING),
                new ItemDef(order2, cocaCola, 1, null, OrderItemStatus.COMPLETED),
                // T03
                new ItemDef(order3, friedRice, 1, null, OrderItemStatus.PREPARING),
                new ItemDef(order3, phoBo, 1, null, OrderItemStatus.PREPARING),
                new ItemDef(order3, orangeJuice, 2, null, OrderItemStatus.COMPLETED),
                // T04
                new ItemDef(order4, bunCha, 3, null, OrderItemStatus.PREPARING),
                new ItemDef(order4, friedRice, 2, null, OrderItemStatus.PREPARING),
                new ItemDef(order4, cocaCola, 2, null, OrderItemStatus.COMPLETED)
        );

        LocalDateTime now = LocalDateTime.now();
        List<OrderItem> items = new ArrayList<>();
        for (int i = 0; i < itemDefs.size(); i++)
        {
            ItemDef def = itemDefs.get(i);
            long offset = (long) (itemDefs.size() - i) * 2;  // 2s apart, newest last
            items.add(buildOrderItem(def.order(), def.dish(), def.qty(), def.note(), def.status(),
                    now.minusSeconds(offset)));
        }

        orderItemRepository.saveAll(items);
    }

    private Order buildOrder(RestaurantTable table, User createdBy, long totalAmount)
    {
        Order order = new Order();
        order.setTable(table);
        order.setCreatedBy(createdBy);
        order.setStatus(OrderStatus.SERVING);
        order.setTotalAmount(BigDecimal.valueOf(totalAmount));
        return order;
    }

    private OrderItem buildOrderItem(Order order, Dish dish, int quantity, String note,
                                     OrderItemStatus status, LocalDateTime createdAt)
    {
        OrderItem item = new OrderItem();
        item.setOrder(order);
        item.setDish(dish);
        item.setQuantity(quantity);
        item.setUnitPrice(BigDecimal.valueOf(dish.getPrice()));
        item.setSubTotal(BigDecimal.valueOf((long) dish.getPrice() * quantity));
        item.setNote(note);
        item.setStatus(status);
        item.setCreatedAt(createdAt);
        return item;
    }
}
