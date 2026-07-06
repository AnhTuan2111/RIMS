package vn.edu.fpt.swp391.g6.rimsapi.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.menu.MenuDashboardResponse;
import vn.edu.fpt.swp391.g6.rimsapi.repository.CategoryRepository;
import vn.edu.fpt.swp391.g6.rimsapi.repository.DishRepository;
import vn.edu.fpt.swp391.g6.rimsapi.service.DashboardService;

import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService
{
    private final DishRepository dishRepository;
    private final CategoryRepository categoryRepository;

    @Override
    public MenuDashboardResponse getMenuDashboardData()
    {
        long totalDishes = dishRepository.count();
        long totalCategories = categoryRepository.count();
        long totalPausedDishes = dishRepository.countByIsAvailable(false);

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

        var categoryStats = dishRepository.getCategoryStatistics().stream()
                .map(result ->
                {
                    Boolean isCategoryAvailable = (Boolean) result[1];
                    return MenuDashboardResponse.CategoryStatResponse.builder()
                            .categoryName((String) result[0])
                            .status(isCategoryAvailable != null && isCategoryAvailable ? "ACTIVE" : "HIDDEN")
                            .dishCount((Long) result[2])
                            .build();
                })
                .collect(Collectors.toList());

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