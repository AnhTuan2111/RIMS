package vn.edu.fpt.swp391.g6.rimsapi.repository;

import vn.edu.fpt.swp391.g6.rimsapi.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<Category, Integer> {
    boolean existsByName(String name);
}