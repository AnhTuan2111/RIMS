package vn.edu.fpt.swp391.g6.rimsapi.service.impl;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.menu.CreateCategoryRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.menu.UpdateCategoryRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.menu.CategoryResponse;
import vn.edu.fpt.swp391.g6.rimsapi.entity.Category;
import vn.edu.fpt.swp391.g6.rimsapi.repository.CategoryRepository;
import vn.edu.fpt.swp391.g6.rimsapi.service.CategoryService;

import java.util.List;
import java.util.stream.Collectors;


@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class CategoryServiceImpl implements CategoryService
{

    private final CategoryRepository categoryRepository;

    @Override
    public List<CategoryResponse> getAllCategories()
    {
        try
        {
            return categoryRepository.findAll().stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
        } catch (Exception e)
        {
            log.error("Lỗi khi lấy danh sách categories: {}", e.getMessage());
            throw new RuntimeException("Không thể lấy danh sách danh mục: " + e.getMessage());
        }
    }

    @Override
    public List<CategoryResponse> getAvailableCategories()
    {
        try
        {
            return categoryRepository.findByIsAvailableTrue().stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
        } catch (Exception e)
        {
            log.error("Lỗi khi lấy danh sách categories đang hoạt động: {}", e.getMessage());
            throw new RuntimeException("Không thể lấy danh sách danh mục đang hoạt động: " + e.getMessage());
        }
    }

    @Override
    public CategoryResponse getCategoryById(Integer id)
    {
        try
        {
            Category category = categoryRepository.findById(id)
                    .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy category với ID: " + id));
            return convertToDTO(category);
        } catch (EntityNotFoundException e)
        {
            log.warn("Không tìm thấy category với ID: {}", id);
            throw e;  // Ném lại để GlobalExceptionHandler bắt
        } catch (Exception e)
        {
            log.error("Lỗi khi lấy category với ID {}: {}", id, e.getMessage());
            throw new RuntimeException("Không thể lấy thông tin danh mục: " + e.getMessage());
        }
    }

    @Override
    public CategoryResponse createCategory(CreateCategoryRequest createCategoryRequest)
    {
        try
        {
            if (categoryRepository.existsByName(createCategoryRequest.getName()))
            {
                throw new IllegalArgumentException("Tên danh mục '" + createCategoryRequest.getName() + "' đã tồn tại!");
            }

            Category category = new Category();
            category.setName(createCategoryRequest.getName());
            category.setDescription(createCategoryRequest.getDescription());
            category.setAvailable(true);

            Category savedCategory = categoryRepository.save(category);
            log.info("Tạo danh mục thành công: {}", savedCategory.getName());
            return convertToDTO(savedCategory);

        } catch (IllegalArgumentException e)
        {
            log.warn("Lỗi khi tạo category: {}", e.getMessage());
            throw e;  // Ném lại để GlobalExceptionHandler bắt
        } catch (Exception e)
        {
            log.error("Lỗi khi tạo category: {}", e.getMessage());
            throw new RuntimeException("Không thể tạo danh mục mới: " + e.getMessage());
        }
    }

    @Override
    public CategoryResponse updateCategory(Integer id, UpdateCategoryRequest updateCategoryRequest)
    {
        try
        {
            Category category = categoryRepository.findById(id)
                    .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy category với ID: " + id));

            // Kiểm tra tên mới có bị trùng không (bỏ qua chính nó)
            if (!category.getName().equals(updateCategoryRequest.getName())
                    && categoryRepository.existsByName(updateCategoryRequest.getName()))
            {
                throw new IllegalArgumentException("Tên danh mục '" + updateCategoryRequest.getName() + "' đã tồn tại!");
            }

            category.setName(updateCategoryRequest.getName());
            category.setDescription(updateCategoryRequest.getDescription());

            // Cập nhật trạng thái nếu có
            if (updateCategoryRequest.getIsAvailable() != null)
            {
                boolean newStatus = updateCategoryRequest.getIsAvailable();

                // Nếu đang chuyển từ Hoạt động -> Ẩn thì phải kiểm tra còn món ăn không
                if (category.isAvailable() && !newStatus)
                {
                    long dishCount = categoryRepository.countDishesByCategoryId(id);
                    if (dishCount > 0)
                    {
                        throw new IllegalStateException(
                                String.format("Không thể ẩn category vì đang có %d món ăn thuộc danh mục này!", dishCount)
                        );
                    }
                }

                category.setAvailable(newStatus);
            }

            Category updatedCategory = categoryRepository.save(category);
            log.info("Cập nhật category thành công: {}", updatedCategory.getName());
            return convertToDTO(updatedCategory);

        } catch (EntityNotFoundException | IllegalArgumentException | IllegalStateException e)
        {
            log.warn("Lỗi khi cập nhật category ID {}: {}", id, e.getMessage());
            throw e;  // Ném lại để GlobalExceptionHandler bắt
        } catch (Exception e)
        {
            log.error("Lỗi khi cập nhật category ID {}: {}", id, e.getMessage());
            throw new RuntimeException("Không thể cập nhật danh mục: " + e.getMessage());
        }
    }

    @Override
    public void deleteCategory(Integer id)
    {
        try
        {
            Category category = categoryRepository.findById(id)
                    .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy danh mục với ID: " + id));

            // Kiểm tra xem category có đang chứa dishes không[cite: 2]
            long dishCount = categoryRepository.countDishesByCategoryId(id); // Giả định hàm này đã viết trong repo[cite: 2]
            if (dishCount > 0)
            {
                throw new IllegalStateException(
                        String.format("Không thể xóa danh mục này vì đang có %d món ăn thuộc danh mục!", dishCount)
                );
            }

            // HỢP LỆ: Danh mục trống -> Cho phép xóa hẳn khỏi hệ thống
            categoryRepository.delete(category);
            log.info("Xóa cứng danh mục thành công: {}", category.getName());

        } catch (EntityNotFoundException | IllegalStateException e)
        {
            log.warn("Lỗi khi xóa category ID {}: {}", id, e.getMessage());
            throw e;
        } catch (Exception e)
        {
            log.error("Lỗi khi xóa category ID {}: {}", id, e.getMessage());
            throw new RuntimeException("Không thể xóa danh mục: " + e.getMessage());
        }
    }

    private CategoryResponse convertToDTO(Category category)
    {
        CategoryResponse dto = new CategoryResponse();
        dto.setId(category.getId());
        dto.setName(category.getName());
        dto.setDescription(category.getDescription());
        dto.setIsAvailable(category.isAvailable());
        dto.setCreatedAt(category.getCreatedAt());
        dto.setUpdatedAt(category.getUpdatedAt());
        return dto;
    }
}