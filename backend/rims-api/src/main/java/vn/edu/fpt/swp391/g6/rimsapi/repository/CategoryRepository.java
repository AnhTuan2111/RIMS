package vn.edu.fpt.swp391.g6.rimsapi.repository;

import vn.edu.fpt.swp391.g6.rimsapi.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;


@Repository
public interface CategoryRepository extends JpaRepository<Category, Integer>
{
    boolean existsByName(String name);

    // Kiểm tra tồn tại khi update (loại trừ chính nó)
    boolean existsByNameAndIdNot(String name, Integer id);

    // Chỉ lấy các category chưa bị xóa mềm (isAvailable = true)
    List<Category> findByIsAvailableTrue();

    // Lấy category theo id và chưa bị xóa
    Optional<Category> findByIdAndIsAvailableTrue(Integer id);

    // Tìm kiếm theo tên (chỉ lấy category đang available)
    List<Category> findByNameContainingAndIsAvailableTrue(String name);

    // Đếm số lượng dishes trong category (dùng để kiểm tra trước khi xóa)
    @Query("SELECT COUNT(d) FROM Dish d WHERE d.category.id = :categoryId")
    long countDishesByCategoryId(@Param("categoryId") Integer categoryId);
}