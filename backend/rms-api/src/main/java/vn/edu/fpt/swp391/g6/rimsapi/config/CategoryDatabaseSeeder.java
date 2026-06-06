package vn.edu.fpt.swp391.g6.rimsapi.config;

import vn.edu.fpt.swp391.g6.rimsapi.entity.Category;
import vn.edu.fpt.swp391.g6.rimsapi.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import java.util.Arrays;
import java.util.List;
import org.springframework.core.annotation.Order;
@Component
@RequiredArgsConstructor
@Order(1)
public class CategoryDatabaseSeeder implements CommandLineRunner {

    private final CategoryRepository categoryRepository;

    @Override
    public void run(String... args) throws Exception {
        if (categoryRepository.count() == 0) {
            List<Category> categories = Arrays.asList(
                    createCategory("Món khai vị", "Các món ăn nhẹ khai vị"),
                    createCategory("Món chính", "Các món chính đa dạng"),
                    createCategory("Món tráng miệng", "Các món ngọt tráng miệng"),
                    createCategory("Đồ uống", "Các loại nước uống giải khát"),
                    createCategory("Món hải sản", "Các món ăn từ hải sản tươi sống")
            );
            categoryRepository.saveAll(categories);
            System.out.println("✅ Đã tạo " + categories.size() + " categories mẫu!");
        }
    }

    private Category createCategory(String name, String description) {
        Category category = new Category();
        category.setName(name);
        category.setDescription(description);
        return category;
    }
}