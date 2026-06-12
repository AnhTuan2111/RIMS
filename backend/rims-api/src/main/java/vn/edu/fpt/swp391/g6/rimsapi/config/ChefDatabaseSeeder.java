package vn.edu.fpt.swp391.g6.rimsapi.config;

import java.time.LocalDateTime;
import java.util.concurrent.TimeUnit;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import vn.edu.fpt.swp391.g6.rimsapi.entity.*;
import vn.edu.fpt.swp391.g6.rimsapi.enums.OrderItemStatus;
import vn.edu.fpt.swp391.g6.rimsapi.enums.OrderStatus;
import vn.edu.fpt.swp391.g6.rimsapi.enums.RoleType;
import vn.edu.fpt.swp391.g6.rimsapi.enums.TableStatus;
import vn.edu.fpt.swp391.g6.rimsapi.repository.*;

import java.math.BigDecimal;
import java.util.List;


@Component
@RequiredArgsConstructor
public class ChefDatabaseSeeder implements CommandLineRunner
{

    private final RestaurantTableRepository tableRepository;
    private final UserRepository userRepository;
    private final DishRepository dishRepository;
    private final CategoryRepository categoryRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;

    @Override
    public void run(String... args) throws Exception
    {

        seedTables();
        seedUsers();
        seedCategoriesAndDishes();
        seedOrders();

        printDatabaseInfo();
    }

    private void seedTables()
    {

        if (tableRepository.count() > 0)
        {
            return;
        }

        for (int i = 1; i <= 12; i++)
        {

            RestaurantTable table = new RestaurantTable();

            table.setTableNumber(String.format("T%02d", i));
            table.setCapacity(4);
            table.setStatus(TableStatus.AVAILABLE);

            tableRepository.save(table);
        }

        System.out.println("Seeded restaurant tables.");
    }

    private void seedUsers()
    {

        if (userRepository.count() > 0)
        {
            return;
        }

        User chef = new User();

        chef.setUsername("chef01");
        chef.setFullName("Chef Manager");
        chef.setEmail("chef@gmail.com");
        chef.setPhone("0123456789");
        chef.setPasswordHash("123456");
        chef.setRole(RoleType.CHEF);
        chef.setActive(true);

        userRepository.save(chef);

        System.out.println("Seeded chef user.");
    }

    private void seedCategoriesAndDishes()
    {

        if (dishRepository.count() > 0)
        {
            return;
        }

        Category mainCourse = new Category();
        mainCourse.setName("Main Course");
        mainCourse.setDescription("Main dishes");

        Category drink = new Category();
        drink.setName("Drink");
        drink.setDescription("Beverages");

        categoryRepository.save(mainCourse);
        categoryRepository.save(drink);

        Dish d1 = new Dish();
        d1.setName("Fried Rice");
        d1.setDescription("Traditional fried rice");
        d1.setPrice(50000);
        d1.setImageUrl("fried-rice.jpg");
        d1.setAvailable(true);
        d1.setCategory(mainCourse);

        Dish d2 = new Dish();
        d2.setName("Pho Bo");
        d2.setDescription("Vietnamese beef noodle soup");
        d2.setPrice(65000);
        d2.setImageUrl("pho-bo.jpg");
        d2.setAvailable(true);
        d2.setCategory(mainCourse);

        Dish d3 = new Dish();
        d3.setName("Bun Cha");
        d3.setDescription("Grilled pork with noodles");
        d3.setPrice(60000);
        d3.setImageUrl("bun-cha.jpg");
        d3.setAvailable(true);
        d3.setCategory(mainCourse);

        Dish d4 = new Dish();
        d4.setName("Coca Cola");
        d4.setDescription("Soft drink");
        d4.setPrice(15000);
        d4.setImageUrl("coca-cola.jpg");
        d4.setAvailable(true);
        d4.setCategory(drink);

        Dish d5 = new Dish();
        d5.setName("Orange Juice");
        d5.setDescription("Fresh orange juice");
        d5.setPrice(25000);
        d5.setImageUrl("orange-juice.jpg");
        d5.setAvailable(true);
        d5.setCategory(drink);

        dishRepository.saveAll(
                List.of(d1, d2, d3, d4, d5)
        );

        System.out.println("Seeded categories and dishes.");
    }

