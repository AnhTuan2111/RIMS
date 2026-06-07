package vn.edu.fpt.swp391.g6.rimsapi.config;

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
public class ChefDatabaseSeeder implements CommandLineRunner {

    private final RestaurantTableRepository tableRepository;
    private final UserRepository userRepository;
    private final DishRepository dishRepository;
    private final CategoryRepository categoryRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;

    @Override
    public void run(String... args) {

        seedTables();
        seedUsers();
        seedCategoriesAndDishes();
        seedOrders();

        printDatabaseInfo();
    }

    private void seedTables() {

        if (tableRepository.count() > 0) {
            return;
        }

        for (int i = 1; i <= 12; i++) {

            RestaurantTable table = new RestaurantTable();

            table.setTableNumber(String.format("T%02d", i));
            table.setCapacity(4);
            table.setStatus(TableStatus.AVAILABLE);

            tableRepository.save(table);
        }

        System.out.println("Seeded restaurant tables.");
    }

    private void seedUsers() {

        if (userRepository.count() > 0) {
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

    private void seedCategoriesAndDishes() {

        if (dishRepository.count() > 0) {
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

    private void seedOrders() {

        if (orderRepository.count() > 0) {
            return;
        }

        RestaurantTable table =
                tableRepository.findAll().get(0);

        User user =
                userRepository.findAll().get(0);

        List<Dish> dishes =
                dishRepository.findAll();

        Order order = new Order();

        order.setTable(table);
        order.setCreatedBy(user);
        order.setStatus(OrderStatus.SERVING);
        order.setTotalAmount(
                BigDecimal.valueOf(165000));

        orderRepository.save(order);

        OrderItem item1 = new OrderItem();

        item1.setOrder(order);
        item1.setDish(dishes.get(0));
        item1.setQuantity(2);

        item1.setUnitPrice(
                BigDecimal.valueOf(
                        dishes.get(0).getPrice()));

        item1.setSubTotal(
                BigDecimal.valueOf(
                        dishes.get(0).getPrice() * 2));

        item1.setNote("Less spicy");
        item1.setStatus(
                OrderItemStatus.PREPARING);

        OrderItem item2 = new OrderItem();

        item2.setOrder(order);
        item2.setDish(dishes.get(1));
        item2.setQuantity(1);

        item2.setUnitPrice(
                BigDecimal.valueOf(
                        dishes.get(1).getPrice()));

        item2.setSubTotal(
                BigDecimal.valueOf(
                        dishes.get(1).getPrice()));

        item2.setNote("No onion");
        item2.setStatus(
                OrderItemStatus.COMPLETED);

        orderItemRepository.save(item1);
        orderItemRepository.save(item2);

        System.out.println(
                "Seeded orders and order items.");
    }

    private void printDatabaseInfo() {

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