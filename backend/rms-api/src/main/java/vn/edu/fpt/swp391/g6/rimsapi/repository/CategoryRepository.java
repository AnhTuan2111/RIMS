package vn.edu.fpt.swp391.g6.rimsapi.repository;

import vn.edu.fpt.swp391.g6.rimsapi.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Integer> {
    boolean existsByName(String name);
    boolean existsByIdAndDishesIsNotEmpty(Integer id);

    List<Category> findAllByIsDeletedFalse();
    Optional<Category> findByIdAndIsDeletedFalse(Integer id);
    boolean existsByNameAndIsDeletedFalse(String name);
}