    private void seedOrders() throws InterruptedException
    {

        if (orderRepository.count() > 0)
        {
            return;
        }

        List<RestaurantTable> tables = tableRepository.findAll();
        List<Dish> dishes = dishRepository.findAll();
        User user = userRepository.findAll().get(0);

        // ===== ORDER T01 =====
        Order order1 = new Order();
        order1.setTable(tables.get(0));
        order1.setCreatedBy(user);
        order1.setStatus(OrderStatus.SERVING);
        order1.setTotalAmount(BigDecimal.valueOf(140000));
        orderRepository.save(order1);

        // ===== ORDER T02 =====
        Order order2 = new Order();
        order2.setTable(tables.get(1));
        order2.setCreatedBy(user);
        order2.setStatus(OrderStatus.SERVING);
        order2.setTotalAmount(BigDecimal.valueOf(200000));
        orderRepository.save(order2);

        // ===== ORDER T03 =====
        Order order3 = new Order();
        order3.setTable(tables.get(2));
        order3.setCreatedBy(user);
        order3.setStatus(OrderStatus.SERVING);
        order3.setTotalAmount(BigDecimal.valueOf(180000));
        orderRepository.save(order3);

        // ===== ORDER T04 =====
        Order order4 = new Order();
        order4.setTable(tables.get(3));
        order4.setCreatedBy(user);
        order4.setStatus(OrderStatus.SERVING);
        order4.setTotalAmount(BigDecimal.valueOf(220000));
        orderRepository.save(order4);

        // ================= T01 =================
        OrderItem item1 = new OrderItem();
        item1.setOrder(order1);
        item1.setDish(dishes.get(0)); // Fried Rice
        item1.setQuantity(2);
        item1.setUnitPrice(BigDecimal.valueOf(dishes.get(0).getPrice()));
        item1.setSubTotal(BigDecimal.valueOf(dishes.get(0).getPrice() * 2));
        item1.setNote("Less spicy");
        item1.setStatus(OrderItemStatus.PREPARING);

        OrderItem item2 = new OrderItem();
        item2.setOrder(order1);
        item2.setDish(dishes.get(3)); // Coca Cola
        item2.setQuantity(2);
        item2.setUnitPrice(BigDecimal.valueOf(dishes.get(3).getPrice()));
        item2.setSubTotal(BigDecimal.valueOf(dishes.get(3).getPrice() * 2));
        item2.setNote("");
        item2.setStatus(OrderItemStatus.PREPARING);

        OrderItem item3 = new OrderItem();
        item3.setOrder(order1);
        item3.setDish(dishes.get(4)); // Orange Juice
        item3.setQuantity(1);
        item3.setUnitPrice(BigDecimal.valueOf(dishes.get(4).getPrice()));
        item3.setSubTotal(BigDecimal.valueOf(dishes.get(4).getPrice()));
        item3.setStatus(OrderItemStatus.COMPLETED);

        // ================= T02 =================
        OrderItem item4 = new OrderItem();
        item4.setOrder(order2);
        item4.setDish(dishes.get(1)); // Pho Bo
        item4.setQuantity(1);
        item4.setUnitPrice(BigDecimal.valueOf(dishes.get(1).getPrice()));
        item4.setSubTotal(BigDecimal.valueOf(dishes.get(1).getPrice()));
        item4.setStatus(OrderItemStatus.PREPARING);

        OrderItem item5 = new OrderItem();
        item5.setOrder(order2);
        item5.setDish(dishes.get(2)); // Bun Cha
        item5.setQuantity(2);
        item5.setUnitPrice(BigDecimal.valueOf(dishes.get(2).getPrice()));
        item5.setSubTotal(BigDecimal.valueOf(dishes.get(2).getPrice() * 2));
        item5.setStatus(OrderItemStatus.PREPARING);

        OrderItem item6 = new OrderItem();
        item6.setOrder(order2);
        item6.setDish(dishes.get(3)); // Coca Cola
        item6.setQuantity(1);
        item6.setUnitPrice(BigDecimal.valueOf(dishes.get(3).getPrice()));
        item6.setSubTotal(BigDecimal.valueOf(dishes.get(3).getPrice()));
        item6.setStatus(OrderItemStatus.COMPLETED);

        // ================= T03 =================
        OrderItem item7 = new OrderItem();
        item7.setOrder(order3);
        item7.setDish(dishes.get(0)); // Fried Rice
        item7.setQuantity(1);
        item7.setUnitPrice(BigDecimal.valueOf(dishes.get(0).getPrice()));
        item7.setSubTotal(BigDecimal.valueOf(dishes.get(0).getPrice()));
        item7.setStatus(OrderItemStatus.PREPARING);

        OrderItem item8 = new OrderItem();
        item8.setOrder(order3);
        item8.setDish(dishes.get(1)); // Pho Bo
        item8.setQuantity(1);
        item8.setUnitPrice(BigDecimal.valueOf(dishes.get(1).getPrice()));
        item8.setSubTotal(BigDecimal.valueOf(dishes.get(1).getPrice()));
        item8.setStatus(OrderItemStatus.PREPARING);

        OrderItem item9 = new OrderItem();
        item9.setOrder(order3);
        item9.setDish(dishes.get(4)); // Orange Juice
        item9.setQuantity(2);
        item9.setUnitPrice(BigDecimal.valueOf(dishes.get(4).getPrice()));
        item9.setSubTotal(BigDecimal.valueOf(dishes.get(4).getPrice() * 2));
        item9.setStatus(OrderItemStatus.COMPLETED);

        // ================= T04 =================
        OrderItem item10 = new OrderItem();
        item10.setOrder(order4);
        item10.setDish(dishes.get(2)); // Bun Cha
        item10.setQuantity(3);
        item10.setUnitPrice(BigDecimal.valueOf(dishes.get(2).getPrice()));
        item10.setSubTotal(BigDecimal.valueOf(dishes.get(2).getPrice() * 3));
        item10.setStatus(OrderItemStatus.PREPARING);

        OrderItem item11 = new OrderItem();
        item11.setOrder(order4);
        item11.setDish(dishes.get(0)); // Fried Rice
        item11.setQuantity(2);
        item11.setUnitPrice(BigDecimal.valueOf(dishes.get(0).getPrice()));
        item11.setSubTotal(BigDecimal.valueOf(dishes.get(0).getPrice() * 2));
        item11.setStatus(OrderItemStatus.PREPARING);

        OrderItem item12 = new OrderItem();
        item12.setOrder(order4);
        item12.setDish(dishes.get(3)); // Coca Cola
        item12.setQuantity(2);
        item12.setUnitPrice(BigDecimal.valueOf(dishes.get(3).getPrice()));
        item12.setSubTotal(BigDecimal.valueOf(dishes.get(3).getPrice() * 2));
        item12.setStatus(OrderItemStatus.COMPLETED);

        item1.setCreatedAt(LocalDateTime.now());
        orderItemRepository.save(item1);
        TimeUnit.SECONDS.sleep(2);

        item2.setCreatedAt(LocalDateTime.now());
        orderItemRepository.save(item2);
        TimeUnit.SECONDS.sleep(2);

        item3.setCreatedAt(LocalDateTime.now());
        orderItemRepository.save(item3);
        TimeUnit.SECONDS.sleep(2);

        item4.setCreatedAt(LocalDateTime.now());
        orderItemRepository.save(item4);
        TimeUnit.SECONDS.sleep(2);

        item5.setCreatedAt(LocalDateTime.now());
        orderItemRepository.save(item5);
        TimeUnit.SECONDS.sleep(2);

        item6.setCreatedAt(LocalDateTime.now());
        orderItemRepository.save(item6);
        TimeUnit.SECONDS.sleep(2);

        item7.setCreatedAt(LocalDateTime.now());
        orderItemRepository.save(item7);
        TimeUnit.SECONDS.sleep(2);

        item8.setCreatedAt(LocalDateTime.now());
        orderItemRepository.save(item8);
        TimeUnit.SECONDS.sleep(2);

        item9.setCreatedAt(LocalDateTime.now());
        orderItemRepository.save(item9);
        TimeUnit.SECONDS.sleep(2);

        item10.setCreatedAt(LocalDateTime.now());
        orderItemRepository.save(item10);
        TimeUnit.SECONDS.sleep(2);

        item11.setCreatedAt(LocalDateTime.now());
        orderItemRepository.save(item11);
        TimeUnit.SECONDS.sleep(2);

        item12.setCreatedAt(LocalDateTime.now());
        orderItemRepository.save(item12);

        System.out.println("Seeded orders and order items.");
    }

    private void printDatabaseInfo()
    {

        System.out.println("\n=================================");
        System.out.println("CHEF DATABASE CHECK");
        System.out.println("=================================");

        System.out.println(
                "Tables     : " +
                        tableRepository.count());

        System.out.println(
                "Users      : " +
                        userRepository.count());

        System.out.println(
                "Categories : " +
                        categoryRepository.count());

        System.out.println(
                "Dishes     : " +
                        dishRepository.count());

        System.out.println(
                "Orders     : " +
                        orderRepository.count());

        System.out.println(
                "OrderItems : " +
                        orderItemRepository.count());

        System.out.println("=================================\n");
    }
}