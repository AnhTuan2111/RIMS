package vn.edu.fpt.swp391.g6.rimsapi.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
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
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import vn.edu.fpt.swp391.g6.rimsapi.dto.request.menu.UpdateCategoryRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.menu.CategoryRemovalResponse;
import vn.edu.fpt.swp391.g6.rimsapi.entity.Category;
import vn.edu.fpt.swp391.g6.rimsapi.entity.Dish;
import vn.edu.fpt.swp391.g6.rimsapi.exception.ResourceNotFoundException;
import vn.edu.fpt.swp391.g6.rimsapi.repository.CategoryRepository;
import vn.edu.fpt.swp391.g6.rimsapi.repository.DishRepository;

/**
 * Xoá danh mục.
 *
 * <p>Danh mục còn món thì chỉ được ẩn: món đã bán còn nằm trong hoá đơn và các
 * báo cáo doanh thu, xoá đi là thủng số liệu của những ngày đã qua.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Xoá danh mục")
class AdminCategoryRemovalTest
{

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private DishRepository dishRepository;

    /** Ẩn món có phát tin sang Bếp và Phục vụ. */
    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private AdminServiceImpl service;

    private Category category;

    @BeforeEach
    void setUp()
    {
        category = new Category();
        category.setId(3);
        category.setName("Lẩu");
        category.setAvailable(true);

        lenient().when(categoryRepository.findById(3)).thenReturn(Optional.of(category));
        lenient().when(categoryRepository.save(any(Category.class)))
                .thenAnswer(i -> i.getArgument(0));
    }

    private static Dish dish(int id)
    {
        Dish d = new Dish();
        d.setId(id);
        d.setName("Món " + id);
        d.setAvailable(true);
        d.setHidden(false);
        return d;
    }

    @Test
    @DisplayName("danh mục rỗng thì xoá hẳn khỏi cơ sở dữ liệu")
    void danhMucRongThiXoaHan()
    {
        when(dishRepository.findByCategoryId(3)).thenReturn(List.of());

        CategoryRemovalResponse res = service.deleteCategory(3);

        assertThat(res.isDeleted()).isTrue();
        assertThat(res.getHiddenDishCount()).isZero();
        verify(categoryRepository).delete(category);
    }

    @Test
    @DisplayName("danh mục còn món thì chỉ ẩn, không xoá")
    void conMonThiChiAn()
    {
        List<Dish> dishes = List.of(dish(1), dish(2));
        when(dishRepository.findByCategoryId(3)).thenReturn(dishes);

        CategoryRemovalResponse res = service.deleteCategory(3);

        assertThat(res.isDeleted()).isFalse();
        assertThat(res.getHiddenDishCount()).isEqualTo(2);

        verify(categoryRepository, never()).delete(any(Category.class));
        verify(dishRepository, never()).deleteAll(anyList());
    }

    @Test
    @DisplayName("ẩn danh mục thì ẩn luôn mọi món thuộc nó")
    void anDanhMucThiAnCaMon()
    {
        // Để sót một món còn hiện trong danh mục đã ẩn thì bếp vẫn nhận đơn.
        List<Dish> dishes = List.of(dish(1), dish(2));
        when(dishRepository.findByCategoryId(3)).thenReturn(dishes);

        service.deleteCategory(3);

        assertThat(category.isAvailable()).isFalse();
        assertThat(dishes).allSatisfy(d -> {
            assertThat(d.isAvailable()).isFalse();
            assertThat(d.isHidden()).isTrue();
        });

        verify(dishRepository).saveAll(dishes);
    }

    @Test
    @DisplayName("câu trả về nói rõ việc nào đã xảy ra")
    void cauTraVeNoiRoViecGiDaXayRa()
    {
        when(dishRepository.findByCategoryId(3)).thenReturn(List.of(dish(1)));

        assertThat(service.deleteCategory(3).getMessage())
                .contains("Đã ẩn")
                .contains("Lẩu")
                .contains("báo cáo");
    }

    @Test
    @DisplayName("bật lại danh mục thì hiện lại cả món")
    void batLaiThiHienLaiCaMon()
    {
        // Chiều ngược của việc ẩn. Trước đây chỉ làm chiều ẩn: bật lại danh mục
        // vẫn để toàn bộ món biến mất khỏi thực đơn.
        List<Dish> dishes = List.of(dish(1), dish(2));
        dishes.forEach(d -> {
            d.setAvailable(false);
            d.setHidden(true);
        });

        category.setAvailable(false);
        when(dishRepository.findByCategoryId(3)).thenReturn(dishes);

        UpdateCategoryRequest req = new UpdateCategoryRequest();
        req.setName("Lẩu");
        req.setDescription("mô tả");
        req.setIsAvailable(true);

        service.updateCategory(3, req);

        assertThat(category.isAvailable()).isTrue();
        assertThat(dishes).allSatisfy(d -> {
            assertThat(d.isAvailable()).isTrue();
            assertThat(d.isHidden()).isFalse();
        });
    }

    @Test
    @DisplayName("không tìm thấy danh mục thì báo lỗi")
    void khongTimThayThiBaoLoi()
    {
        when(categoryRepository.findById(99)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.deleteCategory(99))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
