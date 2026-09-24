package vn.edu.fpt.swp391.g6.rimsapi.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import vn.edu.fpt.swp391.g6.rimsapi.entity.Dish;

@Repository
public interface DishRepository extends JpaRepository<Dish, Integer>
{
    List<Dish> findByIsAvailableTrue();

    List<Dish> findByIsHiddenFalse();

    List<Dish> findByCategoryId(Integer categoryId);

    @Query("SELECT d FROM Dish d WHERE LOWER(d.name) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<Dish> searchByName(@Param("keyword") String keyword);

    boolean existsByName(String name);

    boolean existsByNameAndIdNot(String name, Integer id);

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

    /**
     * Danh mục này đã có món nào từng được gọi chưa.
     *
     * <p>Trước đây chỗ gọi lặp qua từng món rồi đếm riêng, tức là N truy vấn cho
     * một câu hỏi có/không.
     */
    @Query("SELECT COUNT(oi) > 0 FROM OrderItem oi WHERE oi.dish.category.id = :categoryId")
    boolean existsOrderItemByCategoryId(@Param("categoryId") Integer categoryId);

    /**
     * Số món của từng danh mục: [categoryId, số món].
     *
     * <p>Một truy vấn cho cả bảng, thay vì đếm riêng từng danh mục.
     */
    @Query("SELECT d.category.id, COUNT(d) FROM Dish d GROUP BY d.category.id")
    List<Object[]> countDishesByCategory();

    long countByCategoryId(Integer categoryId);

    // Đếm số món bị ẩn
    long countByIsHidden(boolean isHidden);

    // Top 4 món mới nhất đang hiển thị, dùng cho bảng điều khiển thực đơn
    List<Dish> findTop4ByIsHiddenFalseOrderByCreatedAtDesc();

}
