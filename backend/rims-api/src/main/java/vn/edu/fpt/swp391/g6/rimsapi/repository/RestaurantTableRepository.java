package vn.edu.fpt.swp391.g6.rimsapi.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.edu.fpt.swp391.g6.rimsapi.entity.RestaurantTable;
import vn.edu.fpt.swp391.g6.rimsapi.enums.TableStatus;


import java.util.List;

public interface RestaurantTableRepository extends JpaRepository<RestaurantTable, Integer>
{

    // Tìm bàn theo trạng thái
    List<RestaurantTable> findByStatus(TableStatus status);

    // Tìm bàn theo số bàn
    RestaurantTable findByTableNumber(String tableNumber);
}
