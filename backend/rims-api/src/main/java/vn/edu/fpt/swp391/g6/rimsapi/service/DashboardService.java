package vn.edu.fpt.swp391.g6.rimsapi.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.menu.MenuDashboardResponse;
import vn.edu.fpt.swp391.g6.rimsapi.repository.CategoryRepository;
import vn.edu.fpt.swp391.g6.rimsapi.repository.DishRepository;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final DishRepository dishRepository;
    private final CategoryRepository categoryRepository;

    public MenuDashboardResponse getMenuDashboardData() {
        // 1. Lấy dữ liệu cho các thẻ chỉ số trên cùng
        long totalDishes = dishRepository.count();
        long totalCategories = categoryRepository.count();

        // Món ăn: true -> AVAILABLE, false -> PAUSED
        long totalPausedDishes = dishRepository.countByIsAvailable(false);

        // 2. Lấy danh sách 4 món mới thêm (Sắp xếp theo ngày tạo giảm dần)
        var latestDishes = dishRepository.findTop4ByOrderByCreatedAtDesc().stream()
                .map(dish -> MenuDashboardResponse.DishSummaryResponse.builder()
                        .id(dish.getId())
                        .name(dish.getName())
                        .categoryName(dish.getCategory().getName())
                        .price((double) dish.getPrice())
                        .imageUrl(dish.getImageUrl())
                        .status(dish.isAvailable() ? "AVAILABLE" : "PAUSED")
                        .build())
                .collect(Collectors.toList());

        // 3. Lấy dữ liệu thống kê danh mục
        var categoryStats = dishRepository.getCategoryStatistics().stream()
                .map(result -> {
                    // Ép kiểu phần tử thứ 2 từ Object sang Boolean (Giá trị của d.category.isAvailable)
                    Boolean isCategoryAvailable = (Boolean) result[1];

                    return MenuDashboardResponse.CategoryStatResponse.builder()
                            .categoryName((String) result[0])
                            .status(isCategoryAvailable != null && isCategoryAvailable ? "ACTIVE" : "HIDDEN") // true -> ACTIVE, false -> HIDDEN
                            .dishCount((Long) result[2])
                            .build();
                })
                .collect(Collectors.toList());

        // 4. Trả về object tổng hợp
        return MenuDashboardResponse.builder()
                .totalDishes(totalDishes)
                .totalCategories(totalCategories)
                .totalPausedDishes(totalPausedDishes)
                .totalHiddenDishes(0)
                .latestDishes(latestDishes)
                .categoryStats(categoryStats)
                .build();
    }
}