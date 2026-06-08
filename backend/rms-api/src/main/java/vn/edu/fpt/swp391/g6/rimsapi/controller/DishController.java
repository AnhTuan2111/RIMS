package vn.edu.fpt.swp391.g6.rimsapi.controller;

import vn.edu.fpt.swp391.g6.rimsapi.dto.request.DishCreateDTO;
import org.springframework.http.HttpStatus;
import jakarta.validation.Valid;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.DishResponseDTO;
import vn.edu.fpt.swp391.g6.rimsapi.service.DishService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/dishes")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DishController {

    private final DishService dishService;

    // View tất cả món ăn
    @GetMapping
    public ResponseEntity<List<DishResponseDTO>> getAllDishes() {
        return ResponseEntity.ok(dishService.getAllDishes());
    }

    // Lọc món theo category
    @GetMapping("/category/{categoryId}")
    public ResponseEntity<List<DishResponseDTO>> getDishesByCategory(@PathVariable Integer categoryId) {
        return ResponseEntity.ok(dishService.getDishesByCategory(categoryId));
    }

    // Chỉ lấy món đang có sẵn
    @GetMapping("/available")
    public ResponseEntity<List<DishResponseDTO>> getAvailableDishes() {
        return ResponseEntity.ok(dishService.getAvailableDishes());
    }

    // Tìm kiếm món ăn
    @GetMapping("/search")
    public ResponseEntity<List<DishResponseDTO>> searchDishes(@RequestParam(required = false) String keyword) {
        return ResponseEntity.ok(dishService.searchDishes(keyword));
    }

    // Xem chi tiết 1 món
    @GetMapping("/{id}")
    public ResponseEntity<DishResponseDTO> getDishById(@PathVariable Integer id) {
        return ResponseEntity.ok(dishService.getDishById(id));
    }
    @PostMapping
    public ResponseEntity<DishResponseDTO> createDish(@Valid @RequestBody DishCreateDTO dishCreateDTO) {
        DishResponseDTO createdDish = dishService.createDish(dishCreateDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdDish);
    }
}