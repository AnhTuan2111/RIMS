package vn.edu.fpt.swp391.g6.rimsapi.controller;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.Comparator;
import java.util.List;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import vn.edu.fpt.swp391.g6.rimsapi.dto.response.menu.PublicMenuSectionResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.report.PublicBestSellingDishResponse;
import vn.edu.fpt.swp391.g6.rimsapi.entity.Category;
import vn.edu.fpt.swp391.g6.rimsapi.entity.Dish;
import vn.edu.fpt.swp391.g6.rimsapi.repository.CategoryRepository;
import vn.edu.fpt.swp391.g6.rimsapi.service.AdminService;

@RestController
@RequestMapping("/rims/public/menu")
@RequiredArgsConstructor
public class PublicMenuController
{
    private final AdminService adminService;
    private final CategoryRepository categoryRepository;

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
     * <p>Danh mục rỗng bị bỏ hẳn: một mục danh mục không có món nào bên dưới
     * chỉ làm băng danh mục dài thêm mà bấm vào không tới đâu.
     */
    @GetMapping
    public List<PublicMenuSectionResponse> getPublicMenu()
    {
        return categoryRepository.findAll().stream()
                .filter(Category::isAvailable)
                .sorted(Comparator.comparing(Category::getName))
                .map(category -> PublicMenuSectionResponse.builder()
                        .categoryId(category.getId())
                        .categoryName(category.getName())
                        .description(category.getDescription())
                        .dishes(visibleDishes(category))
                        .build())
                .filter(section -> !section.getDishes().isEmpty())
                .toList();
    }

    private static List<PublicMenuSectionResponse.PublicMenuDish> visibleDishes(Category category)
    {
        if (category.getDishes() == null)
        {
            return List.of();
        }

        return category.getDishes().stream()
                .filter(dish -> !dish.isHidden() && dish.isAvailable())
                .sorted(Comparator.comparing(Dish::getName))
                .map(dish -> PublicMenuSectionResponse.PublicMenuDish.builder()
                        .dishId(dish.getId())
                        .name(dish.getName())
                        .description(dish.getDescription())
                        .price(dish.getPrice())
                        .imageUrl(dish.getImageUrl())
                        .build())
                .toList();
    }
}
