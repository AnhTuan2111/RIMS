package vn.edu.fpt.swp391.g6.rimsapi.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.CategoryCreateDTO;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.CategoryUpdateDTO;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.CategoryResponseDTO;
import vn.edu.fpt.swp391.g6.rimsapi.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public ResponseEntity<List<CategoryResponseDTO>> getAllCategories() {
        return ResponseEntity.ok(categoryService.getAllCategories());
    }

    @GetMapping("/available")
    public ResponseEntity<List<CategoryResponseDTO>> getAvailableCategories() {
        return ResponseEntity.ok(categoryService.getAvailableCategories());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CategoryResponseDTO> getCategoryById(@PathVariable Integer id) {
        return ResponseEntity.ok(categoryService.getCategoryById(id));
    }

    @PostMapping
    public ResponseEntity<CategoryResponseDTO> createCategory(
            @RequestBody @Valid CategoryCreateDTO categoryCreateDTO) {
        return ResponseEntity.status(HttpStatus.CREATED).body(categoryService.createCategory(categoryCreateDTO));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CategoryResponseDTO> updateCategory(
            @PathVariable Integer id,
            @RequestBody @Valid CategoryUpdateDTO categoryUpdateDTO) {
        return ResponseEntity.ok(categoryService.updateCategory(id, categoryUpdateDTO));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable Integer id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.noContent().build();
    }
}