package vn.edu.fpt.swp391.g6.rimsapi.service;

import vn.edu.fpt.swp391.g6.rimsapi.dto.response.CategoryResponseDTO;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.CategoryCreateDTO;
import java.util.List;

public interface CategoryService {
    List<CategoryResponseDTO> getAllCategories();
    CategoryResponseDTO getCategoryById(Integer id);
    CategoryResponseDTO createCategory(CategoryCreateDTO categoryCreateDTO);
}