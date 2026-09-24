package vn.edu.fpt.swp391.g6.rimsapi.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import vn.edu.fpt.swp391.g6.rimsapi.dto.request.table.CreateTableRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.table.UpdateTableRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.table.AdminTableResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.table.TableRemovalResponse;
import vn.edu.fpt.swp391.g6.rimsapi.entity.RestaurantTable;
import vn.edu.fpt.swp391.g6.rimsapi.enums.TableStatus;
import vn.edu.fpt.swp391.g6.rimsapi.exception.BusinessRuleException;
import vn.edu.fpt.swp391.g6.rimsapi.exception.ResourceNotFoundException;
import vn.edu.fpt.swp391.g6.rimsapi.repository.RestaurantTableRepository;

/**
 * Quản lý bàn.
 *
 * <p>Hai luật xuyên suốt: không đụng vào bàn đang bận, và bàn đã có lịch sử
 * thì chỉ cất đi chứ không xoá — đơn cũ còn trỏ về nó trong báo cáo doanh thu.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Quản lý bàn")
class AdminTableTest
{

    @Mock
    private RestaurantTableRepository restaurantTableRepository;

    /** Thêm hay cất bàn đều phát tin để sơ đồ bàn đang mở cập nhật theo. */
    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private AdminServiceImpl service;

    private RestaurantTable table;

    @BeforeEach
    void setUp()
    {
        table = new RestaurantTable();
        table.setId(7);
        table.setTableNumber("T07");
        table.setCapacity(4);
        table.setStatus(TableStatus.AVAILABLE);
        table.setActive(true);

        lenient().when(restaurantTableRepository.findById(7)).thenReturn(Optional.of(table));
        lenient().when(restaurantTableRepository.save(any(RestaurantTable.class)))
                .thenAnswer(i -> i.getArgument(0));
    }

    private static CreateTableRequest createRequest(String number, int capacity)
    {
        CreateTableRequest req = new CreateTableRequest();
        req.setTableNumber(number);
        req.setCapacity(capacity);
        return req;
    }

    private static UpdateTableRequest updateRequest(String number, int capacity, boolean active)
    {
        UpdateTableRequest req = new UpdateTableRequest();
        req.setTableNumber(number);
        req.setCapacity(capacity);
        req.setActive(active);
        return req;
    }

    // ---------- thêm bàn ----------

    @Test
    @DisplayName("bàn mới luôn bắt đầu ở trạng thái trống và đang dùng")
    void banMoiBatDauTrongVaDangDung()
    {
        AdminTableResponse res = service.createTable(createRequest("T13", 6));

        ArgumentCaptor<RestaurantTable> saved = ArgumentCaptor.forClass(RestaurantTable.class);
        verify(restaurantTableRepository).save(saved.capture());

        assertThat(saved.getValue().getStatus()).isEqualTo(TableStatus.AVAILABLE);
        assertThat(saved.getValue().isActive()).isTrue();
        assertThat(res.getCapacity()).isEqualTo(6);
        assertThat(res.isDeletable()).isTrue();
    }

    @Test
    @DisplayName("số bàn được cắt khoảng trắng thừa trước khi lưu")
    void soBanDuocCatKhoangTrang()
    {
        // Người nhìn thấy "T13 " và "T13" là một bàn, nhưng ràng buộc duy nhất
        // trong cơ sở dữ liệu thì thấy hai.
        service.createTable(createRequest("  T13  ", 4));

        ArgumentCaptor<RestaurantTable> saved = ArgumentCaptor.forClass(RestaurantTable.class);
        verify(restaurantTableRepository).save(saved.capture());
        assertThat(saved.getValue().getTableNumber()).isEqualTo("T13");
    }

    @Test
    @DisplayName("trùng số bàn thì không thêm được")
    void trungSoBanThiKhongThem()
    {
        when(restaurantTableRepository.existsByTableNumber("T07")).thenReturn(true);

        assertThatThrownBy(() -> service.createTable(createRequest("T07", 4)))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("T07");

        verify(restaurantTableRepository, never()).save(any(RestaurantTable.class));
    }

    // ---------- sửa bàn ----------

    @Test
    @DisplayName("đổi số chỗ ngồi của bàn trống thì được")
    void doiSoChoBanTrong()
    {
        AdminTableResponse res = service.updateTable(7, updateRequest("T07", 8, true));

        assertThat(res.getCapacity()).isEqualTo(8);
        assertThat(table.getCapacity()).isEqualTo(8);
    }

    @Test
    @DisplayName("đổi sang số bàn đã có người dùng thì báo lỗi")
    void doiSangSoBanDaCo()
    {
        when(restaurantTableRepository.existsByTableNumberAndIdNot("T08", 7)).thenReturn(true);

        assertThatThrownBy(() -> service.updateTable(7, updateRequest("T08", 4, true)))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("T08");
    }

    @Test
    @DisplayName("không cất được bàn đang phục vụ khách")
    void khongCatBanDangPhucVu()
    {
        // Cất giữa chừng thì bàn biến mất khỏi sơ đồ của Phục vụ, đơn đang mở
        // trên bàn thành đơn không ai nhìn thấy.
        table.setStatus(TableStatus.SERVING);

        assertThatThrownBy(() -> service.updateTable(7, updateRequest("T07", 4, false)))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("đang phục vụ");
    }

    @Test
    @DisplayName("không cất được bàn đã có người đặt")
    void khongCatBanDaDat()
    {
        table.setStatus(TableStatus.RESERVED);

        assertThatThrownBy(() -> service.updateTable(7, updateRequest("T07", 4, false)))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("đã có người đặt");
    }

    @Test
    @DisplayName("bật lại một bàn đã cất thì không cần bàn phải rảnh")
    void batLaiBanDaCat()
    {
        // Luật chỉ chặn chiều cất đi. Bật lại không lấy mất chỗ của ai.
        table.setActive(false);

        AdminTableResponse res = service.updateTable(7, updateRequest("T07", 4, true));

        assertThat(res.isActive()).isTrue();
        assertThat(table.isActive()).isTrue();
    }

    // ---------- bỏ bàn ----------

    @Test
    @DisplayName("bàn chưa dùng bao giờ thì xoá hẳn")
    void banChuaDungThiXoaHan()
    {
        when(restaurantTableRepository.countOrdersByTableId(7)).thenReturn(0L);
        when(restaurantTableRepository.countReservationsByTableId(7)).thenReturn(0L);

        TableRemovalResponse res = service.deleteTable(7);

        assertThat(res.isDeleted()).isTrue();
        verify(restaurantTableRepository).delete(table);
    }

    @Test
    @DisplayName("bàn đã có đơn thì chỉ cất đi, không xoá")
    void banDaCoDonThiChiCat()
    {
        when(restaurantTableRepository.countOrdersByTableId(7)).thenReturn(3L);

        TableRemovalResponse res = service.deleteTable(7);

        assertThat(res.isDeleted()).isFalse();
        assertThat(res.getMessage()).contains("báo cáo");
        assertThat(table.isActive()).isFalse();
        verify(restaurantTableRepository, never()).delete(any(RestaurantTable.class));
    }

    @Test
    @DisplayName("bàn chưa có đơn nhưng từng được đặt thì cũng chỉ cất đi")
    void banTungDuocDatThiChiCat()
    {
        when(restaurantTableRepository.countOrdersByTableId(7)).thenReturn(0L);
        when(restaurantTableRepository.countReservationsByTableId(7)).thenReturn(2L);

        assertThat(service.deleteTable(7).isDeleted()).isFalse();
        verify(restaurantTableRepository, never()).delete(any(RestaurantTable.class));
    }

    @Test
    @DisplayName("không bỏ được bàn đang phục vụ, kể cả khi bàn chưa có lịch sử")
    void khongBoBanDangPhucVu()
    {
        table.setStatus(TableStatus.SERVING);

        assertThatThrownBy(() -> service.deleteTable(7))
                .isInstanceOf(BusinessRuleException.class);

        verify(restaurantTableRepository, never()).delete(any(RestaurantTable.class));
    }

    @Test
    @DisplayName("không tìm thấy bàn thì báo lỗi")
    void khongTimThayBan()
    {
        when(restaurantTableRepository.findById(99)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.deleteTable(99))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // ---------- danh sách ----------

    @Test
    @DisplayName("danh sách gắn đúng số đơn và số lần đặt cho từng bàn")
    void danhSachGanDungSoDon()
    {
        RestaurantTable other = new RestaurantTable();
        other.setId(8);
        other.setTableNumber("T08");
        other.setCapacity(2);
        other.setStatus(TableStatus.AVAILABLE);
        other.setActive(true);

        when(restaurantTableRepository.countUsagePerTable())
                .thenReturn(List.<Object[]>of(new Object[]{7, 3L, 1L}));
        when(restaurantTableRepository.findAllByOrderByTableNumberAsc())
                .thenReturn(List.of(table, other));

        List<AdminTableResponse> list = service.getAllTables();

        assertThat(list).hasSize(2);
        assertThat(list.get(0).getOrderCount()).isEqualTo(3);
        assertThat(list.get(0).getReservationCount()).isEqualTo(1);
        assertThat(list.get(0).isDeletable()).isFalse();

        // Bàn không có dòng nào trong kết quả đếm nghĩa là chưa dùng lần nào
        assertThat(list.get(1).getOrderCount()).isZero();
        assertThat(list.get(1).isDeletable()).isTrue();
    }
}
