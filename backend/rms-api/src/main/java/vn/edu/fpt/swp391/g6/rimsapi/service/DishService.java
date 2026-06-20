package vn.edu.fpt.swp391.g6.rimsapi.service;

import vn.edu.fpt.swp391.g6.rimsapi.dto.response.DishResponseDTO;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.DishCreateDTO;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.DishUpdateDTO;
import java.util.List;

public interface DishService {
    List<DishResponseDTO> getAllDishes();
    List<DishResponseDTO> getDishesByCategory(Integer categoryId);
    List<DishResponseDTO> getAvailableDishes();
    DishResponseDTO getDishById(Integer id);
    List<DishResponseDTO> searchDishes(String keyword);
    DishResponseDTO createDish(DishCreateDTO dishCreateDTO);
    DishResponseDTO updateDish(Integer id, DishUpdateDTO dishUpdateDTO);  // ✅ Thêm
    void deleteDish(Integer id);  // ✅ Thêm - xóa mềm
}