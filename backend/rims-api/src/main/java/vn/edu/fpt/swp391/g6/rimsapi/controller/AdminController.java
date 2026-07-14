package vn.edu.fpt.swp391.g6.rimsapi.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.auth.UpdateProfileRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.menu.CreateCategoryRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.menu.CreateDishRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.menu.UpdateCategoryRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.menu.UpdateDishRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.user.CreateCustomerRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.user.CreateStaffRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.user.SetAccountStatusRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.user.UpdateAccountRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.common.PageResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.menu.CategoryResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.menu.DishResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.menu.MenuDashboardResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.report.*;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.user.UserProfileResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.user.UserResponse;
import vn.edu.fpt.swp391.g6.rimsapi.service.*;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.table.TableDetailResponse;
import vn.edu.fpt.swp391.g6.rimsapi.service.TableService;

import java.time.LocalDate;
import java.util.ArrayList;
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
    private final DashboardService dashboardService;
    private final TableService tableService;

    // =================== USER / ACCOUNT ===================

    @GetMapping("/user/all")
    public List<UserResponse> getAllUsers()
    {
        return userService.getAllUsers();
    }

    @GetMapping("/user/staff")
    public PageResponse<UserResponse> getStaffAccounts(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Boolean active,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size)
    {
        return userService.getStaffAccounts(keyword, active, page, size);
    }

    @GetMapping("/user/customer")
    public PageResponse<UserResponse> getCustomerAccounts(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Boolean active,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size)
    {
        return userService.getCustomerAccounts(keyword, active, page, size);
    }

    @GetMapping("/user/{id}")
    public UserResponse getAccountDetail(@PathVariable Integer id)
    {
        return userService.getAccountDetail(id);
    }

    @PostMapping("/user/customer/new")
    public ResponseEntity<UserResponse> createCustomer(
            @RequestBody @Valid CreateCustomerRequest request)
    {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.createCustomer(request));
    }

    @PostMapping("/user/staff/new")
    public ResponseEntity<UserResponse> createStaff(
            @RequestBody @Valid CreateStaffRequest request)
    {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.createStaff(request));
    }

    @PutMapping("/user/{id}")
    public UserResponse updateAccount(
            @PathVariable Integer id,
            @RequestBody @Valid UpdateAccountRequest request)
    {
        return userService.updateAccount(id, request);
    }

    @PatchMapping("/user/{id}/status")
    public ResponseEntity<Void> setAccountStatus(
            @PathVariable Integer id,
            @RequestBody SetAccountStatusRequest request)
    {
        userService.setAccountStatus(id, request);
        return ResponseEntity.noContent().build();
    }

    // Legacy profile endpoints
    @GetMapping("/user/profile/{id}")
    public UserProfileResponse getProfile(@PathVariable Integer id)
    {
        return userService.getProfile(id);
    }

    @PutMapping("/user/profile/update/{id}")
    public UserProfileResponse updateProfile(
            @PathVariable Integer id,
            @RequestBody @Valid UpdateProfileRequest request)
    {
        return userService.updateProfile(id, request);
    }

    // =================== INVOICE ===================

    @GetMapping("/invoice/history")
    public InvoiceHistoryPageResponse getInvoiceHistory(
            @RequestParam(
                    defaultValue = "1"
            )
            int page,

            @RequestParam(
                    defaultValue = "10"
            )
            int pageSize
    )
    {
        return invoiceService.getInvoiceHistory(
                page,
                pageSize
        );
    }

    @GetMapping("/invoice/{invoiceId}")
    public InvoiceDetailResponse getInvoiceDetail(
            @PathVariable Long invoiceId
    )
    {
        return invoiceService.getInvoiceDetail(invoiceId);
    }

    // =================== REVENUE ===================

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

    @GetMapping("/revenue/daily")
    public WeeklyRevenueChartResponse getDailyRevenue(
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
        return revenueReportService.getDailyRevenue(
                fromDate,
                toDate
        );
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
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate)
    {
        return revenueReportService.getRevenueBetween(fromDate, toDate);
    }

    @GetMapping("/revenue/best-selling")
    public BestSellingReportResponse getBestSellingReport(
            @RequestParam(
                    defaultValue = "WEEK"
            )
            String period,

            @RequestParam(
                    required = false
            )
            @DateTimeFormat(
                    iso = DateTimeFormat.ISO.DATE
            )
            LocalDate fromDate,

            @RequestParam(
                    required = false
            )
            @DateTimeFormat(
                    iso = DateTimeFormat.ISO.DATE
            )
            LocalDate toDate,

            @RequestParam(
                    required = false
            )
            Integer categoryId
    )
    {
        if (fromDate != null && toDate != null)
        {
            return revenueReportService.getBestSellingReport(
                    fromDate,
                    toDate,
                    categoryId
            );
        }
        return revenueReportService.getBestSellingReport(
                period,
                categoryId
        );
    }

    @GetMapping("/revenue/order-shifts")
    public OrderShiftReportResponse getOrderShiftReport(
            @RequestParam(
                    defaultValue = "WEEK"
            )
            String period,

            @RequestParam(
                    required = false
            )
            @DateTimeFormat(
                    iso = DateTimeFormat.ISO.DATE
            )
            LocalDate fromDate,

            @RequestParam(
                    required = false
            )
            @DateTimeFormat(
                    iso = DateTimeFormat.ISO.DATE
            )
            LocalDate toDate
    )
    {
        if (fromDate != null && toDate != null)
        {
            return revenueReportService
                    .getOrderShiftReport(
                            fromDate,
                            toDate
                    );
        }

        return revenueReportService
                .getOrderShiftReport(period);
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

    // =================== DISH ===================

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
    @GetMapping("/menu")
    public ResponseEntity<MenuDashboardResponse> getMenuDashboard()
    {
        MenuDashboardResponse data = dashboardService.getMenuDashboardData();
        return ResponseEntity.ok(data);
    }

    @GetMapping("/tables")
    public ResponseEntity<List<TableDetailResponse>> getAllTables()
    {
        return ResponseEntity.ok(tableService.getAllTables());
    }
}