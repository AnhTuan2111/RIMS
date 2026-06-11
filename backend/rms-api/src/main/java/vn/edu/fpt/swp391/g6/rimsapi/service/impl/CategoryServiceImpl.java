package vn.edu.fpt.swp391.g6.rimsapi.service.impl;

import vn.edu.fpt.swp391.g6.rimsapi.dto.request.CategoryCreateDTO;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.CategoryResponseDTO;
import vn.edu.fpt.swp391.g6.rimsapi.entity.Category;
import vn.edu.fpt.swp391.g6.rimsapi.repository.CategoryRepository;
import vn.edu.fpt.swp391.g6.rimsapi.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import jakarta.persistence.EntityNotFoundException;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;

    @Override
    public List<CategoryResponseDTO> getAllCategories() {
        return categoryRepository.findAll().stream()
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
        // Kiểm tra tên đã tồn tại chưa?
        if (categoryRepository.existsByName(categoryCreateDTO.getName())) {
            throw new IllegalArgumentException("Tên danh mục '" + categoryCreateDTO.getName() + "' đã tồn tại!");
        }

        // Tạo entity từ DTO
        Category category = new Category();
        category.setName(categoryCreateDTO.getName());
        category.setDescription(categoryCreateDTO.getDescription());

        // Lưu vào database
        Category savedCategory = categoryRepository.save(category);

        // Convert sang DTO và trả về
        return convertToDTO(savedCategory);
    }
    private CategoryResponseDTO convertToDTO(Category category) {
        CategoryResponseDTO dto = new CategoryResponseDTO();
        dto.setId(category.getId());
        dto.setName(category.getName());
        dto.setDescription(category.getDescription());
        dto.setCreatedAt(category.getCreatedAt());
        dto.setUpdatedAt(category.getUpdatedAt());
        return dto;
    }
}