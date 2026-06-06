package vn.edu.fpt.swp391.g6.rimsapi.service.impl;

import vn.edu.fpt.swp391.g6.rimsapi.dto.response.DishResponseDTO;
import vn.edu.fpt.swp391.g6.rimsapi.entity.Dish;
import vn.edu.fpt.swp391.g6.rimsapi.repository.DishRepository;
import vn.edu.fpt.swp391.g6.rimsapi.service.DishService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import jakarta.persistence.EntityNotFoundException;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DishServiceImpl implements DishService {

    private final DishRepository dishRepository;

    @Override
    public List<DishResponseDTO> getAllDishes() {
        return dishRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<DishResponseDTO> getDishesByCategory(Integer categoryId) {
        return dishRepository.findByCategoryId(categoryId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<DishResponseDTO> getAvailableDishes() {
        return dishRepository.findByIsAvailableTrue().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public DishResponseDTO getDishById(Integer id) {
        Dish dish = dishRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy món ăn với ID: " + id));
        return convertToDTO(dish);
    }

    @Override
    public List<DishResponseDTO> searchDishes(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return getAllDishes();
        }
        return dishRepository.searchByName(keyword).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    private DishResponseDTO convertToDTO(Dish dish) {
        DishResponseDTO dto = new DishResponseDTO();
        dto.setId(dish.getId());
        dto.setName(dish.getName());
        dto.setDescription(dish.getDescription());
        dto.setPrice(dish.getPrice());
        dto.setIsAvailable(dish.isAvailable());
        dto.setImageUrl(dish.getImageUrl());
        dto.setCreatedAt(dish.getCreatedAt());
        dto.setUpdatedAt(dish.getUpdatedAt());

        if (dish.getCategory() != null) {
            dto.setCategoryId(dish.getCategory().getId());
            dto.setCategoryName(dish.getCategory().getName());
        }

        return dto;
    }
}