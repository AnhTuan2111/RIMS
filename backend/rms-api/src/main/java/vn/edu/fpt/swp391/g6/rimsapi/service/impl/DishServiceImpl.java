package vn.edu.fpt.swp391.g6.rimsapi.service.impl;

import vn.edu.fpt.swp391.g6.rimsapi.dto.request.DishCreateDTO;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.DishUpdateDTO;
import vn.edu.fpt.swp391.g6.rimsapi.entity.Category;
import vn.edu.fpt.swp391.g6.rimsapi.repository.CategoryRepository;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.DishResponseDTO;
import vn.edu.fpt.swp391.g6.rimsapi.entity.Dish;
import vn.edu.fpt.swp391.g6.rimsapi.repository.DishRepository;
import vn.edu.fpt.swp391.g6.rimsapi.service.DishService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.persistence.EntityNotFoundException;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
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
        // Kiểm tra category tồn tại
        if (!categoryRepository.existsById(categoryId)) {
            throw new EntityNotFoundException("Không tìm thấy danh mục với ID: " + categoryId);
        }
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

    @Override
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

    @Override
    public DishResponseDTO updateDish(Integer id, DishUpdateDTO dishUpdateDTO) {
        // Tìm món ăn cần update
        Dish dish = dishRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy món ăn với ID: " + id));

        // Kiểm tra tên mới có bị trùng không (bỏ qua chính nó)
        if (!dish.getName().equals(dishUpdateDTO.getName())
                && dishRepository.existsByNameAndIdNot(dishUpdateDTO.getName(), id)) {
            throw new IllegalArgumentException("Tên món ăn '" + dishUpdateDTO.getName() + "' đã tồn tại!");
        }

        // Cập nhật thông tin
        dish.setName(dishUpdateDTO.getName());
        dish.setDescription(dishUpdateDTO.getDescription());

        if (dishUpdateDTO.getPrice() != null) {
            dish.setPrice(dishUpdateDTO.getPrice());
        }

        dish.setImageUrl(dishUpdateDTO.getImageUrl());

        // Cập nhật trạng thái nếu có
        if (dishUpdateDTO.getIsAvailable() != null) {
            dish.setAvailable(dishUpdateDTO.getIsAvailable());
        }

        // Cập nhật category nếu có thay đổi
        if (dishUpdateDTO.getCategoryId() != null) {
            Category category = categoryRepository.findById(dishUpdateDTO.getCategoryId())
                    .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy danh mục với ID: " + dishUpdateDTO.getCategoryId()));
            dish.setCategory(category);
        }

        Dish updatedDish = dishRepository.save(dish);
        return convertToDTO(updatedDish);
    }

    @Override
    public void deleteDish(Integer id) {
        Dish dish = dishRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy món ăn với ID: " + id));

        // Soft delete: chỉ set isAvailable = false
        dish.setAvailable(false);
        dishRepository.save(dish);
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
}