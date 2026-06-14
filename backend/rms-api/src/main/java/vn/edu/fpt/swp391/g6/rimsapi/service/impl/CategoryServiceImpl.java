package vn.edu.fpt.swp391.g6.rimsapi.service.impl;

import vn.edu.fpt.swp391.g6.rimsapi.dto.request.CategoryCreateDTO;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.CategoryUpdateDTO;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.CategoryResponseDTO;
import vn.edu.fpt.swp391.g6.rimsapi.entity.Category;
import vn.edu.fpt.swp391.g6.rimsapi.repository.CategoryRepository;
import vn.edu.fpt.swp391.g6.rimsapi.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.persistence.EntityNotFoundException;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;

    @Override
    public List<CategoryResponseDTO> getAllCategories() {
        return categoryRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<CategoryResponseDTO> getAvailableCategories() {
        return categoryRepository.findByIsAvailableTrue().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public CategoryResponseDTO getCategoryById(Integer id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy category với ID: " + id));
        return convertToDTO(category);
    }

    @Override
    public CategoryResponseDTO createCategory(CategoryCreateDTO categoryCreateDTO) {
        if (categoryRepository.existsByName(categoryCreateDTO.getName())) {
            throw new IllegalArgumentException("Tên danh mục '" + categoryCreateDTO.getName() + "' đã tồn tại!");
        }

        Category category = new Category();
        category.setName(categoryCreateDTO.getName());
        category.setDescription(categoryCreateDTO.getDescription());
        category.setAvailable(true);  // ✅ ĐỔI: setAvailable thay vì setIsAvailable

        Category savedCategory = categoryRepository.save(category);
        return convertToDTO(savedCategory);
    }

    @Override
    public CategoryResponseDTO updateCategory(Integer id, CategoryUpdateDTO categoryUpdateDTO) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy category với ID: " + id));

        // Kiểm tra tên mới có bị trùng không (bỏ qua chính nó)
        if (!category.getName().equals(categoryUpdateDTO.getName())
                && categoryRepository.existsByName(categoryUpdateDTO.getName())) {
            throw new IllegalArgumentException("Tên danh mục '" + categoryUpdateDTO.getName() + "' đã tồn tại!");
        }

        category.setName(categoryUpdateDTO.getName());
        category.setDescription(categoryUpdateDTO.getDescription());

        // Cập nhật trạng thái nếu có
        if (categoryUpdateDTO.getIsAvailable() != null) {
            category.setAvailable(categoryUpdateDTO.getIsAvailable());  // ✅ ĐỔI: setAvailable thay vì setIsAvailable
        }

        Category updatedCategory = categoryRepository.save(category);
        return convertToDTO(updatedCategory);
    }

    @Override
    public void deleteCategory(Integer id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy category với ID: " + id));

        // Kiểm tra xem category có đang chứa dishes không
        long dishCount = categoryRepository.countDishesByCategoryId(id);
        if (dishCount > 0) {
            throw new IllegalStateException(
                    String.format("Không thể xóa category vì đang có %d món ăn thuộc danh mục này!", dishCount)
            );
        }

        // Soft delete: chỉ set isAvailable = false
        category.setAvailable(false);  // ✅ ĐỔI: setAvailable thay vì setIsAvailable
        categoryRepository.save(category);
    }

    private CategoryResponseDTO convertToDTO(Category category) {
        CategoryResponseDTO dto = new CategoryResponseDTO();
        dto.setId(category.getId());
        dto.setName(category.getName());
        dto.setDescription(category.getDescription());
        dto.setIsAvailable(category.isAvailable());  // ✅ DTO.setIsAvailable (cái này có trong DTO)
        dto.setCreatedAt(category.getCreatedAt());
        dto.setUpdatedAt(category.getUpdatedAt());
        return dto;
    }
}