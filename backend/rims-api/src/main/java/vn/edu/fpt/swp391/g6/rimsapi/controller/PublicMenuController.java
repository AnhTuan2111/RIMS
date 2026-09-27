package vn.edu.fpt.swp391.g6.rimsapi.controller;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import vn.edu.fpt.swp391.g6.rimsapi.dto.response.menu.PublicMenuSectionResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.report.PublicBestSellingDishResponse;
import vn.edu.fpt.swp391.g6.rimsapi.entity.Category;
import vn.edu.fpt.swp391.g6.rimsapi.entity.Dish;
import vn.edu.fpt.swp391.g6.rimsapi.repository.CategoryRepository;
import vn.edu.fpt.swp391.g6.rimsapi.repository.DishRepository;
import vn.edu.fpt.swp391.g6.rimsapi.service.AdminService;

@RestController
@RequestMapping("/rims/public/menu")
@RequiredArgsConstructor
public class PublicMenuController
{
    private final AdminService adminService;
    private final CategoryRepository categoryRepository;
    private final DishRepository dishRepository;

    @GetMapping("/best-selling")
    public List<PublicBestSellingDishResponse> getPublicBestSelling()
    {
        LocalDate today = LocalDate.now();
        LocalDate startOfWeek = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));

        return adminService.getBestSellingReport(startOfWeek, today, null)
                .getItems()
                .stream()
                .limit(5)
                .map(item -> new PublicBestSellingDishResponse(
                        item.getRank(),
                        item.getDishName(),
                        item.getImageUrl()))
                .toList();
    }

    /**
     * Thực đơn công khai, gom sẵn theo danh mục.
     *
     * <p>Trang chủ cần nó để dựng băng danh mục dính và lưới ảnh món. Trước đây
     * chỉ có /best-selling trả năm món, nên trang chủ không có cách nào hiện cả
     * thực đơn ngoài việc bịa ra danh mục.
     *
     * <p>Lọc ba lớp, tất cả ở đây chứ không ở trình duyệt: danh mục đang bật,
     * món không ẩn, món đang bán. Lọc ở trình duyệt nghĩa là dữ liệu món đang
     * tắt vẫn được gửi ra ngoài cho bất kỳ ai xem mã nguồn trang.
     *
     * <p>ĐỌC TỪ PHÍA MÓN, KHÔNG TỪ PHÍA DANH MỤC. Bản đầu duyệt
     * {@code category.getDishes()} — một collection LAZY — trong controller,
     * nơi phiên Hibernate đã đóng vì {@code open-in-view: false}. Kết quả là
     * mọi lời gọi đều trả 500, và render walk không thấy vì nó dùng dữ liệu
     * giả chứ không gọi backend thật.
     *
     * <p>Đi từ món thì {@code dish.getCategory()} là {@code @ManyToOne}, nạp
     * ngay cùng món, nên không còn collection nào phải mở muộn.
     */
    @GetMapping
    public List<PublicMenuSectionResponse> getPublicMenu()
    {
        Map<Integer, List<Dish>> byCategory = dishRepository.findAll().stream()
                .filter(dish -> !dish.isHidden() && dish.isAvailable())
                .filter(dish -> dish.getCategory() != null && dish.getCategory().isAvailable())
                .collect(Collectors.groupingBy(dish -> dish.getCategory().getId()));

        return categoryRepository.findAll().stream()
                .filter(Category::isAvailable)
                .filter(category -> byCategory.containsKey(category.getId()))
                .sorted(Comparator.comparing(Category::getId))
                .map(category -> PublicMenuSectionResponse.builder()
                        .categoryId(category.getId())
                        .categoryName(category.getName())
                        .description(category.getDescription())
                        .dishes(byCategory.get(category.getId()).stream()
                                .sorted(Comparator.comparing(Dish::getId))
                                .map(dish -> PublicMenuSectionResponse.PublicMenuDish.builder()
                                        .dishId(dish.getId())
                                        .name(dish.getName())
                                        .description(dish.getDescription())
                                        .price(dish.getPrice())
                                        .imageUrl(dish.getImageUrl())
                                        .build())
                                .toList())
                        .build())
                .toList();
    }
}
