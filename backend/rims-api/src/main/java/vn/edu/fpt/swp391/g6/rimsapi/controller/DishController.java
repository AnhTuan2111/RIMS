package vn.edu.fpt.swp391.g6.rimsapi.controller;

import vn.edu.fpt.swp391.g6.rimsapi.dto.request.DishCreateDTO;
import org.springframework.http.HttpStatus;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.DishResponseDTO;
import vn.edu.fpt.swp391.g6.rimsapi.service.DishService;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.DishUpdateDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/dishes")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DishController {

    private final DishService dishService;

    @GetMapping
    public ResponseEntity<List<DishResponseDTO>> getAllDishes() {
        return ResponseEntity.ok(dishService.getAllDishes());
    }

    @GetMapping("/category/{categoryId}")
    public ResponseEntity<List<DishResponseDTO>> getDishesByCategory(@PathVariable Integer categoryId) {
        return ResponseEntity.ok(dishService.getDishesByCategory(categoryId));
    }

    @GetMapping("/available")
    public ResponseEntity<List<DishResponseDTO>> getAvailableDishes() {
        return ResponseEntity.ok(dishService.getAvailableDishes());
    }

    @GetMapping("/search")
    public ResponseEntity<List<DishResponseDTO>> searchDishes(@RequestParam(required = false) String keyword) {
        return ResponseEntity.ok(dishService.searchDishes(keyword));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DishResponseDTO> getDishById(@PathVariable Integer id) {
        return ResponseEntity.ok(dishService.getDishById(id));
    }

    @PostMapping
    public ResponseEntity<DishResponseDTO> createDish(
            @RequestBody @Valid DishCreateDTO dishCreateDTO) {
        return ResponseEntity.status(HttpStatus.CREATED).body(dishService.createDish(dishCreateDTO));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DishResponseDTO> updateDish(
            @PathVariable Integer id,
            @RequestBody @Valid DishUpdateDTO dishUpdateDTO) {
        return ResponseEntity.ok(dishService.updateDish(id, dishUpdateDTO));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDish(@PathVariable Integer id) {
        dishService.deleteDish(id);
        return ResponseEntity.noContent().build();
    }
}