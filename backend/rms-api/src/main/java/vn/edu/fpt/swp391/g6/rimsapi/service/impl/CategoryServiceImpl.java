package vn.edu.fpt.swp391.g6.rimsapi.service.impl;

import vn.edu.fpt.swp391.g6.rimsapi.dto.request.CategoryCreateDTO;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.CategoryUpdateDTO;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.CategoryResponseDTO;
import vn.edu.fpt.swp391.g6.rimsapi.entity.Category;
import vn.edu.fpt.swp391.g6.rimsapi.repository.CategoryRepository;
import vn.edu.fpt.swp391.g6.rimsapi.service.CategoryService;
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
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;

    @Override
    public List<CategoryResponseDTO> getAllCategories() {
        try {
            return categoryRepository.findAll().stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Lỗi khi lấy danh sách categories: {}", e.getMessage());
            throw new RuntimeException("Không thể lấy danh sách danh mục: " + e.getMessage());
        }
    }

    @Override
    public List<CategoryResponseDTO> getAvailableCategories() {
        try {
            return categoryRepository.findByIsAvailableTrue().stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Lỗi khi lấy danh sách categories đang hoạt động: {}", e.getMessage());
            throw new RuntimeException("Không thể lấy danh sách danh mục đang hoạt động: " + e.getMessage());
        }
    }

    @Override
    public CategoryResponseDTO getCategoryById(Integer id) {
        try {
            Category category = categoryRepository.findById(id)
                    .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy category với ID: " + id));
            return convertToDTO(category);
        } catch (EntityNotFoundException e) {
            log.warn("Không tìm thấy category với ID: {}", id);
            throw e;  // Ném lại để GlobalExceptionHandler bắt
        } catch (Exception e) {
            log.error("Lỗi khi lấy category với ID {}: {}", id, e.getMessage());
            throw new RuntimeException("Không thể lấy thông tin danh mục: " + e.getMessage());
        }
    }

    @Override
    public CategoryResponseDTO createCategory(CategoryCreateDTO categoryCreateDTO) {
        try {
            if (categoryRepository.existsByName(categoryCreateDTO.getName())) {
                throw new IllegalArgumentException("Tên danh mục '" + categoryCreateDTO.getName() + "' đã tồn tại!");
            }

            Category category = new Category();
            category.setName(categoryCreateDTO.getName());
            category.setDescription(categoryCreateDTO.getDescription());
            category.setAvailable(true);

            Category savedCategory = categoryRepository.save(category);
            log.info("Tạo danh mục thành công: {}", savedCategory.getName());
            return convertToDTO(savedCategory);

        } catch (IllegalArgumentException e) {
            log.warn("Lỗi khi tạo category: {}", e.getMessage());
            throw e;  // Ném lại để GlobalExceptionHandler bắt
        } catch (Exception e) {
            log.error("Lỗi khi tạo category: {}", e.getMessage());
            throw new RuntimeException("Không thể tạo danh mục mới: " + e.getMessage());
        }
    }

    @Override
    public CategoryResponseDTO updateCategory(Integer id, CategoryUpdateDTO categoryUpdateDTO) {
        try {
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
                category.setAvailable(categoryUpdateDTO.getIsAvailable());
            }

            Category updatedCategory = categoryRepository.save(category);
            log.info("Cập nhật category thành công: {}", updatedCategory.getName());
            return convertToDTO(updatedCategory);

        } catch (EntityNotFoundException | IllegalArgumentException e) {
            log.warn("Lỗi khi cập nhật category ID {}: {}", id, e.getMessage());
            throw e;  // Ném lại để GlobalExceptionHandler bắt
        } catch (Exception e) {
            log.error("Lỗi khi cập nhật category ID {}: {}", id, e.getMessage());
            throw new RuntimeException("Không thể cập nhật danh mục: " + e.getMessage());
        }
    }

    @Override
    public void deleteCategory(Integer id) {
        try {
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
            category.setAvailable(false);
            categoryRepository.save(category);
            log.info("Xóa mềm category thành công: {}", category.getName());

        } catch (EntityNotFoundException | IllegalStateException e) {
            log.warn("Lỗi khi xóa category ID {}: {}", id, e.getMessage());
            throw e;  // Ném lại để GlobalExceptionHandler bắt
        } catch (Exception e) {
            log.error("Lỗi khi xóa category ID {}: {}", id, e.getMessage());
            throw new RuntimeException("Không thể xóa danh mục: " + e.getMessage());
        }
    }

    private CategoryResponseDTO convertToDTO(Category category) {
        CategoryResponseDTO dto = new CategoryResponseDTO();
        dto.setId(category.getId());
        dto.setName(category.getName());
        dto.setDescription(category.getDescription());
        dto.setIsAvailable(category.isAvailable());
        dto.setCreatedAt(category.getCreatedAt());
        dto.setUpdatedAt(category.getUpdatedAt());
        return dto;
    }
}