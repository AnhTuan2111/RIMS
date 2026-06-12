package vn.edu.fpt.swp391.g6.rimsapi.service;

import vn.edu.fpt.swp391.g6.rimsapi.dto.response.CategoryResponseDTO;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.CategoryCreateDTO;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.CategoryUpdateDTO;
import java.util.List;

public interface CategoryService {
    List<CategoryResponseDTO> getAllCategories();
    CategoryResponseDTO getCategoryById(Integer id);
    CategoryResponseDTO createCategory(CategoryCreateDTO categoryCreateDTO);
    CategoryResponseDTO updateCategory(Integer id, CategoryUpdateDTO categoryUpdateDTO);
    void deleteCategory(Integer id);
}