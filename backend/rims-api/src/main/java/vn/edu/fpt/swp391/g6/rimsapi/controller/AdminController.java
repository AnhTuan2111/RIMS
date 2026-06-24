package vn.edu.fpt.swp391.g6.rimsapi.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.auth.UpdateProfileRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.menu.CreateCategoryRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.menu.UpdateCategoryRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.menu.CreateDishRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.menu.UpdateDishRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.menu.CategoryResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.menu.DishResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.report.*;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.user.UserProfileResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.user.UserResponse;
import vn.edu.fpt.swp391.g6.rimsapi.service.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;


@RestController
@RequestMapping("/rims/admin")
@RequiredArgsConstructor
public class AdminController
{

    private final UserService userService;
    private final DishService dishService;
    private final InvoiceService invoiceService;
    private final CategoryService categoryService;
    private final RevenueReportService revenueReportService;
    private final ReservationPerformanceScoreService reservationPerformanceScoreService;

    @GetMapping("/user/all")
    public List<UserResponse> getAllUsers()
    {
        return userService.getAllUsers();
    }

    @GetMapping("/user/staff")
    public List<UserResponse> getStaffAccounts()
    {
        return userService.getStaffAccounts();
    }

    @GetMapping("/user/profile/{id}")
    public UserProfileResponse getProfile(
            @PathVariable Integer id)
    {
        return userService.getProfile(id);
    }

    @PutMapping("/user/profile/update/{id}")
    public UserProfileResponse updateProfile(
            @PathVariable Integer id,
            @RequestBody UpdateProfileRequest request)
    {

        return userService.updateProfile(id, request);
    }



    @GetMapping("/invoice/history")
    public List<InvoiceHistoryResponse> getInvoiceHistory()
    {
        return invoiceService.getInvoiceHistory();
    }

    @GetMapping("/invoice/{invoiceId}")
    public InvoiceDetailResponse getInvoiceDetail(
            @PathVariable Long invoiceId
    )
    {
        return invoiceService.getInvoiceDetail(invoiceId);
    }

    @GetMapping("/revenue/total")
    public RevenueReportResponse getTotalRevenue()
    {
        return revenueReportService.getTotalRevenue();
    }


    @GetMapping("/revenue/today")
    public RevenueReportResponse getTodayRevenue()
    {
        return revenueReportService.getTodayRevenue();
    }

    @GetMapping("/revenue/weekly")
    public RevenueReportResponse getWeeklyRevenue()
    {
        return revenueReportService.getWeeklyRevenue();
    }

    @GetMapping("/revenue/monthly")
    public RevenueReportResponse getMonthlyRevenue()
    {
        return revenueReportService.getMonthlyRevenue();
    }

    @GetMapping("/revenue/yearly")
    public RevenueReportResponse getYearlyRevenue()
    {
        return revenueReportService.getYearlyRevenue();
    }

    @GetMapping("/revenue/custom")
    public RevenueReportResponse getCustomRevenue(
            @RequestParam
            @DateTimeFormat(
                    iso = DateTimeFormat.ISO.DATE)
            LocalDate fromDate,

            @RequestParam
            @DateTimeFormat(
                    iso = DateTimeFormat.ISO.DATE)
            LocalDate toDate
    )
    {

        return revenueReportService
                .getRevenueBetween(
                        fromDate,
                        toDate
                );
    }




    @GetMapping("/revenue/compare")
    public RevenueComparisonResponse compareRevenue(

            @RequestParam
            @DateTimeFormat(
                    iso = DateTimeFormat.ISO.DATE)
            LocalDate startDate1,

            @RequestParam
            @DateTimeFormat(
                    iso = DateTimeFormat.ISO.DATE)
            LocalDate endDate1,

            @RequestParam
            @DateTimeFormat(
                    iso = DateTimeFormat.ISO.DATE)
            LocalDate startDate2,

            @RequestParam
            @DateTimeFormat(
                    iso = DateTimeFormat.ISO.DATE)
            LocalDate endDate2
    )
    {

        return revenueReportService.compareRevenue(
                startDate1,
                endDate1,
                startDate2,
                endDate2
        );
    }

    @GetMapping("/revenue/anomaly")
    public RevenueAnomalyResponse detectRevenueAnomaly(

            @RequestParam
            @DateTimeFormat(
                    iso = DateTimeFormat.ISO.DATE)
            LocalDate targetDate,

            @RequestParam(defaultValue = "7")
            Integer referenceDays,

            @RequestParam(defaultValue = "30")
            BigDecimal spikeThresholdPercent,

            @RequestParam(defaultValue = "30")
            BigDecimal dropThresholdPercent
    )
    {

        return revenueReportService.detectRevenueAnomaly(
                targetDate,
                referenceDays,
                spikeThresholdPercent,
                dropThresholdPercent
        );
    }

