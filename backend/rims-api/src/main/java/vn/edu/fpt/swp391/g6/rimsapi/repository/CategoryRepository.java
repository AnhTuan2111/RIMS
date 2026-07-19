package vn.edu.fpt.swp391.g6.rimsapi.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.edu.fpt.swp391.g6.rimsapi.entity.Category;

import java.util.List;


@Repository
public interface CategoryRepository extends JpaRepository<Category, Integer>
{
    boolean existsByName(String name);

    // Chỉ lấy các category chưa bị xóa mềm (isAvailable = true)
    List<Category> findByIsAvailableTrue();

    // Đếm số lượng dishes trong category (dùng để kiểm tra trước khi xóa)
    @Query("SELECT COUNT(d) FROM Dish d WHERE d.category.id = :categoryId")
    long countDishesByCategoryId(@Param("categoryId") Integer categoryId);
}