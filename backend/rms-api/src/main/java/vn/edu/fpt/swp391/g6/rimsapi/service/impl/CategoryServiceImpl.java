package vn.edu.fpt.swp391.g6.rimsapi.service.impl;

import vn.edu.fpt.swp391.g6.rimsapi.dto.request.CategoryCreateDTO;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.CategoryResponseDTO;
import vn.edu.fpt.swp391.g6.rimsapi.entity.Category;
import vn.edu.fpt.swp391.g6.rimsapi.repository.CategoryRepository;
import vn.edu.fpt.swp391.g6.rimsapi.service.CategoryService;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.CategoryUpdateDTO;
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
        return categoryRepository.findAllByIsDeletedFalse()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public CategoryResponseDTO getCategoryById(Integer id) {
        Category category = categoryRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy category với ID: " + id));
        return convertToDTO(category);
    }
    @Override
    public CategoryResponseDTO createCategory(CategoryCreateDTO categoryCreateDTO) {
        if (categoryRepository.existsByNameAndIsDeletedFalse(categoryCreateDTO.getName())) {
            throw new IllegalArgumentException("Tên danh mục '" + categoryCreateDTO.getName() + "' đã tồn tại!");
        }

        Category category = new Category();
        category.setName(categoryCreateDTO.getName());
        category.setDescription(categoryCreateDTO.getDescription());

        return convertToDTO(categoryRepository.save(category));
    }
    @Override
    public CategoryResponseDTO updateCategory(Integer id, CategoryUpdateDTO categoryUpdateDTO) {
        Category category = categoryRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy category với ID: " + id));

        if (!category.getName().equals(categoryUpdateDTO.getName())
                && categoryRepository.existsByNameAndIsDeletedFalse(categoryUpdateDTO.getName())) {
            throw new IllegalArgumentException("Tên danh mục '" + categoryUpdateDTO.getName() + "' đã tồn tại!");
        }

        category.setName(categoryUpdateDTO.getName());
        category.setDescription(categoryUpdateDTO.getDescription());

        return convertToDTO(categoryRepository.save(category));
    }

    @Override
    public void deleteCategory(Integer id) {
        Category category = categoryRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy category với ID: " + id));

        category.setDeleted(true);
        categoryRepository.save(category);
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