    @GetMapping("/revenue/chart")
    public List<RevenueChartPointResponse> getRevenueChartData(

            @RequestParam
            @DateTimeFormat(
                    iso = DateTimeFormat.ISO.DATE)
            LocalDate fromDate,

            @RequestParam
            @DateTimeFormat(
                    iso = DateTimeFormat.ISO.DATE)
            LocalDate toDate,

            @RequestParam(defaultValue = "7")
            Integer referenceDays,

            @RequestParam(defaultValue = "30")
            BigDecimal spikeThresholdPercent,

            @RequestParam(defaultValue = "30")
            BigDecimal dropThresholdPercent
    )
    {

        return revenueReportService.getRevenueChartData(
                fromDate,
                toDate,
                referenceDays,
                spikeThresholdPercent,
                dropThresholdPercent
        );
    }

    @GetMapping("/revenue/best-selling")
    public BestSellingReportResponse getBestSellingReport()
    {

        return revenueReportService
                .getBestSellingReport();
    }

    @GetMapping("/reservation/performance-score")
    public List<ReservationPerformanceScoreResponse>
    getReservationPerformanceScore(

            @RequestParam LocalDate fromDate,

            @RequestParam LocalDate toDate
    )
    {

        return reservationPerformanceScoreService
                .getReservationPerformanceScore(
                        fromDate,
                        toDate
                );
    }

    @GetMapping("/category/all")
    public ResponseEntity<List<CategoryResponse>> getAllCategories()
    {
        return ResponseEntity.ok(categoryService.getAllCategories());
    }

    @GetMapping("/category/available")
    public ResponseEntity<List<CategoryResponse>> getAvailableCategories()
    {
        return ResponseEntity.ok(categoryService.getAvailableCategories());
    }

    @GetMapping("/category/{id}")
    public ResponseEntity<CategoryResponse> getCategoryById(@PathVariable Integer id)
    {
        return ResponseEntity.ok(categoryService.getCategoryById(id));
    }

    @PostMapping("/category/new")
    public ResponseEntity<CategoryResponse> createCategory(
            @RequestBody @Valid CreateCategoryRequest createCategoryRequest)
    {
        return ResponseEntity.status(HttpStatus.CREATED).body(categoryService.createCategory(createCategoryRequest));
    }

    @PutMapping("/category/{id}")
    public ResponseEntity<CategoryResponse> updateCategory(
            @PathVariable Integer id,
            @RequestBody @Valid UpdateCategoryRequest updateCategoryRequest)
    {
        return ResponseEntity.ok(categoryService.updateCategory(id, updateCategoryRequest));
    }

    @DeleteMapping("/category/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable Integer id)
    {
        categoryService.deleteCategory(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/dish/all")
    public ResponseEntity<List<DishResponse>> getAllDishes()
    {
        return ResponseEntity.ok(dishService.getAllDishes());
    }

    @GetMapping("/dish/category/{categoryId}")
    public ResponseEntity<List<DishResponse>> getDishesByCategory(@PathVariable Integer categoryId)
    {
        return ResponseEntity.ok(dishService.getDishesByCategory(categoryId));
    }

    @GetMapping("/dish/available")
    public ResponseEntity<List<DishResponse>> getAvailableDishes()
    {
        return ResponseEntity.ok(dishService.getAvailableDishes());
    }

    @GetMapping("/dish/search")
    public ResponseEntity<List<DishResponse>> searchDishes(@RequestParam(required = false) String keyword)
    {
        return ResponseEntity.ok(dishService.searchDishes(keyword));
    }

    @GetMapping("/dish/{id}")
    public ResponseEntity<DishResponse> getDishById(@PathVariable Integer id)
    {
        return ResponseEntity.ok(dishService.getDishById(id));
    }

    @PostMapping("/dish/new")
    public ResponseEntity<DishResponse> createDish(
            @RequestBody @Valid CreateDishRequest createDishRequest)
    {
        return ResponseEntity.status(HttpStatus.CREATED).body(dishService.createDish(createDishRequest));
    }

    @PutMapping("/dish/update/{id}")
    public ResponseEntity<DishResponse> updateDish(
            @PathVariable Integer id,
            @RequestBody @Valid UpdateDishRequest updateDishRequest)
    {
        return ResponseEntity.ok(dishService.updateDish(id, updateDishRequest));
    }

    @DeleteMapping("/dish/delete/{id}")
    public ResponseEntity<Void> deleteDish(@PathVariable Integer id)
    {
        dishService.deleteDish(id);
        return ResponseEntity.noContent().build();
    }
}
