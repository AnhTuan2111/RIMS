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
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.persistence.EntityNotFoundException;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j  // 🆕 THÊM ANNOTATION NÀY ĐỂ LOG
public class DishServiceImpl implements DishService {

    private final DishRepository dishRepository;
    private final CategoryRepository categoryRepository;

    @Override
    public List<DishResponseDTO> getAllDishes() {
        try {
            return dishRepository.findAll().stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Lỗi khi lấy danh sách dishes: {}", e.getMessage());
            throw new RuntimeException("Không thể lấy danh sách món ăn: " + e.getMessage());
        }
    }

    @Override
    public List<DishResponseDTO> getDishesByCategory(Integer categoryId) {
        try {
            // Kiểm tra category tồn tại
            if (!categoryRepository.existsById(categoryId)) {
                throw new EntityNotFoundException("Không tìm thấy danh mục với ID: " + categoryId);
            }
            return dishRepository.findByCategoryId(categoryId).stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
        } catch (EntityNotFoundException e) {
            log.warn("Không tìm thấy category với ID: {}", categoryId);
            throw e;  // Ném lại để GlobalExceptionHandler bắt
        } catch (Exception e) {
            log.error("Lỗi khi lấy dishes theo category ID {}: {}", categoryId, e.getMessage());
            throw new RuntimeException("Không thể lấy danh sách món ăn theo danh mục: " + e.getMessage());
        }
    }

    @Override
    public List<DishResponseDTO> getAvailableDishes() {
        try {
            return dishRepository.findByIsAvailableTrue().stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Lỗi khi lấy danh sách dishes đang có sẵn: {}", e.getMessage());
            throw new RuntimeException("Không thể lấy danh sách món ăn đang có sẵn: " + e.getMessage());
        }
    }

    @Override
    public DishResponseDTO getDishById(Integer id) {
        try {
            Dish dish = dishRepository.findById(id)
                    .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy món ăn với ID: " + id));
            return convertToDTO(dish);
        } catch (EntityNotFoundException e) {
            log.warn("Không tìm thấy dish với ID: {}", id);
            throw e;  // Ném lại để GlobalExceptionHandler bắt
        } catch (Exception e) {
            log.error("Lỗi khi lấy dish với ID {}: {}", id, e.getMessage());
            throw new RuntimeException("Không thể lấy thông tin món ăn: " + e.getMessage());
        }
    }

    @Override
    public List<DishResponseDTO> searchDishes(String keyword) {
        try {
            if (keyword == null || keyword.trim().isEmpty()) {
                return getAllDishes();
            }
            return dishRepository.searchByName(keyword).stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Lỗi khi tìm kiếm dishes với keyword '{}': {}", keyword, e.getMessage());
            throw new RuntimeException("Không thể tìm kiếm món ăn: " + e.getMessage());
        }
    }

    @Override
    public DishResponseDTO createDish(DishCreateDTO dishCreateDTO) {
        try {
            // Kiểm tra tên món ăn đã tồn tại chưa
            if (dishRepository.existsByName(dishCreateDTO.getName())) {
                throw new IllegalArgumentException("Tên món ăn '" + dishCreateDTO.getName() + "' đã tồn tại");
            }

            // Tìm category theo ID
            Category category = categoryRepository.findById(dishCreateDTO.getCategoryId())
                    .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy danh mục với ID: " + dishCreateDTO.getCategoryId()));
            if (!category.isAvailable()) {
                throw new IllegalArgumentException("Danh mục này đã bị vô hiệu hóa, không thể thêm món ăn!");
            }
            // Tạo mới món ăn
            Dish dish = new Dish();
            dish.setName(dishCreateDTO.getName());
            dish.setDescription(dishCreateDTO.getDescription());
            dish.setPrice(dishCreateDTO.getPrice());
            dish.setImageUrl(dishCreateDTO.getImageUrl());
            dish.setAvailable(dishCreateDTO.getIsAvailable() != null ? dishCreateDTO.getIsAvailable() : true);
            dish.setCategory(category);

            Dish savedDish = dishRepository.save(dish);
            log.info("Tạo món ăn thành công: {}", savedDish.getName());
            return convertToDTO(savedDish);

        } catch (IllegalArgumentException | EntityNotFoundException e) {
            log.warn("Lỗi khi tạo dish: {}", e.getMessage());
            throw e;  // Ném lại để GlobalExceptionHandler bắt
        } catch (Exception e) {
            log.error("Lỗi khi tạo dish: {}", e.getMessage());
            throw new RuntimeException("Không thể tạo món ăn mới: " + e.getMessage());
        }
    }

    @Override
    public DishResponseDTO updateDish(Integer id, DishUpdateDTO dishUpdateDTO) {
        try {
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
            log.info("Cập nhật món ăn thành công: {}", updatedDish.getName());
            return convertToDTO(updatedDish);

        } catch (EntityNotFoundException | IllegalArgumentException e) {
            log.warn("Lỗi khi cập nhật dish ID {}: {}", id, e.getMessage());
            throw e;  // Ném lại để GlobalExceptionHandler bắt
        } catch (Exception e) {
            log.error("Lỗi khi cập nhật dish ID {}: {}", id, e.getMessage());
            throw new RuntimeException("Không thể cập nhật món ăn: " + e.getMessage());
        }
    }

    @Override
    public void deleteDish(Integer id) {
        try {
            Dish dish = dishRepository.findById(id)
                    .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy món ăn với ID: " + id));

            // Soft delete: chỉ set isAvailable = false
            dish.setAvailable(false);
            dishRepository.save(dish);
            log.info("Xóa mềm món ăn thành công: {}", dish.getName());

        } catch (EntityNotFoundException e) {
            log.warn("Không tìm thấy dish với ID: {}", id);
            throw e;  // Ném lại để GlobalExceptionHandler bắt
        } catch (Exception e) {
            log.error("Lỗi khi xóa dish ID {}: {}", id, e.getMessage());
            throw new RuntimeException("Không thể xóa món ăn: " + e.getMessage());
        }
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