package vn.edu.fpt.swp391.g6.rimsapi.service.impl;

import vn.edu.fpt.swp391.g6.rimsapi.dto.request.DishCreateDTO;
import vn.edu.fpt.swp391.g6.rimsapi.entity.Category;
import vn.edu.fpt.swp391.g6.rimsapi.repository.CategoryRepository;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.DishResponseDTO;
import vn.edu.fpt.swp391.g6.rimsapi.entity.Dish;
import vn.edu.fpt.swp391.g6.rimsapi.repository.DishRepository;
import vn.edu.fpt.swp391.g6.rimsapi.service.DishService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import jakarta.persistence.EntityNotFoundException;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DishServiceImpl implements DishService {

    private final DishRepository dishRepository;
    private final CategoryRepository categoryRepository;

    @Override
    public List<DishResponseDTO> getAllDishes() {
        return dishRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<DishResponseDTO> getDishesByCategory(Integer categoryId) {
        return dishRepository.findByCategoryId(categoryId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<DishResponseDTO> getAvailableDishes() {
        return dishRepository.findByIsAvailableTrue().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public DishResponseDTO getDishById(Integer id) {
        Dish dish = dishRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy món ăn với ID: " + id));
        return convertToDTO(dish);
    }

    @Override
    public List<DishResponseDTO> searchDishes(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return getAllDishes();
        }
        return dishRepository.searchByName(keyword).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    private DishResponseDTO convertToDTO(Dish dish) {
        DishResponseDTO dto = new DishResponseDTO();
        dto.setId(dish.getId());
        dto.setName(dish.getName());
        dto.setDescription(dish.getDescription());
        dto.setPrice(dish.getPrice());
        dto.setIsAvailable(dish.isAvailable());
        dto.setImageUrl(dish.getImageUrl());
        dto.setCreatedAt(dish.getCreatedAt());
        dto.setUpdatedAt(dish.getUpdatedAt());

        if (dish.getCategory() != null) {
            dto.setCategoryId(dish.getCategory().getId());
            dto.setCategoryName(dish.getCategory().getName());
        }

        return dto;
    }
    public DishResponseDTO createDish(DishCreateDTO dishCreateDTO) {
        // Kiểm tra tên món ăn đã tồn tại chưa
        if (dishRepository.existsByName(dishCreateDTO.getName())) {
            throw new IllegalArgumentException("Tên món ăn '" + dishCreateDTO.getName() + "' đã tồn tại");
        }

        // Tìm category theo ID
        Category category = categoryRepository.findById(dishCreateDTO.getCategoryId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy danh mục với ID: " + dishCreateDTO.getCategoryId()));

        // Tạo mới món ăn
        Dish dish = new Dish();
        dish.setName(dishCreateDTO.getName());
        dish.setDescription(dishCreateDTO.getDescription());
        dish.setPrice(dishCreateDTO.getPrice());
        dish.setImageUrl(dishCreateDTO.getImageUrl());
        dish.setAvailable(dishCreateDTO.getIsAvailable() != null ? dishCreateDTO.getIsAvailable() : true);
        dish.setCategory(category);

        Dish savedDish = dishRepository.save(dish);
        return convertToDTO(savedDish);
    }

}