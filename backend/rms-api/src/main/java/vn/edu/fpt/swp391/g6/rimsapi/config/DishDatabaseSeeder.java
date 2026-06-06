package vn.edu.fpt.swp391.g6.rimsapi.config;

import vn.edu.fpt.swp391.g6.rimsapi.entity.Category;
import vn.edu.fpt.swp391.g6.rimsapi.entity.Dish;
import vn.edu.fpt.swp391.g6.rimsapi.repository.CategoryRepository;
import vn.edu.fpt.swp391.g6.rimsapi.repository.DishRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import java.util.Arrays;
import java.util.List;

@Component
@RequiredArgsConstructor
@Order(2)  // Chạy sau CategoryDatabaseSeeder
public class DishDatabaseSeeder implements CommandLineRunner {

    private final DishRepository dishRepository;
    private final CategoryRepository categoryRepository;

    @Override
    public void run(String... args) throws Exception {
        // Chỉ thêm nếu chưa có món ăn nào
        if (dishRepository.count() == 0) {

            // Lấy categories từ database - kiểm tra null
            Category khaiVi = categoryRepository.findById(1).orElse(null);
            Category monChinh = categoryRepository.findById(2).orElse(null);
            Category trangMieng = categoryRepository.findById(3).orElse(null);
            Category doUong = categoryRepository.findById(4).orElse(null);
            Category haiSan = categoryRepository.findById(5).orElse(null);

            // Kiểm tra nếu category null thì không insert
            if (khaiVi == null || monChinh == null || trangMieng == null || doUong == null || haiSan == null) {
                System.out.println("⚠️ Chưa có categories, bỏ qua tạo món ăn mẫu!");
                return;
            }

            List<Dish> dishes = Arrays.asList(
                    createDish("Gỏi cuốn tôm thịt", "Gỏi cuốn tươi ngon, chấm nước mắm chua ngọt", 35000, true, null, khaiVi),
                    createDish("Chả giò chiên giòn", "Chả giò nhân thịt, tôm, miến", 45000, true, null, khaiVi),
                    createDish("Phở bò đặc biệt", "Phở bò với thịt bò thượng hạng", 85000, true, null, monChinh),
                    createDish("Cơm tấm sườn", "Cơm tấm sườn bì chả", 55000, true, null, monChinh),
                    createDish("Bún bò Huế", "Bún bò Huế cay đậm đà", 75000, true, null, monChinh),
                    createDish("Chè bưởi", "Chè bưởi Huế thơm ngon", 30000, true, null, trangMieng),
                    createDish("Kem dừa", "Kem dừa tươi mát lạnh", 25000, true, null, trangMieng),
                    createDish("Cà phê sữa đá", "Cà phê Việt Nam đậm đà", 25000, true, null, doUong),
                    createDish("Trà đào cam sả", "Trà đào thơm mát", 35000, true, null, doUong),
                    createDish("Tôm hấp bia", "Tôm hấp bia thơm ngon", 120000, true, null, haiSan),
                    createDish("Mực chiên mắm tỏi", "Mực tươi chiên giòn", 110000, true, null, haiSan)
            );

            dishRepository.saveAll(dishes);
            System.out.println("✅ Đã tạo " + dishes.size() + " món ăn mẫu!");
        }
    }

    private Dish createDish(String name, String description, int price, boolean isAvailable, String imageUrl, Category category) {
        Dish dish = new Dish();
        dish.setName(name);
        dish.setDescription(description);
        dish.setPrice(price);
        dish.setAvailable(isAvailable);
        dish.setImageUrl(imageUrl);
        dish.setCategory(category);
        return dish;
    }
}