package vn.edu.fpt.swp391.g6.rimsapi.service;

import vn.edu.fpt.swp391.g6.rimsapi.dto.response.menu.DishResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.menu.CreateDishRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.menu.UpdateDishRequest;
import java.util.List;

public interface DishService {
    List<DishResponse> getAllDishes();
    List<DishResponse> getDishesByCategory(Integer categoryId);
    List<DishResponse> getAvailableDishes();
    DishResponse getDishById(Integer id);
    List<DishResponse> searchDishes(String keyword);
    DishResponse createDish(CreateDishRequest createDishRequest);
    DishResponse updateDish(Integer id, UpdateDishRequest updateDishRequest);  // ✅ Thêm
    void deleteDish(Integer id);
}