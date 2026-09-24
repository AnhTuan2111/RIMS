package vn.edu.fpt.swp391.g6.rimsapi.repository;

import java.util.List;
import java.util.Optional;

import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import vn.edu.fpt.swp391.g6.rimsapi.entity.RestaurantTable;
import vn.edu.fpt.swp391.g6.rimsapi.enums.TableStatus;

public interface RestaurantTableRepository extends JpaRepository<RestaurantTable, Integer>
{
    // Tìm các bàn trống có sức chứa >= minCapacity, dùng để chuyển reservation sang bàn mới.
    // Chỉ lấy bàn còn trong sơ đồ: bàn đã cất đi thì không được nhận khách nữa.
    List<RestaurantTable> findByActiveTrueAndStatusAndCapacityGreaterThanEqual(
            TableStatus status, int minCapacity);

    // Sơ đồ bàn của Phục vụ, Thu ngân và màn đặt bàn của Khách chỉ thấy bàn còn dùng
    List<RestaurantTable> findByActiveTrueOrderByTableNumberAsc();

    // Màn Quản lý bàn thấy cả bàn đã cất, vì phải cho bật lại được
    List<RestaurantTable> findAllByOrderByTableNumberAsc();

    boolean existsByTableNumber(String tableNumber);

    boolean existsByTableNumberAndIdNot(String tableNumber, Integer id);

    /**
     * Số đơn và số lần đặt của từng bàn: [tableId, số đơn, số lần đặt].
     *
     * <p>Một truy vấn cho cả bảng thay vì đếm riêng từng bàn. Hai nhánh đếm
     * bằng truy vấn con chứ không JOIN cả hai cùng lúc: join hai quan hệ
     * một-nhiều trên cùng một bàn sẽ nhân chéo và đếm gấp lên.
     */
    @Query("SELECT t.id, "
            + "(SELECT COUNT(o) FROM Order o WHERE o.table = t), "
            + "(SELECT COUNT(r) FROM Reservation r WHERE r.table = t) "
            + "FROM RestaurantTable t")
    List<Object[]> countUsagePerTable();

    /**
     * Bàn này đã dính vào bao nhiêu đơn và bao nhiêu lần đặt.
     *
     * <p>Chưa dính gì thì xoá hẳn không mất số liệu nào; dính rồi thì chỉ được
     * cất đi. Đếm thật chứ không chỉ hỏi có/không, để câu trả về của một lần
     * sửa cũng mang đúng con số như danh sách.
     */
    @Query("SELECT COUNT(o) FROM Order o WHERE o.table.id = :tableId")
    long countOrdersByTableId(@Param("tableId") Integer tableId);

    @Query("SELECT COUNT(r) FROM Reservation r WHERE r.table.id = :tableId")
    long countReservationsByTableId(@Param("tableId") Integer tableId);

    // Lock bàn để tránh 2 request cùng đặt 1 bàn tại cùng thời điểm (race condition)
    // Request thứ 2 sẽ phải CHỜ cho tới khi transaction của request thứ 1 commit/rollback
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT t FROM RestaurantTable t WHERE t.id = :id")
    Optional<RestaurantTable> findByIdForUpdate(@Param("id") Integer id);
}
