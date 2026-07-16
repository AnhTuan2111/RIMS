package vn.edu.fpt.swp391.g6.rimsapi.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.edu.fpt.swp391.g6.rimsapi.entity.Dish;

import java.util.List;


@Repository
public interface DishRepository extends JpaRepository<Dish, Integer>
{
    List<Dish> findByIsAvailableTrue();

    List<Dish> findByIsAvailableTrueAndIsHiddenFalse();

    List<Dish> findByCategoryId(Integer categoryId);

    @Query("SELECT d FROM Dish d WHERE LOWER(d.name) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<Dish> searchByName(@Param("keyword") String keyword);

    boolean existsByName(String name);

    boolean existsByNameAndIdNot(String name, Integer id);

    List<Dish> findByCategoryIdAndIsAvailableTrue(Integer categoryId);

    long countByIsAvailableFalse();

    // Đếm số món ăn theo trạng thái hoạt động
    long countByIsAvailable(boolean isAvailable);

    // Lấy ra 4 món ăn mới nhất dựa trên ngày tạo giảm dần
    List<Dish> findTop4ByOrderByCreatedAtDesc();

    // THAY ĐỔI TẠI ĐÂY: Dùng d.category.isAvailable thay vì d.category.status cũ
    @Query("SELECT d.category.name, d.category.isAvailable, COUNT(d) " +
            "FROM Dish d " +
            "GROUP BY d.category.id, d.category.name, d.category.isAvailable")
    List<Object[]> getCategoryStatistics();
    @Query("SELECT COUNT(oi) FROM OrderItem oi WHERE oi.dish.id = :dishId")
    long countOrderItemsByDishId(@Param("dishId") Integer dishId);
}