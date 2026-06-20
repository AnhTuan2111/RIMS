package vn.edu.fpt.swp391.g6.rimsapi.repository;

import vn.edu.fpt.swp391.g6.rimsapi.entity.Dish;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface DishRepository extends JpaRepository<Dish, Integer> {
    List<Dish> findByCategoryId(Integer categoryId);
    List<Dish> findByIsAvailableTrue();

    @Query("SELECT d FROM Dish d WHERE LOWER(d.name) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<Dish> searchByName(@Param("keyword") String keyword);
    boolean existsByName(String name);
    boolean existsByNameAndIdNot(String name, Integer id);
    List<Dish> findByCategoryIdAndIsAvailableTrue(Integer categoryId);
}